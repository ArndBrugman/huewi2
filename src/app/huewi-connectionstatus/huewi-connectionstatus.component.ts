import { Component, OnInit } from '@angular/core';

import { HuepiService } from '../huepi.service';

@Component({
  selector: 'huewi-connectionstatus',
  templateUrl: './huewi-connectionstatus.component.html',
  styleUrls: ['./huewi-connectionstatus.component.css']
})
export class HuewiConnectionstatusComponent implements OnInit {

  constructor(private huepiService: HuepiService) { }

  ngOnInit() {
  }

  getStatus() {
    return this.huepiService.getStatus();
  }
  
  getMessage() {
    return this.huepiService.getMessage();
  }

}
