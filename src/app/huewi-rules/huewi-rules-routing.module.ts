import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HuewiRulesComponent } from './huewi-rules.component';
import { HuewiRuleDetailsComponent } from './huewi-rule-details/huewi-rule-details.component';

const huewiRulesRoutes: Routes = [
  { path: 'rules',  component: HuewiRulesComponent },
  { path: 'rules/:id', component: HuewiRulesComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(huewiRulesRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class HuewiRulesRoutingModule { }
