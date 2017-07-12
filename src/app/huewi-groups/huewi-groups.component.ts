import { Component, OnInit } from '@angular/core';

import { flyInOut } from '../app-routing.animations';

@Component({
  selector: 'huewi-groups',
  templateUrl: './huewi-groups.component.html',
  styleUrls: ['./huewi-groups.component.css'],
  animations: [flyInOut]
})
export class HuewiGroupsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
