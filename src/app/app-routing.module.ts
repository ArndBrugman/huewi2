import { NgModule, ModuleWithProviders }  from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AppComponent } from './app.component';

//import { HuewiGroupsComponent } from './huewi-groups/huewi-groups.component';
//import { HuewiLightsComponent } from './huewi-lights/huewi-lights.component';
import { HuewiHomeComponent } from './huewi-home/huewi-home.component';
import { HuewiDetailsComponent } from './huewi-details/huewi-details.component';
import { HuewiRulesComponent } from './huewi-rules/huewi-rules.component';
import { HuewiScenesComponent } from './huewi-scenes/huewi-scenes.component';
import { HuewiSchedulesComponent } from './huewi-schedules/huewi-schedules.component';
import { HuewiSensorsComponent } from './huewi-sensors/huewi-sensors.component';
import { HuewiGroupComponent } from './huewi-groups/huewi-group/huewi-group.component';
import { HuewiLightComponent } from './huewi-lights/huewi-light/huewi-light.component';
import { HuewiRuleComponent } from './huewi-rules/huewi-rule/huewi-rule.component';
import { HuewiSceneComponent } from './huewi-scenes/huewi-scene/huewi-scene.component';
import { HuewiScheduleComponent } from './huewi-schedules/huewi-schedule/huewi-schedule.component';
import { HuewiSensorComponent } from './huewi-sensors/huewi-sensor/huewi-sensor.component';
import { HuewiBridgesComponent } from './huewi-bridges/huewi-bridges.component';
import { HuewiAboutComponent } from './huewi-about/huewi-about.component';

export const appRoutes: Routes = [
  { path: 'home', component: HuewiHomeComponent },
  //{ path: 'groups', component: HuewiGroupsComponent },
  //{ path: 'lights', component: HuewiLightsComponent },
  { path: 'rules', component: HuewiRulesComponent },
  { path: 'scenes', component: HuewiScenesComponent },
  { path: 'schedules', component: HuewiSchedulesComponent },
  { path: 'sensors', component: HuewiSensorsComponent },
  { path: 'bridges', component: HuewiBridgesComponent },
  { path: 'about', component: HuewiAboutComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home'}
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
