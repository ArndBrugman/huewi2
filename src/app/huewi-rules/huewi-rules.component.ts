import { Component, OnInit, Input } from '@angular/core';
// import { HUEWI_RULES_MOCK } from './huewi-rules.mock'

import { HuepiService } from '../huepi.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

@Component({
  selector: 'huewi-rules',
  templateUrl: './huewi-rules.component.html',
  styleUrls: ['./huewi-rules.component.css']
})
export class HuewiRulesComponent implements OnInit {
  @Input() rules; // = HUEWI_RULES_MOCK;
  private rulesObserver: Observable<Array<any>> = Observable.of(this.rules);

  constructor(private huepiService: HuepiService) {
    this.rulesObserver = this.huepiService.getLights();
    this.rulesObserver.subscribe((data) => this.rules = data);
  }

  ngOnInit() {
  }

}
