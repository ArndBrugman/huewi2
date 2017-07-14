import { NgModule, ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AppComponent } from './app.component';

import { HuewiHomeComponent } from './huewi-home/huewi-home.component';
import { HuewiAboutComponent } from './huewi-about/huewi-about.component';

export const appRoutes: Routes = [
  { path: 'home', component: HuewiHomeComponent },
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
