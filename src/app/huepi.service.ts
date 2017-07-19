import { Injectable } from '@angular/core';
import axios from 'axios';
import { huepi } from '../assets/huepi.js';
huepi.http = axios.create();
import { HUEPI_MOCK } from './huepi.mock'
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

@Injectable()
export class HuepiService {
  private MyHue;

  private groups: Array<any>;
  private lights: Array<any>;
  private rules: Array<any>;
  private scenes: Array<any>;
  private schedules: Array<any>;
  private sensors: Array<any>;

  constructor() {
    this.MyHue = new huepi();

    this.MyHue['Groups'] = HUEPI_MOCK['groups'];
    this.MyHue['Lights'] = HUEPI_MOCK['lights'];
    this.update();

    this.MyHue.PortalDiscoverLocalBridges().then(() => {
      this.MyHue.BridgeGetConfig().then(() => {
        this.MyHue.BridgeGetData().then(() => {
          console.log('Data Received');
          this.update();
        });
      });
    });

    setInterval( () =>  {
      this.MyHue['Groups'] = HUEPI_MOCK['groups'];
      this.update();
    }, 666);
  }

  update () {

    const groups = [];
    if (this.MyHue.Groups) {
      Object.keys(this.MyHue.Groups).forEach((key) => {
        this.MyHue.Groups[key].name = Date.now();
        this.MyHue.Groups[key].__key = key;
        groups.push(this.MyHue.Groups[key]);
      })
    }
    this.groups = groups;

    const lights = [];
    if (this.MyHue.Lights) {
      Object.keys(this.MyHue.Lights).forEach((key) => {
        this.MyHue.Lights[key].__key = key;
        lights.push(this.MyHue.Lights[key]);
      })
    }
    this.lights = lights;

    console.log('Update', JSON.stringify(this.groups));
  }

  getGroups(): Observable<Array<any>> {
    return Observable.of(this.groups);
  }

  getLights(): Observable<Array<any>> {
    return Observable.of(this.lights);
  }

  getRules(): Observable<Array<any>> {
    return Observable.of(this.rules);
  }

  getScenes(): Observable<Array<any>> {
    return Observable.of(this.scenes);
  }

  getSchedules(): Observable<Array<any>> {
    return Observable.of(this.schedules);
  }

  getSensors(): Observable<Array<any>> {
    return Observable.of(this.sensors);
  }
}
