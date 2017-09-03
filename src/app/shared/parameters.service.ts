import { Injectable, OnInit, OnDestroy } from '@angular/core';

import { ActivatedRoute } from '@angular/router';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class ParametersService implements OnInit, OnDestroy {
  private parametersSubscription;
  private parameters: BehaviorSubject<Array<any>> = new BehaviorSubject(Array([]));

  constructor(private activatedRoute: ActivatedRoute) {
    this.parametersSubscription = this.activatedRoute.queryParams.subscribe(params => {
      this.parameters.next({...params.keys, ...params});
      console.log(this.parameters.value);
    });
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.parametersSubscription.unsubscribe();
  }

  getParameters() {
    return this.parameters.value;
  }

}
