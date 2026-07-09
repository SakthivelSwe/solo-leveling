package com.thesystem.service;

import com.thesystem.dto.PlayerSkillDTO;
import com.thesystem.entity.PlayerSkill;
import com.thesystem.repository.PlayerSkillRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SkillService {

    private final PlayerSkillRepository skillRepository;

    public SkillService(PlayerSkillRepository skillRepository) {
        this.skillRepository = skillRepository;
    }

    public List<PlayerSkillDTO> getPlayerSkills(Long playerId) {
        return skillRepository.findByPlayerId(playerId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public PlayerSkillDTO toDto(PlayerSkill s) {
        return new PlayerSkillDTO(s.getId(), s.getSkillName(), s.getSkillPct(),
                s.getSkillPct() / 10);
    }
}

