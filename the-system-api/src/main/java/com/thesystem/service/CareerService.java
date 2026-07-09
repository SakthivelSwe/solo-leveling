package com.thesystem.service;

import com.thesystem.dto.LeetcodeStatsDTO;
import com.thesystem.dto.SkillsGapDTO;
import com.thesystem.dto.SkillsGapDTO.SkillGapItem;
import com.thesystem.entity.*;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Module 1 — Career OS: job applications, interview rounds, LeetCode log,
 * course progress and a skills-gap analyzer for a ₹80k+ Java Full Stack role.
 */
@Service
public class CareerService {

    private final JobApplicationRepository jobRepo;
    private final InterviewRoundRepository roundRepo;
    private final LeetcodeLogRepository leetcodeRepo;
    private final CourseProgressRepository courseRepo;
    private final PlayerSkillRepository skillRepo;

    private static final Map<String, Integer> TARGETS = Map.of(
            "Java + Spring Boot", 80,
            "DSA / LeetCode", 60,
            "Angular / JavaScript", 70,
            "English Speaking", 65,
            "System Design", 50
    );

    public CareerService(JobApplicationRepository jobRepo,
                         InterviewRoundRepository roundRepo,
                         LeetcodeLogRepository leetcodeRepo,
                         CourseProgressRepository courseRepo,
                         PlayerSkillRepository skillRepo) {
        this.jobRepo = jobRepo;
        this.roundRepo = roundRepo;
        this.leetcodeRepo = leetcodeRepo;
        this.courseRepo = courseRepo;
        this.skillRepo = skillRepo;
    }

    // ---- Job applications ----
    public JobApplication createJob(Long playerId, JobApplication body) {
        body.setId(null);
        body.setPlayerId(playerId);
        if (body.getAppliedDate() == null) body.setAppliedDate(LocalDate.now());
        return jobRepo.save(body);
    }

    public List<JobApplication> listJobs(Long playerId) {
        return jobRepo.findByPlayerIdOrderByAppliedDateDesc(playerId);
    }

    public JobApplication updateStatus(Long playerId, Long id, String status) {
        JobApplication job = ownedJob(playerId, id);
        job.setStatus(status);
        return jobRepo.save(job);
    }

    public InterviewRound addRound(Long playerId, Long applicationId, InterviewRound round) {
        ownedJob(playerId, applicationId);
        round.setId(null);
        round.setApplicationId(applicationId);
        return roundRepo.save(round);
    }

    public List<InterviewRound> rounds(Long playerId, Long applicationId) {
        ownedJob(playerId, applicationId);
        return roundRepo.findByApplicationIdOrderByRoundNumberAsc(applicationId);
    }

    private JobApplication ownedJob(Long playerId, Long id) {
        JobApplication job = jobRepo.findById(id)
                .orElseThrow(() -> new ApiException("Application not found", HttpStatus.NOT_FOUND));
        if (!job.getPlayerId().equals(playerId)) {
            throw new ApiException("Not your application", HttpStatus.FORBIDDEN);
        }
        return job;
    }

    // ---- LeetCode ----
    public LeetcodeLog logLeetcode(Long playerId, LeetcodeLog body) {
        body.setId(null);
        body.setPlayerId(playerId);
        if (body.getSolvedDate() == null) body.setSolvedDate(LocalDate.now());
        return leetcodeRepo.save(body);
    }

    public List<LeetcodeLog> leetcodeHistory(Long playerId) {
        // Bounded to the 60 most recent entries — the UI only surfaces recent solves.
        return leetcodeRepo.findTop60ByPlayerIdOrderBySolvedDateDesc(playerId);
    }

    public LeetcodeStatsDTO leetcodeStats(Long playerId) {
        long total = leetcodeRepo.countByPlayerId(playerId);
        long easy = leetcodeRepo.countByPlayerIdAndDifficulty(playerId, "EASY");
        long medium = leetcodeRepo.countByPlayerIdAndDifficulty(playerId, "MEDIUM");
        long hard = leetcodeRepo.countByPlayerIdAndDifficulty(playerId, "HARD");
        int streak = leetcodeStreak(playerId);
        return new LeetcodeStatsDTO(total, easy, medium, hard, streak);
    }

    private int leetcodeStreak(Long playerId) {
        Set<LocalDate> dates = leetcodeRepo.findByPlayerIdOrderBySolvedDateDesc(playerId).stream()
                .map(LeetcodeLog::getSolvedDate).collect(Collectors.toSet());
        int streak = 0;
        LocalDate cursor = LocalDate.now();
        if (!dates.contains(cursor)) cursor = cursor.minusDays(1);
        while (dates.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    // ---- Courses ----
    public CourseProgress upsertCourse(Long playerId, CourseProgress body) {
        CourseProgress course = courseRepo
                .findByPlayerIdAndCourseName(playerId, body.getCourseName())
                .orElseGet(CourseProgress::new);
        course.setPlayerId(playerId);
        course.setCourseName(body.getCourseName());
        course.setTotalTopics(body.getTotalTopics() > 0 ? body.getTotalTopics() : course.getTotalTopics());
        course.setCompletedTopics(body.getCompletedTopics());
        course.setLastUpdated(LocalDate.now());
        return courseRepo.save(course);
    }

    public List<CourseProgress> courses(Long playerId) {
        return courseRepo.findByPlayerIdOrderByLastUpdatedDesc(playerId);
    }

    // ---- Skills gap analyzer ----
    public SkillsGapDTO analyzeSkillsGap(Long playerId) {
        List<PlayerSkill> skills = skillRepo.findByPlayerId(playerId);
        List<SkillGapItem> items = skills.stream().map(sk -> {
            int target = TARGETS.getOrDefault(sk.getSkillName(), 70);
            int gap = Math.max(0, target - sk.getSkillPct());
            String urgency = gap > 40 ? "CRITICAL" : gap > 20 ? "HIGH" : "ON_TRACK";
            return new SkillGapItem(sk.getSkillName(), sk.getSkillPct(), target, gap, urgency);
        }).collect(Collectors.toList());
        return new SkillsGapDTO(items);
    }
}

