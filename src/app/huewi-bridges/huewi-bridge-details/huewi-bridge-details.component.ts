import { Component, OnInit, Input } from '@angular/core';

import { HuepiService } from '../../huepi.service';

@Component({
  selector: 'huewi-bridge-details',
  templateUrl: './huewi-bridge-details.component.html',
  styleUrls: ['./huewi-bridge-details.component.css']
})
export class HuewiBridgeDetailsComponent implements OnInit {
  @Input() bridge = { name: 'None' };

  constructor(private huepiService: HuepiService) {
  }

  ngOnInit() {
  }

}
