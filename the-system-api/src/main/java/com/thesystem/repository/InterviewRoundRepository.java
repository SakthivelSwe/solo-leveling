package com.thesystem.repository;

import com.thesystem.entity.InterviewRound;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InterviewRoundRepository extends JpaRepository<InterviewRound, Long> {
    List<InterviewRound> findByApplicationIdOrderByRoundNumberAsc(Long applicationId);
}

