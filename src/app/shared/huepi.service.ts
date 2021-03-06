import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import axios from 'axios';
import { Huepi, HuepiLightstate } from './../../../../huepi/huepi.js';

import { HUEPI_MOCK } from './huepi.mock'
import { BehaviorSubject, Subscription } from 'rxjs';

@Injectable()
export class HuepiService implements OnInit, OnDestroy {
  private heartbeat;
  public MyHue;
  private status: BehaviorSubject<String> = new BehaviorSubject('Connecting');
  private statusSubscription: Subscription;
  private message: BehaviorSubject<String> = new BehaviorSubject('');

  private bridges: BehaviorSubject<Array<any>> = new BehaviorSubject(Array([]));
  private whitelist: BehaviorSubject<Array<any>> = new BehaviorSubject(Array([]));
  private groups: BehaviorSubject<Array<any>> = new BehaviorSubject(Array([]));
  private lights: BehaviorSubject<Array<any>> = new BehaviorSubject(Array([]));
  private rules: BehaviorSubject<Array<any>> = new BehaviorSubject(Array([]));
  private scenes: BehaviorSubject<Array<any>> = new BehaviorSubject(Array([]));
  private schedules: BehaviorSubject<Array<any>> = new BehaviorSubject(Array([]));
  private sensors: BehaviorSubject<Array<any>> = new BehaviorSubject(Array([]));

  constructor(private router: Router) {
    Huepi.http = axios.create();
window["MyHue"] = // DEBUGCODE
    this.MyHue = new Huepi();

    this.MyHue['Groups'] = HUEPI_MOCK['groups'];
    this.MyHue['Lights'] = HUEPI_MOCK['lights'];
    this.MyHue['Schedules'] = HUEPI_MOCK['schedules'];
    this.MyHue['BridgeConfig'] = HUEPI_MOCK['config'];
    this.dataReceived(); // Show Mockdata

    this.startup();

    this.statusSubscription = this.status.subscribe(value => {
      this.statusChanged();
    });
  }

  ngOnInit() {
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

  statusChanged() {
    if (this.status.value.search('Unable') >= 0) {
      setTimeout(() => { this.connect() }, 1250)
    }
  }

  // Entry Point for Starting a Connection
  connect(NewBridgeAddress?) {
    this.cancelScan();
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
    }).catch(() => {
      this.status.next('Unable to Retreive Bridge Configuration');
      delete localStorage.MyHueBridgeIP; // un-Cache BridgeIP
    });
  }

  // IP,ID & Username is known and stored in this.MyHue.IP,ID & Username
  resumeConnection() {
    this.MyHue.BridgeGetData().then(() => {
      localStorage.MyHueBridgeIP = this.MyHue.BridgeIP; // Cache BridgeIP
      this.MyHue.GroupsGetZero().then(() => {
        this.dataReceived();
      });
      this.status.next('Bridge Connected');
      setTimeout(() => this.status.next('Connected'), 500);
      this.startHeartbeat();
    }).catch(() => {
      this.message.next('Please press Connectbutton on the hue Bridge');
      this.MyHue.BridgeCreateUser('huewi2').then(() => {
        localStorage.MyHueBridgeIP = this.MyHue.BridgeIP; // Cache BridgeIP
        this.status.next('Whitelisting Succeded');
        setTimeout(() => this.status.next('Connected'), 500);
        this.startHeartbeat();
      }).catch(() => {
        this.status.next('Unable to Whitelist');
      });
    });
  }

  discover() {
    this.cancelScan();
    this.stopHeartbeat();
    this.status.next('Discovering Bridge via Portal');
    this.MyHue.PortalDiscoverLocalBridges().then(() => {
      this.status.next('Bridge Discovered');
      this.reConnect();
    }).catch(() => {
      this.status.next('No Bridge discovered via Portal');
    });
  }

  scan() {
    this.stopHeartbeat();
    this.status.next('Scanning Network for Bridge');
    this.MyHue.ScanningNetwork = true;
    this.MyHue.NetworkDiscoverLocalBridges().then(() => {
      this.status.next('Bridge Found');
      this.reConnect();
    }).catch(() => {
      this.status.next('Unable to Locate Bridge with Network Scan');
    });
    this.updateScanProgress();
  }

  private updateScanProgress() {
    this.status.next('Scanning Network for Bridge: ' + this.MyHue.ScanProgress + '% Progress');
    setTimeout(() => {
      if (this.isScanning()) {
        this.updateScanProgress();
      }
    }, 450);
  }

  isScanning() {
    return this.MyHue.ScanningNetwork;
  }

  cancelScan() {
    this.MyHue.ScanningNetwork = false;
  }

  startHeartbeat() {
    this.heartbeat = setInterval(() => { this.onHeartbeat() }, 2500);
  }

  stopHeartbeat() {
    clearInterval(this.heartbeat);
    this.heartbeat = -1;
  }

  onHeartbeat() {
    this.MyHue.BridgeGetData().then(() => {
      this.MyHue.GroupsGetZero().then(() => {
        this.dataReceived();
      });
    }).catch(() => {
      this.stopHeartbeat();
      this.status.next('Unable to Receive Bridge Data');
    });
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
    if (this.MyHue.Groups[0]) {
      this.MyHue.Groups[0].name = 'All available Lights';
    }
    this.bridges.next(this.asArray(this.MyHue.LocalBridges));
    this.whitelist.next(this.asArray(this.MyHue.BridgeConfig.whitelist));
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

  getWhitelist() {
    return this.whitelist;
  }

  getBridges() {
    return this.bridges;
  }

  getGroups() {
    return this.groups;
  }

  getLights() {
    return this.lights;
  }

  getRules() {
    return this.rules;
  }

  getScenes() {
    return this.scenes;
  }

  getSchedules() {
    return this.schedules;
  }

  getSensors() {
    return this.sensors;
  }

}
