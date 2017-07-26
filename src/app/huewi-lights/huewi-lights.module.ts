import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '@angular/material';

import { OrderByModule } from '../../assets/orderby.module';

import { HuewiLightsComponent } from './huewi-lights.component';
import { HuewiLightComponent } from './huewi-light/huewi-light.component';
import { HuewiLightDetailsComponent } from './huewi-light-details/huewi-light-details.component';

import { HuewiLightsRoutingModule } from './huewi-lights-routing.module';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    OrderByModule,
    HuewiLightsRoutingModule
  ],
  declarations: [
    HuewiLightsComponent,
    HuewiLightComponent,
    HuewiLightDetailsComponent
  ],
  exports: [
    HuewiLightsComponent,
    HuewiLightComponent,
    HuewiLightDetailsComponent
  ]
})
export class HuewiLightsModule { }
