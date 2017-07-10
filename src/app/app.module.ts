import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { MaterialModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import 'hammerjs';

import { AppComponent } from './app.component';
import { HuewiMenuComponent } from './huewi-menu/huewi-menu.component';
import { HuewiGroupsComponent } from './huewi-groups/huewi-groups.component';
import { HuewiLightsComponent } from './huewi-lights/huewi-lights.component';
import { HuewiOverviewComponent } from './huewi-overview/huewi-overview.component';
import { HuewiBridgeComponent } from './huewi-bridge/huewi-bridge.component';
import { HuewiAboutComponent } from './huewi-about/huewi-about.component';
import { HuewiRulesComponent } from './huewi-rules/huewi-rules.component';
import { HuewiScenesComponent } from './huewi-scenes/huewi-scenes.component';
import { HuewiSchedulesComponent } from './huewi-schedules/huewi-schedules.component';
import { HuewiSensorsComponent } from './huewi-sensors/huewi-sensors.component';

@NgModule({
  declarations: [
    AppComponent,
    HuewiMenuComponent,
    HuewiGroupsComponent,
    HuewiLightsComponent,
    HuewiOverviewComponent,
    HuewiBridgeComponent,
    HuewiAboutComponent,
    HuewiRulesComponent,
    HuewiScenesComponent,
    HuewiSchedulesComponent,
    HuewiSensorsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MaterialModule,
    BrowserAnimationsModule,
    NgbModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
