import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HuewiSensorsComponent } from './huewi-sensors.component';
import { HuewiSensorDetailsComponent } from './huewi-sensor-details/huewi-sensor-details.component';

const huewiSensorsRoutes: Routes = [
  { path: 'sensors',  component: HuewiSensorsComponent },
  { path: 'sensors/:id', component: HuewiSensorDetailsComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(huewiSensorsRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class HuewiSensorsRoutingModule { }
