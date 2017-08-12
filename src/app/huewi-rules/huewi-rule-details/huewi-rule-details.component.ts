import { Component, OnInit, Input } from '@angular/core';

import { HuepiService } from '../../shared/huepi.service';

@Component({
  selector: 'huewi-rule-details',
  templateUrl: './huewi-rule-details.component.html',
  styleUrls: ['./huewi-rule-details.component.css']
})
export class HuewiRuleDetailsComponent implements OnInit {
  @Input() rule;

  constructor(private huepiService: HuepiService) {
  }

  ngOnInit() {
  }

}
