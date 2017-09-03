import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '@angular/material';
import { FormsModule } from '@angular/forms';

import { PipesModule } from '../pipes/pipes.module';

import { HuewiSensorsComponent } from './huewi-sensors.component';
import { HuewiSensorComponent } from './huewi-sensor/huewi-sensor.component';
import { HuewiSensorDetailsComponent } from './huewi-sensor-details/huewi-sensor-details.component';

import { HuewiSensorsRoutingModule } from './huewi-sensors-routing.module';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    PipesModule,
    HuewiSensorsRoutingModule
  ],
  declarations: [
    HuewiSensorsComponent,
    HuewiSensorComponent,
    HuewiSensorDetailsComponent
  ],
  exports: [
    HuewiSensorsComponent,
    HuewiSensorComponent,
    HuewiSensorDetailsComponent
  ]
})
export class HuewiSensorsModule { }
