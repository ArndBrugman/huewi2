import { Component, OnInit, Input, OnDestroy } from '@angular/core';

import { HuepiService } from '../../shared/huepi.service';
import { ParametersService } from '../../shared/parameters.service';

@Component({
  selector: 'huewi-schedule-details',
  templateUrl: './huewi-schedule-details.component.html',
  styleUrls: ['./huewi-schedule-details.component.css']
})
export class HuewiScheduleDetailsComponent implements OnInit, OnDestroy {
  @Input() schedule;
  @Input() expand = false;

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
