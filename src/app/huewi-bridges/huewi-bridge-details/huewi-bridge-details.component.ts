import { Component, OnInit, Input } from '@angular/core';

import { HuepiService } from '../../shared/huepi.service';

@Component({
  selector: 'huewi-bridge-details',
  templateUrl: './huewi-bridge-details.component.html',
  styleUrls: ['./huewi-bridge-details.component.css']
})
export class HuewiBridgeDetailsComponent implements OnInit {
  @Input() bridge = { name: 'None' };
  config;

  constructor(private huepiService: HuepiService) {
    this.config = huepiService.MyHue.BridgeConfig;
  }

  ngOnInit() {
  }

}
