import {
  trigger, transition, style, animate, query, stagger, state, keyframes,
} from '@angular/animations';

/** Fade + rise in. Great for cards and panels. */
export const fadeInUp = trigger('fadeInUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(16px)' }),
    animate('420ms cubic-bezier(.22,1,.36,1)', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);

/** Staggered list entrance — apply on the list container. */
export const listStagger = trigger('listStagger', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(14px)' }),
      stagger(60, [
        animate('380ms cubic-bezier(.22,1,.36,1)',
          style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ], { optional: true }),
  ]),
]);

/** Route-level fade/scale transition. */
export const routeFade = trigger('routeFade', [
  transition('* <=> *', [
    style({ opacity: 0, transform: 'scale(.985)' }),
    animate('320ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
  ]),
]);

/** Slide a panel in from the right (notification drawer). */
export const slideInRight = trigger('slideInRight', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(40px)' }),
    animate('300ms cubic-bezier(.22,1,.36,1)', style({ opacity: 1, transform: 'translateX(0)' })),
  ]),
  transition(':leave', [
    animate('220ms ease-in', style({ opacity: 0, transform: 'translateX(40px)' })),
  ]),
]);

/** Pulse used for "live" / urgent badges. */
export const pulse = trigger('pulse', [
  state('void', style({ transform: 'scale(1)' })),
  transition('* => *', [
    animate('700ms ease-out', keyframes([
      style({ transform: 'scale(1)', offset: 0 }),
      style({ transform: 'scale(1.18)', offset: 0.5 }),
      style({ transform: 'scale(1)', offset: 1 }),
    ])),
  ]),
]);

/** Expand/collapse for accordions. */
export const expandCollapse = trigger('expandCollapse', [
  transition(':enter', [
    style({ height: 0, opacity: 0, overflow: 'hidden' }),
    animate('300ms ease-out', style({ height: '*', opacity: 1 })),
  ]),
  transition(':leave', [
    style({ overflow: 'hidden' }),
    animate('220ms ease-in', style({ height: 0, opacity: 0 })),
  ]),
]);

