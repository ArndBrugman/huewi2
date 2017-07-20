import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HuewiLightsComponent } from './huewi-lights.component';
import { HuewiLightDetailsComponent } from './huewi-light-details/huewi-light-details.component';

const huewiLightsRoutes: Routes = [
  { path: 'lights',  component: HuewiLightsComponent },
  { path: 'lights/:id', component: HuewiLightsComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(huewiLightsRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class HuewiLightsRoutingModule { }
