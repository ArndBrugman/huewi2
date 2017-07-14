import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '@angular/material';

import { HuewiSchedulesComponent } from './huewi-schedules.component';
import { HuewiScheduleComponent } from './huewi-schedule/huewi-schedule.component';
import { HuewiScheduleDetailsComponent } from './huewi-schedule-details/huewi-schedule-details.component';

import { HuewiSchedulesRoutingModule } from './huewi-schedules-routing.module';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    HuewiSchedulesRoutingModule
  ],
  declarations: [
    HuewiSchedulesComponent,
    HuewiScheduleComponent,
    HuewiScheduleDetailsComponent
  ],
  exports: [
    HuewiSchedulesComponent,
    HuewiScheduleComponent,
    HuewiScheduleDetailsComponent
  ]
})
export class HuewiSchedulesModule { }
