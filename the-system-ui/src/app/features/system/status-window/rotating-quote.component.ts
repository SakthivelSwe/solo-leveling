import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Quote {
  text: string;
  author: string;
  source: string;
}

@Component({
  selector: 'app-rotating-quote',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="quote-container tech" *ngIf="currentQuote()" [class.fade-out]="isAnimating()">
      <div class="quote-content">
        <span class="quote-mark">"</span>
        <span class="quote-text">{{ currentQuote()?.text }}</span>
        <span class="quote-mark">"</span>
      </div>
      <div class="quote-author mono">
        ◈ {{ currentQuote()?.author }} <span class="quote-source">[{{ currentQuote()?.source }}]</span>
      </div>
    </div>
  `,
  styles: [`
    .quote-container {
      margin-top: 24px;
      padding: 18px 24px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(29, 158, 117, 0.08), rgba(29, 158, 117, 0.02));
      border: 1px solid rgba(29, 158, 117, 0.2);
      border-left: 4px solid var(--system-green);
      transition: opacity 0.8s ease, transform 0.8s ease;
      opacity: 1;
      transform: translateY(0);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2), inset 0 0 10px rgba(29, 158, 117, 0.05);
    }
    .quote-container.fade-out {
      opacity: 0;
      transform: translateY(10px);
    }
    .quote-content {
      font-size: 0.85rem;
      line-height: 1.6;
      color: var(--text-primary);
      margin-bottom: 12px;
      font-style: italic;
      letter-spacing: 0.5px;
    }
    .quote-mark {
      color: var(--system-green);
      font-size: 1.2rem;
      font-weight: bold;
      opacity: 0.7;
      margin: 0 4px;
    }
    .quote-author {
      font-size: 0.7rem;
      color: var(--text-secondary);
      text-align: right;
      letter-spacing: 1px;
      font-weight: 600;
    }
    .quote-source {
      color: rgba(255, 255, 255, 0.3);
      font-size: 0.65rem;
      margin-left: 4px;
    }
  `]
})
export class RotatingQuoteComponent implements OnInit, OnDestroy {
  quotes = signal<Quote[]>([]);
  currentQuote = signal<Quote | null>(null);
  isAnimating = signal<boolean>(false);
  private intervalId: any;

  // 1 minute in milliseconds (sequential display)
  private readonly ROTATION_INTERVAL = 60000;
  // localStorage key to persist position across page reloads
  private readonly INDEX_KEY = 'rq_quote_index';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<Quote[]>('assets/quotes.json').subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.quotes.set(data);
          this.showCurrentQuote();
          this.startRotation();
        }
      },
      error: (err) => console.error('Failed to load quotes:', err)
    });
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  /** Returns the current sequential index from localStorage (0-based, wraps around) */
  private getCurrentIndex(): number {
    const stored = localStorage.getItem(this.INDEX_KEY);
    const idx = stored ? parseInt(stored, 10) : 0;
    return isNaN(idx) ? 0 : idx;
  }

  /** Display the quote at the current persisted index */
  private showCurrentQuote(): void {
    const quotesList = this.quotes();
    if (quotesList.length === 0) return;
    const idx = this.getCurrentIndex() % quotesList.length;
    this.currentQuote.set(quotesList[idx]);
  }

  /** Advance to the next quote in sequence and persist the index */
  private advanceToNext(): void {
    const quotesList = this.quotes();
    if (quotesList.length === 0) return;
    const nextIdx = (this.getCurrentIndex() + 1) % quotesList.length;
    localStorage.setItem(this.INDEX_KEY, String(nextIdx));
    this.currentQuote.set(quotesList[nextIdx]);
  }

  private startRotation() {
    this.intervalId = setInterval(() => {
      // Trigger fade out
      this.isAnimating.set(true);

      // Wait for fade out animation (800ms) then advance quote and fade in
      setTimeout(() => {
        this.advanceToNext();
        this.isAnimating.set(false);
      }, 800);

    }, this.ROTATION_INTERVAL);
  }
}

