import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'huewi-sensor',
  templateUrl: './huewi-sensor.component.html',
  styleUrls: ['./huewi-sensor.component.css']
})
export class HuewiSensorComponent implements OnInit {
  @Input() sensor = { };

  constructor() { }

  ngOnInit() {
  }

}
