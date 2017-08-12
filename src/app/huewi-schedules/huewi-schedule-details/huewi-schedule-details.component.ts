import { Component, OnInit, Input } from '@angular/core';

import { HuepiService } from '../../shared/huepi.service';

@Component({
  selector: 'huewi-schedule-details',
  templateUrl: './huewi-schedule-details.component.html',
  styleUrls: ['./huewi-schedule-details.component.css']
})
export class HuewiScheduleDetailsComponent implements OnInit {
  @Input() schedule;

  constructor(private huepiService: HuepiService) {
  }

  ngOnInit() {
  }

}
