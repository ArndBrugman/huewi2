import { Component, OnInit, Input, OnDestroy } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

import { HUEWI_SENSORS_MOCK} from './huewi-sensors.mock'

import { HuepiService } from '../huepi.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { trigger, state, animate, transition, style } from '@angular/animations';

@Component({
  selector: 'huewi-sensors',
  templateUrl: './huewi-sensors.component.html',
  styleUrls: ['./huewi-sensors.component.css']
})
export class HuewiSensorsComponent implements OnInit, OnDestroy {
  @Input() sensors = HUEWI_SENSORS_MOCK;
  private sensorsSubscription;
  private sensorObserver: Observable<Array<any>> = Observable.of(this.sensors);
  selectedSensor = undefined;

  constructor(private huepiService: HuepiService, private activatedRoute: ActivatedRoute, private router: Router) {
  }

  ngOnInit() {
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
