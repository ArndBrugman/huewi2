import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '@angular/material';

import { HuewiLightsComponent } from './huewi-lights.component';
import { HuewiLightComponent } from './huewi-light/huewi-light.component'
import { HuewiDetailsComponent }  from '../huewi-details/huewi-details.component';

import { HuewiLightsRoutingModule } from './huewi-lights-routing.module'

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    HuewiLightsRoutingModule
  ],
  declarations: [
    //HuewiLightsComponent,
    //HuewiLightsComponent
  ]
})
export class HuewiLightsModule { }
