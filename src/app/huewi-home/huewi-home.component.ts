import { Component, OnInit, OnDestroy } from '@angular/core';

import { ParametersService } from '../shared/parameters.service';

import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'huewi-home',
  templateUrl: './huewi-home.component.html',
  styleUrls: ['./huewi-home.component.css']
})
export class HuewiHomeComponent implements OnInit, OnDestroy {
  customElements;

  constructor(private activatedRoute: ActivatedRoute, private parametersService: ParametersService) {
  }

  ngOnInit() {
    const parameters = this.parametersService.getParameters();
    this.customElements = [];
    for (const key in parameters) {
      if ( (key === 'groups') || (key === 'lights') || (key === 'bridges') ||
        (key === 'rules') || (key === 'scenes') || (key === 'schedules') || (key === 'sensors') ) {
        if (parseInt(parameters[key], 10) === NaN) {
          this.customElements.push('#/' + key + '?widget=true');
        } else {
          this.customElements.push('#/' + key + '/' + parseInt(parameters[key], 10) + '?widget=true');
        }
      } else if (key === 'about') {
        this.customElements.push('#/' + key + '?widget=true');
      }
    }
  }

  ngOnDestroy() {
  }

}
