import { Component, OnInit, Input } from '@angular/core';
import { HUEWI_GROUPS_MOCK } from './huewi-groups.mock'
import { fadeInOut } from '../app-routing.animations';

@Component({
  selector: 'huewi-groups',
  templateUrl: './huewi-groups.component.html',
  styleUrls: ['./huewi-groups.component.css'],
  animations: [fadeInOut]
})
export class HuewiGroupsComponent implements OnInit {
  @Input() groups = HUEWI_GROUPS_MOCK;

  constructor() { }

  ngOnInit() {
  }

}
