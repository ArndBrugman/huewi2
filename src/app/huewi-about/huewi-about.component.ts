import { Component, HostBinding, OnInit, Input } from '@angular/core';

import { Router } from '@angular/router';
import { RoutingAnimations } from './../app-routing.animations';

@Component({
  selector: 'huewi-about',
  templateUrl: './huewi-about.component.html',
  styleUrls: ['./huewi-about.component.css'],
  animations: [RoutingAnimations()]
})
export class HuewiAboutComponent implements OnInit {
  @HostBinding('@RoutingAnimations') get RoutingAnimations() { return true };
  @Input() touchSequence = ['swiperight', 'swipeleft', 'press'];
  showNote = false;
  touchPhase = 0;


  constructor() { }

  ngOnInit() {
    this.showNote = false;
  }

  touchEvent(action) {
    if (action === this.touchSequence[this.touchPhase]) {
      this.touchPhase++; // sequence is continueing
    } else {
      this.touchPhase = 0; // sequence is broken
      // however, recheck action to validate if last action matches first touch action in touchSequence
      if (action === this.touchSequence[this.touchPhase]) {
        this.touchPhase++; // yes: sequence is broken by first item in sequence
      }
    }
    console.log(action, this.touchPhase);
    if (this.touchPhase === this.touchSequence.length) {
      this.showNote = true;
    }
  }

}
