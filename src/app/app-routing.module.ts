import { NgModule, ModuleWithProviders }  from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AppComponent } from './app.component';

import { HuewiGroupsComponent } from './huewi-groups/huewi-groups.component';
import { HuewiLightsComponent } from './huewi-lights/huewi-lights.component';
import { HuewiOverviewComponent } from './huewi-overview/huewi-overview.component';
import { HuewiBridgeComponent } from './huewi-bridge/huewi-bridge.component';
import { HuewiAboutComponent } from './huewi-about/huewi-about.component';
import { HuewiRulesComponent } from './huewi-rules/huewi-rules.component';
import { HuewiScenesComponent } from './huewi-scenes/huewi-scenes.component';
import { HuewiSchedulesComponent } from './huewi-schedules/huewi-schedules.component';
import { HuewiSensorsComponent } from './huewi-sensors/huewi-sensors.component';
import { HuewiMenuComponent } from './huewi-menu/huewi-menu.component';

export const appRoutes: Routes = [
  { path: 'groups', component: HuewiGroupsComponent },
  { path: 'lights', component: HuewiLightsComponent },
  { path: 'overview', component: HuewiOverviewComponent },
  { path: 'bridge', component: HuewiBridgeComponent },
  { path: 'about', component: HuewiAboutComponent },
  { path: 'rules', component: HuewiRulesComponent },
  { path: 'schedules', component: HuewiSchedulesComponent },
  { path: 'sensors', component: HuewiSensorsComponent },
  { path: 'menu', component: HuewiMenuComponent },
  { path: '', component: HuewiOverviewComponent },
  { path: '**', redirectTo: '/overview'}
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
