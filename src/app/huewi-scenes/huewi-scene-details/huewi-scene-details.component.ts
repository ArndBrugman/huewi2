import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'huewi-scene-details',
  templateUrl: './huewi-scene-details.component.html',
  styleUrls: ['./huewi-scene-details.component.css']
})
export class HuewiSceneDetailsComponent implements OnInit {
  id: string;

  constructor(private activatedRoute: ActivatedRoute) { }

    ngOnInit() {
      this.id = this.activatedRoute.snapshot.paramMap.get('id');
      // this.activatedRoute.url.subscribe((urlPath) => { this.type = urlPath[urlPath.length - 2].path; })
    }

}
