import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HuewiSchedulesComponent } from './huewi-schedules.component';
import { HuewiScheduleDetailsComponent } from './huewi-schedule-details/huewi-schedule-details.component';

const huewiSchedulesRoutes: Routes = [
  { path: 'schedules',  component: HuewiSchedulesComponent },
  { path: 'schedules/:id', component: HuewiScheduleDetailsComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(huewiSchedulesRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class HuewiSchedulesRoutingModule { }
