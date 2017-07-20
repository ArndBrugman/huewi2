import { Component, OnInit, Input, OnDestroy } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

import { HUEWI_GROUPS_MOCK } from './huewi-groups.mock';

import { HuepiService } from '../huepi.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { fadeInOut } from '../app-routing.animations';

@Component({
  selector: 'huewi-groups',
  templateUrl: './huewi-groups.component.html',
  styleUrls: ['./huewi-groups.component.css'],
  animations: [fadeInOut]
})
export class HuewiGroupsComponent implements OnInit, OnDestroy {
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
      this.groupsType = 'Groups';
    } else if (this.groupsType === 'Groups') {
      this.groupsType = 'Rooms & Groups';
    } else {
      this.groupsType = 'Rooms';
    }
  }

}
