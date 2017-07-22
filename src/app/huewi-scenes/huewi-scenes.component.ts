import { Component, OnInit, Input, OnDestroy } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

import { HUEWI_SCENES_MOCK } from './huewi-scenes.mock'

import { HuepiService } from '../huepi.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { trigger, state, animate, transition, style } from '@angular/animations';

@Component({
  selector: 'huewi-scenes',
  templateUrl: './huewi-scenes.component.html',
  styleUrls: ['./huewi-scenes.component.css']
})
export class HuewiScenesComponent implements OnInit, OnDestroy {
  @Input() scenes = HUEWI_SCENES_MOCK;
  private scenesSubscription;
  private sceneObserver: Observable<Array<any>> = Observable.of(this.scenes);
  selectedScene = undefined;

  constructor(private huepiService: HuepiService, private activatedRoute: ActivatedRoute, private router: Router) {
  }

  ngOnInit() {
    this.sceneObserver = this.huepiService.getScenes();
    this.scenesSubscription = this.sceneObserver.subscribe(value => {
      this.scenes = value;
      this.updateSelected();
    });
  }

  ngOnDestroy() {
    this.scenesSubscription.unsubscribe();
  }

  updateSelected() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    this.selectedScene = this.huepiService.MyHue.Scenes[id];
  }

}
