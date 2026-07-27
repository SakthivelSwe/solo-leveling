package com.thesystem.service;

import com.thesystem.dto.FlashcardDTO;
import com.thesystem.entity.Flashcard;
import com.thesystem.entity.Player;
import com.thesystem.repository.FlashcardRepository;
import com.thesystem.repository.PlayerRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Spaced Repetition System (SRS) using a simplified SuperMemo-2 algorithm.
 */
@Service
public class SrsService {

    private final FlashcardRepository flashcardRepo;
    private final PlayerRepository playerRepo;

    public SrsService(FlashcardRepository flashcardRepo, PlayerRepository playerRepo) {
        this.flashcardRepo = flashcardRepo;
        this.playerRepo = playerRepo;
    }

    public List<FlashcardDTO> getDueCards(Long playerId) {
        return flashcardRepo.findByPlayerIdAndNextReviewDateBefore(playerId, LocalDateTime.now())
                .stream().map(this::toDto).toList();
    }

    public FlashcardDTO addCard(Long playerId, String front, String back, String topic) {
        Flashcard card = new Flashcard();
        card.setPlayerId(playerId);
        card.setFrontText(front);
        card.setBackText(back);
        card.setTopic(topic);
        return toDto(flashcardRepo.save(card));
    }

    /**
     * Rate a flashcard: 
     * 1 = Hard (Failed, reset interval)
     * 2 = Good (Remembered, but hard)
     * 3 = Easy (Remembered easily)
     */
    public FlashcardDTO reviewCard(Long playerId, Long cardId, int rating) {
        Flashcard card = flashcardRepo.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Card not found"));
        if (!card.getPlayerId().equals(playerId)) {
            throw new RuntimeException("Not your card");
        }

        // Apply SM-2 logic
        if (rating == 1) { // Failed
            card.setEaseFactor(Math.max(130, card.getEaseFactor() - 20));
            card.setIntervalDays(1);
            
            // Apply damage to player
            Player player = playerRepo.findById(playerId).orElseThrow();
            player.setHp(Math.max(1, player.getHp() - 5));
            playerRepo.save(player);
            
        } else if (rating == 2) { // Good
            if (card.getIntervalDays() == 0) card.setIntervalDays(1);
            else if (card.getIntervalDays() == 1) card.setIntervalDays(3);
            else card.setIntervalDays((int) Math.round(card.getIntervalDays() * (card.getEaseFactor() / 100.0)));
        } else if (rating == 3) { // Easy
            card.setEaseFactor(card.getEaseFactor() + 15);
            if (card.getIntervalDays() == 0) card.setIntervalDays(3);
            else card.setIntervalDays((int) Math.round(card.getIntervalDays() * (card.getEaseFactor() / 100.0) * 1.3));
        }

        card.setNextReviewDate(LocalDateTime.now().plusDays(card.getIntervalDays()));
        return toDto(flashcardRepo.save(card));
    }

    private FlashcardDTO toDto(Flashcard c) {
        return new FlashcardDTO(
            c.getId(), c.getFrontText(), c.getBackText(), c.getTopic(),
            c.getIntervalDays(), c.getEaseFactor(), c.getNextReviewDate()
        );
    }
}
