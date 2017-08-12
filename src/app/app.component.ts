import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { HuepiService } from './shared/huepi.service';

@Component({
  selector: 'huewi-app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'hue Web Interface';
  theme = 'defaults-to-light';

  constructor(private huepiService: HuepiService, private router: Router) {
  }

  toggleTheme() {
    this.theme === 'dark-theme'? this.theme = '' : this.theme = 'dark-theme';
  }

}
