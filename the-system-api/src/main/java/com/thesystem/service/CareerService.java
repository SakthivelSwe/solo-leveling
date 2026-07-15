package com.thesystem.service;

import com.thesystem.dto.InterviewReadinessDTO;
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
    private final DeepWorkSessionRepository deepWorkRepo;

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
                         PlayerSkillRepository skillRepo,
                         DeepWorkSessionRepository deepWorkRepo) {
        this.jobRepo = jobRepo;
        this.roundRepo = roundRepo;
        this.leetcodeRepo = leetcodeRepo;
        this.courseRepo = courseRepo;
        this.skillRepo = skillRepo;
        this.deepWorkRepo = deepWorkRepo;
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

    // ---- Interview Readiness ----

    /**
     * Computes an interview readiness score (0-100%) tailored to the ₹80k+ Java Full-Stack target.
     *
     * Weights:
     *   Java + Spring Boot:  25%
     *   Angular / JS:        15%
     *   DSA / LeetCode:      20%  (problems solved / 100, capped 100)
     *   English Speaking:    15%
     *   System Design:       10%
     *   Coding Evidence:     15%  (deep work hours / 200, capped 100)
     */
    public InterviewReadinessDTO calculateInterviewReadiness(Long playerId) {
        List<PlayerSkill> skills = skillRepo.findByPlayerId(playerId);
        Map<String, Integer> pctBySkill = new HashMap<>();
        for (PlayerSkill s : skills) pctBySkill.put(s.getSkillName(), s.getSkillPct());

        long leetcodeSolved = leetcodeRepo.countByPlayerId(playerId);
        int leetcodePct = (int) Math.min(100, leetcodeSolved);

        int codingMinutes = deepWorkRepo.sumCodingMinutesByPlayerId(playerId);
        int codingPct = Math.min(100, codingMinutes / 120); // 200 hrs = 100%

        int javaPct     = pctBySkill.getOrDefault("Java + Spring Boot", 0);
        int angularPct  = pctBySkill.getOrDefault("Angular / JavaScript", 0);
        int englishPct  = pctBySkill.getOrDefault("English Speaking", 0);
        int sdPct       = pctBySkill.getOrDefault("System Design", 0);

        Map<String, Integer> perSkill = new LinkedHashMap<>();
        perSkill.put("Java + Spring Boot", javaPct);
        perSkill.put("Angular / JavaScript", angularPct);
        perSkill.put("DSA / LeetCode", leetcodePct);
        perSkill.put("English Speaking", englishPct);
        perSkill.put("System Design", sdPct);
        perSkill.put("Coding Evidence", codingPct);

        int overall = (int) Math.round(
                javaPct    * 0.25 +
                angularPct * 0.15 +
                leetcodePct* 0.20 +
                englishPct * 0.15 +
                sdPct      * 0.10 +
                codingPct  * 0.15
        );

        String verdict = overall >= 85 ? "Ready for senior roles. Negotiate confidently."
                : overall >= 70 ? "Interview-ready for mid-level Java Full Stack (₹80k+ target)."
                : overall >= 50 ? "Ready for junior Java roles. Keep pushing DSA and System Design."
                : "Not yet interview-ready. Focus: LeetCode daily + Java Spring projects.";

        List<String> weakAreas = perSkill.entrySet().stream()
                .filter(e -> e.getValue() < 50).map(Map.Entry::getKey)
                .collect(Collectors.toList());
        List<String> strongAreas = perSkill.entrySet().stream()
                .filter(e -> e.getValue() >= 70).map(Map.Entry::getKey)
                .collect(Collectors.toList());

        return new InterviewReadinessDTO(perSkill, overall, verdict, weakAreas, strongAreas,
                codingMinutes / 60);
    }
}

