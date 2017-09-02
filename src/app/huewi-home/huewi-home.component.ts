import { Component, OnInit, OnDestroy } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'huewi-home',
  templateUrl: './huewi-home.component.html',
  styleUrls: ['./huewi-home.component.css']
})
export class HuewiHomeComponent implements OnInit, OnDestroy {
  parametersSubscription;
  customElements;

  constructor(private activatedRoute: ActivatedRoute, private router: Router) {
  }

  ngOnInit() {
    let parameters;

    this.parametersSubscription = this.activatedRoute.queryParams.subscribe(params => {
      this.customElements = [];
      parameters = {...params.keys, ...params};
      for (const key in parameters) {
        if ( (key === 'groups') || (key === 'lights') || (key === 'bridges') ||
         (key === 'rules') || (key === 'scenes') || (key === 'schedules') || (key === 'sensors') ) {
          if (parseInt(parameters[key], 10) === NaN) {
            this.customElements.push('/#/' + key + '?widget=true');
          } else {
            this.customElements.push('/#/' + key + '/' + parseInt(parameters[key], 10) + '?widget=true');
          }
        } else if (key === 'about') {
          this.customElements.push('/#/' + key + '?widget=true');
        }
      }
    });
  }

  ngOnDestroy() {
    this.parametersSubscription.unsubscribe();
  }

}
