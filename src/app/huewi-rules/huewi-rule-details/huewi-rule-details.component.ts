import { Component, OnInit, Input, OnDestroy } from '@angular/core';

import { HuepiService } from '../../shared/huepi.service';
import { ParametersService } from '../../shared/parameters.service';

@Component({
  selector: 'huewi-rule-details',
  templateUrl: './huewi-rule-details.component.html',
  styleUrls: ['./huewi-rule-details.component.css']
})
export class HuewiRuleDetailsComponent implements OnInit, OnDestroy {
  @Input() rule;
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
