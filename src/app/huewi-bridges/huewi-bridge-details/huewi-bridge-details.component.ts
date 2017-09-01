import { Component, OnInit, Input, OnDestroy } from '@angular/core';

import { HuepiService } from '../../shared/huepi.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

@Component({
  selector: 'huewi-bridge-details',
  templateUrl: './huewi-bridge-details.component.html',
  styleUrls: ['./huewi-bridge-details.component.css']
})
export class HuewiBridgeDetailsComponent implements OnInit, OnDestroy {
  @Input() bridge = { name: 'None' };
  config;
  whitelist;
  private whitelistSubscription;
  private whitelistObserver: Observable<Array<any>> = Observable.of(this.whitelist);

  constructor(private huepiService: HuepiService) {
    this.config = huepiService.MyHue.BridgeConfig;
    this.whitelist = huepiService.getWhitelist();
  }

  ngOnInit() {
    this.whitelistObserver = this.huepiService.getWhitelist();
    this.whitelistSubscription = this.whitelistObserver.subscribe(value => {
      this.whitelist = value;
    });
  }

  ngOnDestroy() {
    this.whitelistSubscription.unsubscribe();
  }

  isCurrent(key) {
    return (key === this.huepiService.MyHue.Username);
  }

  link(key) { // open in new tab
    window.open(location.origin + "/#/bridges/" + this.huepiService.MyHue.BridgeConfig.bridgeid.toLowerCase() + ":" + key);
  }

  delete(key) {
    this.huepiService.MyHue.BridgeDeleteUser(key);
  }
}
