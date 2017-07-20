import { Component, OnInit, Input } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

import { HUEWI_SENSORS_MOCK } from './huewi-sensors.mock'

import { HuepiService } from '../huepi.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

@Component({
  selector: 'huewi-sensors',
  templateUrl: './huewi-sensors.component.html',
  styleUrls: ['./huewi-sensors.component.css']
})
export class HuewiSensorsComponent implements OnInit {
  @Input() sensors = HUEWI_SENSORS_MOCK;
  private sensorsObserver: Observable<Array<any>> = Observable.of(this.sensors);

  constructor(private huepiService: HuepiService) {
    this.sensorsObserver = this.huepiService.getSensors();
    this.sensorsObserver.subscribe((data) => this.sensors = data);
  }

  ngOnInit() {
  }

}
