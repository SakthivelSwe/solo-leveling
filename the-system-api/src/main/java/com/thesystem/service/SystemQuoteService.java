package com.thesystem.service;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Rotates THE SYSTEM's daily Solo-Leveling-style quotes. Deterministic per day
 * so every player sees the same "System message" for a given date.
 */
@Service
public class SystemQuoteService {

    private static final List<String> SYSTEM_QUOTES = List.of(
        "Hunter, the weak make excuses. The strong make progress.",
        "E-Rank is not your destiny. It is your starting point.",
        "Every quest skipped is experience lost. Every habit missed is a stat that doesn't grow.",
        "Sung Jin-Woo started weaker than you. He didn't stop.",
        "Chennai's future S-Rank developer is awake. Begin.",
        "Your STR is 12. Your potential is unlimited. Train.",
        "The interview room is a Boss Gate. You are not ready yet. Keep grinding.",
        "Three months. That's all it takes. Do not waste today.",
        "Your DIS stat is the weakest in the game. Fix it tonight — sleep before 11:30.",
        "A hunter who skips breakfast loses VIT. A hunter who skips code loses INT. Choose wisely."
    );

    public String quoteForToday() {
        return quoteFor(LocalDate.now());
    }

    public String quoteFor(LocalDate date) {
        int index = (int) (Math.floorMod(date.toEpochDay(), SYSTEM_QUOTES.size()));
        return SYSTEM_QUOTES.get(index);
    }

    public List<String> all() {
        return SYSTEM_QUOTES;
    }
}

