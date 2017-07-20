import { Injectable } from '@angular/core';
import axios from 'axios';
import { huepi } from '../assets/huepi.js';
huepi.http = axios.create();
import { HUEPI_MOCK } from './huepi.mock'
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

@Injectable()
export class HuepiService {
  public MyHue;

  private groups: BehaviorSubject<Array<any>> = new BehaviorSubject(Array([]));
  private lights: BehaviorSubject<Array<any>> = new BehaviorSubject(Array([]));
  private rules: BehaviorSubject<Array<any>> = new BehaviorSubject(Array([]));
  private scenes: BehaviorSubject<Array<any>> = new BehaviorSubject(Array([]));
  private schedules: BehaviorSubject<Array<any>> = new BehaviorSubject(Array([]));
  private sensors: BehaviorSubject<Array<any>> = new BehaviorSubject(Array([]));

  constructor() {
window["MyHue"] = // DEBUGCODE
    this.MyHue = new huepi();

    this.MyHue['Groups'] = HUEPI_MOCK['groups'];
    this.MyHue['Lights'] = HUEPI_MOCK['lights'];
    this.update();

    this.MyHue.PortalDiscoverLocalBridges().then(() => {
      this.MyHue.BridgeGetConfig().then(() => {
        this.MyHue.BridgeGetData().then(() => {
          console.log('Bridge Found, Data Received');
          this.update();
        });
      });
    });

    setInterval(() => {
      this.MyHue.BridgeGetData().then(() => {
        this.update();
      });
    }, 1500);
  }

  private asArray(input): Array<any> {
    const output = [];
    if (input) {
      Object.keys(input).forEach((key) => {
        input[key].__key = key;
        output.push(input[key]);
      })
    }
    return output;
  }

  update () {
    this.groups.next(this.asArray(this.MyHue.Groups));
    this.lights.next(this.asArray(this.MyHue.Lights));
    this.rules.next(this.asArray(this.MyHue.Rules));
    this.scenes.next(this.asArray(this.MyHue.Scenes));
    this.schedules.next(this.asArray(this.MyHue.Schedules));
    this.sensors.next(this.asArray(this.MyHue.Sensors));
  }

  getGroups(): Observable<Array<any>> {
    return this.groups;
  }

  getLights(): Observable<Array<any>> {
    return this.lights;
  }

  getRules(): Observable<Array<any>> {
    return this.rules;
  }

  getScenes(): Observable<Array<any>> {
    return this.scenes;
  }

  getSchedules(): Observable<Array<any>> {
    return this.schedules;
  }

  getSensors(): Observable<Array<any>> {
    return this.sensors;
  }
}
