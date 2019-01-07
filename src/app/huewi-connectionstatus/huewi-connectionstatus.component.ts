import { Component, OnInit, HostBinding } from '@angular/core';

import { trigger, state, style, transition, animate } from '@angular/animations';

import { HuepiService } from '../shared/huepi.service';

@Component({
  selector: 'huewi-connectionstatus',
  templateUrl: './huewi-connectionstatus.component.html',
  styleUrls: ['./huewi-connectionstatus.component.css'],
  animations: [
    trigger('StatusAnimations', [
    state('void', style({ opacity: 0, transform: 'translate3d(4px, 32px, 0px)'}) ),
    state('*', style({ opacity: 1, transform: 'translate3d(0px, 0px, 0px)'}) ),
    transition(':enter', [
      animate('0.5s ease-in-out')
    ]),
    transition(':leave', [
      animate('1.0s ease-in-out')
    ])
  ])
]
})
export class HuewiConnectionstatusComponent implements OnInit {
  constructor(private huepiService: HuepiService) { }

  ngOnInit() {
  }

  getStatus() {
    return this.huepiService.getStatus();
  }

  getMessage() {
    return this.huepiService.getMessage();
  }

}
