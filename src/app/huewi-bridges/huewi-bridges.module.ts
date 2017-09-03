import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '@angular/material';
import { FormsModule } from '@angular/forms';

import { PipesModule } from '../pipes/pipes.module';

import { HuewiBridgesComponent } from './huewi-bridges.component';
import { HuewiBridgeComponent } from './huewi-bridge/huewi-bridge.component';
import { HuewiBridgeDetailsComponent } from './huewi-bridge-details/huewi-bridge-details.component';

import { HuewiBridgesRoutingModule } from './huewi-bridges-routing.module';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    PipesModule,
    HuewiBridgesRoutingModule
  ],
  declarations: [
    HuewiBridgesComponent,
    HuewiBridgeComponent,
    HuewiBridgeDetailsComponent
  ],
  exports: [
    HuewiBridgesComponent,
    HuewiBridgeComponent,
    HuewiBridgeDetailsComponent
  ]
})
export class HuewiBridgesModule { }
