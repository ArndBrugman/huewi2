import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'huewi-group',
  templateUrl: './huewi-group.component.html',
  styleUrls: ['./huewi-group.component.css']
})
export class HuewiGroupComponent implements OnInit {
  @Input() group = {};

  constructor() { }

  ngOnInit() {
  }

}
