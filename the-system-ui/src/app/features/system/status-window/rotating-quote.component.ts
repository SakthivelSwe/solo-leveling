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
        <span class="quote-mark">“</span>
        <span class="quote-text">{{ currentQuote()?.text }}</span>
        <span class="quote-mark">”</span>
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

  // 5 minutes in milliseconds
  private readonly ROTATION_INTERVAL = 300000;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<Quote[]>('assets/quotes.json').subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.quotes.set(data);
          this.pickRandomQuote();
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

  private pickRandomQuote() {
    const quotesList = this.quotes();
    if (quotesList.length === 0) return;
    
    // Pick a random quote that isn't the current one (if possible)
    let randomIndex = Math.floor(Math.random() * quotesList.length);
    if (quotesList.length > 1 && this.currentQuote()) {
      while (quotesList[randomIndex].text === this.currentQuote()?.text) {
        randomIndex = Math.floor(Math.random() * quotesList.length);
      }
    }
    
    this.currentQuote.set(quotesList[randomIndex]);
  }

  private startRotation() {
    this.intervalId = setInterval(() => {
      // Trigger fade out
      this.isAnimating.set(true);
      
      // Wait for fade out to complete before changing text and fading in
      setTimeout(() => {
        this.pickRandomQuote();
        this.isAnimating.set(false);
      }, 800); // 800ms matches the CSS transition duration
      
    }, this.ROTATION_INTERVAL);
  }
}
