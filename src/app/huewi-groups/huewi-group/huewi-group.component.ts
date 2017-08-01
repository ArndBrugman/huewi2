import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { HuepiService } from '../../huepi.service';

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

  ngOnDestroy() {
  }

  select(group) {
    this.huepiService.MyHue.GroupAlertSelect(group.__key);
    this.router.navigate(['/groups', group.__key]);
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
