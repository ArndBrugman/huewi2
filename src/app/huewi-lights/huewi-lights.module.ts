import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { PipesModule } from '../pipes/pipes.module';
import { MaterialModule } from '../app-material.module';

import { HuewiLightsComponent } from './huewi-lights.component';
import { HuewiLightComponent } from './huewi-light/huewi-light.component';
import { HuewiLightDetailsComponent } from './huewi-light-details/huewi-light-details.component';

import { HuewiLightsRoutingModule } from './huewi-lights-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    PipesModule,
    MaterialModule,
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
