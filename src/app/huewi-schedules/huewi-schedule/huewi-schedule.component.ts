import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'huewi-schedule',
  templateUrl: './huewi-schedule.component.html',
  styleUrls: ['./huewi-schedule.component.css']
})
export class HuewiScheduleComponent implements OnInit {
  @Input() schedule = { };

  constructor() { }

  ngOnInit() {
  }

}
