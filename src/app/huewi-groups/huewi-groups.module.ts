import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '@angular/material';

import { HuewiGroupsComponent } from './huewi-groups.component';
import { HuewiGroupComponent } from './huewi-group/huewi-group.component';
import { HuewiGroupDetailsComponent } from './huewi-group-details/huewi-group-details.component';

import { HuewiGroupsRoutingModule } from './huewi-groups-routing.module';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    HuewiGroupsRoutingModule
  ],
  declarations: [
    HuewiGroupsComponent,
    HuewiGroupComponent,
    HuewiGroupDetailsComponent
  ],
  exports: [
    HuewiGroupsComponent,
    HuewiGroupComponent,
    HuewiGroupDetailsComponent
  ]
})
export class HuewiGroupsModule { }
