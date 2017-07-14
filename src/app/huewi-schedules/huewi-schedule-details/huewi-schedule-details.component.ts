import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'huewi-schedule-details',
  templateUrl: './huewi-schedule-details.component.html',
  styleUrls: ['./huewi-schedule-details.component.css']
})
export class HuewiScheduleDetailsComponent implements OnInit {
  id: string;

  constructor(private activatedRoute: ActivatedRoute) { }

    ngOnInit() {
      this.id = this.activatedRoute.snapshot.paramMap.get('id');
      // this.activatedRoute.url.subscribe((urlPath) => { this.type = urlPath[urlPath.length - 2].path; })
    }

}
