import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-system-guide',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="guide-container">
      <div class="top-nav tech">
        <button class="back-btn" (click)="goBack()">? SYSTEM OS</button>
      </div>

      <header class="guide-header">
        <h1 class="glitch" data-text="SYSTEM MANUAL">SYSTEM MANUAL</h1>
        <p class="subtitle tech">Classified Information for Awakened Players</p>
      </header>

      <div class="content-wrapper">

        <section class="panel">
          <h2 class="tech">I. THE SYSTEM: AN OVERVIEW</h2>
          <p>Welcome, Hunter. You have been selected by <strong>THE SYSTEM</strong>. This is not a habit tracker — it is a full RPG engine for your real life. Your goal: grow from <span class="rank-e">E-Rank</span> to <span class="rank-s">S-Rank</span> by mastering your daily habits, career skills, and physical discipline.</p>
          <div class="info-chip">
            <span class="k">AWAKENING DATE</span>
            <span class="v">Shown on your Status card — the day you first registered in THE SYSTEM</span>
          </div>
        </section>

        <section class="panel">
          <h2 class="tech">II. NAVIGATION — ALL SCREENS</h2>
          <div class="highlight-box">
            <h3 class="tech">? STATUS (/system) — Home Dashboard</h3>
            <ul>
              <li>Hunter Rank badge, Level, XP ring, HP bar, Awakening Date</li>
              <li>All 6 stats (STR, INT, VIT, AGI, PER, DIS) with live progress bars</li>
              <li>Today's quest log — Daily / Weekly / Monthly / Milestones tabs</li>
              <li>Quest category filter chips: All · Daily Habits · Skill Grind · Discipline · Testosterone</li>
              <li>Weekly 7-day progress chart (quests + XP per day)</li>
              <li>AI Quest Sync button — generates 4 personalized AI quests (24hr cooldown)</li>
              <li>Deep Work Pomodoro timer (25-min focus sessions)</li>
              <li>DSA Grind log — quick LeetCode solve tracker + stats</li>
              <li>Job Applications tracker</li>
              <li>Daily Mission mode — curated 8-quest focus set based on your weakest stats</li>
            </ul>
          </div>
          <div class="highlight-box">
            <h3 class="tech">? QUESTS (/habits) — Atomic Habits Engine</h3>
            <ul>
              <li>View, complete, and track all Habits with streak tracking</li>
              <li>Current streak + longest streak + 30-day history dots</li>
              <li>Consistency % and Mastery % per habit</li>
              <li>Shadow Army — mastered habits become Shadows with permanent XP bonuses</li>
              <li>Habit Templates: Hunter / Scholar / Monk / Warrior packs</li>
              <li>Identity Score per tag (Hunter, Scholar, Monk, Warrior)</li>
            </ul>
          </div>
          <div class="highlight-box">
            <h3 class="tech">?? LIFE OS (/life) — 9 Modules</h3>
            <ul>
              <li><strong>Career OS</strong> — Job applications (status tracking), interview rounds, LeetCode logs, course progress</li>
              <li><strong>Health OS</strong> — Sleep quality, water intake, meal tracking, energy levels (morning/afternoon/evening)</li>
              <li><strong>Mind OS</strong> — Mood journal, anxiety level, gratitude, dark thought reframing + counter-evidence</li>
              <li><strong>Wealth OS</strong> — Budget entries, savings goals, SIP amount tracking</li>
              <li><strong>English OS</strong> — Speaking minutes, vocabulary, mock interview log, self-rating</li>
              <li><strong>Body OS</strong> — Testosterone pillars: cold shower, morning sun, zinc meal, no soda, no porn, exercise, sleep before 11:30</li>
              <li><strong>Relationship OS</strong> — GF call log (duration + quality), family contact, friend messages</li>
              <li><strong>Dopamine OS</strong> — Social media minutes, reels, gaming, junk food ? calculates Focus Multiplier for XP</li>
              <li><strong>Deep Work OS</strong> — Focus session logs, coding minutes, mobile pickups, interruptions ? Focus Score</li>
            </ul>
          </div>
          <div class="highlight-box">
            <h3 class="tech">?? BODY (/physical) — Physical Tracker</h3>
            <ul>
              <li>Daily weight log (kg) with 30-day trend chart</li>
              <li>Body fat % tracking</li>
              <li>Sleep log (bedtime + wake time ? auto duration)</li>
              <li>Workout entries — exercise, sets, reps, weight (kg), notes</li>
              <li>30-day mood trend line</li>
            </ul>
          </div>
          <div class="highlight-box">
            <h3 class="tech">?? LEARNING (/learning) — Dev Mastery Path</h3>
            <ul>
              <li>Structured learning paths: Angular, Spring Boot, DSA, System Design</li>
              <li>Topic-by-topic progress with XP rewards per topic</li>
              <li>Skill gap analysis — CRITICAL / HIGH / ON_TRACK urgency ratings</li>
              <li>Interview Readiness % (per skill + overall verdict)</li>
              <li>Diet Tracker — food log (calories, protein, vitamins)</li>
            </ul>
          </div>
          <div class="highlight-box">
            <h3 class="tech">?? AI MENTOR (/ai)</h3>
            <ul>
              <li><strong>Morning Briefing</strong> — Reviews yesterday, gives today's priorities and feedback</li>
              <li><strong>AI Chat</strong> — Ask coding, career, or discipline questions. AI knows your stats and tech stack</li>
              <li><strong>Memory</strong> — AI remembers your past sessions for context continuity</li>
            </ul>
          </div>
          <div class="highlight-box">
            <h3 class="tech">?? INSIGHTS (/insights) — Analytics</h3>
            <ul>
              <li>GitHub-style XP heatmap (last 90 / 180 / 365 days)</li>
              <li>Monthly report card — days active, XP, perfect days, streak, System Verdict</li>
              <li>Best stat, weakest stat, rank target narrative</li>
            </ul>
          </div>
          <div class="highlight-box">
            <h3 class="tech">?? RANKS (/achievements) — Achievements & Titles</h3>
            <ul>
              <li>All unlocked achievements with unlock dates</li>
              <li>Equipped title shown in topbar (e.g. "The Awakened", "Iron-Willed", "Gate Breaker")</li>
              <li>Rank ladder: E ? D ? C ? B ? A ? S</li>
            </ul>
          </div>
        </section>

        <section class="panel">
          <h2 class="tech">III. QUEST SYSTEM — COMPLETE REFERENCE</h2>
          <p>You have <strong>26 system daily quests</strong> plus unlimited custom quests you can create. Full breakdown:</p>

          <h3 class="tech cat-daily">?? DAILY — Physical Habits (reset every midnight)</h3>
          <table class="quest-table">
            <tr><th>Quest</th><th>Task</th><th>XP</th><th>Key Stat Boosts</th></tr>
            <tr><td>Courage of the Weak ?</td><td>Push-ups, Sit-ups, Squats, Walk/Run (scales with level)</td><td>50–200</td><td>STR+3, VIT+3, AGI+2</td></tr>
            <tr><td>Breakfast</td><td>Eat breakfast before 9:30 AM</td><td>40</td><td>VIT+2</td></tr>
            <tr><td>Water</td><td>Drink 2 bottles of water</td><td>30</td><td>VIT+2</td></tr>
            <tr><td>Exercise ?</td><td>20-min exercise or walk outside</td><td>80</td><td>STR+4, DIS+5</td></tr>
            <tr><td>Sleep ?</td><td>Slept before 11:30 PM last night</td><td>50</td><td>VIT+3, DIS+6</td></tr>
            <tr><td>No Reels</td><td>No reels or screens after 11 PM</td><td>90</td><td>AGI+1, INT+1</td></tr>
            <tr><td>Dopamine Detox</td><td>30 min no screens in the morning</td><td>100</td><td>PER+5, DIS+5</td></tr>
            <tr><td>Mock Interview Daily ?</td><td>Answer 1 behavioral question on video</td><td>150</td><td>AGI+5, INT+2</td></tr>
          </table>

          <h3 class="tech cat-skill">?? SKILL — Career Growth (reset every midnight)</h3>
          <table class="quest-table">
            <tr><th>Quest</th><th>Task</th><th>XP</th><th>Key Stat Boosts</th></tr>
            <tr><td>Code No AI ?</td><td>1 hour coding WITHOUT AI or Copilot</td><td>150</td><td>INT+5, PER+3</td></tr>
            <tr><td>LeetCode ?</td><td>Solve 1 LeetCode problem</td><td>120</td><td>INT+4, PER+4</td></tr>
            <tr><td>English ?</td><td>20 min English speaking practice</td><td>100</td><td>AGI+6</td></tr>
            <tr><td>Mock Interview ?</td><td>Do a full mock interview</td><td>150</td><td>AGI+4, PER+3</td></tr>
            <tr><td>Tech Learn</td><td>Tutorial or docs session</td><td>70</td><td>INT+3</td></tr>
            <tr><td>Self Debug</td><td>Debug something yourself (no AI first)</td><td>100</td><td>PER+5, INT+2</td></tr>
            <tr><td>System Design</td><td>Read 1 system design concept</td><td>90</td><td>INT+3, PER+4</td></tr>
            <tr><td>Angular Build</td><td>Build Angular component (30 min)</td><td>80</td><td>INT+2</td></tr>
            <tr><td>LinkedIn Update</td><td>Post/update LinkedIn or apply to 1 job</td><td>100</td><td>AGI+2</td></tr>
            <tr><td>Read No Scroll</td><td>Read tech article 20 min (no reels)</td><td>70</td><td>INT+2</td></tr>
            <tr><td>System Design Doc</td><td>Write one system design document</td><td>200</td><td>INT+6, PER+4</td></tr>
            <tr><td>Angular Mastery</td><td>Work on production Angular at TVM Infotech</td><td>150</td><td>INT+4, PER+3</td></tr>
          </table>

          <h3 class="tech cat-disc">?? DISCIPLINE — Mental Fortitude (reset every midnight)</h3>
          <table class="quest-table">
            <tr><th>Quest</th><th>Task</th><th>XP</th><th>Key Stat Boosts</th></tr>
            <tr><td>Morning Sun</td><td>20 min sunlight before 10 AM</td><td>70</td><td>STR+2, VIT+3, DIS+4</td></tr>
            <tr><td>Cold Shower</td><td>Cold water last 30 sec of shower</td><td>60</td><td>STR+3, VIT+2, DIS+3</td></tr>
            <tr><td>Zinc Meal</td><td>Ate eggs / nuts / dhal today</td><td>50</td><td>VIT+3, STR+1, DIS+3</td></tr>
            <tr><td>No Soda</td><td>No soft drinks or junk today</td><td>50</td><td>VIT+4, DIS+5</td></tr>
            <tr><td>Breathing</td><td>5 min deep breathing — cortisol reset</td><td>40</td><td>VIT+2, DIS+2</td></tr>
            <tr><td>No Porn</td><td>No pornography — dopamine reset</td><td>80</td><td>STR+3, PER+4, DIS+4</td></tr>
          </table>

          <h3 class="tech cat-week">?? WEEKLY — Reset every Monday</h3>
          <table class="quest-table">
            <tr><th>Quest</th><th>Goal</th><th>XP</th></tr>
            <tr><td>Weekly LeetCode 5</td><td>Solve 5 LeetCode problems this week</td><td>400</td></tr>
            <tr><td>Weekly Consistency</td><td>Complete all daily habits 5 consecutive days</td><td>500</td></tr>
            <tr><td>Weekly Code Pure</td><td>3 coding sessions without AI (3 hrs total)</td><td>450</td></tr>
            <tr><td>Weekly English Talk</td><td>2 English sessions (20 min each)</td><td>300</td></tr>
            <tr><td>Weekly Body</td><td>Exercise 4 out of 7 days this week</td><td>350</td></tr>
          </table>

          <h3 class="tech cat-month">?? MONTHLY — Reset on 1st of each month</h3>
          <table class="quest-table">
            <tr><th>Quest</th><th>Goal</th><th>XP</th></tr>
            <tr><td>Monthly Job Apps</td><td>Apply to 10 jobs this month</td><td>800</td></tr>
            <tr><td>Monthly Habit Streak</td><td>Maintain 21-day streak this month</td><td>1000</td></tr>
            <tr><td>Monthly LeetCode 20</td><td>Solve 20 LeetCode problems this month</td><td>900</td></tr>
          </table>

          <h3 class="tech cat-mile">?? MILESTONES — One-time achievements (never reset)</h3>
          <table class="quest-table">
            <tr><th>Quest</th><th>Achievement</th><th>XP</th></tr>
            <tr><td>First LeetCode</td><td>Solve your very first LeetCode problem</td><td>200</td></tr>
            <tr><td>First Cold Shower</td><td>First cold shower ever</td><td>150</td></tr>
            <tr><td>First English Session</td><td>First mock English interview practice</td><td>200</td></tr>
            <tr><td>First No-AI Session</td><td>First full coding session without AI</td><td>300</td></tr>
            <tr><td>First Gym Visit</td><td>Visit a gym for the first time</td><td>200</td></tr>
            <tr><td>First Chennai Meetup</td><td>Attend first Chennai tech meetup</td><td>250</td></tr>
            <tr><td>First Savings Transfer</td><td>Transfer first 500 to savings</td><td>200</td></tr>
            <tr><td>First Job Application</td><td>Submit first job application</td><td>300</td></tr>
            <tr><td>First Mock Interview</td><td>Complete your first full mock interview</td><td>300</td></tr>
          </table>

          <p style="margin-top:14px;font-size:0.82rem;color:#8a8a9a;">
            ? = Critical quest — always shown in Daily Mission mode regardless of stats.
            Use the + button in the quest log to add unlimited Custom Quests.
          </p>
        </section>

        <section class="panel">
          <h2 class="tech">IV. DAILY MISSION MODE vs SHOW ALL QUESTS</h2>
          <div class="highlight-box">
            <h3 class="tech cat-daily">SHOW ALL QUESTS (Default)</h3>
            <p>Shows all 26 system quests + your custom quests. Filter by category chips: <strong>All · Daily Habits · Skill Grind · Discipline · Testosterone</strong></p>
          </div>
          <div class="highlight-box">
            <h3 class="tech cat-skill">SHOW MISSIONS (Smart Filter)</h3>
            <p>The System analyses your 6 stats and curates 8 quests:</p>
            <ul>
              <li><strong>5 Main Quests</strong> — always includes ? critical quests + quests targeting your weakest stat</li>
              <li><strong>3 Side Quests</strong> — recovery and support for your 2nd weakest stat</li>
              <li>Shows directive: e.g. "? Today's focus: CODE. Your INT is weakest. LeetCode mandatory."</li>
            </ul>
          </div>
          <h3 class="tech">? AI QUEST SYNC (24-hour cooldown)</h3>
          <ul>
            <li>Generates 3 SKILL + 1 DISCIPLINE quest using AI</li>
            <li>AI knows: your name, city (Chennai), goal (high-paying dev role), current job (TVM Infotech, Angular + Spring Boot)</li>
            <li>AI uses your exact stat values and skill levels for accurate quests</li>
            <li>Example output: "[SKILL] Solve 1 LeetCode Medium (Two Pointers) — no AI — 35 min"</li>
            <li>Old AI quests are automatically deactivated on each new sync</li>
          </ul>
        </section>

        <section class="panel">
          <h2 class="tech">V. XP, MULTIPLIERS AND RANK SYSTEM</h2>
          <h3 class="tech">XP Multipliers on Every Quest</h3>
          <table class="quest-table">
            <tr><th>Multiplier</th><th>Source (where to log)</th><th>Effect</th></tr>
            <tr><td>Energy Multiplier</td><td>Life OS ? Health ? Morning Energy</td><td>below 40 = 0.80x · 40-60 = 0.90x · 60-80 = 1.00x · above 80 = 1.10x</td></tr>
            <tr><td>Focus Multiplier</td><td>Life OS ? Dopamine ? Daily log</td><td>Low dopamine score = 0.80-0.90x · High score = 1.10-1.20x</td></tr>
          </table>
          <p><em>Log your sleep, water, and dopamine data daily to earn significantly more XP from every quest!</em></p>
          <h3 class="tech">Rank Ladder</h3>
          <div class="rank-row">
            <span class="rbadge rank-e">E</span>
            <span class="rbadge rank-d">D</span>
            <span class="rbadge rank-c">C</span>
            <span class="rbadge rank-b">B</span>
            <span class="rbadge rank-a">A</span>
            <span class="rbadge rank-s">S</span>
          </div>
          <h3 class="tech" style="margin-top:20px;">Progressive Overload — Courage of the Weak</h3>
          <table class="quest-table">
            <tr><th>Level</th><th>Rank</th><th>Required Exercise</th><th>XP</th></tr>
            <tr><td>1-5</td><td><span class="rank-e">E</span></td><td>10 Push-ups · 10 Sit-ups · 10 Squats · 1km Walk</td><td>50</td></tr>
            <tr><td>6-10</td><td><span class="rank-d">D</span></td><td>25 Push-ups · 25 Sit-ups · 25 Squats · 2.5km Jog</td><td>100</td></tr>
            <tr><td>11-20</td><td><span class="rank-c">C</span></td><td>50 Push-ups · 50 Sit-ups · 50 Squats · 5km Run</td><td>150</td></tr>
            <tr><td>21+</td><td><span class="rank-b">B-S</span></td><td>100 Push-ups · 100 Sit-ups · 100 Squats · 10km Run</td><td>200</td></tr>
          </table>
        </section>

        <section class="panel">
          <h2 class="tech">VI. STATS AND ATTRIBUTES</h2>
          <p>Every quest grants stat boosts. Your stats reflect your real-life growth:</p>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="tech stat-name str">STR — Strength</span>
              Physical fitness. Boosted by: EXERCISE, COURAGE_OF_THE_WEAK, COLD_SHOWER, MORNING_SUN, NO_PORN
            </div>
            <div class="stat-item">
              <span class="tech stat-name intel">INT — Intelligence</span>
              Technical knowledge and coding depth. Boosted by: CODE_NO_AI, LEETCODE, TECH_LEARN, SYSTEM_DESIGN, ANGULAR_BUILD
            </div>
            <div class="stat-item">
              <span class="tech stat-name vit">VIT — Vitality</span>
              Health, sleep, nutrition, recovery. Boosted by: SLEEP, WATER, BREAKFAST, ZINC_MEAL, NO_SODA, MORNING_SUN
            </div>
            <div class="stat-item">
              <span class="tech stat-name agi">AGI — Agility</span>
              Communication and English speaking. Boosted by: ENGLISH, MOCK_INTERVIEW, LINKEDIN_UPDATE, BREATHING
            </div>
            <div class="stat-item">
              <span class="tech stat-name per">PER — Perception</span>
              Problem solving and analytical thinking. Boosted by: LEETCODE, SELF_DEBUG, SYSTEM_DESIGN, DOPAMINE_DETOX
            </div>
            <div class="stat-item">
              <span class="tech stat-name dis">DIS — Discipline</span>
              Mental fortitude and consistency. Boosted by: SLEEP, NO_PORN, EXERCISE, COLD_SHOWER, NO_SODA, BREATHING
            </div>
          </div>
        </section>

        <section class="panel">
          <h2 class="tech">VII. HP, SURVIVAL AND THE PENALTY ZONE</h2>
          <ul>
            <li><strong>Starting HP:</strong> 100 HP</li>
            <li><strong>Midnight Reset:</strong> Every night the System evaluates your day</li>
            <li><strong>HP Loss:</strong> Missing critical quests causes HP to drop</li>
            <li><strong>Perfect Day Bonus:</strong> Complete ALL daily quests — HP +5 at midnight</li>
            <li><strong>Rank Drop:</strong> If HP hits 0, Hunter Rank drops one level</li>
          </ul>
          <div class="highlight-box" style="border-color:#E24B4A;">
            <h3 class="tech" style="color:#E24B4A;">?? THE PENALTY ZONE</h3>
            <p>If HP drops critically low, you enter Penalty Zone. A red banner locks your Status page. Complete the Survival Quest to escape:</p>
            <p style="font-family:monospace;background:rgba(226,75,74,0.1);padding:8px 12px;border-radius:4px;">[PENALTY] Survival: 20 Burpees or No Screen Time for 1 Hour</p>
          </div>
        </section>

        <section class="panel">
          <h2 class="tech">VIII. ATOMIC HABITS ENGINE (/habits)</h2>
          <ul>
            <li><strong>Cue</strong> — What triggers this habit (time, location, event)</li>
            <li><strong>Craving</strong> — The deeper reason this habit matters to you</li>
            <li><strong>Routine</strong> — The exact action you perform</li>
            <li><strong>Reward</strong> — What you do right after to reinforce it</li>
            <li><strong>2-Minute Version</strong> — The minimum version for hard days</li>
            <li><strong>Keystone Habits</strong> — High-impact habits that trigger other positive habits</li>
          </ul>
          <div class="highlight-box">
            <h3 class="tech">?? Shadow Army</h3>
            <p>When a habit reaches mastery, it transforms into a <strong>Shadow</strong> — a permanent ally with a power bonus (e.g., +10% SKILL XP). View your Shadow Army on the Status page.</p>
          </div>
          <div class="highlight-box">
            <h3 class="tech">Habit Template Packs</h3>
            <ul>
              <li>?? <strong>Hunter Pack</strong> — Cold shower, Morning sun, Body training</li>
              <li>?? <strong>Scholar Pack</strong> — LeetCode, Book reading, English speaking</li>
              <li>?? <strong>Monk Pack</strong> — Meditation, Evening journal</li>
              <li>? <strong>Warrior Pack</strong> — No junk food, Track spending, No PMO</li>
            </ul>
          </div>
        </section>

        <section class="panel">
          <h2 class="tech">IX. WEEKLY DUNGEON (GATE)</h2>
          <ul>
            <li>A dungeon boss resets every Monday in the right panel of Status</li>
            <li>Each quest deals <strong>Boss Damage</strong> to the boss (5-80 per quest)</li>
            <li>Clearing <strong>33+ quests per week</strong> defeats the boss — bonus XP reward</li>
            <li>Current: <strong>E-Rank Gate: The Awakening</strong> (Boss: Lesser Wraith, 600 HP)</li>
            <li>Boss difficulty scales with your Rank as you grow stronger</li>
          </ul>
        </section>

        <section class="panel">
          <h2 class="tech">X. AI FEATURES — COMPLETE GUIDE</h2>
          <div class="highlight-box">
            <h3 class="tech">?? AI Morning Commander</h3>
            <p>Modal on the Status page. Reviews yesterday's quest performance, your current stats and skills, and today's quest list. Outputs: Greeting · Yesterday Recap · Today's Top 3 Priorities · Feedback · Estimated Level-Up Timeline.</p>
          </div>
          <div class="highlight-box">
            <h3 class="tech">? AI Quest Sync (24hr cooldown)</h3>
            <p>Generates 4 quests. The AI knows your name, city (Chennai), career goal, current job (TVM Infotech — Angular + Spring Boot), your exact stats, and skill levels. Generates quests only for your real tech stack: Angular (Signals, Guards, Routing), Spring Boot, Java, DSA/LeetCode, System Design, English speaking.</p>
          </div>
          <div class="highlight-box">
            <h3 class="tech">?? AI Mentor Chat (/ai)</h3>
            <p>Direct chat with your AI mentor. Ask coding questions, career strategy, or discipline advice. The AI has memory of your past sessions.</p>
          </div>
        </section>

        <section class="panel">
          <h2 class="tech">XI. LIVE SYNC AND CONNECTIVITY</h2>
          <ul>
            <li><span class="live-on">? LIVE</span> — Connected to backend via real-time Server-Sent Events. Quest completions update all devices instantly.</li>
            <li><span class="live-off">? SYNC</span> — Reconnecting. The backend on Render's free tier sleeps after 15 min of inactivity. Wait 30-60 seconds for it to wake, then click RETRY CONNECTION.</li>
          </ul>
        </section>

        <section class="panel">
          <h2 class="tech">XII. AWAKENING DATE AND JOURNEY TRACKING</h2>
          <p>Your <strong>Awakening Date</strong> is shown on your Status card:</p>
          <div class="code-block">AWAKENED: JULY 22, 2026</div>
          <p>Track your full journey on the <strong>Insights</strong> page — a GitHub-style heatmap shows every day you completed quests. The monthly report gives a System Verdict on how your month performed.</p>
        </section>

        <section class="panel">
          <h2 class="tech">XIII. CHEAT DAYS / VACATION MODE</h2>
          <div class="highlight-box" style="border-color:#FAC775;">
            <h3 class="tech" style="color:#FAC775;">? Coming Soon — Not Yet Implemented</h3>
            <p>A planned feature will let you mark days as Cheat Days (Sunday, trips, special occasions) so missed quests do not count against your HP or streak.</p>
            <p>For now on rest days: complete at least the <strong>Recovery Quests</strong> (BREATHING, READ_NO_SCROLL, MORNING_SUN) — these count double toward the daily minimum and do not trigger the Penalty Zone.</p>
          </div>
        </section>

        <div class="footer tech">
          <p>? E-RANK ? S-RANK · ARISE, HUNTER · THE SYSTEM IS WATCHING ?</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .guide-container {
      min-height: 100vh;
      background-color: #050511;
      background-image: radial-gradient(circle at 20% 30%, rgba(83,74,183,0.08) 0%, transparent 60%),
                        radial-gradient(circle at 80% 70%, rgba(29,158,117,0.06) 0%, transparent 60%);
      color: #c5c5d8;
      padding: 0 20px 80px 20px;
      overflow-y: auto;
    }
    .top-nav {
      padding: max(env(safe-area-inset-top, 20px), 20px) 0 20px 0;
      position: sticky; top: 0;
      background: rgba(5, 5, 17, 0.93);
      backdrop-filter: blur(10px);
      z-index: 10;
      border-bottom: 1px solid rgba(83,74,183,0.3);
    }
    .back-btn {
      background: none; border: 1px solid #534AB7; color: #534AB7;
      padding: 8px 16px; font-size: 0.85rem; cursor: pointer;
      border-radius: 4px; letter-spacing: 1px; transition: all 0.2s;
      font-family: 'Courier New', monospace;
    }
    .back-btn:hover { background: rgba(83,74,183,0.15); box-shadow: 0 0 12px rgba(83,74,183,0.4); color: #7F77DD; }
    .guide-header { text-align: center; margin: 48px 0 40px; }
    .glitch {
      font-size: 2.5rem; font-weight: 900; color: #fff;
      text-shadow: 0 0 16px rgba(83,74,183,0.8), 0 0 32px rgba(83,74,183,0.4);
      letter-spacing: 5px; margin-bottom: 10px;
    }
    .subtitle { color: #534AB7; letter-spacing: 3px; font-size: 0.85rem; }
    .content-wrapper { max-width: 860px; margin: 0 auto; }
    .panel {
      background: rgba(8, 8, 22, 0.88); border-left: 3px solid #534AB7;
      padding: 28px; margin-bottom: 28px; border-radius: 6px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6);
    }
    .panel h2 {
      color: #fff; font-size: 1.1rem; margin-top: 0; margin-bottom: 16px;
      letter-spacing: 1.5px; text-shadow: 0 0 8px rgba(83,74,183,0.5);
    }
    .panel h3.tech { font-size: 0.9rem; margin: 18px 0 10px; letter-spacing: 1px; }
    .panel p { line-height: 1.7; margin-bottom: 12px; font-size: 0.9rem; }
    .panel ul { padding-left: 20px; line-height: 1.7; }
    .panel li { margin-bottom: 8px; font-size: 0.9rem; }
    strong { color: #e8e8f8; }
    em { color: #9898b8; }
    .highlight-box {
      background: rgba(83,74,183,0.07); border: 1px dashed rgba(83,74,183,0.45);
      padding: 16px 20px; margin: 16px 0; border-radius: 6px;
    }
    .highlight-box h3 { color: #7F77DD; margin-top: 0; font-size: 0.9rem; }
    .quest-table { width: 100%; border-collapse: collapse; margin: 10px 0 22px; font-size: 0.83rem; }
    .quest-table th {
      background: rgba(255,255,255,0.04); color: #8a8a9a; text-align: left;
      padding: 7px 10px; font-size: 0.72rem; letter-spacing: 1px;
      font-family: 'Courier New', monospace; border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .quest-table td { padding: 7px 10px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #c5c5d8; }
    .quest-table tr:last-child td { border-bottom: none; }
    .quest-table tr:hover td { background: rgba(255,255,255,0.025); }
    .cat-daily  { color: #1D9E75 !important; }
    .cat-skill  { color: #7F77DD !important; }
    .cat-disc   { color: #E24B4A !important; }
    .cat-week   { color: #4FC3F7 !important; }
    .cat-month  { color: #CE93D8 !important; }
    .cat-mile   { color: #FAC775 !important; }
    .stats-grid { display: grid; grid-template-columns: 1fr; gap: 14px; margin-top: 18px; }
    @media (min-width: 600px) { .stats-grid { grid-template-columns: 1fr 1fr; } }
    .stat-item {
      background: rgba(0, 0, 0, 0.35); padding: 14px; border-radius: 6px;
      font-size: 0.86rem; line-height: 1.55; border: 1px solid rgba(255,255,255,0.05);
    }
    .stat-name { font-weight: bold; font-size: 0.92rem; display: block; margin-bottom: 5px; }
    .str   { color: #D85A30; }
    .intel { color: #534AB7; }
    .vit   { color: #1D9E75; }
    .agi   { color: #BA7517; }
    .per   { color: #378ADD; }
    .dis   { color: #E24B4A; }
    .rank-row { display: flex; gap: 10px; margin: 14px 0; flex-wrap: wrap; align-items: center; }
    .rbadge { padding: 5px 16px; border-radius: 4px; font-weight: bold; font-size: 0.95rem; font-family: 'Courier New', monospace; letter-spacing: 2px; border: 1px solid; }
    .rank-e { color: #F0997B; background: rgba(153,60,29,0.2); border-color: #993C1D; }
    .rank-d { color: #85B7EB; background: rgba(55,138,221,0.15); border-color: #378ADD; }
    .rank-c { color: #5DCAA5; background: rgba(29,158,117,0.15); border-color: #1D9E75; }
    .rank-b { color: #AFA9EC; background: rgba(127,119,221,0.15); border-color: #7F77DD; }
    .rank-a { color: #FAC775; background: rgba(186,117,23,0.15); border-color: #BA7517; }
    .rank-s { color: #F09595; background: rgba(226,75,74,0.15); border-color: #E24B4A; }
    .info-chip {
      display: inline-flex; flex-direction: column; gap: 3px;
      background: rgba(83,74,183,0.1); border: 1px solid rgba(83,74,183,0.3);
      padding: 10px 16px; border-radius: 6px; margin-top: 12px;
    }
    .info-chip .k { font-size: 0.68rem; color: #8a8a9a; letter-spacing: 1px; font-family: 'Courier New', monospace; }
    .info-chip .v { font-size: 0.86rem; color: #c5c5d8; margin-top: 2px; }
    .code-block {
      font-family: 'Courier New', monospace;
      background: rgba(83,74,183,0.12); border: 1px solid rgba(83,74,183,0.3);
      padding: 10px 16px; border-radius: 4px; color: #FAC775;
      font-size: 0.9rem; letter-spacing: 2px; margin: 12px 0;
    }
    .live-on { color: #1D9E75; font-family: monospace; }
    .live-off { color: #E24B4A; font-family: monospace; }
    .footer {
      text-align: center; margin-top: 60px; padding: 24px;
      border-top: 1px solid rgba(83,74,183,0.25);
      color: #534AB7; font-weight: bold; letter-spacing: 4px;
      text-shadow: 0 0 12px rgba(83,74,183,0.5); font-size: 0.85rem;
    }
  `]
})
export class SystemGuideComponent {
  constructor(private location: Location) {}
  goBack() { this.location.back(); }
}
