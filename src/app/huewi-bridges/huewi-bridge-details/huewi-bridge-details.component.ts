import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'huewi-bridge-details',
  templateUrl: './huewi-bridge-details.component.html',
  styleUrls: ['./huewi-bridge-details.component.css']
})
export class HuewiBridgeDetailsComponent implements OnInit {
  id: string;

  constructor(private activatedRoute: ActivatedRoute) { }

    ngOnInit() {
      this.id = this.activatedRoute.snapshot.paramMap.get('id');
      // this.activatedRoute.url.subscribe((urlPath) => { this.type = urlPath[urlPath.length - 2].path; })
    }

}
