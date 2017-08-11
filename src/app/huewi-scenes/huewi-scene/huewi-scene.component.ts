import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

import { HuepiService } from '../../shared/huepi.service';

@Component({
  selector: 'huewi-scene',
  templateUrl: './huewi-scene.component.html',
  styleUrls: ['./huewi-scene.component.css']
})
export class HuewiSceneComponent implements OnInit {
  @Input() scene;

  constructor(private huepiService: HuepiService, private router: Router) {
  }

  ngOnInit() {
  }

  select(scene) {
    this.router.navigate(['/scenes', scene.__key]);
  }

}
