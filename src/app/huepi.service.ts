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

    setInterval(() => {
      this.MyHue.BridgeGetData().then(() => {
        console.log('New Data Received');
        this.update();
      });
    }, 2500);
  }

  update () {
    let groups = [];
    if (this.MyHue.Groups) {
      Object.keys(this.MyHue.Groups).forEach((key) => {
        this.MyHue.Groups[key].__key = key;
        groups.push(this.MyHue.Groups[key]);
      })
    }
    this.groups.next(groups);
 
    let lights = [];
    if (this.MyHue.Lights) {
      Object.keys(this.MyHue.Lights).forEach((key) => {
        this.MyHue.Lights[key].__key = key;
        lights.push(this.MyHue.Lights[key]);
      })
    }
    this.lights.next(lights);
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
