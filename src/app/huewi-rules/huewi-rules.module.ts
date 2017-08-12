import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '@angular/material';
import { FormsModule }   from '@angular/forms';

import { FilterModule } from '../pipes/filter.module';

import { HuewiRulesComponent } from './huewi-rules.component';
import { HuewiRuleComponent } from './huewi-rule/huewi-rule.component';
import { HuewiRuleDetailsComponent } from './huewi-rule-details/huewi-rule-details.component';

import { HuewiRulesRoutingModule } from './huewi-rules-routing.module';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    FilterModule,
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
