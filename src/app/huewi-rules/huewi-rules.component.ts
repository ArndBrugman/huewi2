import { Component, HostBinding, OnInit, Input, OnDestroy } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { RoutingAnimations } from './../app-routing.animations';

import { HUEWI_RULES_MOCK } from './huewi-rules.mock'

import { HuepiService } from '../shared/huepi.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

@Component({
  selector: 'huewi-rules',
  templateUrl: './huewi-rules.component.html',
  styleUrls: ['./huewi-rules.component.css'],
  animations: [RoutingAnimations()]
})
export class HuewiRulesComponent implements OnInit, OnDestroy {
  @HostBinding('@RoutingAnimations') get RoutingAnimations() { return true };
  @Input() rules = HUEWI_RULES_MOCK;
  private rulesSubscription;
  private ruleObserver: Observable<Array<any>> = Observable.of(this.rules);
  selectedRule = undefined;

  constructor(private huepiService: HuepiService, private activatedRoute: ActivatedRoute, private router: Router) {
  }

  ngOnInit() {
    this.ruleObserver = this.huepiService.getRules();
    this.rulesSubscription = this.ruleObserver.subscribe(value => {
      this.rules = value;
      this.updateSelected();
    });
  }

  ngOnDestroy() {
    this.rulesSubscription.unsubscribe();
  }

  updateSelected() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    this.selectedRule = this.huepiService.MyHue.Rules[id];
  }

}
