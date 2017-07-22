import { Component, OnInit, Input, OnDestroy } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

import { HUEWI_RULES_MOCK } from './huewi-rules.mock'

import { HuepiService } from '../huepi.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { trigger, state, animate, transition, style } from '@angular/animations';

@Component({
  selector: 'huewi-rules',
  templateUrl: './huewi-rules.component.html',
  styleUrls: ['./huewi-rules.component.css']
})
export class HuewiRulesComponent implements OnInit, OnDestroy {
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
