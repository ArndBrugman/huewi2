import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

import { HuepiService } from '../../huepi.service';

@Component({
  selector: 'huewi-light',
  templateUrl: './huewi-light.component.html',
  styleUrls: ['./huewi-light.component.css']
})
export class HuewiLightComponent implements OnInit {
  @Input() light;
  @Input() editable = false;

  constructor(private huepiService: HuepiService, private router: Router) {
  }

  ngOnInit() {
  }

  select(light) {
    this.huepiService.MyHue.LightAlertSelect(light.__key);
    this.router.navigate(['/lights', light.__key]);
  }

  rename(light, name) {
    this.huepiService.MyHue.LightSetName(light.__key, name);
  }

  brightness(light, value) {
    this.huepiService.MyHue.LightSetBrightness(light.__key, value);
  }

  toggle(light) {
    if (light.state.on === true) {
      this.huepiService.MyHue.LightOff(light.__key);
    } else {
      this.huepiService.MyHue.LightOn(light.__key);
    }
  }
}
