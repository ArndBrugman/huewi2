import { Component, HostBinding, OnInit, Input, OnDestroy } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { RoutingAnimations } from './../app-routing.animations';

import { HUEWI_SCHEDULES_MOCK } from './huewi-schedules.mock'

import { HuepiService } from '../shared/huepi.service';
import { ParametersService } from '../shared/parameters.service';

import { Subscription, Observable, of } from 'rxjs';

@Component({
  selector: 'huewi-schedules',
  templateUrl: './huewi-schedules.component.html',
  styleUrls: ['./huewi-schedules.component.css'],
  animations: [RoutingAnimations]
})
export class HuewiSchedulesComponent implements OnInit, OnDestroy {
  @Input() schedules = HUEWI_SCHEDULES_MOCK;
  @Input() back = true;
  private schedulesSubscription: Subscription;
  private scheduleObserver: Observable<Array<any>> = of(this.schedules);
  selectedSchedule = undefined;

  constructor(private huepiService: HuepiService, private parametersService: ParametersService,
    private activatedRoute: ActivatedRoute, private router: Router) {
  }

  ngOnInit() {
    const parameters = this.parametersService.getParameters();
    if (parameters['widget']) {
      this.back = false;
    }

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
