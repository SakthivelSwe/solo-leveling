import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Penalty Zone — shown as a full-screen overlay when HP = 0.
 * Dramatically communicates the consequence of failing all quests.
 * Uses glitch effects, scanlines, and a timer countdown.
 */
@Component({
  selector: 'app-penalty-zone',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="pz-overlay" [class.pz-visible]="true">

      <!-- Scanlines overlay -->
      <div class="pz-scanlines"></div>

      <!-- Red noise vignette -->
      <div class="pz-vignette"></div>

      <!-- Main content -->
      <div class="pz-content">

        <!-- System alert icon -->
        <div class="pz-icon-wrap">
          <div class="pz-icon-ring ring1"></div>
          <div class="pz-icon-ring ring2"></div>
          <div class="pz-icon-ring ring3"></div>
          <span class="pz-icon">☠</span>
        </div>

        <!-- Glitch title -->
        <div class="pz-glitch-wrap">
          <span class="pz-glitch" data-text="PENALTY ZONE">PENALTY ZONE</span>
        </div>

        <div class="pz-sys-id tech">SYS://ALERT · HP = 0 · HUNTER DOWN</div>

        <!-- Verdict message -->
        <p class="pz-verdict">
          You have failed to complete your assigned quests.<br>
          <strong>The System does not forgive weakness.</strong>
        </p>

        <!-- HP display -->
        <div class="pz-hp-display">
          <div class="pz-hp-label tech">CURRENT HP</div>
          <div class="pz-hp-bar">
            <div class="pz-hp-fill"></div>
          </div>
          <div class="pz-hp-val mono">0 / {{ maxHp }}</div>
        </div>

        <!-- Consequence lines -->
        <div class="pz-consequences">
          <div class="pz-con-item">
            <span class="pz-con-icon">⚠</span>
            <span class="pz-con-text tech">XP MULTIPLIER REDUCED TO MINIMUM</span>
          </div>
          <div class="pz-con-item">
            <span class="pz-con-icon">⚠</span>
            <span class="pz-con-text tech">RANK PROGRESSION FROZEN</span>
          </div>
          <div class="pz-con-item">
            <span class="pz-con-icon">⚠</span>
            <span class="pz-con-text tech">HP RESTORES AT MIDNIGHT IF SURVIVAL QUEST COMPLETED</span>
          </div>
        </div>

        <!-- CTA -->
        <div class="pz-cta">
          <a routerLink="/habits" class="pz-btn-survive tech">
            ⚔ BEGIN SURVIVAL QUEST
          </a>
          <p class="pz-cta-hint tech">Complete all daily quests to restore the System</p>
        </div>

        <!-- System quote -->
        <div class="pz-quote tech">
          "In the end, the weak perish and the strong survive.<br>
          Arise, hunter. This is not your end."
          <span class="pz-quote-src"> — The System</span>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 10000;
    }

    /* ── Overlay ─────────────────────────────────────────────── */
    .pz-overlay {
      background: rgba(8, 0, 0, 0.97);
      border-bottom: 2px solid #ff2222;
      box-shadow:
        0 4px 40px rgba(255,0,0,0.4),
        0 0 80px rgba(255,0,0,0.08);
      padding: 16px 20px 20px;
      position: relative;
      overflow: hidden;
      animation: pzPulse 4s ease-in-out infinite alternate;
    }

    @keyframes pzPulse {
      from { box-shadow: 0 4px 30px rgba(255,0,0,0.3), 0 0 60px rgba(255,0,0,0.06); }
      to   { box-shadow: 0 4px 60px rgba(255,0,0,0.55), 0 0 120px rgba(255,0,0,0.14); }
    }

    /* ── Scanlines ───────────────────────────────────────────── */
    .pz-scanlines {
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,0.15) 2px,
        rgba(0,0,0,0.15) 4px
      );
      pointer-events: none;
      z-index: 1;
    }

    /* ── Vignette ────────────────────────────────────────────── */
    .pz-vignette {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at center, transparent 40%, rgba(200,0,0,0.12) 100%);
      pointer-events: none;
      z-index: 1;
    }

    /* ── Content ─────────────────────────────────────────────── */
    .pz-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      text-align: center;
    }

    /* ── Icon Rings ──────────────────────────────────────────── */
    .pz-icon-wrap {
      position: relative;
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pz-icon-ring {
      position: absolute;
      border-radius: 50%;
      border: 1px solid rgba(255,0,0,0.5);
      animation: ringPulse 2s ease-in-out infinite;
    }

    .ring1 { width: 56px; height: 56px; animation-delay: 0s; }
    .ring2 { width: 44px; height: 44px; animation-delay: 0.3s; }
    .ring3 { width: 32px; height: 32px; animation-delay: 0.6s; }

    @keyframes ringPulse {
      0%,100% { opacity: 0.4; transform: scale(1); }
      50%      { opacity: 1;   transform: scale(1.08); }
    }

    .pz-icon {
      font-size: 1.8rem;
      color: #ff2222;
      text-shadow: 0 0 20px #ff0000, 0 0 40px rgba(255,0,0,0.5);
      animation: iconShake 3s ease-in-out infinite;
      position: relative;
      z-index: 2;
    }

    @keyframes iconShake {
      0%,100% { transform: rotate(0deg); }
      5%       { transform: rotate(-3deg); }
      10%      { transform: rotate(3deg); }
      15%      { transform: rotate(-2deg); }
      20%      { transform: rotate(0deg); }
    }

    /* ── Glitch Title ────────────────────────────────────────── */
    .pz-glitch-wrap { line-height: 1; }

    .pz-glitch {
      font-family: 'Space Mono', monospace;
      font-size: 1.4rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 4px;
      position: relative;
      color: white;
      text-shadow: 0 0 8px #ff0000, 0 0 20px rgba(255,0,0,0.5);
      display: inline-block;

      &::before, &::after {
        content: attr(data-text);
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
      }

      &::before {
        left: 2px;
        color: #ff0000;
        animation: glitch1 2.5s infinite linear alternate-reverse;
        clip-path: inset(10% 0 60% 0);
      }

      &::after {
        left: -2px;
        color: #0000ff;
        animation: glitch2 3.2s infinite linear alternate-reverse;
        clip-path: inset(50% 0 10% 0);
      }
    }

    @keyframes glitch1 {
      0%   { clip-path: inset(20% 0 80% 0); transform: translate(-1px, 0); }
      25%  { clip-path: inset(60% 0 15% 0); transform: translate(1px, 0); }
      50%  { clip-path: inset(40% 0 40% 0); transform: translate(-1px, 0); }
      75%  { clip-path: inset(80% 0 5%  0); transform: translate(2px, 0); }
      100% { clip-path: inset(10% 0 75% 0); transform: translate(-2px, 0); }
    }

    @keyframes glitch2 {
      0%   { clip-path: inset(10% 0 55% 0); transform: translate(1px, 0); }
      33%  { clip-path: inset(35% 0 25% 0); transform: translate(-1px, 0); }
      66%  { clip-path: inset(70% 0 10% 0); transform: translate(2px, 0); }
      100% { clip-path: inset(5%  0 80% 0); transform: translate(-2px, 0); }
    }

    /* ── System ID ───────────────────────────────────────────── */
    .pz-sys-id {
      font-size: .52rem;
      letter-spacing: 3px;
      color: rgba(255,50,50,0.7);
      animation: blink 1.4s step-end infinite;
    }

    @keyframes blink {
      0%,100% { opacity: 1; }
      50%      { opacity: 0.3; }
    }

    /* ── Verdict ─────────────────────────────────────────────── */
    .pz-verdict {
      font-size: .74rem;
      color: #ff9999;
      line-height: 1.5;
      margin: 0;
      max-width: 400px;

      strong { color: #ff3333; font-family: 'Space Mono', monospace; }
    }

    /* ── HP bar ──────────────────────────────────────────────── */
    .pz-hp-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      width: 100%;
      max-width: 300px;
    }

    .pz-hp-label {
      font-size: .54rem;
      letter-spacing: 2px;
      color: rgba(255,100,100,0.7);
    }

    .pz-hp-bar {
      width: 100%;
      height: 6px;
      background: rgba(255,0,0,0.1);
      border-radius: 3px;
      border: 1px solid rgba(255,0,0,0.2);
      overflow: hidden;
    }

    .pz-hp-fill {
      height: 100%;
      width: 0%;
      background: #ff2222;
    }

    .pz-hp-val {
      font-size: .7rem;
      color: #ff3333;
    }

    /* ── Consequences ────────────────────────────────────────── */
    .pz-consequences {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
      max-width: 420px;
    }

    .pz-con-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 10px;
      background: rgba(255,0,0,0.06);
      border-left: 2px solid rgba(255,0,0,0.3);
      border-radius: 0 4px 4px 0;
    }

    .pz-con-icon {
      font-size: .85rem;
      color: #ff3333;
      flex-shrink: 0;
    }

    .pz-con-text {
      font-size: .55rem;
      letter-spacing: 1.5px;
      color: #ff9999;
    }

    /* ── CTA ─────────────────────────────────────────────────── */
    .pz-cta { display: flex; flex-direction: column; align-items: center; gap: 5px; }

    .pz-btn-survive {
      display: inline-block;
      padding: 10px 24px;
      border: 1px solid #ff2222;
      border-radius: 8px;
      background: rgba(255,0,0,0.12);
      color: #ff4444;
      font-size: .7rem;
      letter-spacing: 2px;
      text-decoration: none;
      transition: all 0.2s ease;
      animation: ctaPulse 2s ease-in-out infinite alternate;

      &:hover {
        background: rgba(255,0,0,0.25);
        box-shadow: 0 0 20px rgba(255,0,0,0.3);
        color: #fff;
      }
    }

    @keyframes ctaPulse {
      from { box-shadow: 0 0 8px rgba(255,0,0,0.2); }
      to   { box-shadow: 0 0 24px rgba(255,0,0,0.5); }
    }

    .pz-cta-hint {
      font-size: .52rem;
      letter-spacing: 1px;
      color: rgba(255,100,100,0.5);
      margin: 0;
    }

    /* ── Bottom quote ────────────────────────────────────────── */
    .pz-quote {
      font-size: .62rem;
      color: rgba(255,100,100,0.4);
      font-style: italic;
      line-height: 1.6;
      max-width: 360px;
    }

    .pz-quote-src {
      color: rgba(255,100,100,0.3);
      font-style: normal;
      display: block;
      font-size: .52rem;
      letter-spacing: 1.5px;
      margin-top: 2px;
    }

    /* ── Responsive ──────────────────────────────────────────── */
    @media (max-width: 480px) {
      .pz-overlay { padding: 12px 14px 16px; }
      .pz-glitch { font-size: 1.1rem; letter-spacing: 3px; }
      .pz-verdict { font-size: .68rem; }
      .pz-btn-survive { padding: 8px 18px; font-size: .64rem; }
      .pz-consequences { gap: 3px; }
      .pz-con-text { font-size: .5rem; letter-spacing: 1px; }
    }
  `]
})
export class PenaltyZoneComponent {
  @Input() endTime!: string;
  @Input() maxHp = 100;
}
