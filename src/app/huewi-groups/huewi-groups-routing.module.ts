import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HuewiGroupsComponent } from './huewi-groups.component';
import { HuewiGroupDetailsComponent } from './huewi-group-details/huewi-group-details.component';

const huewiGroupsRoutes: Routes = [
  { path: 'groups',  component: HuewiGroupsComponent },
  { path: 'groups/:id', component: HuewiGroupsComponent }
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
