package com.thesystem.controller;

import com.thesystem.dto.InterviewReadinessDTO;
import com.thesystem.dto.LeetcodeStatsDTO;
import com.thesystem.dto.SkillsGapDTO;
import com.thesystem.entity.CourseProgress;
import com.thesystem.entity.InterviewRound;
import com.thesystem.entity.JobApplication;
import com.thesystem.entity.LeetcodeLog;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.CareerService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/career")
public class CareerController {

    private final CareerService careerService;
    private final CurrentPlayer currentPlayer;

    public CareerController(CareerService careerService, CurrentPlayer currentPlayer) {
        this.careerService = careerService;
        this.currentPlayer = currentPlayer;
    }

    // Jobs
    @PostMapping("/jobs")
    public JobApplication createJob(Principal p, @RequestBody JobApplication body) {
        return careerService.createJob(currentPlayer.id(p), body);
    }

    @GetMapping("/jobs")
    public List<JobApplication> listJobs(Principal p) {
        return careerService.listJobs(currentPlayer.id(p));
    }

    @PutMapping("/jobs/{id}/status")
    public JobApplication updateStatus(Principal p, @PathVariable Long id, @RequestBody Map<String, String> body) {
        return careerService.updateStatus(currentPlayer.id(p), id, body.get("status"));
    }

    @PostMapping("/jobs/{id}/rounds")
    public InterviewRound addRound(Principal p, @PathVariable Long id, @RequestBody InterviewRound round) {
        return careerService.addRound(currentPlayer.id(p), id, round);
    }

    @GetMapping("/jobs/{id}/rounds")
    public List<InterviewRound> rounds(Principal p, @PathVariable Long id) {
        return careerService.rounds(currentPlayer.id(p), id);
    }

    // LeetCode
    @PostMapping("/leetcode")
    public LeetcodeLog logLeetcode(Principal p, @RequestBody LeetcodeLog body) {
        return careerService.logLeetcode(currentPlayer.id(p), body);
    }

    @GetMapping("/leetcode/stats")
    public LeetcodeStatsDTO leetcodeStats(Principal p) {
        return careerService.leetcodeStats(currentPlayer.id(p));
    }

    @GetMapping("/leetcode/history")
    public List<LeetcodeLog> leetcodeHistory(Principal p) {
        return careerService.leetcodeHistory(currentPlayer.id(p));
    }

    // Courses
    @PostMapping("/courses")
    public CourseProgress upsertCourse(Principal p, @RequestBody CourseProgress body) {
        return careerService.upsertCourse(currentPlayer.id(p), body);
    }

    @GetMapping("/courses")
    public List<CourseProgress> courses(Principal p) {
        return careerService.courses(currentPlayer.id(p));
    }

    // Skills gap
    @GetMapping("/skills-gap")
    public SkillsGapDTO skillsGap(Principal p) {
        return careerService.analyzeSkillsGap(currentPlayer.id(p));
    }

    // Interview Readiness
    @GetMapping("/interview-readiness")
    public InterviewReadinessDTO interviewReadiness(Principal p) {
        return careerService.calculateInterviewReadiness(currentPlayer.id(p));
    }
}

