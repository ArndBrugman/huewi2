import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { MaterialModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import 'hammerjs';

import { AppComponent } from './app.component';
import { HuewiGroupsModule } from './huewi-groups/huewi-groups.module';
  import { HuewiGroupsComponent } from './huewi-groups/huewi-groups.component';
import { HuewiLightsModule } from './huewi-lights/huewi-lights.module';
  import { HuewiLightsComponent } from './huewi-lights/huewi-lights.component';
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

@NgModule({
  declarations: [
    AppComponent,
      HuewiGroupsComponent,
      HuewiLightsComponent,
    HuewiDetailsComponent,
    HuewiHomeComponent,
    HuewiRulesComponent,
    HuewiScenesComponent,
    HuewiSchedulesComponent,
    HuewiSensorsComponent,
      HuewiGroupComponent,
      HuewiLightComponent,
    HuewiRuleComponent,
    HuewiSceneComponent,
    HuewiScheduleComponent,
    HuewiSensorComponent,
    HuewiBridgesComponent,
    HuewiAboutComponent
  ],
  imports: [
    BrowserModule,
    MaterialModule,
    BrowserAnimationsModule,
    NgbModule.forRoot(),
    HuewiGroupsModule,
    HuewiLightsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
