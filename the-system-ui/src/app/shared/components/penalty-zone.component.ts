import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-penalty-zone',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="penalty-banner">
      <div class="glitch-container">
        <span class="glitch" data-text="PENALTY ZONE">PENALTY ZONE</span>
      </div>
      <p class="penalty-desc tech">
        Complete your Survival Quest to restore the System.
      </p>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 10000;
    }

    .penalty-banner {
      background-color: rgba(60, 0, 0, 0.95);
      border-bottom: 2px solid #ff3333;
      box-shadow: 0 4px 20px rgba(255, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10px;
      text-align: center;
      animation: pulseBg 4s infinite alternate;
    }

    @keyframes pulseBg {
      0% { background-color: rgba(60, 0, 0, 0.95); }
      100% { background-color: rgba(100, 0, 0, 0.95); }
    }

    .glitch-container {
      margin-bottom: 5px;
    }

    .glitch {
      font-size: 1.2rem;
      font-weight: 900;
      text-transform: uppercase;
      position: relative;
      color: white;
      text-shadow: 0 0 5px red, 0 0 10px darkred;
      letter-spacing: 2px;
    }

    .glitch::before, .glitch::after {
      content: attr(data-text);
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: transparent;
    }

    .glitch::before {
      left: 1px;
      text-shadow: -1px 0 red;
      animation: glitch-anim-1 2s infinite linear alternate-reverse;
    }

    .glitch::after {
      left: -1px;
      text-shadow: -1px 0 blue;
      animation: glitch-anim-2 3s infinite linear alternate-reverse;
    }

    @keyframes glitch-anim-1 {
      0% { clip-path: inset(20% 0 80% 0); }
      20% { clip-path: inset(60% 0 10% 0); }
      40% { clip-path: inset(40% 0 50% 0); }
      60% { clip-path: inset(80% 0 5% 0); }
      80% { clip-path: inset(10% 0 70% 0); }
      100% { clip-path: inset(30% 0 50% 0); }
    }
    @keyframes glitch-anim-2 {
      0% { clip-path: inset(10% 0 60% 0); }
      20% { clip-path: inset(30% 0 20% 0); }
      40% { clip-path: inset(70% 0 10% 0); }
      60% { clip-path: inset(20% 0 50% 0); }
      80% { clip-path: inset(50% 0 30% 0); }
      100% { clip-path: inset(5% 0 80% 0); }
    }

    .penalty-desc {
      font-size: 0.8rem;
      margin: 0;
      color: #ff9999;
    }
  `]
})
export class PenaltyZoneComponent {
  @Input() endTime!: string; // Maintained for interface compatibility, but unused
}
