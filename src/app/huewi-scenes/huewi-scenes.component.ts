import { Component, HostBinding, OnInit, Input, OnDestroy } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { RoutingAnimations } from './../app-routing.animations';

import { HUEWI_SCENES_MOCK } from './huewi-scenes.mock'

import { HuepiService } from '../shared/huepi.service';
import { ParametersService } from '../shared/parameters.service';

import { Subscription, Observable, of } from 'rxjs';

@Component({
  selector: 'huewi-scenes',
  templateUrl: './huewi-scenes.component.html',
  styleUrls: ['./huewi-scenes.component.css'],
  animations: [RoutingAnimations]
})
export class HuewiScenesComponent implements OnInit, OnDestroy {
  @Input() scenes = HUEWI_SCENES_MOCK;
  @Input() back = true;
  private scenesSubscription: Subscription;
  private sceneObserver: Observable<Array<any>> = of(this.scenes);
  selectedScene = undefined;

  constructor(private huepiService: HuepiService, private parametersService: ParametersService,
    private activatedRoute: ActivatedRoute, private router: Router) {
  }

  ngOnInit() {
    const parameters = this.parametersService.getParameters();
    if (parameters['widget']) {
      this.back = false;
    }

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
