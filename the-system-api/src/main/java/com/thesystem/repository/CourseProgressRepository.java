package com.thesystem.repository;

import com.thesystem.entity.CourseProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseProgressRepository extends JpaRepository<CourseProgress, Long> {
    List<CourseProgress> findByPlayerIdOrderByLastUpdatedDesc(Long playerId);
    Optional<CourseProgress> findByPlayerIdAndCourseName(Long playerId, String courseName);
}

