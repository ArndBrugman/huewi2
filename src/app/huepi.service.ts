import { Injectable, OnInit, OnDestroy } from '@angular/core';
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
export class HuepiService implements OnInit, OnDestroy {
  private heartbeat;
  public MyHue;
  private status: BehaviorSubject<String> = new BehaviorSubject('Connecting');
  private statusSubscription;
  private message: BehaviorSubject<String> = new BehaviorSubject('');

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
  }

  ngOnInit() {
    this.statusSubscription = Observable.of(this.status).subscribe(value => {
      console.log('Satus Changed: ', value);
    });
  }

  ngOnDestroy() {
    this.statusSubscription.unsubscribe();
  }

  startup() {
    this.resume();
  }

  pause() {
    this.stopHeartbeat();
  }

  resume() {
    this.MyHue.PortalDiscoverLocalBridges(); // Parallel PortalDiscoverLocalBridges
    this.connect();
  }

  // Entry Point for Starting a Connection
  connect(NewBridgeAddress?) {
    this.stopHeartbeat();
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
    this.stopHeartbeat();
    this.status.next('Getting Bridge Config');
    this.MyHue.BridgeGetConfig().then(() => {
      this.status.next('Bridge Config Received, Getting Data');
      this.resumeConnection();
    }, () => {
      this.status.next('Unable to Retreive Bridge Configuration');
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
      this.status.next('Connected');
      this.startHeartbeat();
    }, () => {
      this.message.next('Please press Connectbutton on the hue Bridge');
      this.MyHue.BridgeCreateUser(/*AppComponent.name*/'huewi2').then(() => {
        localStorage.MyHueBridgeIP = this.MyHue.BridgeIP; // Cache BridgeIP
        this.startHeartbeat();
      }, () => {
        this.status.next('Unable to Whitelist, Please press Connectbutton on the hue Bridge');
      });
    });
  }

  discover() {
    this.stopHeartbeat();
    this.status.next('Discovering Bridge via Portal');
    this.MyHue.PortalDiscoverLocalBridges().then(() => {
      this.status.next('Bridge Discovered');
      this.reConnect();
    }, () => { // else
      this.status.next('Unable to Discover Bridge via Portal');
    } );
  }

  scan() {
    this.stopHeartbeat();
    this.status.next('Scanning Network for Bridge');
    this.MyHue.NetworkDiscoverLocalBridges().then(() => {
      this.status.next('Bridge Found');
      this.reConnect();
    }, () => { // else
      this.status.next('Unable to Locate Bridge with Network Scan');
    });
  }

  startHeartbeat() {
    this.heartbeat = setInterval(() => {
      this.onHeartbeat()
    }, 2500);
  }

  stopHeartbeat() {
    clearInterval(this.heartbeat);
    this.heartbeat = -1;
  }

  onHeartbeat() {
    this.MyHue.BridgeGetData().then(() => {
      this.MyHue.GroupsGetZero().then(() => {
        this.dataReceived();
      }, () => { // else
        this.dataReceived();
      });
    }, () => {
      this.stopHeartbeat();
      this.status.next('Unable to Receive Bridge Data');
    } );
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

  dataReceived() {
    this.bridges.next(this.asArray(this.MyHue.LocalBridges));
    this.groups.next(this.asArray(this.MyHue.Groups));
    this.lights.next(this.asArray(this.MyHue.Lights));
    this.rules.next(this.asArray(this.MyHue.Rules));
    this.scenes.next(this.asArray(this.MyHue.Scenes));
    this.schedules.next(this.asArray(this.MyHue.Schedules));
    this.sensors.next(this.asArray(this.MyHue.Sensors));
  }

  getStatus() {
    return this.status.getValue();
  }

  getMessage() {
    return this.message.getValue();
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
