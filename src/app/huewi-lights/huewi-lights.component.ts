import { Component, OnInit, Input, OnDestroy } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

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
export class HuewiLightsComponent implements OnInit, OnDestroy {
  @Input() lights = HUEWI_LIGHTS_MOCK;
  private lightsSubscription;
  private lightObserver: Observable<Array<any>> = Observable.of(this.lights);
  selectedLight = undefined;

  constructor(private huepiService: HuepiService, private activatedRoute: ActivatedRoute, private router: Router) {
  }

  ngOnInit() {
    this.lightObserver = this.huepiService.getLights();
    this.lightsSubscription = this.lightObserver.subscribe(value => {
      this.lights = value;
      this.updateSelected();
    });
  }

  ngOnDestroy() {
    this.lightsSubscription.unsubscribe();
  }

  updateSelected() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    this.selectedLight = this.huepiService.MyHue.Lights[id];
  }

}
