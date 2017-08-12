import { Component, OnInit, Input } from '@angular/core';

import { HuepiService } from '../../shared/huepi.service';

@Component({
  selector: 'huewi-sensor-details',
  templateUrl: './huewi-sensor-details.component.html',
  styleUrls: ['./huewi-sensor-details.component.css']
})
export class HuewiSensorDetailsComponent implements OnInit {
  @Input() sensor;

  constructor(private huepiService: HuepiService) {
  }

  ngOnInit() {
  }

}
