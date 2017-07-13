import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HuewiGroupsComponent } from './huewi-groups.component';
import { HuewiDetailsComponent } from '../huewi-details/huewi-details.component';

const huewiGroupsRoutes: Routes = [
  { path: 'groups',  component: HuewiGroupsComponent },
  { path: 'group/:id', component: HuewiDetailsComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(huewiGroupsRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class HuewiGroupsRoutingModule { }
