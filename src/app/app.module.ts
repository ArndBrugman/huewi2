import { enableProdMode } from '@angular/core';
// enableProdMode();

import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { NgModule } from '@angular/core';
import { MaterialModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
// import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import 'hammerjs/hammer';

import { PipesModule } from './pipes/pipes.module';

import { HuepiService } from './shared/huepi.service';
import { ParametersService } from './shared/parameters.service';

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
import { HuewiConnectionstatusComponent } from './huewi-connectionstatus/huewi-connectionstatus.component';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MaterialModule,
    FormsModule,
    // NgbModule.forRoot(),
    PipesModule,
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
    HuewiAboutComponent,
    HuewiConnectionstatusComponent
  ],
  providers: [
    HuepiService,
    ParametersService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
