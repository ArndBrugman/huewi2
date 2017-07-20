import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HuewiScenesComponent } from './huewi-scenes.component';
import { HuewiSceneDetailsComponent } from './huewi-scene-details/huewi-scene-details.component';

const huewiScenesRoutes: Routes = [
  { path: 'scenes',  component: HuewiScenesComponent },
  { path: 'scenes/:id', component: HuewiScenesComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(huewiScenesRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class HuewiScenesRoutingModule { }
