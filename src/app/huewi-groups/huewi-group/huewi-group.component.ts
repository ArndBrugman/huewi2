import { Component, OnInit, Input } from '@angular/core';

import { HuepiService } from '../../huepi.service';

@Component({
  selector: 'huewi-group',
  templateUrl: './huewi-group.component.html',
  styleUrls: ['./huewi-group.component.css']
})
export class HuewiGroupComponent implements OnInit {
  @Input() group = {};

  constructor(private huepiService: HuepiService) { 
  }

  ngOnInit() {
  }

  toggle(group) {
    if (group.action.on === true) {
      this.huepiService.MyHue.GroupOff(group.__key);
    } else {
      this.huepiService.MyHue.GroupOn(group.__key);
    } 
  }
}
