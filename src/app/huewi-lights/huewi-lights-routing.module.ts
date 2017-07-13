import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HuewiLightsComponent } from './huewi-lights.component';
import { HuewiDetailsComponent } from '../huewi-details/huewi-details.component';

const huewiLightsRoutes: Routes = [
  { path: 'lights',  component: HuewiLightsComponent },
  { path: 'light/:id', component: HuewiDetailsComponent }
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
