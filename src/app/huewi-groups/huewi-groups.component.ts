import { Component, OnInit, Input } from '@angular/core';
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
export class HuewiGroupsComponent implements OnInit {
  @Input() groups = HUEWI_GROUPS_MOCK;
  private groupObserver: Observable<Array<any>> = Observable.of(this.groups);

  constructor(private huepiService: HuepiService) {
    this.groupObserver = this.huepiService.getGroups();
    this.groupObserver.subscribe((data) => this.groups = data);
  }

  ngOnInit() {
  }

}
