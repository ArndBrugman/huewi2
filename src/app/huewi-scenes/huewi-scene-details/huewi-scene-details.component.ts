import { Component, OnInit, Input, OnDestroy } from '@angular/core';

import { HuepiService } from '../../shared/huepi.service';
import { ParametersService } from '../../shared/parameters.service';

@Component({
  selector: 'huewi-scene-details',
  templateUrl: './huewi-scene-details.component.html',
  styleUrls: ['./huewi-scene-details.component.css']
})
export class HuewiSceneDetailsComponent implements OnInit, OnDestroy {
  @Input() scene;
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
