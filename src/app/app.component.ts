import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'huewi-app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'hue Web Interface';

  constructor(private router: Router) { }
}
