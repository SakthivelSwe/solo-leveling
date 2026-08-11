package com.thesystem.repository;

import com.thesystem.entity.OnboardingAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface OnboardingAssessmentRepository extends JpaRepository<OnboardingAssessment, Long> {
    Optional<OnboardingAssessment> findByPlayerId(Long playerId);
    boolean existsByPlayerId(Long playerId);
}
