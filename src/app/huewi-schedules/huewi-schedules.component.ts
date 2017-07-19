import { Component, OnInit, Input } from '@angular/core';
// import { HUEWI_SCHEDULES_MOCK } from './huewi-schedules.mock'

import { HuepiService } from '../huepi.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

@Component({
  selector: 'huewi-schedules',
  templateUrl: './huewi-schedules.component.html',
  styleUrls: ['./huewi-schedules.component.css']
})
export class HuewiSchedulesComponent implements OnInit {
  @Input() schedules; // = HUEWI_SCHEDULES_MOCK;
  private schedulesObserver: Observable<Array<any>> = Observable.of(this.schedules);

  constructor(private huepiService: HuepiService) {
    this.schedulesObserver = this.huepiService.getLights();
    this.schedulesObserver.subscribe((data) => this.schedules = data);
  }

  ngOnInit() {
  }

}
