import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { HuepiService } from './huepi.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

@Component({
  selector: 'huewi-app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'hue Web Interface';

  constructor(private router: Router, private huepiService: HuepiService) {

  }

}
