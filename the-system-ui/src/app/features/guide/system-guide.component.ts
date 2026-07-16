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
          <h2 class="tech">I. AWAKENING</h2>
          <p>
            Welcome, Player. You have been selected by <strong>THE SYSTEM</strong>.
            This application is not just a habit tracker; it is an RPG engine for your real life.
            Every action you take in reality earns XP, levels you up, and increases your stats.
          </p>
          <p>
            If you stay consistent, you will grow stronger. If you fail to meet the System's requirements, you will be penalized.
          </p>
        </section>

        <section class="panel">
          <h2 class="tech">II. DAILY QUESTS & PROGRESSIVE OVERLOAD</h2>
          <p>
            Quests reset every night at midnight. You must complete your core Daily Quests to survive.
          </p>
          <div class="highlight-box">
            <h3 class="tech">[DAILY] Secret Quest: Courage of the Weak</h3>
            <p>
              Your physical requirement scales with your Player Level. You are not expected to do 100 reps on Day 1.
            </p>
            <ul>
              <li><strong>Level 1-5:</strong> 10 Push-ups, 10 Sit-ups, 10 Squats, 1km Walk</li>
              <li><strong>Level 6-10:</strong> 25 Push-ups, 25 Sit-ups, 25 Squats, 2.5km Jog</li>
              <li><strong>Level 11-20:</strong> 50 Push-ups, 50 Sit-ups, 50 Squats, 5km Run</li>
              <li><strong>Level 21+:</strong> 100 Push-ups, 100 Sit-ups, 100 Squats, 10km Run</li>
            </ul>
          </div>
          <p>
            In addition to physical training, foundational habits (Sleep, Water, Breakfast, No Screens before bed) are marked as <strong>[DAILY]</strong>. The System recognizes that recovery is just as important as training.
          </p>
        </section>

        <section class="panel">
          <h2 class="tech">III. HP & THE PENALTY ZONE</h2>
          <p>
            You start with 100 HP. Completing your Daily Quests perfectly recovers HP. Failing them results in HP loss.
          </p>
          <ul>
            <li><strong>Penalty Zone:</strong> If you fail the "Courage of the Weak" physical quest, the System will throw you into the Penalty Zone the next day. A red banner will lock the top of your screen, and you must complete a <em>Survival Penalty Quest</em> (e.g. Burpees or Screen-Time bans) to restore normal functionality.</li>
            <li><strong>Rank Drop:</strong> If you consistently fail your quests and your HP reaches 0, you will be demoted to a lower Rank (e.g. from C-Rank down to D-Rank), losing your prestige.</li>
          </ul>
        </section>

        <section class="panel">
          <h2 class="tech">IV. STATUS & STATS</h2>
          <p>
            Completing specific quests (like Coding, Reading, or Exercising) grants points toward your core stats:
          </p>
          <div class="stats-grid">
            <div class="stat-item"><span class="tech stat-name str">STR</span> (Strength): Physical power and muscle endurance.</div>
            <div class="stat-item"><span class="tech stat-name agi">AGI</span> (Agility): Speed, cardio, and quick task execution.</div>
            <div class="stat-item"><span class="tech stat-name vit">VIT</span> (Vitality): Health, sleep quality, and diet.</div>
            <div class="stat-item"><span class="tech stat-name int">INT</span> (Intelligence): Technical knowledge, coding, and learning.</div>
            <div class="stat-item"><span class="tech stat-name per">PER</span> (Perception): Awareness, debugging, and focus.</div>
            <div class="stat-item"><span class="tech stat-name hor">HOR</span> (Hormones): Testosterone, drive, and dopamine detox (No-fap, Cold Showers).</div>
          </div>
        </section>

        <section class="panel">
          <h2 class="tech">V. THE SYSTEM OS MODULES</h2>
          <ul>
            <li><strong>Life OS:</strong> Track your career, coding hours, deep work, and dopamine detox.</li>
            <li><strong>Body OS:</strong> Track your body weight, sleep duration, and detailed workouts.</li>
            <li><strong>AI Mentor:</strong> Seek guidance from the System Architect when you are stuck.</li>
            <li><strong>Ranks & Achievements:</strong> Unlock titles and view your overall Hunter Rank.</li>
          </ul>
        </section>

        <div class="footer tech">
          <p>ARISE, HUNTER.</p>
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
