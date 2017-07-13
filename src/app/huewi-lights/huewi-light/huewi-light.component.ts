import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'huewi-light',
  templateUrl: './huewi-light.component.html',
  styleUrls: ['./huewi-light.component.css']
})
export class HuewiLightComponent implements OnInit {
  @Input() light;

  constructor() { }

  ngOnInit() {
  }

}
