import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

import { HuepiService } from '../../huepi.service';

@Component({
  selector: 'huewi-bridge',
  templateUrl: './huewi-bridge.component.html',
  styleUrls: ['./huewi-bridge.component.css']
})
export class HuewiBridgeComponent implements OnInit {
  @Input() bridge;
  config;

  constructor(private huepiService: HuepiService, private router: Router) {
    this.config = this.huepiService.MyHue.BridgeConfig;
  }

  ngOnInit() {
  }

  select(bridge) {
    this.huepiService.MyHue.BridgeGetConfig(bridge.internalipaddress).then((data) => {
      this.huepiService.connect(bridge.internalipaddress);
      this.config = this.huepiService.MyHue.BridgeConfig;
      this.huepiService.MyHue.BridgeIP = bridge.internalipaddress;
      this.router.navigate(['/bridges', bridge.__key]);
    });
  }

}
