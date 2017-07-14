import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { NgModule } from '@angular/core';
import { MaterialModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import 'hammerjs';

import { AppComponent } from './app.component';
import { HuewiHomeComponent } from './huewi-home/huewi-home.component';
import { HuewiGroupsModule } from './huewi-groups/huewi-groups.module';
import { HuewiLightsModule } from './huewi-lights/huewi-lights.module';
import { HuewiRulesModule } from './huewi-rules/huewi-rules.module';
import { HuewiScenesModule } from './huewi-scenes/huewi-scenes.module';
import { HuewiSchedulesModule } from './huewi-schedules/huewi-schedules.module';
import { HuewiSensorsModule } from './huewi-sensors/huewi-sensors.module';
import { HuewiBridgesModule } from './huewi-bridges/huewi-bridges.module';
import { HuewiAboutComponent } from './huewi-about/huewi-about.component';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MaterialModule,
    NgbModule.forRoot(),
    HuewiGroupsModule,
    HuewiLightsModule,
    HuewiRulesModule,
    HuewiScenesModule,
    HuewiSchedulesModule,
    HuewiSensorsModule,
    HuewiBridgesModule,
    AppRoutingModule
  ],
  declarations: [
    AppComponent,
    HuewiHomeComponent,
    HuewiAboutComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
