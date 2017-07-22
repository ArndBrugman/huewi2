import { Injectable } from '@angular/core';
import { IntervalObservable } from 'rxjs/observable/IntervalObservable';
import { TimerObservable } from "rxjs/observable/TimerObservable";

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
  private heartbeat;
  public MyHue;
  public status = 'Connecting';
  public message = '';

  private bridges: BehaviorSubject<Array<any>> = new BehaviorSubject(Array([]));
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
    this.dataReceived();

    this.startup();

    /*
    this.MyHue.PortalDiscoverLocalBridges().then(() => {
      this.MyHue.BridgeGetConfig().then(() => {
        console.log('Bridge Found');
        this.MyHue.BridgeGetData().then(() => {
          console.log('Data Received');
          this.MyHue.GroupsGetZero().then(() => {
            console.log('Got Group Zero');
            this.dataReceived();
          });
        });
      });
    });

    setInterval(() => {
      this.MyHue.BridgeGetData().then(() => {
        this.MyHue.GroupsGetZero().then(() => {
          this.dataReceived();
        });
      });
    }, 1500); */
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

  startup() {
    this.resume();
  }

  pause() {
    clearInterval(this.heartbeat);
    this.heartbeat = -1;
  }

  resume() {
    this.MyHue.PortalDiscoverLocalBridges(); // Parallel PortalDiscoverLocalBridges
    this.connect();
  }

  // Entry Point for Starting a Connection
  connect(NewBridgeAddress?) {
    clearInterval(this.heartbeat);
    this.heartbeat = -1;
    this.MyHue.BridgeIP = NewBridgeAddress || this.MyHue.BridgeIP || localStorage.MyHueBridgeIP || '';
    this.MyHue.BridgeID = '';
    this.MyHue.BridgeName = '';
    this.MyHue.Username = '';
    if (this.MyHue.BridgeIP !== '') {
      this.reConnect();
    } else {
      this.discover();
    }
  }

  // IP is known and stored in this.MyHue.BridgeIP
  reConnect() {
    clearInterval(this.heartbeat);
    this.heartbeat = -1;
    this.status = 'Getting Bridge Config';
    this.MyHue.BridgeGetConfig().then(() => {
      this.status = 'Bridge Config Received, Getting Data';
      this.resumeConnection();
    }, () => {
      this.status = 'Unable to Retreive Bridge Configuration';
      delete localStorage.MyHueBridgeIP; // un-Cache BridgeIP
    } );
  }

  // IP,ID & Username is known and stored in this.MyHue.IP,ID & Username
  resumeConnection() {
    this.MyHue.BridgeGetData().then(() => {
      localStorage.MyHueBridgeIP = this.MyHue.BridgeIP; // Cache BridgeIP
      this.MyHue.GroupsGetZero().then(() => {
        this.dataReceived();
      }, () => { // else
        this.dataReceived();
      });
      this.status = 'Connected';
      this.heartbeat = setInterval(() => { this.onHeartbeat() }, 2500);
    }, () => {
      this.status = 'Please press connect button on the hue Bridge';
      this.MyHue.BridgeCreateUser(/*AppComponent.name*/'huewi2').then(() => {
        localStorage.MyHueBridgeIP = this.MyHue.BridgeIP; // Cache BridgeIP
        this.heartbeat = setInterval(() => { this.onHeartbeat() }, 2500);
      }, () => {
        this.status = 'Unable to Whitelist, Please press connect button on the hue Bridge';
      });
    });
  }

  discover() {
    clearInterval(this.heartbeat);
    this.heartbeat = -1;
    this.status = 'Discovering Bridge via Portal';
    this.MyHue.PortalDiscoverLocalBridges().then(() => {
      this.status = 'Bridge Discovered';
      this.reConnect();
    }, () => { // else
      this.status = 'Unable to discover Bridge via Portal';
    } );
  }

  scan() {
    clearInterval(this.heartbeat);
    this.heartbeat = -1;
    this.status = 'Scanning Network for Bridge';
    this.MyHue.NetworkDiscoverLocalBridges().then(() => {
      this.status = 'Bridge Found';
      this.reConnect();
    }, () => { // else
      this.status = 'Unable to locate Bridge with Network Scan';
    });
  }

  onHeartbeat() {
    this.MyHue.BridgeGetData().then(() => {
      this.MyHue.GroupsGetZero().then(() => {
        this.dataReceived();
      }, () => { // else
        this.dataReceived();
      });
    }, () => {
      clearInterval(this.heartbeat);
      this.heartbeat = -1;
      this.status = 'Unable to receive Bridge Data';
    } );
  }

  dataReceived() {
    if (this.MyHue.BridgeConfig.bridgeid) {
      this.MyHue.BridgeConfig.bridgeid = this.MyHue.BridgeConfig.bridgeid.toLowerCase();
    }
    this.bridges.next(this.asArray(this.MyHue.LocalBridges));
    this.groups.next(this.asArray(this.MyHue.Groups));
    this.lights.next(this.asArray(this.MyHue.Lights));
    this.rules.next(this.asArray(this.MyHue.Rules));
    this.scenes.next(this.asArray(this.MyHue.Scenes));
    this.schedules.next(this.asArray(this.MyHue.Schedules));
    this.sensors.next(this.asArray(this.MyHue.Sensors));
  }

  getBridges(): Observable<Array<any>> {
    return this.bridges;
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
