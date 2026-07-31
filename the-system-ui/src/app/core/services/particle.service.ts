import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface ParticleOptions {
  text: string;
  x: number;
  y: number;
  color?: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ParticleService {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  spawn(options: ParticleOptions): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const el = document.createElement('div');
    el.innerText = options.text;
    el.style.position = 'fixed';
    el.style.left = `${options.x}px`;
    el.style.top = `${options.y}px`;
    el.style.color = options.color || '#FAC775'; // default gold
    el.style.fontFamily = "'Share Tech Mono', monospace";
    el.style.fontWeight = 'bold';
    el.style.fontSize = '1.2rem';
    el.style.textShadow = `0 0 10px ${options.color || '#FAC775'}`;
    el.style.pointerEvents = 'none';
    el.style.zIndex = '9999';
    el.style.transition = `all ${options.duration || 1000}ms cubic-bezier(0.25, 1, 0.5, 1)`;
    el.style.transform = 'translate(-50%, -50%) scale(0.5)';
    el.style.opacity = '1';
    
    document.body.appendChild(el);
    
    // trigger reflow
    void el.offsetWidth;
    
    // animate
    el.style.transform = 'translate(-50%, -150px) scale(1.2)';
    el.style.opacity = '0';
    
    setTimeout(() => {
      el.remove();
    }, options.duration || 1000);
  }
}
