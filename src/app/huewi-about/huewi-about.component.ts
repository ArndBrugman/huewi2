import { Component, HostBinding, OnInit, Input } from '@angular/core';

import { Router } from '@angular/router';
import { RoutingAnimations } from './../app-routing.animations';

import { VERSION } from '@angular/core';

import { HuepiService } from '../shared/huepi.service';

@Component({
  selector: 'huewi-about',
  templateUrl: './huewi-about.component.html',
  styleUrls: ['./huewi-about.component.css'],
  animations: [RoutingAnimations]
})
export class HuewiAboutComponent implements OnInit {
  huepiVersion = 'x.x.x';
  angularVersion = 'x.x.x';
  @Input() touchSequence = ['swiperight', 'swipeleft', 'press'];
  touchPhase = 0;
  touchDiscovered = false;

  constructor(private huepiService: HuepiService) {
  }

  ngOnInit() {
    this.huepiVersion = this.huepiService.MyHue.version;
    this.angularVersion = VERSION.full;
    this.touchDiscovered = false;
  }

  onTouch(event) {
    if (event === this.touchSequence[this.touchPhase]) {
      this.touchPhase++; // sequence is continueing
    } else {
      this.touchPhase = 0; // sequence is broken
      // however, recheck action to validate if last action matches first touch action in touchSequence
      if (event === this.touchSequence[this.touchPhase]) {
        this.touchPhase++; // yes: sequence is broken by first item in sequence
      }
    }
    if (this.touchPhase === this.touchSequence.length) {
      this.touchDiscovered = true;
    }
  }

}
