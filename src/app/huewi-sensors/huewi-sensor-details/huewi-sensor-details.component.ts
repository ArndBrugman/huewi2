import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'huewi-sensor-details',
  templateUrl: './huewi-sensor-details.component.html',
  styleUrls: ['./huewi-sensor-details.component.css']
})
export class HuewiSensorDetailsComponent implements OnInit {
  id: string;

  constructor(private activatedRoute: ActivatedRoute) { }

    ngOnInit() {
      this.id = this.activatedRoute.snapshot.paramMap.get('id');
      // this.activatedRoute.url.subscribe((urlPath) => { this.type = urlPath[urlPath.length - 2].path; })
    }

}
