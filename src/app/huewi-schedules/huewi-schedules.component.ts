import { Component, OnInit, Input, OnDestroy } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

import { HUEWI_SCHEDULES_MOCK } from './huewi-schedules.mock'

import { HuepiService } from '../huepi.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { trigger, state, animate, transition, style } from '@angular/animations';

@Component({
  selector: 'huewi-schedules',
  templateUrl: './huewi-schedules.component.html',
  styleUrls: ['./huewi-schedules.component.css']
})
export class HuewiSchedulesComponent implements OnInit, OnDestroy {
  @Input() schedules = HUEWI_SCHEDULES_MOCK;
  private schedulesSubscription;
  private scheduleObserver: Observable<Array<any>> = Observable.of(this.schedules);
  selectedSchedule = undefined;

  constructor(private huepiService: HuepiService, private activatedRoute: ActivatedRoute, private router: Router) {
  }

  ngOnInit() {
    this.scheduleObserver = this.huepiService.getSchedules();
    this.schedulesSubscription = this.scheduleObserver.subscribe(value => {
      this.schedules = value;
      this.updateSelected();
    });
  }

  ngOnDestroy() {
    this.schedulesSubscription.unsubscribe();
  }

  updateSelected() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    this.selectedSchedule = this.huepiService.MyHue.Schedules[id];
  }

}
