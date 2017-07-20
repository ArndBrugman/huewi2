import { Component, OnInit, Input } from '@angular/core';

import { HuepiService } from '../../huepi.service';

@Component({
  selector: 'huewi-light-details',
  templateUrl: './huewi-light-details.component.html',
  styleUrls: ['./huewi-light-details.component.css']
})
export class HuewiLightDetailsComponent implements OnInit {
  @Input() light = { name: 'None' };

  constructor(private huepiService: HuepiService) {
  }

  ngOnInit() {
  }

}
