import { Component, HostBinding, OnInit, Input, OnDestroy } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { RoutingAnimations } from './../app-routing.animations';

import { HUEWI_GROUPS_MOCK } from './huewi-groups.mock';

import { HuepiService } from '../shared/huepi.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

@Component({
  selector: 'huewi-groups',
  templateUrl: './huewi-groups.component.html',
  styleUrls: ['./huewi-groups.component.css'],
  animations: [RoutingAnimations()]
})
export class HuewiGroupsComponent implements OnInit, OnDestroy {
  @HostBinding('@RoutingAnimations') get RoutingAnimations() { return true };
  private groupsType = 'Rooms';
  @Input() groups = HUEWI_GROUPS_MOCK;
  private groupsSubscription;
  private groupObserver: Observable<Array<any>> = Observable.of(this.groups);
  selectedGroup = undefined;

  constructor(private huepiService: HuepiService, private activatedRoute: ActivatedRoute, private router: Router) {
  }

  ngOnInit() {
    this.groupObserver = this.huepiService.getGroups();
    this.groupsSubscription = this.groupObserver.subscribe(value => {
      this.groups = value;
      this.updateSelected();
    });
  }

  ngOnDestroy() {
    this.groupsSubscription.unsubscribe();
  }

  updateSelected() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    this.selectedGroup = this.huepiService.MyHue.Groups[id];
  }

  changeGroupsType() {
    if (this.groupsType === 'Rooms') {
      this.groupsType = 'LightGroups';
    } else if (this.groupsType === 'LightGroups') {
      this.groupsType = 'LightGroups & Rooms';
    } else {
      this.groupsType = 'Rooms';
    }
  }

}
