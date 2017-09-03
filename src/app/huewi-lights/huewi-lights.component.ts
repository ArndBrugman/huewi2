import { Component, HostBinding, OnInit, Input, OnDestroy } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { RoutingAnimations } from './../app-routing.animations';

import { HUEWI_LIGHTS_MOCK } from './huewi-lights.mock'

import { HuepiService } from '../shared/huepi.service';
import { ParametersService } from '../shared/parameters.service';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

@Component({
  selector: 'huewi-lights',
  templateUrl: './huewi-lights.component.html',
  styleUrls: ['./huewi-lights.component.css'],
  animations: [RoutingAnimations()]
})
export class HuewiLightsComponent implements OnInit, OnDestroy {
  @HostBinding('@RoutingAnimations') get RoutingAnimations() { return true };
  @Input() lights = HUEWI_LIGHTS_MOCK;
  @Input() back = true;
  private lightsSubscription;
  private lightObserver: Observable<Array<any>> = Observable.of(this.lights);
  selectedLight = undefined;

  constructor(private huepiService: HuepiService, private parametersService: ParametersService,
    private activatedRoute: ActivatedRoute, private router: Router) {
  }

  ngOnInit() {
    const parameters = this.parametersService.getParameters();
    if (parameters['widget']) {
      this.back = false;
    }

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
