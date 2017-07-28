import { Component, OnInit, HostBinding } from '@angular/core';

import { trigger, state, style, transition, animate } from '@angular/animations';

import { HuepiService } from '../huepi.service';

@Component({
  selector: 'huewi-connectionstatus',
  templateUrl: './huewi-connectionstatus.component.html',
  styleUrls: ['./huewi-connectionstatus.component.css'],
  animations: [
    trigger('StatusAnimations', [
    state('void', style({ opacity: 0, transform: 'translate3d(0, 100%, 0)'}) ),
    state('*', style({ opacity: 1, transform: 'translate3d(0, 0, 0)'}) ),
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
  @HostBinding('@StatusAnimations') get StatusAnimations() { return true };

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
