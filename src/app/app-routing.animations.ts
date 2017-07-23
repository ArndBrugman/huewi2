import { trigger, state, style, transition, animate } from '@angular/animations';

export function RoutingAnimations() {
  return FadeDrop();
}

function FadeDrop() {
  return trigger('RoutingAnimations', [
    state('void', style({top: -32, left: 0, opacity: 0}) ),
    state('*', style({top: 0, left: 0, opacity: 1}) ),
    transition(':enter', [
      animate('0.2s ease-in-out', style({top: 0, left: 0, opacity: 1}))
    ]),
    transition(':leave', [
      animate('0s ease-in-out', style({top: -32, left: 0, opacity: 0}))
    ])
  ])
}
