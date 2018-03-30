import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { PipesModule } from '../pipes/pipes.module';
import { MaterialModule } from '../app-material.module';

import { HuewiScenesComponent } from './huewi-scenes.component';
import { HuewiSceneComponent } from './huewi-scene/huewi-scene.component';
import { HuewiSceneDetailsComponent } from './huewi-scene-details/huewi-scene-details.component';

import { HuewiScenesRoutingModule } from './huewi-scenes-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    PipesModule,
    MaterialModule,
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
