import { Component, OnInit, Input } from '@angular/core';

import { HuepiService } from '../../huepi.service';

@Component({
  selector: 'huewi-rule-details',
  templateUrl: './huewi-rule-details.component.html',
  styleUrls: ['./huewi-rule-details.component.css']
})
export class HuewiRuleDetailsComponent implements OnInit {
  @Input() rule = { name: 'None' };

  constructor(private huepiService: HuepiService) {
  }

  ngOnInit() {
  }

}
