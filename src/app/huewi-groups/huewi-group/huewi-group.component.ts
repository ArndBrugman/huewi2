import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { HuepiService } from '../../shared/huepi.service';

@Component({
  selector: 'huewi-group',
  templateUrl: './huewi-group.component.html',
  styleUrls: ['./huewi-group.component.css']
})
export class HuewiGroupComponent implements OnInit {
  @Input() group;
  @Input() editable = false;

  constructor(private huepiService: HuepiService, private router: Router) {
  }

  ngOnInit() {
  }

  select(group) {
    this.huepiService.MyHue.GroupAlertSelect(group.__key);
    this.router.navigate(['/groups', group.__key], { replaceUrl: true });
  }

  rename(group, name) {
    this.huepiService.MyHue.GroupSetName(group.__key, name);
  }

  brightness(group, value) {
    this.huepiService.MyHue.GroupSetBrightness(group.__key, value);
  }

  toggle(group) {
    if (group.action.on === true) {
      this.huepiService.MyHue.GroupOff(group.__key);
    } else {
      this.huepiService.MyHue.GroupOn(group.__key);
    }
  }
}
