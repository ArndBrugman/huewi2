import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { PipesModule } from '../pipes/pipes.module';
import { MaterialModule } from '../app-material.module';

import { HuewiRulesComponent } from './huewi-rules.component';
import { HuewiRuleComponent } from './huewi-rule/huewi-rule.component';
import { HuewiRuleDetailsComponent } from './huewi-rule-details/huewi-rule-details.component';

import { HuewiRulesRoutingModule } from './huewi-rules-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    PipesModule,
    MaterialModule,
    HuewiRulesRoutingModule
  ],
  declarations: [
    HuewiRulesComponent,
    HuewiRuleComponent,
    HuewiRuleDetailsComponent
  ],
  exports: [
    HuewiRulesComponent,
    HuewiRuleComponent,
    HuewiRuleDetailsComponent
  ]
})
export class HuewiRulesModule { }
