import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

import { HuepiService } from '../../shared/huepi.service';

@Component({
  selector: 'huewi-rule',
  templateUrl: './huewi-rule.component.html',
  styleUrls: ['./huewi-rule.component.css']
})
export class HuewiRuleComponent implements OnInit {
  @Input() rule;

  constructor(private huepiService: HuepiService, private router: Router) {
  }

  ngOnInit() {
  }

  select(rule) {
    this.router.navigate(['/rules', rule.__key], { replaceUrl: true });
  }

}
