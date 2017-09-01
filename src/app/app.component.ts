import { Component, OnInit, OnDestroy } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

import { HuepiService } from './shared/huepi.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

@Component({
  selector: 'huewi-app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'hue Web Interface';
  theme = 'defaults-to-light';
  parameters;

  constructor(private huepiService: HuepiService, private activatedRoute: ActivatedRoute, private router: Router) {
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.parameters = {...params.keys, ...params};
    });
  }

  ngOnDestroy() {
  }

  toggleTheme() {
    this.theme === 'dark-theme' ? this.theme = '' : this.theme = 'dark-theme';
  }

}
