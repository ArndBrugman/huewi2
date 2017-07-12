import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'huewi-details',
  templateUrl: './huewi-details.component.html',
  styleUrls: ['./huewi-details.component.css']
})
export class HuewiDetailsComponent implements OnInit {
  type: string; // light or group
  id: string;

  constructor(private activatedRoute: ActivatedRoute) { }

    ngOnInit() {
        this.id = this.activatedRoute.snapshot.paramMap.get('id');
        this.activatedRoute.url.subscribe((urlPath) => {
          this.type = urlPath[urlPath.length - 2].path;
        })
    }
}
