import { Component, HostBinding, OnInit } from '@angular/core';
import { RoutingAnimations } from './../app-routing.animations';

@Component({
  selector: 'huewi-about',
  templateUrl: './huewi-about.component.html',
  styleUrls: ['./huewi-about.component.css'],
  animations: [RoutingAnimations()]
})
export class HuewiAboutComponent implements OnInit {
  @HostBinding('@RoutingAnimations') get RoutingAnimations() { return true };

  constructor() { }

  ngOnInit() {
  }

}
