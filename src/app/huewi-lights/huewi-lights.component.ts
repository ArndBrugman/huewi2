import { Component, OnInit, Input } from '@angular/core';
import { HUEWI_LIGHTS_MOCK } from './huewi-lights.mock'

import { HuepiService } from '../huepi.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { trigger, state, animate, transition, style } from '@angular/animations';

@Component({
  selector: 'huewi-lights',
  templateUrl: './huewi-lights.component.html',
  styleUrls: ['./huewi-lights.component.css']
})
export class HuewiLightsComponent implements OnInit {
  @Input() lights = HUEWI_LIGHTS_MOCK;
  private lightsObserver: Observable<Array<any>> = Observable.of(this.lights);

  constructor(private huepiService: HuepiService) {
    this.lightsObserver = this.huepiService.getLights();
    this.lightsObserver.subscribe((data) => this.lights = data);
  }

  ngOnInit() {
  }
}
