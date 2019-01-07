import { Component, HostBinding, OnInit, Input, OnDestroy } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { RoutingAnimations } from './../app-routing.animations';

import { HUEWI_RULES_MOCK } from './huewi-rules.mock'

import { HuepiService } from '../shared/huepi.service';
import { ParametersService } from '../shared/parameters.service';

import { Subscription, Observable, of } from 'rxjs';

@Component({
  selector: 'huewi-rules',
  templateUrl: './huewi-rules.component.html',
  styleUrls: ['./huewi-rules.component.css'],
  animations: [RoutingAnimations]
})
export class HuewiRulesComponent implements OnInit, OnDestroy {
  @Input() rules = HUEWI_RULES_MOCK;
  @Input() back = true;
  private rulesSubscription: Subscription;
  private ruleObserver: Observable<Array<any>> = of(this.rules);
  selectedRule = undefined;

  constructor(private huepiService: HuepiService, private parametersService: ParametersService,
    private activatedRoute: ActivatedRoute, private router: Router) {
  }

  ngOnInit() {
    const parameters = this.parametersService.getParameters();
    if (parameters['widget']) {
      this.back = false;
    }

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
