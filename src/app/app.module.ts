import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { MaterialModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import 'hammerjs';

import { AppComponent } from './app.component';
import { HuewiGroupsModule } from './huewi-groups/huewi-groups.module';
import { HuewiLightsModule } from './huewi-lights/huewi-lights.module';
import { HuewiHomeComponent } from './huewi-home/huewi-home.component';
import { HuewiDetailsComponent } from './huewi-details/huewi-details.component';
import { HuewiRulesComponent } from './huewi-rules/huewi-rules.component';
import { HuewiScenesComponent } from './huewi-scenes/huewi-scenes.component';
import { HuewiSchedulesComponent } from './huewi-schedules/huewi-schedules.component';
import { HuewiSensorsComponent } from './huewi-sensors/huewi-sensors.component';
import { HuewiBridgesComponent } from './huewi-bridges/huewi-bridges.component';
import { HuewiAboutComponent } from './huewi-about/huewi-about.component';

@NgModule({
  declarations: [
    AppComponent,
    HuewiDetailsComponent,
    HuewiHomeComponent,
    HuewiRulesComponent,
    HuewiScenesComponent,
    HuewiSchedulesComponent,
    HuewiSensorsComponent,
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
