import { Injectable } from '@angular/core';
import axios from 'axios';
import { huepi } from 'assets/huepi.js';
huepi.http = axios.create();
import { HUEPI_MOCK } from './huepi.mock'

@Injectable()
export class HuepiService {
  private MyHue;
  
  public groups : Array<any>;
  public lights : Array<any>;
  public rules : Array<any>;
  public scenes : Array<any>;
  public schedules : Array<any>;
  public sensors : Array<any>;

  constructor() {
    this.MyHue = new huepi();

    this.MyHue['Lights'] = HUEPI_MOCK['lights'];
    this.MyHue['Groups'] = HUEPI_MOCK['groups'];

    this.MyHue.PortalDiscoverLocalBridges().then(() => {
      this.MyHue.BridgeGetConfig().then(() => {
        this.MyHue.BridgeGetData().then(() => {
          console.log('Data Received');
          this.update();
        });
      });
    });

    this.update();
  }

  update () {
    
    let groups = [];
    if (this.MyHue.Groups) {
      Object.keys(this.MyHue.Groups).forEach((key) => {
        this.MyHue.Groups[key].__key = key;
        groups.push(this.MyHue.Groups[key]);
      })
    }
    this.groups = groups;

    let lights = [];
    if (this.MyHue.Lights) {
      Object.keys(this.MyHue.Lights).forEach((key) => {
        this.MyHue.Lights[key].__key = key;
        lights.push(this.MyHue.Lights[key]);
      })
    }
    this.lights = lights;

    console.log('Update', JSON.stringify(this.groups));
  }

  
}
