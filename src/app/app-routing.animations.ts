import { trigger, state, style, transition, animate } from '@angular/animations';

export const RoutingAnimations= 
  trigger('RoutingAnimations', [
    state('void', style({transform: 'translate3d(1px, 16px, 0px) rotate3d(0,0,1,0.5deg)', opacity: 0.0}) ),
    state('*', style({transform: 'translate3d(0px, 0px, 0px) rotate3d(0,0,1,0.0deg)', opacity: 1.0}) ),
    transition(':enter', [
      animate('0.4s ease-in-out')
    ]),
    transition(':leave', [
      animate('0.3s ease-in-out')
    ])
  ])
