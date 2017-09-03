import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '@angular/material';
import { FormsModule } from '@angular/forms';

import { PipesModule } from '../pipes/pipes.module';

import { HuewiGroupsComponent } from './huewi-groups.component';
import { HuewiGroupComponent } from './huewi-group/huewi-group.component';
import { HuewiGroupDetailsComponent } from './huewi-group-details/huewi-group-details.component';

import { HuewiGroupsFilter } from './huewi-groups.filter';

import { HuewiGroupsRoutingModule } from './huewi-groups-routing.module';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    PipesModule,
    HuewiGroupsRoutingModule
  ],
  declarations: [
    HuewiGroupsComponent,
    HuewiGroupComponent,
    HuewiGroupDetailsComponent,
    HuewiGroupsFilter
  ],
  exports: [
    HuewiGroupsComponent,
    HuewiGroupComponent,
    HuewiGroupDetailsComponent
  ]
})
export class HuewiGroupsModule { }
