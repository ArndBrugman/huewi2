import { Component, OnInit, Input, OnDestroy } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

import { HUEWI_BRIDGES_MOCK } from './huewi-bridges.mock'

import { HuepiService } from '../huepi.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { trigger, state, animate, transition, style } from '@angular/animations';

@Component({
  selector: 'huewi-bridges',
  templateUrl: './huewi-bridges.component.html',
  styleUrls: ['./huewi-bridges.component.css']
})
export class HuewiBridgesComponent implements OnInit, OnDestroy {
  @Input() bridges = HUEWI_BRIDGES_MOCK;
  private bridgesSubscription;
  private bridgeObserver: Observable<Array<any>> = Observable.of(this.bridges);
  selectedBridge = undefined;

  constructor(private huepiService: HuepiService, private activatedRoute: ActivatedRoute, private router: Router) {
  }

  ngOnInit() {
    this.bridgeObserver = this.huepiService.getBridges();
    this.bridgesSubscription = this.bridgeObserver.subscribe(value => {
      this.bridges = value;
      this.updateSelected();
    });
  }

  ngOnDestroy() {
    this.bridgesSubscription.unsubscribe();
  }

  updateSelected() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    this.selectedBridge = this.huepiService.MyHue.LocalBridges[id];
  }

}
