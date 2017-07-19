import { Component, OnInit, Input } from '@angular/core';

import { HuepiService } from '../../huepi.service';

@Component({
  selector: 'huewi-light',
  templateUrl: './huewi-light.component.html',
  styleUrls: ['./huewi-light.component.css']
})
export class HuewiLightComponent implements OnInit {
  @Input() light;

  constructor(private huepiService: HuepiService) { }

  ngOnInit() {
  }

  toggle(light) {
    if (light.state.on === true) {
      this.huepiService.MyHue.LightOff(light.__key);
    } else {
      this.huepiService.MyHue.LightOn(light.__key);
    } 
  }
}
