package com.thesystem.service;

import com.thesystem.dto.DevMasteryProgressDTO;
import com.thesystem.entity.DevMasteryProgress;
import com.thesystem.entity.Player;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.DevMasteryProgressRepository;
import com.thesystem.repository.PlayerRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;

@Service
public class DevMasterySyncService {

    private final DevMasteryProgressRepository devMasteryProgressRepository;
    private final PlayerRepository playerRepository;
    private final LevelService levelService;
    private final RestTemplate restTemplate;

    @Value("${thesystem.devmastery.api-url}")
    private String devMasteryApiUrl;

    @Value("${thesystem.devmastery.webhook-secret}")
    private String devMasterySecret;

    public DevMasterySyncService(DevMasteryProgressRepository devMasteryProgressRepository,
                                 PlayerRepository playerRepository,
                                 LevelService levelService) {
        this.devMasteryProgressRepository = devMasteryProgressRepository;
        this.playerRepository = playerRepository;
        this.levelService = levelService;
        this.restTemplate = new RestTemplate();
    }

    @Transactional
    public List<DevMasteryProgress> syncProgress(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ApiException("Player not found", HttpStatus.NOT_FOUND));

        if (player.getEmail() == null || player.getEmail().isBlank()) {
            throw new ApiException("Player has no email to sync with Dev-Mastery", HttpStatus.BAD_REQUEST);
        }

        String url = devMasteryApiUrl + "/api/integration/solo-leveling/progress?email=" + player.getEmail();

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Webhook-Secret", devMasterySecret);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<List<DevMasteryProgressDTO>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<List<DevMasteryProgressDTO>>() {}
            );

            List<DevMasteryProgressDTO> dtoList = response.getBody();
            if (dtoList != null) {
                for (DevMasteryProgressDTO dto : dtoList) {
                    processDevMasteryItem(playerId, dto);
                }
            }
        } catch (Exception e) {
            throw new ApiException("Failed to sync with Dev-Mastery: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return devMasteryProgressRepository.findByPlayerId(playerId);
    }

    private void processDevMasteryItem(Long playerId, DevMasteryProgressDTO dto) {
        Optional<DevMasteryProgress> existing = devMasteryProgressRepository.findByPlayerIdAndTopicId(playerId, dto.topicId());
        
        if (existing.isEmpty()) {
            DevMasteryProgress progress = new DevMasteryProgress();
            progress.setPlayerId(playerId);
            progress.setTopicId(dto.topicId());
            progress.setTopicTitle(dto.topicTitle());
            progress.setPathSlug(dto.pathSlug());
            progress.setXpEarned(dto.xpEarned());
            progress.setCompletedAt(dto.timestamp());
            
            devMasteryProgressRepository.save(progress);

            // Award XP to the player dynamically for learning!
            int xpToAward = dto.xpEarned() != null ? dto.xpEarned() : 10;
            
            Player player = playerRepository.findById(playerId).orElseThrow();
            player.setCurrentXp(player.getCurrentXp() + xpToAward);
            player.setTotalXp(player.getTotalXp() + xpToAward);
            levelService.checkLevelUp(player);
            playerRepository.save(player);
        }
    }
}
