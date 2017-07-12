import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '@angular/material';

import { HuewiGroupsComponent } from './huewi-groups.component';
import { HuewiGroupComponent } from './huewi-group/huewi-group.component'

import { HuewiGroupsRoutingModule } from './huewi-groups-routing.module'

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    HuewiGroupsRoutingModule
  ],
  declarations: [
      HuewiGroupsComponent,
      HuewiGroupComponent
  ],
  exports: [
      HuewiGroupsComponent,
      HuewiGroupComponent
  ]
})
export class HuewiGroupsModule { }
