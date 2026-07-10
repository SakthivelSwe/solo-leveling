import {
  Component, Input, Output, EventEmitter,
  OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'rect' | 'circle';
}

/**
 * Streak milestone celebration overlay.
 * Shows a canvas-based gold/purple confetti burst + streak badge.
 * Auto-dismisses after 3 seconds. Triggers haptics via the parent.
 */
@Component({
  selector: 'app-streak-celebration',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="celebration-overlay" (click)="dismiss()">
      <canvas #confetti class="confetti-canvas"></canvas>

      <div class="celebration-card system-card">
        <div class="fire-row">
          <span class="fire">🔥</span>
          <span class="fire delay1">🔥</span>
          <span class="fire delay2">🔥</span>
        </div>

        <p class="streak-label tech">STREAK MILESTONE</p>
        <p class="streak-num mono">{{ streak }}</p>
        <p class="streak-unit tech">DAYS IN A ROW</p>

        <div class="habit-name">{{ habitName }}</div>

        <p class="message">{{ milestoneMessage }}</p>

        <p class="dismiss-hint tech">TAP TO CONTINUE</p>
      </div>
    </div>
  `,
  styleUrls: ['./streak-celebration.component.scss'],
})
export class StreakCelebrationComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() streak = 0;
  @Input() habitName = '';
  @Output() dismissed = new EventEmitter<void>();

  @ViewChild('confetti') canvasRef!: ElementRef<HTMLCanvasElement>;

  private animFrame = 0;
  private particles: Particle[] = [];
  private dismissTimer = 0;

  readonly COLORS = [
    '#FAC775', '#534AB7', '#4fc3f7', '#1D9E75',
    '#E24B4A', '#ffe6b0', '#b3aef0', '#5dcaa5',
  ];

  readonly MILESTONE_MESSAGES: Record<number, string> = {
    3:   'The habit loop is forming. Keep going.',
    7:   'One week strong. Identity is shifting.',
    14:  'Two weeks. You are becoming the habit.',
    21:  'Three weeks. The neural pathways are carved.',
    30:  'One month. A new identity is locked in.',
    50:  'Fifty days. Elite discipline.',
    100: 'ONE HUNDRED DAYS. You are unstoppable.',
  };

  get milestoneMessage(): string {
    return this.MILESTONE_MESSAGES[this.streak]
      ?? `${this.streak} days. The system is working.`;
  }

  ngOnInit(): void {
    this.dismissTimer = window.setTimeout(() => this.dismiss(), 3500);
  }

  ngAfterViewInit(): void {
    this.initConfetti();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animFrame);
    clearTimeout(this.dismissTimer);
  }

  dismiss(): void {
    this.dismissed.emit();
  }

  private initConfetti(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Spawn 80 particles from the top center
    this.particles = Array.from({ length: 80 }, () => this.spawnParticle(canvas));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      this.particles = this.particles.filter(p => p.alpha > 0.01);

      for (const p of this.particles) {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.12; // gravity
        p.vx *= 0.99; // air resistance
        p.rotation += p.rotationSpeed;
        p.alpha -= 0.008;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
      }

      if (this.particles.length > 0) {
        this.animFrame = requestAnimationFrame(animate);
      }
    };

    this.animFrame = requestAnimationFrame(animate);
  }

  private spawnParticle(canvas: HTMLCanvasElement): Particle {
    const angle = (Math.random() * Math.PI) - Math.PI / 2 + (Math.random() - 0.5) * 1.8;
    const speed = 4 + Math.random() * 10;
    return {
      x: canvas.width / 2 + (Math.random() - 0.5) * 100,
      y: canvas.height * 0.3,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      size: 6 + Math.random() * 10,
      color: this.COLORS[Math.floor(Math.random() * this.COLORS.length)],
      alpha: 1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
    };
  }
}
