import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HuewiBridgesComponent } from './huewi-bridges.component';
import { HuewiBridgeDetailsComponent } from './huewi-bridge-details/huewi-bridge-details.component';

const huewiBridgesRoutes: Routes = [
  { path: 'bridges',  component: HuewiBridgesComponent },
  { path: 'bridges/:id', component: HuewiBridgesComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(huewiBridgesRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class HuewiBridgesRoutingModule { }
