package com.thesystem.controller;

import com.thesystem.dto.NoFapStatusDTO;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.NoFapService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * Phase 2D — NoFap SOS Emergency Panel.
 *
 * Fast, synchronous endpoint returning streak context + 8 evidence-based
 * coping strategies. No AI calls — works offline.
 *
 * Note: mapped under /api/v1/nofap alongside NoFapController.
 * Spring routes GET /api/v1/nofap/sos exclusively to this bean since
 * NoFapController only registers /status, /confirm-clean, /relapse, etc.
 */
@RestController
@RequestMapping("/api/v1/nofap")
public class SosController {

    private static final List<Map<String, String>> SOS_STRATEGIES = List.of(
        Map.of("title", "◈ PHYSICAL INTERRUPT",
               "action", "Drop and do 20 push-ups NOW. Physical exertion redirects blood flow and burns the cortisol spike.",
               "duration", "2-3 min", "type", "PHYSICAL"),
        Map.of("title", "◈ COLD EXPOSURE",
               "action", "Splash cold water on your face and wrists for 30 seconds. Activates the mammalian dive reflex — instant calm.",
               "duration", "1 min", "type", "PHYSICAL"),
        Map.of("title", "◈ URGE SURFING",
               "action", "Close your eyes. Observe the urge like a wave. Don't fight it — watch it rise, peak, and fall. It will pass in 8-12 minutes.",
               "duration", "10 min", "type", "MINDFULNESS"),
        Map.of("title", "◈ LEAVE THE SCENE",
               "action", "Get up. Go to a different room, or outside. Change your environment immediately. The brain can't sustain a trigger without the cue.",
               "duration", "Immediate", "type", "ENVIRONMENT"),
        Map.of("title", "◈ CALL SOMEONE",
               "action", "Text or call a friend right now — topic doesn't matter. Social connection suppresses the limbic system's urge signal.",
               "duration", "5 min", "type", "SOCIAL"),
        Map.of("title", "◈ 5-4-3-2-1 GROUNDING",
               "action", "Name: 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. Forces the prefrontal cortex back online.",
               "duration", "3 min", "type", "MINDFULNESS"),
        Map.of("title", "◈ IDENTITY STATEMENT",
               "action", "Say aloud: 'I am not someone who gives in. Every urge I resist makes the next one weaker. I am building the Hunter.'",
               "duration", "30 sec", "type", "IDENTITY"),
        Map.of("title", "◈ DELAY TACTIC",
               "action", "Tell yourself: 'I will wait 15 minutes before making any decision.' Set a timer. Most urges collapse within that window.",
               "duration", "15 min", "type", "COGNITIVE")
    );

    private final NoFapService noFapService;
    private final CurrentPlayer currentPlayer;

    public SosController(NoFapService noFapService, CurrentPlayer currentPlayer) {
        this.noFapService = noFapService;
        this.currentPlayer = currentPlayer;
    }

    /**
     * GET /api/v1/nofap/sos
     * Emergency SOS panel — returns current streak context + coping strategies.
     * Fully synchronous, no AI calls, < 50ms. Safe to call from low-signal areas.
     */
    @GetMapping("/sos")
    public Map<String, Object> getSosPanel(Principal p) {
        Long playerId = currentPlayer.id(p);
        NoFapStatusDTO status = noFapService.getStatus(playerId);

        int streak = status.getCurrentStreak();
        int nextMilestone = status.getNextMilestone();
        int daysToNext = status.getDaysToNextMilestone();
        String milestoneLabel = nextMilestoneLabel(nextMilestone);

        return Map.of(
            "streakDays", streak,
            "phaseName", status.getPhaseName() != null ? status.getPhaseName() : "NOVICE",
            "phaseIcon", status.getPhaseIcon() != null ? status.getPhaseIcon() : "⚡",
            "nextMilestoneDays", daysToNext,
            "nextMilestoneLabel", milestoneLabel,
            "xpBonusPct", status.getXpBonusPct(),
            "systemMessage", buildSystemMessage(streak, status.getPhaseName()),
            "strategies", SOS_STRATEGIES
        );
    }

    private String milestoneLabel(int days) {
        return switch (days) {
            case 7   -> "First Week";
            case 30  -> "One Month";
            case 90  -> "90-Day Reboot";
            case 365 -> "One Year";
            default  -> days + " Days";
        };
    }

    private String nextMilestoneLabel(int nextMilestone) {
        return switch (nextMilestone) {
            case 7   -> "First Week — dopamine receptors begin upregulating";
            case 30  -> "30 Days — brain fog clears, energy stabilises";
            case 90  -> "90-Day Reboot — neural pathways fully rewired";
            case 365 -> "One Year — Mastery";
            default  -> nextMilestone + " days";
        };
    }

    private String buildSystemMessage(int streak, String phase) {
        if (streak == 0) return "◈ Day zero. Every warrior starts here. The streak begins NOW.";
        if (streak < 7)  return "◈ " + streak + " day" + (streak > 1 ? "s" : "") + " in. Don't waste this. One urge doesn't erase your progress.";
        if (streak < 30) return "◈ " + streak + " days of rewiring. Your dopamine receptors are healing — protect that investment.";
        if (streak < 90) return "◈ " + streak + " days. The old pathways are weakening. Don't reignite them now.";
        return "◈ " + streak + " days. You are proof it is possible. THE SYSTEM has logged this moment. Rise.";
    }
}
