import { Component, OnInit, Input } from '@angular/core';

import { HuepiService } from '../../huepi.service';

@Component({
  selector: 'huewi-rule',
  templateUrl: './huewi-rule.component.html',
  styleUrls: ['./huewi-rule.component.css']
})
export class HuewiRuleComponent implements OnInit {
  @Input() rule = { };

  constructor(private huepiService: HuepiService) {

  }

  ngOnInit() {
  }

}
