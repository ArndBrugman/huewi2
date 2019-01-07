import { Component, HostBinding, OnInit, Input, OnDestroy } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { RoutingAnimations } from './../app-routing.animations';

import { HUEWI_SENSORS_MOCK} from './huewi-sensors.mock'

import { HuepiService } from '../shared/huepi.service';
import { ParametersService } from '../shared/parameters.service';

import { Subscription, Observable, of } from 'rxjs';

@Component({
  selector: 'huewi-sensors',
  templateUrl: './huewi-sensors.component.html',
  styleUrls: ['./huewi-sensors.component.css'],
  animations: [RoutingAnimations]
})
export class HuewiSensorsComponent implements OnInit, OnDestroy {
  @Input() sensors = HUEWI_SENSORS_MOCK;
  @Input() back = true;
  private sensorsSubscription: Subscription;
  private sensorObserver: Observable<Array<any>> = of(this.sensors);
  selectedSensor = undefined;

  constructor(private huepiService: HuepiService, private parametersService: ParametersService,
    private activatedRoute: ActivatedRoute, private router: Router) {
  }

  ngOnInit() {
    const parameters = this.parametersService.getParameters();
    if (parameters['widget']) {
      this.back = false;
    }

    this.sensorObserver = this.huepiService.getSensors();
    this.sensorsSubscription = this.sensorObserver.subscribe(value => {
      this.sensors = value;
      this.updateSelected();
    });
  }

  ngOnDestroy() {
    this.sensorsSubscription.unsubscribe();
  }

  updateSelected() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    this.selectedSensor = this.huepiService.MyHue.Sensors[id];
  }

}
