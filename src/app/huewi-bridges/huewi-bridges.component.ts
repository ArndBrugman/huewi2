import { Component, HostBinding, OnInit, Input, OnDestroy } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { RoutingAnimations } from './../app-routing.animations';

import { HUEWI_BRIDGES_MOCK } from './huewi-bridges.mock'

import { HuepiService } from '../shared/huepi.service';
import { ParametersService } from '../shared/parameters.service';

import { Subscription, Observable, of } from 'rxjs';

@Component({
  selector: 'huewi-bridges',
  templateUrl: './huewi-bridges.component.html',
  styleUrls: ['./huewi-bridges.component.css'],
  animations: [RoutingAnimations]
})
export class HuewiBridgesComponent implements OnInit, OnDestroy {
  @Input() bridges = HUEWI_BRIDGES_MOCK;
  @Input() back = true;
  @Input() manualIP = '192.168.0.2';
  private bridgesSubscription: Subscription;
  private bridgeObserver: Observable<Array<any>> = of(this.bridges);
  selectedBridge = undefined;

  constructor(private huepiService: HuepiService, private parametersService: ParametersService,
    private activatedRoute: ActivatedRoute, private router: Router) {
  }

  ngOnInit() {
    const parameters = this.parametersService.getParameters();
    if (parameters['widget']) {
      this.back = false;
    }

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
    const id = this.activatedRoute.snapshot.paramMap.get('id') || '';
    if (id.indexOf(':') > 0) { // Parameters contain bridgeId:whitelistKey
      const bridgeId = id.substr(0, id.indexOf(':'));
      const whitelistKey = id.substr(id.indexOf(':') + 1);
      this.huepiService.MyHue.BridgeCache[bridgeId] = whitelistKey;
      this.huepiService.MyHue._BridgeCacheSave();
      this.router.navigate(['/bridges'], { replaceUrl: true });
      this.reload();
    }
    this.selectedBridge = this.huepiService.MyHue.LocalBridges[id];
  }

  discover() {
    this.huepiService.discover();
  }

  scan() {
    this.huepiService.scan();
  }

  isScanning() {
    return this.huepiService.isScanning();
  }

  cancelScan() {
    this.huepiService.cancelScan();
  }

  reload() {
    delete localStorage.MyHueBridgeIP;
    window.location.reload(true);
  }

  connect() {
    this.huepiService.connect(this.manualIP);
  }

}
