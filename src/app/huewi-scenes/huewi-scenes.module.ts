import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '@angular/material';
import { FormsModule } from '@angular/forms';

import { OrderByModule } from '../pipes/orderby.module';
import { FilterModule } from '../pipes/filter.module';

import { HuewiScenesComponent } from './huewi-scenes.component';
import { HuewiSceneComponent } from './huewi-scene/huewi-scene.component';
import { HuewiSceneDetailsComponent } from './huewi-scene-details/huewi-scene-details.component';

import { HuewiScenesRoutingModule } from './huewi-scenes-routing.module';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    OrderByModule,
    FilterModule,
    HuewiScenesRoutingModule
  ],
  declarations: [
    HuewiScenesComponent,
    HuewiSceneComponent,
    HuewiSceneDetailsComponent
  ],
  exports: [
    HuewiScenesComponent,
    HuewiSceneComponent,
    HuewiSceneDetailsComponent
  ]
})
export class HuewiScenesModule { }
