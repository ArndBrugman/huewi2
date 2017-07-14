import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'huewi-light-details',
  templateUrl: './huewi-light-details.component.html',
  styleUrls: ['./huewi-light-details.component.css']
})
export class HuewiLightDetailsComponent implements OnInit {
  id: string;

  constructor(private activatedRoute: ActivatedRoute) { }

    ngOnInit() {
      this.id = this.activatedRoute.snapshot.paramMap.get('id');
      // this.activatedRoute.url.subscribe((urlPath) => { this.type = urlPath[urlPath.length - 2].path; })
    }

}
