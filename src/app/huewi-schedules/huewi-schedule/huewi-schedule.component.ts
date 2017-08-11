import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

import { HuepiService } from '../../shared/huepi.service';

@Component({
  selector: 'huewi-schedule',
  templateUrl: './huewi-schedule.component.html',
  styleUrls: ['./huewi-schedule.component.css']
})
export class HuewiScheduleComponent implements OnInit {
  @Input() schedule;

  constructor(private huepiService: HuepiService, private router: Router) {
  }

  ngOnInit() {
  }

  select(schedule) {
    this.router.navigate(['/schedules', schedule.__key]);
  }

}
