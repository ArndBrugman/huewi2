import { Component, OnInit, Input } from '@angular/core';

import { HuepiService } from '../../huepi.service';

@Component({
  selector: 'huewi-scene',
  templateUrl: './huewi-scene.component.html',
  styleUrls: ['./huewi-scene.component.css']
})
export class HuewiSceneComponent implements OnInit {
  @Input() scene = { };

  constructor(private huepiService: HuepiService) {

  }

  ngOnInit() {
  }

}
