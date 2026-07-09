package com.thesystem.repository;

import com.thesystem.entity.Quest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface QuestRepository extends JpaRepository<Quest, Long> {
    Optional<Quest> findByQuestKey(String questKey);
    List<Quest> findByActiveTrueOrderByCategoryAscXpRewardDesc();
    boolean existsByQuestKey(String questKey);
}

