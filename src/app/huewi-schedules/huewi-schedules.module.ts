import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { PipesModule } from '../pipes/pipes.module';
import { MaterialModule } from '../app-material.module';

import { HuewiSchedulesComponent } from './huewi-schedules.component';
import { HuewiScheduleComponent } from './huewi-schedule/huewi-schedule.component';
import { HuewiScheduleDetailsComponent } from './huewi-schedule-details/huewi-schedule-details.component';

import { HuewiSchedulesRoutingModule } from './huewi-schedules-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    PipesModule,
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
