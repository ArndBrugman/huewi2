import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

import { HuepiService } from '../../shared/huepi.service';

@Component({
  selector: 'huewi-sensor',
  templateUrl: './huewi-sensor.component.html',
  styleUrls: ['./huewi-sensor.component.css']
})
export class HuewiSensorComponent implements OnInit {
  @Input() sensor;

  constructor(private huepiService: HuepiService, private router: Router) {
  }

  ngOnInit() {
  }

  select(sensor) {
    this.router.navigate(['/sensors', sensor.__key], {replaceUrl:true});
  }

}
