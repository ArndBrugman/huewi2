import { Component, OnInit, Input, OnDestroy } from '@angular/core';

import { HuepiService } from '../../shared/huepi.service';
import { ParametersService } from '../../shared/parameters.service';

@Component({
  selector: 'huewi-sensor-details',
  templateUrl: './huewi-sensor-details.component.html',
  styleUrls: ['./huewi-sensor-details.component.css']
})
export class HuewiSensorDetailsComponent implements OnInit, OnDestroy {
  @Input() sensor;
  @Input() back = true;
  @Input() expand = true;

  constructor(private huepiService: HuepiService, private parametersService: ParametersService) {
  }

  ngOnInit() {
    const parameters = this.parametersService.getParameters();
    if (parameters['expand']) {
      this.expand = parameters['expand'];
    }
  }

  ngOnDestroy() {
  }
}
