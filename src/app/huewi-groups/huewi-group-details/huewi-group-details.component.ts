import { Component, OnInit, Input } from '@angular/core';

import { HuepiService } from '../../huepi.service';

@Component({
  selector: 'huewi-group-details',
  templateUrl: './huewi-group-details.component.html',
  styleUrls: ['./huewi-group-details.component.css']
})
export class HuewiGroupDetailsComponent implements OnInit {
  @Input() group = { name: 'None' };

  constructor(private huepiService: HuepiService) {
  }

  ngOnInit() {
  }

}
