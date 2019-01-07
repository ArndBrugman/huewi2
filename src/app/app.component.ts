import { Component, HostBinding, OnInit, OnDestroy } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { RoutingAnimations } from './app-routing.animations';

import { HuepiService } from './shared/huepi.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'huewi-app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [RoutingAnimations]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'hue Web Interface';
  theme = 'defaults-to-light';
  parametersSubscription: Subscription;
  parameters;

  constructor(private huepiService: HuepiService, private activatedRoute: ActivatedRoute, private router: Router) {
  }

  ngOnInit() {
    this.parametersSubscription = this.activatedRoute.queryParams.subscribe(params => {
      this.parameters = {...params.keys, ...params};
    });
    // this.theme = 'dark-theme';
  }

  ngOnDestroy() {
    this.parametersSubscription.unsubscribe();
  }

  toggleTheme() {
    this.theme === 'dark-theme' ? this.theme = '' : this.theme = 'dark-theme';
  }

}
