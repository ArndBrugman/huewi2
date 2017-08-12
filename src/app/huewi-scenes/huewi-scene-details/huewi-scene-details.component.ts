import { Component, OnInit, Input } from '@angular/core';

import { HuepiService } from '../../shared/huepi.service';

@Component({
  selector: 'huewi-scene-details',
  templateUrl: './huewi-scene-details.component.html',
  styleUrls: ['./huewi-scene-details.component.css']
})
export class HuewiSceneDetailsComponent implements OnInit {
  @Input() scene;

  constructor(private huepiService: HuepiService) {
  }

  ngOnInit() {
  }

}
