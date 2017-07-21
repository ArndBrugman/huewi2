import { Component, OnInit, Input } from '@angular/core';

import { HuepiService } from '../../huepi.service';

@Component({
  selector: 'huewi-group-details',
  templateUrl: './huewi-group-details.component.html',
  styleUrls: ['./huewi-group-details.component.css']
})
export class HuewiGroupDetailsComponent implements OnInit {
  @Input() group = { name: 'None' };

  constructor(private huepiService: HuepiService) {
  }

  ngOnInit() {
  }

  setCTBrightness(group, CT, Brightness) {
    this.huepiService.MyHue.GroupOn(group.__key);
    this.huepiService.MyHue.GroupSetCT(group.__key, CT);
    this.huepiService.MyHue.GroupSetBrightness(group.__key, Brightness);
  }

  relax(group) {
    this.setCTBrightness(group, 447, 144);
  }

  reading(group) {
    this.setCTBrightness(group, 346, 254);
  }

  concentrate(group) {
    this.setCTBrightness(group, 234, 254);
  }

  energize(group) {
    this.setCTBrightness(group, 153, 254);
  }

  bright(group) {
    this.setCTBrightness(group, 367, 254);
  }

  dimmed(group) {
    this.setCTBrightness(group, 365, 77);
  }

  nightLight(group) {
    this.setCTBrightness(group, 500, 1);
  }

  goldenHour(group) {
    this.setCTBrightness(group, 400, 125);
  }

}
