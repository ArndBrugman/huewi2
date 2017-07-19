import { Component, OnInit, Input } from '@angular/core';
// import { HUEWI_SCENES_MOCK } from './huewi-scenes.mock'

import { HuepiService } from '../huepi.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

@Component({
  selector: 'huewi-scenes',
  templateUrl: './huewi-scenes.component.html',
  styleUrls: ['./huewi-scenes.component.css']
})
export class HuewiScenesComponent implements OnInit {
  @Input() scenes; // = HUEWI_SCENES_MOCK;
  private scenesObserver: Observable<Array<any>> = Observable.of(this.scenes);

  constructor(private huepiService: HuepiService) {
    this.scenesObserver = this.huepiService.getLights();
    this.scenesObserver.subscribe((data) => this.scenes = data);
  }

  ngOnInit() {
  }

}
