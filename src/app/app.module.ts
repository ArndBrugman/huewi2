import { enableProdMode } from '@angular/core';
// enableProdMode();

import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { NgModule } from '@angular/core';
import { MaterialModule } from './app-material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

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
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    // NgbModule.forRoot(),
    MaterialModule,
    PipesModule,
    HuewiGroupsModule,
    HuewiLightsModule,
    HuewiRulesModule,
    HuewiScenesModule,
    HuewiSchedulesModule,
    HuewiSensorsModule,
    HuewiBridgesModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
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
