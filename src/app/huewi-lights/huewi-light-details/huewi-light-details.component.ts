import { Component, OnInit, Input } from '@angular/core';

import { HuepiService } from '../../huepi.service';

@Component({
  selector: 'huewi-light-details',
  templateUrl: './huewi-light-details.component.html',
  styleUrls: ['./huewi-light-details.component.css']
})
export class HuewiLightDetailsComponent implements OnInit {
  @Input() light = { name: 'None' };

  constructor(private huepiService: HuepiService) {
  }

  ngOnInit() {
  }

  setCTBrightness(light, CT, Brightness) {
    this.huepiService.MyHue.LightOn(light.__key);
    this.huepiService.MyHue.LightSetCT(light.__key, CT);
    this.huepiService.MyHue.LightSetBrightness(light.__key, Brightness);
  }

  relax(light) {
    this.setCTBrightness(light, 346, 254);
  }

  reading(light) {
    this.setCTBrightness(light, 346, 254);
  }

  concentrate(light) {
    this.setCTBrightness(light, 234, 254);
  }

  energize(light) {
    this.setCTBrightness(light, 153, 254);
  }

  bright(light) {
    this.setCTBrightness(light, 367, 254);
  }

  dimmed(light) {
    this.setCTBrightness(light, 365, 77);
  }

  nightLight(light) {
    this.setCTBrightness(light, 500, 1);
  }

  goldenHour(light) {
    this.setCTBrightness(light, 400, 125);
  }

}
