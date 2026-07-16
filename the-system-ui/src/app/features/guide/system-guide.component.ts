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
        <button class="back-btn" (click)="goBack()">← SYSTEM OS</button>
      </div>

      <header class="guide-header">
        <h1 class="glitch" data-text="SYSTEM MANUAL">SYSTEM MANUAL</h1>
        <p class="subtitle tech">Classified Information for Awakened Players</p>
      </header>

      <div class="content-wrapper">
        <section class="panel">
          <h2 class="tech">I. THE SYSTEM: AN OVERVIEW</h2>
          <p>
            Welcome, Player. You have been selected by <strong>THE SYSTEM</strong>.
            This application is not just a habit tracker; it is a full RPG engine for your real life.
            Your ultimate goal is to grow stronger, level up, and become an S-Rank Hunter by mastering your daily routines, physical health, and professional skills.
          </p>
        </section>

        <section class="panel">
          <h2 class="tech">II. DAILY WORKFLOW (HOW TO PLAY)</h2>
          <p>Every day in THE SYSTEM follows a strict cycle. To survive and level up, you must follow this daily flow:</p>
          
          <div class="highlight-box">
            <h3 class="tech">Morning: The Awakening</h3>
            <ul>
              <li><strong>Open the App:</strong> Check your <em>Status</em> page to see your current HP, Level, and Rank.</li>
              <li><strong>Review Quests:</strong> Navigate to the <em>Quests</em> tab to see your assigned tasks for the day.</li>
            </ul>
          </div>

          <div class="highlight-box">
            <h3 class="tech">Daytime: The Grind</h3>
            <ul>
              <li><strong>Log Your Habits:</strong> As you complete tasks (e.g., Eating Breakfast, Drinking Water, Coding), check them off in the Quests tab.</li>
              <li><strong>Physical Training:</strong> You must complete the <em>Courage of the Weak</em> quest every single day. (See section on Physical Quests).</li>
              <li><strong>Life OS:</strong> Use the <em>Life OS</em> tab to log deep work sessions, track learning hours, or record dopamine detox streaks.</li>
            </ul>
          </div>

          <div class="highlight-box">
            <h3 class="tech">Evening: The Review (9 PM)</h3>
            <ul>
              <li><strong>Evening Check-in:</strong> At 9 PM, the System will prompt an Evening Review. You must log your daily reflections.</li>
              <li><strong>Midnight Reset:</strong> At exactly 12:00 AM, the System evaluates your day. If you missed core quests, you will lose HP and face penalties.</li>
            </ul>
          </div>
        </section>

        <section class="panel">
          <h2 class="tech">III. QUESTS & PROGRESSIVE OVERLOAD</h2>
          <p>Your tasks are divided into routines and the core Physical Quest.</p>
          
          <h3 class="tech">The Physical Quest: Courage of the Weak</h3>
          <p>
            You must complete this quest daily. The System uses <strong>Progressive Overload</strong>, meaning the difficulty scales with your current Player Level:
          </p>
          <ul>
            <li><strong>Level 1-5 (E-Rank):</strong> 10 Push-ups, 10 Sit-ups, 10 Squats, 1km Walk</li>
            <li><strong>Level 6-10 (D-Rank):</strong> 25 Push-ups, 25 Sit-ups, 25 Squats, 2.5km Jog</li>
            <li><strong>Level 11-20 (C-Rank):</strong> 50 Push-ups, 50 Sit-ups, 50 Squats, 5km Run</li>
            <li><strong>Level 21+ (B-Rank to S-Rank):</strong> 100 Push-ups, 100 Sit-ups, 100 Squats, 10km Run</li>
          </ul>

          <h3 class="tech">Foundational Habits</h3>
          <p>You are required to track basic life habits to ensure recovery. Eating, sleeping 8 hours, and avoiding late-night screens are critical for maintaining high HP.</p>
        </section>

        <section class="panel">
          <h2 class="tech">IV. HP, SURVIVAL & THE PENALTY ZONE</h2>
          <p>You start with 100 HP. Your HP determines your survival.</p>
          
          <ul>
            <li><strong>Gaining HP:</strong> Completing all your Daily Quests perfectly restores lost HP.</li>
            <li><strong>Losing HP:</strong> Failing to complete enough quests causes your HP to drop during the Midnight Reset.</li>
            <li><strong>The Penalty Zone:</strong> If you fail the "Courage of the Weak" physical quest, the System will throw you into the Penalty Zone. A red banner will lock the top of your screen. To escape, you must complete the <em>Survival Penalty Quest</em> (e.g., 20 Burpees or a 1-hour screen ban) listed in your Quests tab.</li>
            <li><strong>Rank Drop:</strong> If you are lazy, your HP will eventually hit 0. When this happens, the System will instantly demote your Hunter Rank (e.g., from C-Rank back down to D-Rank).</li>
          </ul>
        </section>

        <section class="panel">
          <h2 class="tech">V. STATS & ATTRIBUTES</h2>
          <p>Every quest you complete grants Experience Points (XP) towards specific stats. Leveling up these stats reflects your real-life growth:</p>
          <div class="stats-grid">
            <div class="stat-item"><span class="tech stat-name str">STR (Strength)</span><br>Increased by physical workouts, lifting, and the daily physical quest.</div>
            <div class="stat-item"><span class="tech stat-name agi">AGI (Agility)</span><br>Increased by cardio, running, speed reading, and fast task execution.</div>
            <div class="stat-item"><span class="tech stat-name vit">VIT (Vitality)</span><br>Increased by sleep, eating healthy meals, drinking water, and recovery.</div>
            <div class="stat-item"><span class="tech stat-name int">INT (Intelligence)</span><br>Increased by deep work, coding sessions, reading, and learning.</div>
            <div class="stat-item"><span class="tech stat-name per">PER (Perception)</span><br>Increased by meditation, debugging code, and avoiding distractions.</div>
            <div class="stat-item"><span class="tech stat-name hor">HOR (Hormones)</span><br>Increased by dopamine detox (No-fap, cold showers) and discipline.</div>
          </div>
        </section>

        <section class="panel">
          <h2 class="tech">VI. SYSTEM COMPONENTS EXPLAINED</h2>
          
          <div class="highlight-box">
            <h3 class="tech">1. Status (Dashboard)</h3>
            <p>Your main hub. Here you can see your beautiful Hunter Badge, your current Level, XP progress bar, and your HP. Use this to quickly check your standing.</p>
          </div>

          <div class="highlight-box">
            <h3 class="tech">2. Quests (Habits)</h3>
            <p>This is where you check off your tasks. Simply tap a quest to mark it as complete. You will immediately see XP and stat boosts floating on the screen.</p>
          </div>

          <div class="highlight-box">
            <h3 class="tech">3. Life OS</h3>
            <p>Your professional and mental tracking tool. Use this tab to:</p>
            <ul>
              <li>Log hours spent coding or working.</li>
              <li>Track your dopamine detox streaks (e.g., days without social media).</li>
              <li>Input journal entries for mental clarity.</li>
            </ul>
          </div>

          <div class="highlight-box">
            <h3 class="tech">4. Body OS (Physical)</h3>
            <p>Your health tracker. Use this tab to:</p>
            <ul>
              <li>Log your daily body weight.</li>
              <li>Track your sleep duration and quality.</li>
              <li>Record specific gym workouts (sets, reps, weights) beyond the basic daily quest.</li>
            </ul>
          </div>

          <div class="highlight-box">
            <h3 class="tech">5. AI Mentor</h3>
            <p>If you feel lost, unmotivated, or need coding/life advice, talk to the AI Mentor. It acts as the "System Architect" and will give you ruthless, discipline-focused advice to keep you on track.</p>
          </div>

          <div class="highlight-box">
            <h3 class="tech">6. Ranks & Achievements</h3>
            <p>As you level up, you unlock Titles (like "Shadow Monarch" or "Novice Hunter"). This page shows your overall Rank (E -> S) and the achievements you have permanently unlocked.</p>
          </div>
        </section>

        <div class="footer tech">
          <p>ARISE, HUNTER. THE SYSTEM IS WATCHING.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .guide-container {
      min-height: 100vh;
      background-color: #050505;
      background-image: radial-gradient(circle at center, #111 0%, #000 100%);
      color: #ccc;
      padding: 0 20px 60px 20px;
      overflow-y: auto;
    }

    .top-nav {
      padding: 20px 0;
      position: sticky;
      top: 0;
      background: rgba(5, 5, 5, 0.9);
      backdrop-filter: blur(5px);
      z-index: 10;
      border-bottom: 1px solid rgba(0, 153, 255, 0.2);
    }

    .back-btn {
      background: none;
      border: 1px solid #0099ff;
      color: #0099ff;
      padding: 8px 16px;
      font-size: 0.9rem;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .back-btn:hover {
      background: rgba(0, 153, 255, 0.2);
      box-shadow: 0 0 10px rgba(0, 153, 255, 0.5);
    }

    .guide-header {
      text-align: center;
      margin: 40px 0;
    }

    .glitch {
      font-size: 2.5rem;
      font-weight: 900;
      color: #fff;
      text-shadow: 0 0 10px rgba(0, 153, 255, 0.8);
      letter-spacing: 4px;
      margin-bottom: 10px;
    }

    .subtitle {
      color: #0099ff;
      letter-spacing: 2px;
      font-size: 0.9rem;
    }

    .content-wrapper {
      max-width: 800px;
      margin: 0 auto;
    }

    .panel {
      background: rgba(10, 15, 25, 0.8);
      border-left: 3px solid #0099ff;
      padding: 25px;
      margin-bottom: 30px;
      border-radius: 4px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
    }

    .panel h2 {
      color: #fff;
      font-size: 1.2rem;
      margin-top: 0;
      margin-bottom: 15px;
      letter-spacing: 1px;
      text-shadow: 0 0 5px rgba(0, 153, 255, 0.5);
    }

    .panel p {
      line-height: 1.6;
      margin-bottom: 15px;
      font-size: 0.95rem;
    }

    .panel ul {
      padding-left: 20px;
      line-height: 1.6;
    }

    .panel li {
      margin-bottom: 10px;
      font-size: 0.95rem;
    }

    strong {
      color: #fff;
    }

    .highlight-box {
      background: rgba(0, 153, 255, 0.1);
      border: 1px dashed #0099ff;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }

    .highlight-box h3 {
      color: #0099ff;
      margin-top: 0;
      font-size: 1rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 15px;
      margin-top: 20px;
    }

    @media (min-width: 600px) {
      .stats-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .stat-item {
      background: rgba(0, 0, 0, 0.4);
      padding: 15px;
      border-radius: 4px;
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .stat-name {
      font-weight: bold;
      font-size: 1rem;
    }

    .str { color: #ff4d4d; }
    .agi { color: #4dff4d; }
    .vit { color: #ffff4d; }
    .int { color: #4d4dff; }
    .per { color: #b34dff; }
    .hor { color: #ff994d; }

    .footer {
      text-align: center;
      margin-top: 50px;
      padding: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: #0099ff;
      font-weight: bold;
      letter-spacing: 5px;
      text-shadow: 0 0 10px rgba(0, 153, 255, 0.5);
    }
  `]
})
export class SystemGuideComponent {
  constructor(private location: Location) {}

  goBack() {
    this.location.back();
  }
}
