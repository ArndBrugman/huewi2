(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["main"],{

/***/ "../huepi/huepi.js":
/*!*************************!*\
  !*** ../huepi/huepi.js ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// //////////////////////////////////////////////////////////////////////////////
//
// hue (Philips Wireless Lighting) Api interface for JavaScript
//  +-> HUEPI sounds like Joepie which makes me smile during development...
//
// Requires axios for http calls and uses regular modern Promisses
//
// //////////////////////////////////////////////////////////////////////////////

(function(exports){

  'use strict';

/**
 * HuepiLightstate Object.
 * Internal object to recieve all settings that are about to be send to the Bridge as a string.
 *
 * @class
 * @alias HuepiLightstate
 */
class HuepiLightstate {
  constructor(State) {
    if (State) {
      this.Merge(State)
    }
  }
  /**
  SetOn(On) {
    this.on = On;
    return this;
  } */
  /** */
  On() {
    this.on = true;
    return this;
  }
  /** */
  Off() {
    this.on = false;
    return this;
  }
  /*
   * @param {number} Hue Range [0..65535]
   * @param {float} Saturation Range [0..255]
   * @param {float} Brightness Range [0..255]
   */
  SetHSB(Hue, Saturation, Brightness) { // Range 65535, 255, 255
    this.hue = Math.round(Hue);
    this.sat = Math.round(Saturation);
    this.bri = Math.round(Brightness);
    return this;
  }
  /**
   * @param {number} Hue Range [0..65535]
   */
  SetHue(Hue) {
    this.hue = Math.round(Hue);
    return this;
  }
  /**
   * @param {float} Saturation Range [0..255]
   */
  SetSaturation(Saturation) {
    this.sat = Math.round(Saturation);
    return this;
  }
  /**
   * @param {float} Brightness Range [0..255]
   */
  SetBrightness(Brightness) {
    this.bri = Math.round(Brightness);
    return this;
  }
  /**
   * @param {float} Ang Range [0..360]
   * @param {float} Sat Range [0..1]
   * @param {float} Bri Range [0..1]
   */
  SetHueAngSatBri(Ang, Sat, Bri) {
    // In: Hue in Deg, Saturation, Brightness 0.0-1.0 Transform To Philips Hue Range...
    while (Ang < 0) {
      Ang = Ang + 360;
    }
    Ang = Ang % 360;
    return this.SetHSB(Math.round(Ang / 360 * 65535), Math.round(Sat * 255), Math.round(Bri * 255));
  }
  /**
   * @param {number} Red Range [0..1]
   * @param {number} Green Range [0..1]
   * @param {number} Blue Range [0..1]
   */
  SetRGB(Red, Green, Blue) {
    var HueAngSatBri;

    HueAngSatBri = Huepi.HelperRGBtoHueAngSatBri(Red, Green, Blue);
    return this.SetHueAngSatBri(HueAngSatBri.Ang, HueAngSatBri.Sat, HueAngSatBri.Bri);
  }
  /**
   * @param {number} Ct Micro Reciprocal Degree of Colortemperature (Ct = 10^6 / Colortemperature)
   */
  SetCT(Ct) {
    this.ct = Math.round(Ct);
    return this;
  }
  /**
   * @param {number} Colortemperature Range [2200..6500] for the 2012 lights
   */
  SetColortemperature(Colortemperature) {
    return this.SetCT(Huepi.HelperColortemperaturetoCT(Colortemperature));
  }
  /**
   * @param {float} X
   * @param {float} Y
   */
  SetXY(X, Y) {
    this.xy = [X, Y];
    return this;
  }
  /**
  SetAlert(Alert) {
    this.alert = Alert;
    return this;
  } */
  /** */
  AlertSelect() {
    this.alert = 'select';
    return this;
  }
  /** */
  AlertLSelect() {
    this.alert = 'lselect';
    return this;
  }
  /** */
  AlertNone() {
    this.alert = 'none';
    return this;
  }
  /**
  SetEffect(Effect) {
    this.effect = Effect;
    return this;
  }; */
  /** */
  EffectColorloop() {
    this.effect = 'colorloop';
    return this;
  }
  /** */
  EffectNone() {
    this.effect = 'none';
    return this;
  }
  /**
   * @param {number} Transitiontime Optional Transitiontime in multiple of 100ms
   *  defaults to 4 (on bridge, meaning 400 ms)
   */
  SetTransitiontime(Transitiontime) {
    if (typeof Transitiontime !== 'undefined') { // Optional Parameter
      this.transitiontime = Transitiontime;
    }
    return this;
  }
  /**
   * @returns {string} Stringified version of the content of LightState ready to be sent to the Bridge.
   */
  Get() {
    return JSON.stringify(this);
  }
  /**
   * @param {HuepiLightstate} NewState to Merge into this
   */
  Merge(NewState) {
    for (let key in NewState) {
      this[key] = NewState[key];
    }
    return this;
  }
}

/**
 * huepi Object, Entry point for all interaction with Lights etc via the Bridge.
 *
 * @class
 * @alias Huepi
 */
class Huepi {
  constructor() {
    /** @member {string} - version of the huepi interface */
    this.version = '1.5.0';

    /** @member {array} - Array of all Bridges on the local network */
    this.LocalBridges = [];

    /** @member {bool} - get: local network scan in progress / set:proceed with scan */
    this.ScanningNetwork = false;
    /** @member {number} - local network scan progress in % */
    this.ScanProgress = 0;

    /** @member {string} - IP address of the Current(active) Bridge */
    this.BridgeIP = '';
    /** @member {string} - ID (Unique, is MAC address) of the Current(active) Bridge */
    this.BridgeID = '';
    /** @member {string} - Username for Whitelisting, generated by the Bridge */
    this.Username = '';

    /** @member {object} - Cache Hashmap of huepi BridgeID and Whitelisted Username */
    this.BridgeCache = {};
    /** @member {boolean} - Autosave Cache Hasmap of huepi BridgeID and Whitelisted Username */
    this.BridgeCacheAutosave = true;
    this._BridgeCacheLoad(); // Load BridgeCache on creation by Default

    /** @member {object} - Configuration of the Current(active) Bridge */
    this.BridgeConfig = {};
    /** @member {string} - Name of the Current(active) Bridge */
    this.BridgeName = '';

    /** @member {array} - Array of all Lights of the Current(active) Bridge */
    this.Lights = [];
    /** @member {array} - Array of all LightIds of the Current(active) Bridge */
    this.LightIds = [];

    /** @member {array} - Array of all Groups of the Current(active) Bridge */
    this.Groups = [];
    /** @member {array} - Array of all GroupIds of the Current(active) Bridge */
    this.GroupIds = [];

    // To Do: Add Schedules, Scenes, Sensors & Rules manupulation functions, they are read only for now
    /** @member {array} - Array of all Schedules of the Current(active) Bridge,
     * NOTE: There are no Setter functions yet */
    this.Schedules = [];
    /** @member {array} - Array of all Scenes of the Current(active) Bridge,
     * NOTE: There are no Setter functions yet */
    this.Scenes = [];
    /** @member {array} - Array of all Sensors of the Current(active) Bridge,
     * NOTE: There are no Setter functions yet */
    this.Sensors = [];
    /** @member {array} - Array of all Rules of the Current(active) Bridge,
     * NOTE: There are no Setter functions yet */
    this.Rules = [];
  }

  // //////////////////////////////////////////////////////////////////////////////
  //
  // Private _BridgeCache Functions, Internally Used
  //
  //

  /**
   * Loads the BridgeCache, typically on startup
   */
  _BridgeCacheLoad() {
    this.BridgeCache = {};
    try {
      if (typeof window !== 'undefined') {
        let huepiBridgeCache = localStorage.huepiBridgeCache || '{}';

        this.BridgeCache = JSON.parse(huepiBridgeCache); // Load
      } else if (typeof module !== 'undefined' && module.exports) {
        let fs = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'fs'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
        let buffer = fs.readFileSync('huepiBridgeCache.json');

        this.BridgeCache = JSON.parse(buffer.toString());
      }
      // console.log('_BridgeCacheLoad()-ed : \n '+ JSON.stringify(this.BridgeCache));
    } catch (error) {
      // console.log('Unable to _BridgeCacheLoad() ' + error);
    }
  }

  _BridgeCacheAddCurrent() {
    // console.log('_BridgeCacheAddCurrent ' + this.BridgeID + ' ' + this.Username);
    this.BridgeCache[this.BridgeID] = this.Username;
    if (this.BridgeCacheAutosave) {
      this._BridgeCacheSave();
    }
  }

  _BridgeCacheRemoveCurrent() {
    if (this.BridgeCache[this.BridgeID] === this.Username) {
      // console.log('_BridgeCacheRemoveCurrent ' + this.BridgeID + ' ' + this.Username);
      delete this.BridgeCache[this.BridgeID];
      if (this.BridgeCacheAutosave) {
        this._BridgeCacheSave();
      }
    }
  }

  /**
   * Selects the first Bridge from LocalBridges found in BridgeCache and stores in BridgeIP
   *  defaults to 1st Bridge in LocalBridges if no bridge from LocalBridges is found in BridgeCache
   *
   * Internally called in PortalDiscoverLocalBridges and NetworkDiscoverLocalBridges
   */
  _BridgeCacheSelectFromLocalBridges() {
    if (this.LocalBridges.length > 0) { // Local Bridges are found
      this.BridgeIP = this.LocalBridges[0].internalipaddress || ''; // Default to 1st Bridge Found
      this.BridgeID = this.LocalBridges[0].id.toLowerCase() || '';
      if (!this.BridgeCache[this.BridgeID]) { // if this.BridgeID not found in BridgeCache
        for (let BridgeNr = 1; BridgeNr < this.LocalBridges.length; BridgeNr++) { // Search and store Found
          this.BridgeID = this.LocalBridges[BridgeNr].id.toLowerCase();
          if (this.BridgeCache[this.BridgeID]) {
            this.BridgeIP = this.LocalBridges[BridgeNr].internalipaddress;
            break;
          } else {
            this.BridgeID = '';
          }
        }
      }
    }
    this.Username = this.BridgeCache[this.BridgeID] || '';
  }

  /**
   * Saves the BridgeCache, typically on Whitelist new Device or Device no longer whitelisted
   *   as is the case with with @BridgeCacheAutosave on @_BridgeCacheAddCurrent and @_BridgeCacheRemoveCurrent
   * NOTE: Saving this cache might be considered a security issue
   * To counter this security issue, arrange your own load/save code with proper encryption
   */
  _BridgeCacheSave() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.huepiBridgeCache = JSON.stringify(this.BridgeCache); // Save
      } else if (typeof module !== 'undefined' && module.exports) {
        let fs = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'fs'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));

        fs.writeFileSync('huepiBridgeCache.json', JSON.stringify(this.BridgeCache));
      }
      // console.log('_BridgeCacheSave()-ed  : \n '+ JSON.stringify(this.BridgeCache));
    } catch (error) {
      // console.log('Unable to _BridgeCacheSave() ' + error);
    }
  }

  // //////////////////////////////////////////////////////////////////////////////
  //
  // Network Functions
  //
  //

  /**
   *
   */
  _NetworkDiscoverLocalIPs() { // resolves LocalIPs[]
    let LocalIPs = [];
    let RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    let PeerConnection = new RTCPeerConnection({ iceServers: [] });

    PeerConnection.createDataChannel('');

    return new Promise((resolve) => {
      PeerConnection.onicecandidate = (e) => {
        if (!e.candidate) {
          PeerConnection.close();
          return resolve(LocalIPs);
        }
        let LocalIP = /^candidate:.+ (\S+) \d+ typ/.exec(e.candidate.candidate)[1];

        if (LocalIPs.indexOf(LocalIP) === -1) {
          LocalIPs.push(LocalIP);
        }
        return LocalIPs;
      };
      PeerConnection.createOffer((sdp) => {
        PeerConnection.setLocalDescription(sdp);
      }, () => { });
    });
  }

  /**
   *
   */
  _NetworkCheckLocalIP(InitialIP, Offset, Parallel, OnResolve) { 
    this.BridgeGetConfig(InitialIP + Offset, 1000).then((data) => {
      let Bridge = data;

      Bridge.internalipaddress = InitialIP + Offset;
      Bridge.id = data.bridgeid.toLowerCase();
      this.LocalBridges.push(Bridge);
    }).catch((error) => {
    }).then(() => { // then().catch().then() is similar to .done(), .always() or .finally()
      this.ScanProgress = Math.round(100*Offset/255);
      if (this.ScanningNetwork === false) {
        Offset = 256; // Stop scanning if (this.ScanningNetwork = false)
      } else {
        Offset += Parallel;
      }
      if (Offset < 256) {
        this._NetworkCheckLocalIP(InitialIP, Offset, Parallel, OnResolve);
      } else {
        this.ScanningNetwork = false;
        OnResolve();
      }
    });
  }

  /**
   *
   */
  _NetworkDiscoverLocalBridges(LocalIPs) {
    let Parallel = 16;
    let Promisses = [];

    this.ScanProgress = 0;
    for (let IPs = 0; IPs < LocalIPs.length; IPs++) {
      let InitialIP = LocalIPs[IPs].slice(0, LocalIPs[IPs].lastIndexOf('.') + 1);

      for (let Offset = 1; Offset <= Parallel; Offset++) {
        Promisses.push( new Promise((resolve, reject) => {
          this._NetworkCheckLocalIP(InitialIP, Offset, Parallel, resolve);
        }) );
      }
    }
    return Promise.all(Promisses);
  }

  /**
   * Creates the list of hue-Bridges on the local network
   */
  NetworkDiscoverLocalBridges() {
    this.ScanningNetwork = true;
    this.BridgeIP =
      this.BridgeID =
      this.BridgeName =
      this.Username = '';
    this.LocalBridges = [];

    return new Promise((resolve, reject) => {
      this._NetworkDiscoverLocalIPs().then((LocalIPs) => {
        this._NetworkDiscoverLocalBridges(LocalIPs).then(() => {
          if (this.LocalBridges.length > 0) {
            this._BridgeCacheSelectFromLocalBridges();
            resolve();
          } else {
            reject();
          }
        });
      });
    });
  }

  // //////////////////////////////////////////////////////////////////////////////
  //
  // Portal Functions
  //
  //

  /**
   * Retreives the list of hue-Bridges on the local network from the hue Portal
   */
  PortalDiscoverLocalBridges() {
    this.BridgeIP =
      this.BridgeID =
      this.BridgeName =
      this.Username = '';
    this.LocalBridges = [];
    return new Promise((resolve, reject) => {
      Huepi.http.get('https://www.meethue.com/api/nupnp').then((response) => {
        return response.data;
      }).then((data) => {
        if (data.length > 0) {
          if (data[0].internalipaddress) { // Bridge(s) Discovered
            this.LocalBridges = data;
            this._BridgeCacheSelectFromLocalBridges();
            resolve(data);
          } else {
            reject('No Bridges found via Portal');
          }
        } else {
          reject(data);
        }
      }).catch(function (message) { // fetch failed
        reject(message);
      });
    });
  }

  // //////////////////////////////////////////////////////////////////////////////
  //
  //  Bridge Functions
  //
  //

  /**
   * Function to retreive BridgeConfig before Checking Whitelisting.
   * ONCE call BridgeGetConfig Before BridgeGetData to validate we are talking to a hue Bridge
   * available members (as of 'apiversion': '1.11.0'):
   *   name, apiversion, swversion, mac, bridgeid, replacesbridgeid, factorynew, modelid
   *
   * @param {string} ConfigBridgeIP - Optional BridgeIP to GetConfig from, otherwise uses BridgeIP (this).
   * @param {string} ConfigTimeOut - Optional TimeOut for network request, otherwise uses 60 seconds.
   */
  BridgeGetConfig(ConfigBridgeIP, ConfigTimeOut) { // GET /api/config -> data.config.whitelist.username
    ConfigBridgeIP = ConfigBridgeIP || this.BridgeIP;
    ConfigTimeOut = ConfigTimeOut || 1000;

    return new Promise((resolve, reject) => {
      Huepi.http.get('http://' + ConfigBridgeIP + '/api/config/', { timeout: ConfigTimeOut, contentType: 'application/json' }).then((response) => {
        return response.data;
      }).then((data) => {
        if (data.bridgeid) {
          if (this.BridgeIP === ConfigBridgeIP) {
            this.BridgeConfig = data;
            if (this.BridgeConfig.bridgeid) { // SteveyO/Hue-Emulator doesn't supply bridgeid as of yet.
              this.BridgeID = this.BridgeConfig.bridgeid.toLowerCase();
            } else {
              this.BridgeID = '';
            }
            this.BridgeName = this.BridgeConfig.name;
            this.Username = this.BridgeCache[this.BridgeID];
            if (typeof this.Username === 'undefined') {
              this.Username = '';
            }
          }
          resolve(data);
        } else { // this BridgeIP is not a hue Bridge
          reject('this BridgeIP is not a hue Bridge');
        }
      }).catch(function (message) { // fetch failed
        reject(message);
      });
    });
  }

  /**
   * Function to retreive BridgeDescription before Checking Whitelisting.
   * ONCE call BridgeGetDescription Before BridgeGetData to validate we are talking to a hue Bridge
   *
   * REMARK: Needs a fix of the hue bridge to allow CORS on xml endpoint too,
   *  just like on json endpoints already is implemented.
   *
   * @param {string} ConfigBridgeIP - Optional BridgeIP to GetConfig from, otherwise uses BridgeIP (this).
   * @param {string} ConfigTimeOut - Optional TimeOut for network request, otherwise uses 60 seconds.
   */
  BridgeGetDescription(ConfigBridgeIP, ConfigTimeOut) { // GET /description.xml -> /device/serialNumber
    ConfigBridgeIP = ConfigBridgeIP || this.BridgeIP;
    ConfigTimeOut = ConfigTimeOut || 1000;

    return new Promise((resolve, reject) => {
      Huepi.http.get('http://' + ConfigBridgeIP + '/description.xml', { timeout: ConfigTimeOut }).then((response) => {
        return response.data;
      }).then((data) => {
        if (data.indexOf('hue_logo_0.png') > 0) {
          if (data.indexOf('<serialNumber>') > 0) {
            this.BridgeID = data.substr(14 + data.indexOf('<serialNumber>'),
             data.indexOf('</serialNumber>') - data.indexOf('<serialNumber>') - 14).toLowerCase();
          }
          if (data.indexOf('<friendlyName>') > 0) {
            this.BridgeName = data.substr(14 + data.indexOf('<friendlyName>'),
             data.indexOf('</friendlyName>') - data.indexOf('<friendlyName>') - 14);
          }
          this.Username = this.BridgeCache[this.BridgeID];
          if (typeof this.Username === 'undefined') {
            // Correct 001788[....]200xxx -> 001788FFFE200XXX short and long serialnumer difference
            this.BridgeID = this.BridgeID.slice(0, 6) + 'fffe' + this.BridgeID.slice(6, 12);
            this.Username = this.BridgeCache[this.BridgeID];
            if (typeof this.Username === 'undefined') {
              this.Username = '';
            }
          }
          resolve(data);
        } else { // this BridgeIP is not a hue Bridge
          reject('this BridgeIP is not a hue Bridge');
        }
      }).catch(function (message) { // fetch failed
        reject(message);
      });
    });
  }

  /**
   * Update function to retreive Bridge data and store it in this object.
   * Consider this the main 'Get' function.
   * Typically used for Heartbeat or manual updates of local data.
   */
  BridgeGetData() { // GET /api/username -> data.config.whitelist.username
    return new Promise((resolve, reject) => {
      if (this.Username === '') {
        reject('Username must be set before calling BridgeGetData');
      } else {
        Huepi.http.get('http://' + this.BridgeIP + '/api/' + this.Username).then((response) => {
          return response.data;
        }).then((data) => {
          if (typeof data.config !== 'undefined') { // if able to read Config, Username must be Whitelisted
            this.BridgeConfig = data.config;
            if (this.BridgeConfig.bridgeid) { // SteveyO/Hue-Emulator doesn't supply bridgeid as of yet.
              this.BridgeID = this.BridgeConfig.bridgeid.toLowerCase();
            } else {
              this.BridgeID = '';
            }
            this.BridgeName = this.BridgeConfig.name;
            this.Lights = data.lights;
            this.LightIds = [];
            for (let key in this.Lights) {
              this.LightIds.push(key);
            }
            this.Groups = data.groups;
            this.GroupIds = [];
            for (let key in this.Groups) {
              this.GroupIds.push(key);
            }
            this.Schedules = data.schedules;
            this.Scenes = data.scenes;
            this.Sensors = data.sensors;
            this.Rules = data.rules;
            this.BridgeName = this.BridgeConfig.name;
            resolve(data);
          } else { // Username is no longer whitelisted
            if (this.Username !== '') {
              this._BridgeCacheRemoveCurrent();
            }
            this.Username = '';
            reject('Username is no longer whitelisted');
          }
        }).catch(function (message) { // fetch failed
          reject(message);
        });
      }
    });
  }

  /**
   * Whitelists the Username stored in this object.
   * Note: a buttonpress on the bridge is requered max 30 sec before this to succeed.
   * please only use this once per device, Username is stored in cache.
   *
   * @param {string} DeviceName - Optional device name to Whitelist.
   */
  BridgeCreateUser(DeviceName) {
  // POST /api {'devicetype': 'AppName#DeviceName' }
    DeviceName = DeviceName || 'WebInterface';

    return new Promise((resolve, reject) => {
      Huepi.http.post('http://' + this.BridgeIP + '/api',
      {"devicetype": "huepi#' + DeviceName + '"}).then((response) => {
        return response.data;
      }).then((data) => {
        if ((data[0]) && (data[0].success)) {
          this.Username = data[0].success.username;
          this._BridgeCacheAddCurrent();
          resolve(data);
        } else {
          reject(data);
        }
      }).catch(function (message) { // fetch failed
        reject(message);
      });
    });
  }

  /**
   * @param {string} UsernameToDelete - Username that will be revoked from the Whitelist.
   * Note: Username stored in this object need to be Whitelisted to succeed.
   */
  BridgeDeleteUser(UsernameToDelete) {
  // DELETE /api/username/config/whitelist/username {'devicetype': 'iPhone', 'username': '1234567890'}
    return Huepi.http.delete('http://' + this.BridgeIP + '/api/' + this.Username + '/config/whitelist/' + UsernameToDelete);
  }

  // //////////////////////////////////////////////////////////////////////////////
  //
  //  Huepi.Helper Functions
  //
  //

  /**
   * @param {string} Model
   * @returns {boolean} Model is capable of CT
   */
  static HelperModelCapableCT(Model) { // CT Capable	LCT* LLM* LTW* LLC020 LST002
    let ModelType = Model.slice(0, 3);

    return ((ModelType === 'LCT') || (ModelType === 'LLM') || (ModelType === 'LTW') ||
    (Model === 'LLC020') || (Model === 'LST002'));
  }

  /**
  * @param {string} Model
  * @returns {boolean} Model is capable of XY
  */
  static HelperModelCapableXY(Model) { // XY Capable	LCT* LLC* LST* LLM001 LLC020 LST002
    let ModelType = Model.slice(0, 3);

    return ((ModelType === 'LCT') || (ModelType === 'LLC') || (ModelType === 'LST') ||
    (Model === 'LLM001') || (Model === 'LLC020') || (Model === 'LST002'));
  }

  /**
   * @param {float} Red - Range [0..1]
   * @param {float} Green - Range [0..1]
   * @param {float} Blue - Range [0..1]
   * @returns {object} [Ang, Sat, Bri] - Ranges [0..360] [0..1] [0..1]
   */
  static HelperRGBtoHueAngSatBri(Red, Green, Blue) {
    let Ang, Sat, Bri;
    let Min = Math.min(Red, Green, Blue);
    let Max = Math.max(Red, Green, Blue);

    if (Min !== Max) {
      if (Red === Max) {
        Ang = (0 + ((Green - Blue) / (Max - Min))) * 60;
      } else if (Green === Max) {
        Ang = (2 + ((Blue - Red) / (Max - Min))) * 60;
      } else {
        Ang = (4 + ((Red - Green) / (Max - Min))) * 60;
      }
      Sat = (Max - Min) / Max;
      Bri = Max;
    } else { // Max === Min
      Ang = 0;
      Sat = 0;
      Bri = Max;
    }
    return { Ang: Ang, Sat: Sat, Bri: Bri };
  }

  /**
   * @param {float} Ang - Range [0..360]
   * @param {float} Sat - Range [0..1]
   * @param {float} Bri - Range [0..1]
   * @returns {object} [Red, Green, Blue] - Ranges [0..1] [0..1] [0..1]
   */
  static HelperHueAngSatBritoRGB(Ang, Sat, Bri) { // Range 360, 1, 1, return .Red, .Green, .Blue
    let Red, Green, Blue;

    if (Sat === 0) {
      Red = Bri;
      Green = Bri;
      Blue = Bri;
    } else {
      let Sector = Math.floor(Ang / 60) % 6;
      let Fraction = (Ang / 60) - Sector;
      let p = Bri * (1 - Sat);
      let q = Bri * (1 - Sat * Fraction);
      let t = Bri * (1 - Sat * (1 - Fraction));

      switch (Sector) {
        case 0:
          Red = Bri;
          Green = t;
          Blue = p;
          break;
        case 1:
          Red = q;
          Green = Bri;
          Blue = p;
          break;
        case 2:
          Red = p;
          Green = Bri;
          Blue = t;
          break;
        case 3:
          Red = p;
          Green = q;
          Blue = Bri;
          break;
        case 4:
          Red = t;
          Green = p;
          Blue = Bri;
          break;
        default: // case 5:
          Red = Bri;
          Green = p;
          Blue = q;
          break;
      }
    }
    return { Red: Red, Green: Green, Blue: Blue };
  }

  /**
   * @param {float} Red - Range [0..1]
   * @param {float} Green - Range [0..1]
   * @param {float} Blue - Range [0..1]
   * @returns {number} Temperature ranges [2200..6500]
   */
  static HelperRGBtoColortemperature(Red, Green, Blue) {
  // Approximation from https://github.com/neilbartlett/color-temperature/blob/master/index.js
    let Temperature;
    let TestRGB;
    let Epsilon = 0.4;
    let MinTemperature = 2200;
    let MaxTemperature = 6500;

    while ((MaxTemperature - MinTemperature) > Epsilon) {
      Temperature = (MaxTemperature + MinTemperature) / 2;
      TestRGB = Huepi.HelperColortemperaturetoRGB(Temperature);
      if ((TestRGB.Blue / TestRGB.Red) >= (Blue / Red)) {
        MaxTemperature = Temperature;
      } else {
        MinTemperature = Temperature;
      }
    }
    return Math.round(Temperature);
  }

  /**
   * @param {number} Temperature ranges [1000..6600]
   * @returns {object} [Red, Green, Blue] ranges [0..1] [0..1] [0..1]
   */
  static HelperColortemperaturetoRGB(Temperature) {
  // http://www.tannerhelland.com/4435/convert-temperature-rgb-algorithm-code/
  // Update Available: https://github.com/neilbartlett/color-temperature/blob/master/index.js
    let Red, Green, Blue;

    Temperature = Temperature / 100;
    if (Temperature <= 66) {
      Red = /* 255; */ 165 + 90 * ((Temperature) / (66));
    } else {
      Red = Temperature - 60;
      Red = 329.698727466 * Math.pow(Red, -0.1332047592);
      if (Red < 0) {
        Red = 0;
      }
      if (Red > 255) {
        Red = 255;
      }
    }
    if (Temperature <= 66) {
      Green = Temperature;
      Green = 99.4708025861 * Math.log(Green) - 161.1195681661;
      if (Green < 0) {
        Green = 0;
      }
      if (Green > 255) {
        Green = 255;
      }
    } else {
      Green = Temperature - 60;
      Green = 288.1221695283 * Math.pow(Green, -0.0755148492);
      if (Green < 0) {
        Green = 0;
      }
      if (Green > 255) {
        Green = 255;
      }
    }
    if (Temperature >= 66) {
      Blue = 255;
    } else {
      if (Temperature <= 19) {
        Blue = 0;
      } else {
        Blue = Temperature - 10;
        Blue = 138.5177312231 * Math.log(Blue) - 305.0447927307;
        if (Blue < 0) {
          Blue = 0;
        }
        if (Blue > 255) {
          Blue = 255;
        }
      }
    }
    return { Red: Red / 255, Green: Green / 255, Blue: Blue / 255 };
  }

  /**
   * @param {float} Red - Range [0..1]
   * @param {float} Green - Range [0..1]
   * @param {float} Blue - Range [0..1]
   * @returns {object} [x, y] - Ranges [0..1] [0..1]
   */
  static HelperRGBtoXY(Red, Green, Blue) {
  // Source: https://github.com/PhilipsHue/PhilipsHueSDK-iOS-OSX/blob/master/
  // ApplicationDesignNotes/RGB%20to%20xy%20Color%20conversion.md
    // Apply gamma correction
    if (Red > 0.04045) {
      Red = Math.pow((Red + 0.055) / (1.055), 2.4);
    } else {
      Red = Red / 12.92;
    }
    if (Green > 0.04045) {
      Green = Math.pow((Green + 0.055) / (1.055), 2.4);
    } else {
      Green = Green / 12.92;
    }
    if (Blue > 0.04045) {
      Blue = Math.pow((Blue + 0.055) / (1.055), 2.4);
    } else {
      Blue = Blue / 12.92;
    }
    // RGB to XYZ [M] for Wide RGB D65, http://www.developers.meethue.com/documentation/color-conversions-rgb-xy
    let X = Red * 0.664511 + Green * 0.154324 + Blue * 0.162028;
    let Y = Red * 0.283881 + Green * 0.668433 + Blue * 0.047685;
    let Z = Red * 0.000088 + Green * 0.072310 + Blue * 0.986039;

    // But we don't want Capital X,Y,Z you want lowercase [x,y] (called the color point) as per:
    if ((X + Y + Z) === 0) {
      return { x: 0, y: 0 };
    }
    return { x: X / (X + Y + Z), y: Y / (X + Y + Z) };
  }

  /**
   * @param {float} x
   * @param {float} y
   * @param {float} Brightness Optional
   * @returns {object} [Red, Green, Blue] - Ranges [0..1] [0..1] [0..1]
   */
  static HelperXYtoRGB(x, y, Brightness) {
  // Source: https://github.com/PhilipsHue/PhilipsHueSDK-iOS-OSX/blob/master/
  // ApplicationDesignNotes/RGB%20to%20xy%20Color%20conversion.md
    Brightness = Brightness || 1.0; // Default full brightness
    let z = 1.0 - x - y;
    let Y = Brightness;
    let X = (Y / y) * x;
    let Z = (Y / y) * z;
    // XYZ to RGB [M]-1 for Wide RGB D65, http://www.developers.meethue.com/documentation/color-conversions-rgb-xy
    let Red = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
    let Green = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
    let Blue = X * 0.051713 - Y * 0.121364 + Z * 1.011530;

    // Limit RGB on [0..1]
    if (Red > Blue && Red > Green && Red > 1.0) { // Red is too big
      Green = Green / Red;
      Blue = Blue / Red;
      Red = 1.0;
    }
    if (Red < 0) {
      Red = 0;
    }
    if (Green > Blue && Green > Red && Green > 1.0) { // Green is too big
      Red = Red / Green;
      Blue = Blue / Green;
      Green = 1.0;
    }
    if (Green < 0) {
      Green = 0;
    }
    if (Blue > Red && Blue > Green && Blue > 1.0) { // Blue is too big
      Red = Red / Blue;
      Green = Green / Blue;
      Blue = 1.0;
    }
    if (Blue < 0) {
      Blue = 0;
    }
    // Apply reverse gamma correction
    if (Red <= 0.0031308) {
      Red = Red * 12.92;
    } else {
      Red = 1.055 * Math.pow(Red, (1.0 / 2.4)) - 0.055;
    }
    if (Green <= 0.0031308) {
      Green = Green * 12.92;
    } else {
      Green = 1.055 * Math.pow(Green, (1.0 / 2.4)) - 0.055;
    }
    if (Blue <= 0.0031308) {
      Blue = Blue * 12.92;
    } else {
      Blue = 1.055 * Math.pow(Blue, (1.0 / 2.4)) - 0.055;
    }
    // Limit RGB on [0..1]
    if (Red > Blue && Red > Green && Red > 1.0) { // Red is too big
      Green = Green / Red;
      Blue = Blue / Red;
      Red = 1.0;
    }
    if (Red < 0) {
      Red = 0;
    }
    if (Green > Blue && Green > Red && Green > 1.0) { // Green is too big
      Red = Red / Green;
      Blue = Blue / Green;
      Green = 1.0;
    }
    if (Green < 0) {
      Green = 0;
    }
    if (Blue > Red && Blue > Green && Blue > 1.0) { // Blue is too big
      Red = Red / Blue;
      Green = Green / Blue;
      Blue = 1.0;
    }
    if (Blue < 0) {
      Blue = 0;
    }
    return { Red: Red, Green: Green, Blue: Blue };
  }

  /**
   * @param {float} x
   * @param {float} y
   * @param {float} Brightness Optional
   * @param {string} Model - Modelname of the Light
   * @returns {object} [Red, Green, Blue] - Ranges [0..1] [0..1] [0..1]
   */
  static HelperXYtoRGBforModel(x, y, Brightness, Model) {
    let GamutCorrected = Huepi.HelperGamutXYforModel(x, y, Model);

    return Huepi.HelperXYtoRGB(GamutCorrected.x, GamutCorrected.y, Brightness);
  }

  /**
   * Tests if the Px,Py resides within the Gamut for the model.
   * Otherwise it will calculated the closesed point on the Gamut.
   * @param {float} Px - Range [0..1]
   * @param {float} Py - Range [0..1]
   * @param {string} Model - Modelname of the Light to Gamutcorrect Px, Py for
   * @returns {object} [x, y] - Ranges [0..1] [0..1]
   */
  static HelperGamutXYforModel(Px, Py, Model) { // https://developers.meethue.com/documentation/supported-lights
    Model = Model || 'LCT001'; // default hue Bulb 2012
    let ModelType = Model.slice(0, 3);
    let PRed, PGreen, PBlue;
    let NormDot;

    if (((ModelType === 'LST') || (ModelType === 'LLC')) &&
      (Model !== 'LLC020') && (Model !== 'LLC002') && (Model !== 'LST002')) {
    // For LivingColors Bloom, Aura and Iris etc the triangle corners are:
      PRed = { x: 0.704, y: 0.296 }; // Gamut A
      PGreen = { x: 0.2151, y: 0.7106 };
      PBlue = { x: 0.138, y: 0.080 };
    } else if (((ModelType === 'LCT') || (ModelType === 'LLM')) &&
      (Model !== 'LCT010') && (Model !== 'LCT014') && (Model !== 'LCT011') && (Model !== 'LCT012')) {
    // For the hue bulb and beyond led modules etc the corners of the triangle are:
      PRed = { x: 0.675, y: 0.322 }; // Gamut B
      PGreen = { x: 0.409, y: 0.518 };
      PBlue = { x: 0.167, y: 0.040 };
    } else { // Exceptions and Unknown default to
      PRed = { x: 0.692, y: 0.308 }; // Gamut C
      PGreen = { x: 0.17, y: 0.7 };
      PBlue = { x: 0.153, y: 0.048 };
    }

    let VBR = { x: PRed.x - PBlue.x, y: PRed.y - PBlue.y }; // Blue to Red
    let VRG = { x: PGreen.x - PRed.x, y: PGreen.y - PRed.y }; // Red to Green
    let VGB = { x: PBlue.x - PGreen.x, y: PBlue.y - PGreen.y }; // Green to Blue

    let GBR = (PGreen.x - PBlue.x) * VBR.y - (PGreen.y - PBlue.y) * VBR.x; // Sign Green on Blue to Red
    let BRG = (PBlue.x - PRed.x) * VRG.y - (PBlue.y - PRed.y) * VRG.x; // Sign Blue on Red to Green
    let RGB = (PRed.x - PGreen.x) * VGB.y - (PRed.y - PGreen.y) * VGB.x; // Sign Red on Green to Blue

    let VBP = { x: Px - PBlue.x, y: Py - PBlue.y }; // Blue to Point
    let VRP = { x: Px - PRed.x, y: Py - PRed.y }; // Red to Point
    let VGP = { x: Px - PGreen.x, y: Py - PGreen.y }; // Green to Point

    let PBR = VBP.x * VBR.y - VBP.y * VBR.x; // Sign Point on Blue to Red
    let PRG = VRP.x * VRG.y - VRP.y * VRG.x; // Sign Point on Red to Green
    let PGB = VGP.x * VGB.y - VGP.y * VGB.x; // Sign Point on Green to Blue

    if ((GBR * PBR >= 0) && (BRG * PRG >= 0) && (RGB * PGB >= 0)) { // All Signs Match so Px,Py must be in triangle
      return { x: Px, y: Py };
    //  Outside Triangle, Find Closesed point on Edge or Pick Vertice...
    } else if (GBR * PBR <= 0) { // Outside Blue to Red
      NormDot = (VBP.x * VBR.x + VBP.y * VBR.y) / (VBR.x * VBR.x + VBR.y * VBR.y);
      if ((NormDot >= 0.0) && (NormDot <= 1.0)) { // Within Edge
        return { x: PBlue.x + NormDot * VBR.x, y: PBlue.y + NormDot * VBR.y };
      } else if (NormDot < 0.0) { // Outside Edge, Pick Vertice
        return { x: PBlue.x, y: PBlue.y }; // Start
      }
      return { x: PRed.x, y: PRed.y }; // End
    } else if (BRG * PRG <= 0) { // Outside Red to Green
      NormDot = (VRP.x * VRG.x + VRP.y * VRG.y) / (VRG.x * VRG.x + VRG.y * VRG.y);
      if ((NormDot >= 0.0) && (NormDot <= 1.0)) { // Within Edge
        return { x: PRed.x + NormDot * VRG.x, y: PRed.y + NormDot * VRG.y };
      } else if (NormDot < 0.0) { // Outside Edge, Pick Vertice
        return { x: PRed.x, y: PRed.y }; // Start
      }
      return { x: PGreen.x, y: PGreen.y }; // End
    } else if (RGB * PGB <= 0) { // Outside Green to Blue
      NormDot = (VGP.x * VGB.x + VGP.y * VGB.y) / (VGB.x * VGB.x + VGB.y * VGB.y);
      if ((NormDot >= 0.0) && (NormDot <= 1.0)) { // Within Edge
        return { x: PGreen.x + NormDot * VGB.x, y: PGreen.y + NormDot * VGB.y };
      } else if (NormDot < 0.0) { // Outside Edge, Pick Vertice
        return { x: PGreen.x, y: PGreen.y }; // Start
      }
      return { x: PBlue.x, y: PBlue.y }; // End
    }
    return { x: 0.5, y: 0.5 }; // Silence return warning
  }

  /**
   * @param {float} Ang - Range [0..360]
   * @param {float} Sat - Range [0..1]
   * @param {float} Bri - Range [0..1]
   * @returns {number} Temperature ranges [2200..6500]
   */
  static HelperHueAngSatBritoColortemperature(Ang, Sat, Bri) {
    let RGB;

    RGB = Huepi.HelperHueAngSatBritoRGB(Ang, Sat, Bri);
    return Huepi.HelperRGBtoColortemperature(RGB.Red, RGB.Green, RGB.Blue);
  }

  /**
   * @param {number} Temperature ranges [1000..6600]
   * @returns {object} [Ang, Sat, Bri] - Ranges [0..360] [0..1] [0..1]
   */
  static HelperColortemperaturetoHueAngSatBri(Temperature) {
    let RGB;

    RGB = Huepi.HelperColortemperaturetoRGB(Temperature);
    return Huepi.HelperRGBtoHueAngSatBri(RGB.Red, RGB.Green, RGB.Blue);
  }

  /**
   * @param {float} x
   * @param {float} y
   * @param {float} Brightness Optional
   * @returns {number} Temperature ranges [1000..6600]
   */
  static HelperXYtoColortemperature(x, y, Brightness) {
    let RGB;

    RGB = Huepi.HelperXYtoRGB(x, y, Brightness);
    return Huepi.HelperRGBtoColortemperature(RGB.Red, RGB.Green, RGB.Blue);
  }

  /**
   * @param {number} Temperature ranges [1000..6600]
   * @returns {object} [x, y] - Ranges [0..1] [0..1]
   */
  static HelperColortemperaturetoXY(Temperature) {
    let RGB;

    RGB = Huepi.HelperColortemperaturetoRGB(Temperature);
    return Huepi.HelperRGBtoXY(RGB.Red, RGB.Green, RGB.Blue);
  }

  /**
   * @param {number} CT in Mired (micro reciprocal degree)
   * @returns {number} ColorTemperature
   */
  static HelperCTtoColortemperature(CT) {
    return Math.round(1000000 / CT);
  }

  /**
   * @param {number} ColorTemperature
   * @returns {number} CT in Mired (micro reciprocal degree)
   */
  static HelperColortemperaturetoCT(Temperature) {
    return Math.round(1000000 / Temperature);
  }

  // //////////////////////////////////////////////////////////////////////////////
  //
  // Light Functions
  //
  //

  /**
   * @param {number} LightNr - LightNr
   * @returns {string} LightId
   */
  LightGetId(LightNr) {
    if (typeof LightNr === 'number') {
      if (LightNr <= this.LightIds.length) {
        return this.LightIds[LightNr - 1];
      }
    }
    return LightNr;
  }

  /**
   * @param {string} LightId - LightId
   * @returns {number} LightNr
   */
  LightGetNr(LightId) {
    if (typeof LightId === 'string') {
      return this.LightIds.indexOf(LightId) + 1;
    }
    return LightId;
  }

  /**
   */
  LightsGetData() {
  // GET /api/username/lights
    return new Promise((resolve, reject) => {
      Huepi.http.get('http://' + this.BridgeIP + '/api/' + this.Username + '/lights').then((response) => {
        return response.data;
      }).then((data) => {
        if (data) {
          this.Lights = data;
          this.LightIds = [];
          for (let key in this.Lights) {
            this.LightIds.push(key);
          }
          resolve(data);
        } else {
          reject(data);
        }
      }).catch(function (message) { // fetch failed
        reject(message);
      });
    });
  }

  /**
   */
  LightsSearchForNew() {
  // POST /api/username/lights
    return Huepi.http.post('http://' + this.BridgeIP + '/api/' + this.Username + '/lights');
  }

  /**
   */
  LightsGetNew() {
  // GET /api/username/lights/new
    return Huepi.http.get('http://' + this.BridgeIP + '/api/' + this.Username + '/lights/new');
  }

  /**
   * @param {number} LightNr
   * @param {string} Name New name of the light Range [1..32]
   */
  LightSetName(LightNr, Name) {
  // PUT /api/username/lights
    return Huepi.http.put('http://' + this.BridgeIP + '/api/' + this.Username + '/lights/' + this.LightGetId(LightNr),
      {"name" : Name} );
  }

  /**
   * @param {number} LightNr
   * @param {HuepiLightstate} State
   */
  LightSetState(LightNr, State) {
  // PUT /api/username/lights/[LightNr]/state
    if (this.Lights[this.LightGetId(LightNr)]) { // Merge in Cache
      console.log(' Light SetState', this.Lights[this.LightGetId(LightNr)].state);
      var NewState = new HuepiLightstate(this.Lights[this.LightGetId(LightNr)].state);
      this.Lights[this.LightGetId(LightNr)].state = NewState.Merge(State);
      console.log(' LightState Set', this.Lights[this.LightGetId(LightNr)].state.Get());
    } // Merge in Cache
    return Huepi.http.put('http://' + this.BridgeIP + '/api/' + this.Username + '/lights/' + this.LightGetId(LightNr) + '/state',
      State.Get() );
  }

  /**
   * @param {number} LightNr
   * @param {number} Transitiontime optional
   */
  LightOn(LightNr, Transitiontime) {
    let State;

    State = new HuepiLightstate();
    State.On();
    State.SetTransitiontime(Transitiontime);
    return this.LightSetState(LightNr, State);
  }

  /**
   * @param {number} LightNr
   * @param {number} Transitiontime optional
   */
  LightOff(LightNr, Transitiontime) {
    let State;

    State = new HuepiLightstate();
    State.Off();
    State.SetTransitiontime(Transitiontime);
    return this.LightSetState(LightNr, State);
  }

  /**
   * Sets Gamut Corrected values for HSB
   * @param {number} LightNr
   * @param {number} Hue Range [0..65535]
   * @param {number} Saturation Range [0..255]
   * @param {number} Brightness Range [0..255]
   * @param {number} Transitiontime optional
   */
  LightSetHSB(LightNr, Hue, Saturation, Brightness, Transitiontime) {
    let HueAng = Hue * 360 / 65535;
    let Sat = Saturation / 255;
    let Bri = Brightness / 255;

    let Color = Huepi.HelperHueAngSatBritoRGB(HueAng, Sat, Bri);
    let Point = Huepi.HelperRGBtoXY(Color.Red, Color.Green, Color.Blue);

    return Promise.all([
      this.LightSetBrightness(LightNr, Brightness, Transitiontime),
      this.LightSetXY(LightNr, Point.x, Point.y, Transitiontime)
    ]);
  }

  /**
   * @param {number} LightNr
   * @param {number} Hue Range [0..65535]
   * @param {number} Transitiontime optional
   */
  LightSetHue(LightNr, Hue, Transitiontime) {
    let State;

    State = new HuepiLightstate();
    State.SetHue(Hue);
    State.SetTransitiontime(Transitiontime);
    return this.LightSetState(LightNr, State);
  }

  /**
   * @param {number} LightNr
   * @param Saturation Range [0..255]
   * @param {number} Transitiontime optional
   */
  LightSetSaturation(LightNr, Saturation, Transitiontime) {
    let State;

    State = new HuepiLightstate();
    State.SetSaturation(Saturation);
    State.SetTransitiontime(Transitiontime);
    return this.LightSetState(LightNr, State);
  }

  /**
   * @param {number} LightNr
   * @param Brightness Range [0..255]
   * @param {number} Transitiontime optional
   */
  LightSetBrightness(LightNr, Brightness, Transitiontime) {
    let State;

    State = new HuepiLightstate();
    State.SetBrightness(Brightness);
    State.SetTransitiontime(Transitiontime);
    return this.LightSetState(LightNr, State);
  }

  /**
   * @param {number} LightNr
   * @param Ang Range [0..360]
   * @param Sat Range [0..1]
   * @param Bri Range [0..1]
   * @param {number} Transitiontime optional
   */
  LightSetHueAngSatBri(LightNr, Ang, Sat, Bri, Transitiontime) {
  // In: Hue in Deg, Saturation, Brightness 0.0-1.0 Transform To Philips Hue Range...
    while (Ang < 0) {
      Ang = Ang + 360;
    }
    Ang = Ang % 360;
    return this.LightSetHSB(LightNr, Ang / 360 * 65535, Sat * 255, Bri * 255, Transitiontime);
  }

  /**
   * @param {number} LightNr
   * @param Red Range [0..1]
   * @param Green Range [0..1]
   * @param Blue Range [0..1]
   * @param {number} Transitiontime optional
   */
  LightSetRGB(LightNr, Red, Green, Blue, Transitiontime) {
    let Point = Huepi.HelperRGBtoXY(Red, Green, Blue);
    let HueAngSatBri = Huepi.HelperRGBtoHueAngSatBri(Red, Green, Blue);

    return Promise.all([
      this.LightSetBrightness(LightNr, HueAngSatBri.Bri * 255),
      this.LightSetXY(LightNr, Point.x, Point.y, Transitiontime)
    ]);
  }

  /**
   * @param {number} LightNr
   * @param {number} CT micro reciprocal degree
   * @param {number} Transitiontime optional
   */
  LightSetCT(LightNr, CT, Transitiontime) {
    let Model = this.Lights[this.LightGetId(LightNr)].modelid;

    if (Huepi.HelperModelCapableCT(Model)) {
      let State;

      State = new HuepiLightstate();
      State.SetCT(CT);
      State.SetTransitiontime(Transitiontime);
      return this.LightSetState(LightNr, State);
    } // else if (Huepi.HelperModelCapableXY(Model)) {
    // hue CT Incapable Lights: CT->RGB->XY to ignore Brightness in RGB}
    let Color = Huepi.HelperColortemperaturetoRGB(Huepi.HelperCTtoColortemperature(CT));
    let Point = Huepi.HelperRGBtoXY(Color.Red, Color.Green, Color.Blue);

    return this.LightSetXY(LightNr, Point.x, Point.y, Transitiontime);
  }

  /**
   * @param {number} LightNr
   * @param {number} Colortemperature Range [2200..6500] for the 2012 model
   * @param {number} Transitiontime optional
   */
  LightSetColortemperature(LightNr, Colortemperature, Transitiontime) {
    return this.LightSetCT(LightNr, Huepi.HelperColortemperaturetoCT(Colortemperature), Transitiontime);
  }

  /**
   * @param {number} LightNr
   * @param {float} X
   * @param {float} Y
   * @param {number} Transitiontime optional
   */
  LightSetXY(LightNr, X, Y, Transitiontime) {
    let Model = this.Lights[this.LightGetId(LightNr)].modelid;

    if (Huepi.HelperModelCapableXY(Model)) {
      let State;

      State = new HuepiLightstate();
      let Gamuted = Huepi.HelperGamutXYforModel(X, Y, Model);

      State.SetXY(Gamuted.x, Gamuted.y);
      State.SetTransitiontime(Transitiontime);
      return this.LightSetState(LightNr, State);
    } // else if (Huepi.HelperModelCapableCT(Model)) {
    // hue XY Incapable Lights: XY->RGB->CT to ignore Brightness in RGB
    let Color = Huepi.HelperXYtoRGB(X, Y);
    let Colortemperature = Huepi.HelperRGBtoColortemperature(Color.Red, Color.Green, Color.Blue);

    return this.LightSetColortemperature(LightNr, Colortemperature, Transitiontime);
  }

  /**
   * @param {number} LightNr
   * @param {number} Transitiontime optional
   */
  LightAlertSelect(LightNr, Transitiontime) {
    let State;

    State = new HuepiLightstate();
    State.AlertSelect();
    State.SetTransitiontime(Transitiontime);
    return this.LightSetState(LightNr, State);
  }

  /**
   * @param {number} LightNr
   * @param {number} Transitiontime optional
   */
  LightAlertLSelect(LightNr, Transitiontime) {
    let State;

    State = new HuepiLightstate();
    State.AlertLSelect();
    State.SetTransitiontime(Transitiontime);
    return this.LightSetState(LightNr, State);
  }

  /**
   * @param {number} LightNr
   * @param {number} Transitiontime optional
   */
  LightAlertNone(LightNr, Transitiontime) {
    let State;

    State = new HuepiLightstate();
    State.AlertNone();
    State.SetTransitiontime(Transitiontime);
    return this.LightSetState(LightNr, State);
  }

  /**
   * @param {number} LightNr
   * @param {number} Transitiontime optional
   */
  LightEffectColorloop(LightNr, Transitiontime) {
    let State;

    State = new HuepiLightstate();
    State.EffectColorloop();
    State.SetTransitiontime(Transitiontime);
    return this.LightSetState(LightNr, State);
  }

  /**
   * @param {number} LightNr
   * @param {number} Transitiontime optional
   */
  LightEffectNone(LightNr, Transitiontime) {
    let State;

    State = new HuepiLightstate();
    State.EffectNone();
    State.SetTransitiontime(Transitiontime);
    return this.LightSetState(LightNr, State);
  }

  // //////////////////////////////////////////////////////////////////////////////
  //
  // Group Functions
  //
  //

  /**
   * @param {number} GroupNr - GroupNr
   * @returns {string} GroupId
   */
  GroupGetId(GroupNr) {
    if (typeof GroupNr === 'number') {
      if (GroupNr === 0) {
        return '0';
      } else if (GroupNr > 0) {
        if (GroupNr <= this.GroupIds.length) {
          return this.GroupIds[GroupNr - 1];
        }
      }
    }
    return GroupNr;
  }

  /**
   * @param {string} GroupId - GroupId
   * @returns {number} GroupNr
   */
  GroupGetNr(GroupId) {
    if (typeof GroupId === 'string') {
      return this.GroupIds.indexOf(GroupId) + 1;
    }
    return GroupId;
  }

  /**
   */
  GroupsGetData() {
  // GET /api/username/groups
    return new Promise((resolve, reject) => {
      Huepi.http.get('http://' + this.BridgeIP + '/api/' + this.Username + '/groups').then((response) => {
        return response.data;
      }).then((data) => {
        if (data) {
          this.Groups = data;
          this.GroupIds = [];
          for (let key in this.Groups) {
            this.GroupIds.push(key);
          }
          resolve(data);
        } else {
          reject(data);
        }
      }).catch(function (message) { // fetch failed
        reject(message);
      });
    });
  }

  /**
   */
  GroupsGetZero() {
  // GET /api/username/groups/0
    return new Promise((resolve, reject) => {
      Huepi.http.get('http://' + this.BridgeIP + '/api/' + this.Username + '/groups/0').then((response) => {
        return response.data;
      }).then((data) => {
        if (data) {
          this.Groups['0'] = data;
          resolve(data);
        } else {
          reject(data);
        }
      }).catch(function (message) { // fetch failed
        reject(message);
      });
    });
  }

  /**
   * Note: Bridge doesn't accept lights in a Group that are unreachable at moment of creation
   * @param {string} Name New name of the light Range [1..32]
   * @param {multiple} Lights LightNr or Array of Lights to Group
   */
  GroupCreate(Name, Lights) {
  // POST /api/username/groups
    return Huepi.http.put('http://' + this.BridgeIP + '/api/' + this.Username + '/groups/',
      {"name": Name, "lights": Lights} );
  }

  /**
   * @param {number} GroupNr
   * @param {string} Name New name of the light Range [1..32]
   */
  GroupSetName(GroupNr, Name) {
  // PUT /api/username/groups/[GroupNr]
    return Huepi.http.put('http://' + this.BridgeIP + '/api/' + this.Username + '/groups/' + this.GroupGetId(GroupNr),
      {"name": Name} );
  }

  /**
   * Note: Bridge doesn't accept lights in a Group that are unreachable at moment of creation
   * @param {number} GroupNr
   * @param {multiple} Lights LightNr or Array of Lights to Group
   */
  GroupSetLights(GroupNr, Lights) {
  // PUT /api/username/groups/[GroupNr]
    return Huepi.http.put('http://' + this.BridgeIP + '/api/' + this.Username + '/groups/' + this.GroupGetId(GroupNr),
      {"lights": Lights} );
  }

  /**
   * Note: Bridge doesn't accept lights in a Group that are unreachable at moment of creation
   * @param {number} GroupNr
   * @param {number} LightNr
   */
  GroupHasLight(GroupNr, LightNr) {
    if (this.GroupGetId(GroupNr) != '0') {
      if (this.Groups[this.GroupGetId(GroupNr)].lights.indexOf(this.LightGetId(LightNr))>=0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Note: Bridge doesn't accept lights in a Group that are unreachable at moment of creation
   * @param {number} GroupNr
   * @param {number} LightNr
   */
  GroupRemoveLight(GroupNr, LightNr) {
    if (this.GroupHasLight(GroupNr, this.LightGetId(LightNr))) {
      this.Groups[this.GroupGetId(GroupNr)].lights.splice(
        this.Groups[this.GroupGetId(GroupNr)].lights.indexOf(this.LightGetId(LightNr)), 1);
      this.GroupSetLights(this.GroupGetId(GroupNr), this.Groups[this.GroupGetId(GroupNr)].lights);
    }
  }

  /**
   * Note: Bridge doesn't accept lights in a Group that are unreachable at moment of creation
   * @param {number} GroupNr
   * @param {number} LightNr
   */
  GroupToggleLight(GroupNr, LightNr) {
    if (this.GroupHasLight(GroupNr, this.LightGetId(LightNr))) {
      this.GroupRemoveLight(GroupNr, LightNr);
    } else {
      this.GroupAddLight(GroupNr, LightNr);
    }
  }

  /**
   * Note: Bridge doesn't accept lights in a Group that are unreachable at moment of creation
   * @param {number} GroupNr
   * @param {number} LightNr
   */
  GroupAddLight(GroupNr, LightNr) {
    if (!this.GroupHasLight(GroupNr, this.LightGetId(LightNr))) {
      this.Groups[this.GroupGetId(GroupNr)].lights.push(this.LightGetId(LightNr));
      this.GroupSetLights(this.GroupGetId(GroupNr), this.Groups[this.GroupGetId(GroupNr)].lights);
    }
  }

  /**
   * Note: Bridge doesn't accept lights in a Group that are unreachable at moment of creation
   * @param {number} GroupNr
   * @param {string} Name New name of the light Range [1..32]
   * @param {multiple} Lights LightNr or Array of Lights to Group
   */
  GroupSetAttributes(GroupNr, Name, Lights) {
  // PUT /api/username/groups/[GroupNr]
    return Huepi.http.put('http://' + this.BridgeIP + '/api/' + this.Username + '/groups/' + this.GroupGetId(GroupNr),
      {"name": Name, "lights":Lights} );
  }

  /**
   * @param {number} GroupNr
   */
  GroupDelete(GroupNr) {
  // DELETE /api/username/groups/[GroupNr]
    return Huepi.http.delete('http://' + this.BridgeIP + '/api/' + this.Username + '/groups/' + this.GroupGetId(GroupNr));
  }

  /**
   * @param {number} GroupNr
   * @param {HuepiLightstate} State
   */
  GroupSetState(GroupNr, State) {
  // PUT /api/username/groups/[GroupNr]/action
    if (this.Groups[this.GroupGetId(GroupNr)]) { // Merge in Cache
      console.log(' Group SetState', this.Groups[this.GroupGetId(GroupNr)].action);
      var NewState = new HuepiLightstate(this.Groups[this.GroupGetId(GroupNr)].action);
      this.Groups[this.GroupGetId(GroupNr)].action = NewState.Merge(State);
      console.log(' GroupState Set', this.Groups[this.GroupGetId(GroupNr)].action.Get());
    } // Merge in Cache
    return Huepi.http.put('http://' + this.BridgeIP + '/api/' + this.Username + '/groups/' + this.GroupGetId(GroupNr) + '/action', 
     State.Get() );
  }

  /**
   * @param {number} GroupNr
   * @param {number} Transitiontime optional
   */
  GroupOn(GroupNr, Transitiontime) {
    let State;

    State = new HuepiLightstate();
    State.On();
    State.SetTransitiontime(Transitiontime);
    return this.GroupSetState(GroupNr, State);
  }

  /**
   * @param {number} GroupNr
   * @param {number} Transitiontime optional
   */
  GroupOff(GroupNr, Transitiontime) {
    let State;

    State = new HuepiLightstate();
    State.Off();
    State.SetTransitiontime(Transitiontime);
    return this.GroupSetState(GroupNr, State);
  }

  /**
   * Sets Gamut Corrected values for HSB
   * @param {number} GroupNr
   * @param {number} Hue Range [0..65535]
   * @param {number} Saturation Range [0..255]
   * @param {number} Brightness Range [0..255]
   * @param {number} Transitiontime optional
   */
  GroupSetHSB(GroupNr, Hue, Saturation, Brightness, Transitiontime) {
    let Ang = Hue * 360 / 65535;
    let Sat = Saturation / 255;
    let Bri = Brightness / 255;

    let Color = Huepi.HelperHueAngSatBritoRGB(Ang, Sat, Bri);
    let Point = Huepi.HelperRGBtoXY(Color.Red, Color.Green, Color.Blue);

    return Promise.all([
      this.GroupSetBrightness(GroupNr, Brightness, Transitiontime),
      this.GroupSetXY(GroupNr, Point.x, Point.y, Transitiontime)
    ]);
  }

  /**
   * @param {number} GroupNr
   * @param {number} Hue Range [0..65535]
   * @param {number} Transitiontime optional
   */
  GroupSetHue(GroupNr, Hue, Transitiontime) {
    let State;

    State = new HuepiLightstate();
    State.SetHue(Hue);
    State.SetTransitiontime(Transitiontime);
    return this.GroupSetState(GroupNr, State);
  }

  /**
   * @param {number} GroupNr
   * @param Saturation Range [0..255]
   * @param {number} Transitiontime optional
   */
  GroupSetSaturation(GroupNr, Saturation, Transitiontime) {
    let State;

    State = new HuepiLightstate();
    State.SetSaturation(Saturation);
    State.SetTransitiontime(Transitiontime);
    return this.GroupSetState(GroupNr, State);
  }

  /**
   * @param {number} GroupNr
   * @param Brightness Range [0..255]
   * @param {number} Transitiontime optional
   */
  GroupSetBrightness(GroupNr, Brightness, Transitiontime) {
    let State;

    State = new HuepiLightstate();
    State.SetBrightness(Brightness);
    State.SetTransitiontime(Transitiontime);
    return this.GroupSetState(GroupNr, State);
  }

  /**
   * @param {number} GroupNr
   * @param Ang Range [0..360]
   * @param Sat Range [0..1]
   * @param Bri Range [0..1]
   * @param {number} Transitiontime optional
   */
  GroupSetHueAngSatBri(GroupNr, Ang, Sat, Bri, Transitiontime) {
    while (Ang < 0) {
      Ang = Ang + 360;
    }
    Ang = Ang % 360;
    return this.GroupSetHSB(GroupNr, Ang / 360 * 65535, Sat * 255, Bri * 255, Transitiontime);
  }

  /**
   * @param {number} GroupNr
   * @param Red Range [0..1]
   * @param Green Range [0..1]
   * @param Blue Range [0..1]
   * @param {number} Transitiontime optional
   */
  GroupSetRGB(GroupNr, Red, Green, Blue, Transitiontime) {
    let HueAngSatBri = Huepi.HelperRGBtoHueAngSatBri(Red, Green, Blue);

    return this.GroupSetHueAngSatBri(GroupNr, HueAngSatBri.Ang, HueAngSatBri.Sat, HueAngSatBri.Bri, Transitiontime);
  }

  /**
   * @param {number} GroupNr
   * @param {number} CT micro reciprocal degree
   * @param {number} Transitiontime optional
   */
  GroupSetCT(GroupNr, CT, Transitiontime) {
    let Lights = [];

    GroupNr = this.GroupGetId(GroupNr);
    if (GroupNr === '0') { // All Lights
      Lights = this.LightIds;
    } else {
      Lights = this.Groups[GroupNr].lights;
    }

    if (Lights.length !== 0) {
      let deferreds = [];

      for (let LightNr = 0; LightNr < Lights.length; LightNr++) {
        deferreds.push(this.LightSetCT(Lights[LightNr], CT, Transitiontime));
      }
      return Promise.all(deferreds); // return Deferred when with array of deferreds
    }
    // No Lights in Group GroupNr, Set State of Group to let Bridge create the API Error and return it.
    let State;

    State = new HuepiLightstate();
    State.SetCT(CT);
    State.SetTransitiontime(Transitiontime);
    return this.GroupSetState(GroupNr, State);
  }

  /**
   * @param {number} GroupNr
   * @param {number} Colortemperature Range [2200..6500] for the 2012 model
   * @param {number} Transitiontime optional
   */
  GroupSetColortemperature(GroupNr, Colortemperature, Transitiontime) {
    return this.GroupSetCT(GroupNr, Huepi.HelperColortemperaturetoCT(Colortemperature), Transitiontime);
  }

  /**
   * @param {number} GroupNr
   * @param {float} X
   * @param {float} Y
   * @param {number} Transitiontime optional
   */
  GroupSetXY(GroupNr, X, Y, Transitiontime) {
    let Lights = [];

    GroupNr = this.GroupGetId(GroupNr);
    if (GroupNr === '0') { // All Lights
      Lights = this.LightIds;
    } else {
      Lights = this.Groups[GroupNr].lights;
    }

    if (Lights.length !== 0) {
      let deferreds = [];

      for (let LightNr = 0; LightNr < Lights.length; LightNr++) {
        deferreds.push(this.LightSetXY(Lights[LightNr], X, Y, Transitiontime));
      }
      return Promise.all(deferreds); // return Deferred when with array of deferreds
    }
    // No Lights in Group GroupNr, Set State of Group to let Bridge create the API Error and return it.
    let State;

    State = new HuepiLightstate();
    State.SetXY(X, Y);
    State.SetTransitiontime(Transitiontime);
    return this.GroupSetState(GroupNr, State);
  }

  /**
   * @param {number} GroupNr
   * @param {number} Transitiontime optional
   */
  GroupAlertSelect(GroupNr, Transitiontime) {
    let State;

    State = new HuepiLightstate();
    State.AlertSelect();
    State.SetTransitiontime(Transitiontime);
    return this.GroupSetState(GroupNr, State);
  }

  /**
   * @param {number} GroupNr
   * @param {number} Transitiontime optional
   */
  GroupAlertLSelect(GroupNr, Transitiontime) {
    let State;

    State = new HuepiLightstate();
    State.AlertLSelect();
    State.SetTransitiontime(Transitiontime);
    return this.GroupSetState(GroupNr, State);
  }

  /**
   * @param {number} GroupNr
   * @param {number} Transitiontime optional
   */
  GroupAlertNone(GroupNr, Transitiontime) {
    let State;

    State = new HuepiLightstate();
    State.AlertNone();
    State.SetTransitiontime(Transitiontime);
    return this.GroupSetState(GroupNr, State);
  }

  /**
   * @param {number} GroupNr
   * @param {number} Transitiontime optional
   */
  GroupEffectColorloop(GroupNr, Transitiontime) {
    let State;

    State = new HuepiLightstate();
    State.EffectColorloop();
    State.SetTransitiontime(Transitiontime);
    return this.GroupSetState(GroupNr, State);
  }

  /**
   * @param {number} GroupNr
   * @param {number} Transitiontime optional
   */
  GroupEffectNone(GroupNr, Transitiontime) {
    let State;

    State = new HuepiLightstate();
    State.EffectNone();
    State.SetTransitiontime(Transitiontime);
    return this.GroupSetState(GroupNr, State);
  }

  // //////////////////////////////////////////////////////////////////////////////
  //
  // Schedule Functions
  //
  //

  /**
   */
  SchedulesGetData() {
  // GET /api/username/schedules
    return new Promise((resolve, reject) => {
      Huepi.http.get('http://' + this.BridgeIP + '/api/' + this.Username + '/schedules').then((response) => {
        return response.data;
      }).then((data) => {
        if (data) {
          this.Schedules = data;
          resolve(data);
        } else {
          reject(data);
        }
      }).catch(function (message) { // fetch failed
        reject(message);
      });
    });
  }

  // //////////////////////////////////////////////////////////////////////////////
  //
  // Scenes Functions
  //
  //

  /**
   */
  ScenesGetData() {
  // GET /api/username/scenes
    return new Promise((resolve, reject) => {
      Huepi.http.get('http://' + this.BridgeIP + '/api/' + this.Username + '/scenes').then((response) => {
        return response.data;
      }).then((data) => {
        if (data) {
          this.Scenes = data;
          resolve(data);
        } else {
          reject(data);
        }
      }).catch(function (message) { // fetch failed
        reject(message);
      });
    });
  }

  // //////////////////////////////////////////////////////////////////////////////
  //
  // Sensors Functions
  //
  //

  /**
   */
  SensorsGetData() {
  // GET /api/username/sensors
    return new Promise((resolve, reject) => {
      Huepi.http.get('http://' + this.BridgeIP + '/api/' + this.Username + '/sensors').then((response) => {
        return response.data;
      }).then((data) => {
        if (data) {
          this.Sensors = data;
          resolve(data);
        } else {
          reject(data);
        }
      }).catch(function (message) { // fetch failed
        reject(message);
      });
    });
  }

  // //////////////////////////////////////////////////////////////////////////////
  //
  // Rules Functions
  //
  //

  /**
   */
  RulesGetData() {
  // GET /api/username/rules
    return new Promise((resolve, reject) => {
      Huepi.http.get('http://' + this.BridgeIP + '/api/' + this.Username + '/rules').then((response) => {
        return response.data;
      }).then((data) => {
        if (data) {
          this.Rules = data;
          resolve(data);
        } else {
          reject(data);
        }
      }).catch(function (message) { // fetch failed
        reject(message);
      });
    });
  }

}

Huepi.http = null;
if (typeof axios !== 'undefined') { 
  Huepi.http = axios.create();
}
exports.Huepi = Huepi;
exports.HuepiLightstate = HuepiLightstate;

}) ( true ? exports : undefined);


/***/ }),

/***/ "./src/$$_lazy_route_resource lazy recursive":
/*!**********************************************************!*\
  !*** ./src/$$_lazy_route_resource lazy namespace object ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function webpackEmptyAsyncContext(req) {
	// Here Promise.resolve().then() is used instead of new Promise() to prevent
	// uncaught exception popping up in devtools
	return Promise.resolve().then(function() {
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	});
}
webpackEmptyAsyncContext.keys = function() { return []; };
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
module.exports = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = "./src/$$_lazy_route_resource lazy recursive";

/***/ }),

/***/ "./src/app/app-material.module.ts":
/*!****************************************!*\
  !*** ./src/app/app-material.module.ts ***!
  \****************************************/
/*! exports provided: MaterialModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MaterialModule", function() { return MaterialModule; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_material__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/material */ "./node_modules/@angular/material/esm5/material.es5.js");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};

//import {CdkTableModule} from '@angular/cdk/table';
//import {CdkTreeModule} from '@angular/cdk/tree';

var MaterialModule = /** @class */ (function () {
    function MaterialModule() {
    }
    MaterialModule = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["NgModule"])({
            exports: [
                //    CdkTableModule,
                //    CdkTreeModule,
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatAutocompleteModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatButtonModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatButtonToggleModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatCardModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatCheckboxModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatChipsModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatDatepickerModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatDialogModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatExpansionModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatFormFieldModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatGridListModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatIconModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatInputModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatListModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatMenuModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatNativeDateModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatPaginatorModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatProgressBarModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatProgressSpinnerModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatRadioModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatRippleModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatSelectModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatSidenavModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatSliderModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatSlideToggleModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatSnackBarModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatSortModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatStepperModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatTableModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatTabsModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatToolbarModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_1__["MatTooltipModule"]
            ]
        })
    ], MaterialModule);
    return MaterialModule;
}());



/***/ }),

/***/ "./src/app/app-routing.animations.ts":
/*!*******************************************!*\
  !*** ./src/app/app-routing.animations.ts ***!
  \*******************************************/
/*! exports provided: RoutingAnimations */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RoutingAnimations", function() { return RoutingAnimations; });
/* harmony import */ var _angular_animations__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/animations */ "./node_modules/@angular/animations/fesm5/animations.js");

function RoutingAnimations() {
    return Object(_angular_animations__WEBPACK_IMPORTED_MODULE_0__["trigger"])('RoutingAnimations', [
        Object(_angular_animations__WEBPACK_IMPORTED_MODULE_0__["state"])('void', Object(_angular_animations__WEBPACK_IMPORTED_MODULE_0__["style"])({ top: -32, left: 0, opacity: 0 })),
        Object(_angular_animations__WEBPACK_IMPORTED_MODULE_0__["state"])('*', Object(_angular_animations__WEBPACK_IMPORTED_MODULE_0__["style"])({ top: 0, left: 0, opacity: 1 })),
        Object(_angular_animations__WEBPACK_IMPORTED_MODULE_0__["transition"])(':enter', [
            Object(_angular_animations__WEBPACK_IMPORTED_MODULE_0__["animate"])('0.2s ease-in-out', Object(_angular_animations__WEBPACK_IMPORTED_MODULE_0__["style"])({ top: 0, left: 0, opacity: 1 }))
        ]),
        Object(_angular_animations__WEBPACK_IMPORTED_MODULE_0__["transition"])(':leave', [
            Object(_angular_animations__WEBPACK_IMPORTED_MODULE_0__["animate"])('0s ease-in-out', Object(_angular_animations__WEBPACK_IMPORTED_MODULE_0__["style"])({ top: -32, left: 0, opacity: 0 }))
        ])
    ]);
}


/***/ }),

/***/ "./src/app/app-routing.module.ts":
/*!***************************************!*\
  !*** ./src/app/app-routing.module.ts ***!
  \***************************************/
/*! exports provided: appRoutes, AppRoutingModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "appRoutes", function() { return appRoutes; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AppRoutingModule", function() { return AppRoutingModule; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _huewi_home_huewi_home_component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./huewi-home/huewi-home.component */ "./src/app/huewi-home/huewi-home.component.ts");
/* harmony import */ var _huewi_about_huewi_about_component__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./huewi-about/huewi-about.component */ "./src/app/huewi-about/huewi-about.component.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};




var appRoutes = [
    { path: 'home', component: _huewi_home_huewi_home_component__WEBPACK_IMPORTED_MODULE_2__["HuewiHomeComponent"] },
    { path: 'about', component: _huewi_about_huewi_about_component__WEBPACK_IMPORTED_MODULE_3__["HuewiAboutComponent"] },
    //  { path: '', component: HuewiHomeComponent },
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: '**', redirectTo: '/home' }
];
var AppRoutingModule = /** @class */ (function () {
    function AppRoutingModule() {
    }
    AppRoutingModule = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["NgModule"])({
            imports: [
                _angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"].forRoot(appRoutes, { useHash: true })
            ],
            exports: [
                _angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"]
            ]
        })
    ], AppRoutingModule);
    return AppRoutingModule;
}());



/***/ }),

/***/ "./src/app/app.component.css":
/*!***********************************!*\
  !*** ./src/app/app.component.css ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ".mat-sidenav {\r\n    min-width: 30%; \r\n    max-width: 70%;\r\n}\r\n\r\nmat-icon {\r\n    padding-right: 32px;\r\n}\r\n"

/***/ }),

/***/ "./src/app/app.component.html":
/*!************************************!*\
  !*** ./src/app/app.component.html ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div class={{theme}}>\r\n\r\n<mat-sidenav-container fullscreen>\r\n\r\n  <mat-toolbar color=\"primary\" *ngIf=\"!parameters.widget\">\r\n      <button mat-icon-button (click)=\"sidenav.toggle()\">\r\n        <mat-icon>menu</mat-icon>\r\n      </button>\r\n      <div>{{title}}</div>\r\n    </mat-toolbar>\r\n\r\n  <nav mat-tab-nav-bar #navbar *ngIf=\"!parameters.widget\">\r\n    <a mat-tab-link [routerLink]=\"['/home']\" [replaceUrl]=\"true\" routerLinkActive=\"active-link\">Home</a>\r\n    <a mat-tab-link [routerLink]=\"['/groups']\" [replaceUrl]=\"true\" routerLinkActive=\"active-link\">Groups</a>\r\n    <a mat-tab-link [routerLink]=\"['/lights']\" [replaceUrl]=\"true\" routerLinkActive=\"active-link\">Lights</a>\r\n    <!--a mat-tab-link [routerLink]=\"['/bridges']\" [replaceUrl]=\"true\" routerLinkActive=\"active-link\">Bridges</a>\r\n    <a mat-tab-link [routerLink]=\"['/about']\" [replaceUrl]=\"true\" routerLinkActive=\"active-link\">About</a-->\r\n  </nav>\r\n\r\n  <mat-sidenav #sidenav>\r\n    <mat-nav-list>\r\n      <a mat-list-item [routerLink]=\"['/home']\" [replaceUrl]=\"true\" routerLinkActive=\"active-link\" (click)=\"sidenav.toggle()\"><mat-icon>home</mat-icon>Home</a>\r\n      <a mat-list-item [routerLink]=\"['/groups']\" [replaceUrl]=\"true\" routerLinkActive=\"active-link\" (click)=\"sidenav.toggle()\"><mat-icon>group_work</mat-icon>Groups</a>\r\n      <a mat-list-item [routerLink]=\"['/lights']\" [replaceUrl]=\"true\" routerLinkActive=\"active-link\" (click)=\"sidenav.toggle()\"><mat-icon>lightbulb_outline</mat-icon>Lights</a>\r\n      <mat-divider></mat-divider>\r\n      <a mat-list-item [routerLink]=\"['/rules']\" [replaceUrl]=\"true\" routerLinkActive=\"active-link\" (click)=\"sidenav.toggle()\"><mat-icon>assignment</mat-icon>Rules</a>\r\n      <a mat-list-item [routerLink]=\"['/scenes']\" [replaceUrl]=\"true\" routerLinkActive=\"active-link\" (click)=\"sidenav.toggle()\"><mat-icon>assignment_ind</mat-icon>Scenes</a>\r\n      <a mat-list-item [routerLink]=\"['/schedules']\" [replaceUrl]=\"true\" routerLinkActive=\"active-link\" (click)=\"sidenav.toggle()\"><mat-icon>alarm</mat-icon>Schedules</a>\r\n      <a mat-list-item [routerLink]=\"['/sensors']\" [replaceUrl]=\"true\" routerLinkActive=\"active-link\" (click)=\"sidenav.toggle()\"><mat-icon>all_out</mat-icon>Sensors</a>\r\n      <mat-divider></mat-divider>\r\n      <a mat-list-item [routerLink]=\"['/bridges']\" [replaceUrl]=\"true\" routerLinkActive=\"active-link\" (click)=\"sidenav.toggle()\"><mat-icon>device_hub</mat-icon>Bridges</a>\r\n      <a mat-list-item [routerLink]=\"['/about']\" [replaceUrl]=\"true\" routerLinkActive=\"active-link\" (click)=\"sidenav.toggle()\"><mat-icon>info</mat-icon>About</a>\r\n      <mat-divider></mat-divider>\r\n      <a mat-list-item (click)=\"toggleTheme()\"><mat-icon>invert_colors</mat-icon>Theme</a>\r\n    </mat-nav-list>\r\n  </mat-sidenav>\r\n\r\n  <router-outlet>\r\n  </router-outlet>\r\n\r\n</mat-sidenav-container>\r\n\r\n<huewi-connectionstatus>\r\n</huewi-connectionstatus>\r\n\r\n</div> <!--div class={{theme}}-->"

/***/ }),

/***/ "./src/app/app.component.ts":
/*!**********************************!*\
  !*** ./src/app/app.component.ts ***!
  \**********************************/
/*! exports provided: AppComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AppComponent", function() { return AppComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./shared/huepi.service */ "./src/app/shared/huepi.service.ts");
var __assign = (undefined && undefined.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




var AppComponent = /** @class */ (function () {
    function AppComponent(huepiService, activatedRoute, router) {
        this.huepiService = huepiService;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.title = 'hue Web Interface';
        this.theme = 'defaults-to-light';
    }
    AppComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.parametersSubscription = this.activatedRoute.queryParams.subscribe(function (params) {
            _this.parameters = __assign({}, params.keys, params);
        });
        // this.theme = 'dark-theme';
    };
    AppComponent.prototype.ngOnDestroy = function () {
        this.parametersSubscription.unsubscribe();
    };
    AppComponent.prototype.toggleTheme = function () {
        this.theme === 'dark-theme' ? this.theme = '' : this.theme = 'dark-theme';
    };
    AppComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-app-root',
            template: __webpack_require__(/*! ./app.component.html */ "./src/app/app.component.html"),
            styles: [__webpack_require__(/*! ./app.component.css */ "./src/app/app.component.css")]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_2__["HuepiService"], _angular_router__WEBPACK_IMPORTED_MODULE_1__["ActivatedRoute"], _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], AppComponent);
    return AppComponent;
}());



/***/ }),

/***/ "./src/app/app.module.ts":
/*!*******************************!*\
  !*** ./src/app/app.module.ts ***!
  \*******************************/
/*! exports provided: AppModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AppModule", function() { return AppModule; });
/* harmony import */ var _angular_platform_browser__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/platform-browser */ "./node_modules/@angular/platform-browser/fesm5/platform-browser.js");
/* harmony import */ var _app_routing_module__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./app-routing.module */ "./src/app/app-routing.module.ts");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _app_material_module__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app-material.module */ "./src/app/app-material.module.ts");
/* harmony import */ var _angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/platform-browser/animations */ "./node_modules/@angular/platform-browser/fesm5/animations.js");
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/forms */ "./node_modules/@angular/forms/fesm5/forms.js");
/* harmony import */ var hammerjs_hammer__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! hammerjs/hammer */ "./node_modules/hammerjs/hammer.js");
/* harmony import */ var hammerjs_hammer__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(hammerjs_hammer__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _pipes_pipes_module__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./pipes/pipes.module */ "./src/app/pipes/pipes.module.ts");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./shared/huepi.service */ "./src/app/shared/huepi.service.ts");
/* harmony import */ var _shared_parameters_service__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./shared/parameters.service */ "./src/app/shared/parameters.service.ts");
/* harmony import */ var _app_component__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./app.component */ "./src/app/app.component.ts");
/* harmony import */ var _huewi_home_huewi_home_component__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./huewi-home/huewi-home.component */ "./src/app/huewi-home/huewi-home.component.ts");
/* harmony import */ var _huewi_groups_huewi_groups_module__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./huewi-groups/huewi-groups.module */ "./src/app/huewi-groups/huewi-groups.module.ts");
/* harmony import */ var _huewi_lights_huewi_lights_module__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./huewi-lights/huewi-lights.module */ "./src/app/huewi-lights/huewi-lights.module.ts");
/* harmony import */ var _huewi_rules_huewi_rules_module__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./huewi-rules/huewi-rules.module */ "./src/app/huewi-rules/huewi-rules.module.ts");
/* harmony import */ var _huewi_scenes_huewi_scenes_module__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./huewi-scenes/huewi-scenes.module */ "./src/app/huewi-scenes/huewi-scenes.module.ts");
/* harmony import */ var _huewi_schedules_huewi_schedules_module__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./huewi-schedules/huewi-schedules.module */ "./src/app/huewi-schedules/huewi-schedules.module.ts");
/* harmony import */ var _huewi_sensors_huewi_sensors_module__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./huewi-sensors/huewi-sensors.module */ "./src/app/huewi-sensors/huewi-sensors.module.ts");
/* harmony import */ var _huewi_bridges_huewi_bridges_module__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./huewi-bridges/huewi-bridges.module */ "./src/app/huewi-bridges/huewi-bridges.module.ts");
/* harmony import */ var _huewi_about_huewi_about_component__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ./huewi-about/huewi-about.component */ "./src/app/huewi-about/huewi-about.component.ts");
/* harmony import */ var _huewi_connectionstatus_huewi_connectionstatus_component__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ./huewi-connectionstatus/huewi-connectionstatus.component */ "./src/app/huewi-connectionstatus/huewi-connectionstatus.component.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
// enableProdMode();






// import { NgbModule } from '@ng-bootstrap/ng-bootstrap';















var AppModule = /** @class */ (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_2__["NgModule"])({
            imports: [
                _angular_platform_browser__WEBPACK_IMPORTED_MODULE_0__["BrowserModule"],
                _angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_4__["BrowserAnimationsModule"],
                _angular_forms__WEBPACK_IMPORTED_MODULE_5__["FormsModule"],
                // NgbModule.forRoot(),
                _app_material_module__WEBPACK_IMPORTED_MODULE_3__["MaterialModule"],
                _pipes_pipes_module__WEBPACK_IMPORTED_MODULE_7__["PipesModule"],
                _huewi_groups_huewi_groups_module__WEBPACK_IMPORTED_MODULE_12__["HuewiGroupsModule"],
                _huewi_lights_huewi_lights_module__WEBPACK_IMPORTED_MODULE_13__["HuewiLightsModule"],
                _huewi_rules_huewi_rules_module__WEBPACK_IMPORTED_MODULE_14__["HuewiRulesModule"],
                _huewi_scenes_huewi_scenes_module__WEBPACK_IMPORTED_MODULE_15__["HuewiScenesModule"],
                _huewi_schedules_huewi_schedules_module__WEBPACK_IMPORTED_MODULE_16__["HuewiSchedulesModule"],
                _huewi_sensors_huewi_sensors_module__WEBPACK_IMPORTED_MODULE_17__["HuewiSensorsModule"],
                _huewi_bridges_huewi_bridges_module__WEBPACK_IMPORTED_MODULE_18__["HuewiBridgesModule"],
                _app_routing_module__WEBPACK_IMPORTED_MODULE_1__["AppRoutingModule"]
            ],
            declarations: [
                _app_component__WEBPACK_IMPORTED_MODULE_10__["AppComponent"],
                _huewi_home_huewi_home_component__WEBPACK_IMPORTED_MODULE_11__["HuewiHomeComponent"],
                _huewi_about_huewi_about_component__WEBPACK_IMPORTED_MODULE_19__["HuewiAboutComponent"],
                _huewi_connectionstatus_huewi_connectionstatus_component__WEBPACK_IMPORTED_MODULE_20__["HuewiConnectionstatusComponent"]
            ],
            providers: [
                _shared_huepi_service__WEBPACK_IMPORTED_MODULE_8__["HuepiService"],
                _shared_parameters_service__WEBPACK_IMPORTED_MODULE_9__["ParametersService"]
            ],
            bootstrap: [_app_component__WEBPACK_IMPORTED_MODULE_10__["AppComponent"]]
        })
    ], AppModule);
    return AppModule;
}());



/***/ }),

/***/ "./src/app/huewi-about/huewi-about.component.css":
/*!*******************************************************!*\
  !*** ./src/app/huewi-about/huewi-about.component.css ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/huewi-about/huewi-about.component.html":
/*!********************************************************!*\
  !*** ./src/app/huewi-about/huewi-about.component.html ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<mat-card [@RoutingAnimations]\r\n(swipeleft)=\"onTouch($event.type)\"\r\n(swiperight)=\"onTouch($event.type)\"\r\n(tap)=\"onTouch($event.type)\"\r\n(press)=\"onTouch($event.type)\">\r\n\r\n  <mat-card-title>About</mat-card-title>\r\n\r\n  <mat-card-subtitle>hue Web Interface...</mat-card-subtitle>\r\n\r\n  <mat-card>\r\n    Made with Angular 2+, Angular Material, Flexbox, HammerJS, huepi and a little focus with some patience.<br>\r\n    <small>\r\n    huepi version {{huepiVersion}}<br>\r\n    Angular version {{angularVersion}}<br>\r\n    </small>\r\n  </mat-card>\r\n  <mat-card>\r\n    Designed as a sample application for <a url='https://github.com/ArndBrugman/huepi'>huepi</a>.\r\n  </mat-card>\r\n  <mat-card>\r\n    This application can also  hide toolbar and navbar to run as a widget with parameter &widget=true.\r\n    It is even possible to use a custom homescreen with embedded widgets by using parameters like \r\n    groups=0 for a detail view on all lights group and/or sensors=1 for the daylight sensor,\r\n    give it a <a [routerLink]=\"['/home']\" [queryParams]=\"{sensors: '1', groups: '0'}\">try</a>.\r\n  </mat-card>\r\n  <mat-card *ngIf=\"touchDiscovered\">\r\n    <i>\r\n    Using HammerJS for touch-events and -sequences like you just discovered.\r\n    </i>\r\n  </mat-card>\r\n\r\n</mat-card>\r\n"

/***/ }),

/***/ "./src/app/huewi-about/huewi-about.component.ts":
/*!******************************************************!*\
  !*** ./src/app/huewi-about/huewi-about.component.ts ***!
  \******************************************************/
/*! exports provided: HuewiAboutComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiAboutComponent", function() { return HuewiAboutComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _app_routing_animations__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./../app-routing.animations */ "./src/app/app-routing.animations.ts");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




var HuewiAboutComponent = /** @class */ (function () {
    function HuewiAboutComponent(huepiService) {
        this.huepiService = huepiService;
        this.huepiVersion = 'x.x.x';
        this.angularVersion = 'x.x.x';
        this.touchSequence = ['swiperight', 'swipeleft', 'press'];
        this.touchPhase = 0;
        this.touchDiscovered = false;
    }
    Object.defineProperty(HuewiAboutComponent.prototype, "RoutingAnimations", {
        get: function () { return true; },
        enumerable: true,
        configurable: true
    });
    ;
    HuewiAboutComponent.prototype.ngOnInit = function () {
        this.huepiVersion = this.huepiService.MyHue.version;
        this.angularVersion = _angular_core__WEBPACK_IMPORTED_MODULE_0__["VERSION"].full;
        this.touchDiscovered = false;
    };
    HuewiAboutComponent.prototype.onTouch = function (event) {
        if (event === this.touchSequence[this.touchPhase]) {
            this.touchPhase++; // sequence is continueing
        }
        else {
            this.touchPhase = 0; // sequence is broken
            // however, recheck action to validate if last action matches first touch action in touchSequence
            if (event === this.touchSequence[this.touchPhase]) {
                this.touchPhase++; // yes: sequence is broken by first item in sequence
            }
        }
        if (this.touchPhase === this.touchSequence.length) {
            this.touchDiscovered = true;
        }
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["HostBinding"])('@RoutingAnimations'),
        __metadata("design:type", Object),
        __metadata("design:paramtypes", [])
    ], HuewiAboutComponent.prototype, "RoutingAnimations", null);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiAboutComponent.prototype, "touchSequence", void 0);
    HuewiAboutComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-about',
            template: __webpack_require__(/*! ./huewi-about.component.html */ "./src/app/huewi-about/huewi-about.component.html"),
            styles: [__webpack_require__(/*! ./huewi-about.component.css */ "./src/app/huewi-about/huewi-about.component.css")],
            animations: [Object(_app_routing_animations__WEBPACK_IMPORTED_MODULE_1__["RoutingAnimations"])()]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_2__["HuepiService"]])
    ], HuewiAboutComponent);
    return HuewiAboutComponent;
}());



/***/ }),

/***/ "./src/app/huewi-bridges/huewi-bridge-details/huewi-bridge-details.component.css":
/*!***************************************************************************************!*\
  !*** ./src/app/huewi-bridges/huewi-bridge-details/huewi-bridge-details.component.css ***!
  \***************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/huewi-bridges/huewi-bridge-details/huewi-bridge-details.component.html":
/*!****************************************************************************************!*\
  !*** ./src/app/huewi-bridges/huewi-bridge-details/huewi-bridge-details.component.html ***!
  \****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<mat-card>\r\n  <mat-card-subtitle>Details</mat-card-subtitle>\r\n  <div class=\"flexcontainer wrap justify-center\">\r\n    <div style=\"flex: 0 1 256px\">\r\n      Id: {{config.bridgeid.toLowerCase()}}\r\n    </div>\r\n    <div style=\"flex: 0 1 256px\">\r\n      Name: {{config.name}}\r\n    </div>\r\n    <div style=\"flex: 0 1 256px\">\r\n      Model: {{config.modelid}}\r\n    </div>\r\n    <div style=\"flex: 0 1 256px\">\r\n      Timezone: {{config.timezone}}\r\n    </div>\r\n    <div style=\"flex: 0 1 256px\">\r\n      Mac: {{config.mac}}\r\n    </div>\r\n    <div style=\"flex: 0 1 256px\">\r\n      Software: {{config.swversion}}\r\n    </div>\r\n    <div style=\"flex: 0 1 256px\">\r\n      API: {{config.apiversion}}\r\n    </div>\r\n    <div style=\"flex: 0 1 256px\">\r\n      Datastore: {{config.datastoreversion}}\r\n    </div>\r\n  </div>\r\n</mat-card>\r\n\r\n<br>\r\n\r\n<mat-card>\r\n  <mat-card-subtitle>Whitelist authorisations</mat-card-subtitle>\r\n  <div class=\"flexcontainer\" *ngFor=\"let listed of whitelist | orderBy:['-last use date']\">\r\n    <div style=\"flex: 1 1 256px\" (click)=\"link(listed.__key)\">\r\n      {{listed.name}}\r\n      <small>\r\n        {{listed[\"last use date\"]}}\r\n        <small>\r\n          <!-- {{listed[\"create date\"]}} -->\r\n          <small>\r\n            {{listed.__key}}\r\n          </small>\r\n        </small>\r\n      </small>    \r\n      <mat-icon *ngIf=\"isCurrent(listed.__key)\">link</mat-icon> \r\n    </div>\r\n    <button mat-raised-button style=\"flex: 0 1 128px\" [disabled]=\"isCurrent(listed.__key)\" (click)=\"delete(listed.__key)\">\r\n      <mat-icon *ngIf=\"isCurrent(listed.__key)\">link</mat-icon>\r\n      Delete\r\n    </button>\r\n  </div>\r\n</mat-card>\r\n"

/***/ }),

/***/ "./src/app/huewi-bridges/huewi-bridge-details/huewi-bridge-details.component.ts":
/*!**************************************************************************************!*\
  !*** ./src/app/huewi-bridges/huewi-bridge-details/huewi-bridge-details.component.ts ***!
  \**************************************************************************************/
/*! exports provided: HuewiBridgeDetailsComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiBridgeDetailsComponent", function() { return HuewiBridgeDetailsComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
/* harmony import */ var rxjs_Observable__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! rxjs/Observable */ "./node_modules/rxjs-compat/_esm5/Observable.js");
/* harmony import */ var rxjs_add_observable_of__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! rxjs/add/observable/of */ "./node_modules/rxjs-compat/_esm5/add/observable/of.js");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




var HuewiBridgeDetailsComponent = /** @class */ (function () {
    function HuewiBridgeDetailsComponent(huepiService) {
        this.huepiService = huepiService;
        this.bridge = { name: 'None' };
        this.whitelistObserver = rxjs_Observable__WEBPACK_IMPORTED_MODULE_2__["Observable"].of(this.whitelist);
        this.config = huepiService.MyHue.BridgeConfig;
        this.whitelist = huepiService.getWhitelist();
    }
    HuewiBridgeDetailsComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.whitelistObserver = this.huepiService.getWhitelist();
        this.whitelistSubscription = this.whitelistObserver.subscribe(function (value) {
            _this.whitelist = value;
        });
    };
    HuewiBridgeDetailsComponent.prototype.ngOnDestroy = function () {
        this.whitelistSubscription.unsubscribe();
    };
    HuewiBridgeDetailsComponent.prototype.isCurrent = function (key) {
        return (key === this.huepiService.MyHue.Username);
    };
    HuewiBridgeDetailsComponent.prototype.link = function (key) {
        window.open(location.origin + "/#/bridges/" + this.huepiService.MyHue.BridgeConfig.bridgeid.toLowerCase() + ":" + key);
    };
    HuewiBridgeDetailsComponent.prototype.delete = function (key) {
        this.huepiService.MyHue.BridgeDeleteUser(key);
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiBridgeDetailsComponent.prototype, "bridge", void 0);
    HuewiBridgeDetailsComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-bridge-details',
            template: __webpack_require__(/*! ./huewi-bridge-details.component.html */ "./src/app/huewi-bridges/huewi-bridge-details/huewi-bridge-details.component.html"),
            styles: [__webpack_require__(/*! ./huewi-bridge-details.component.css */ "./src/app/huewi-bridges/huewi-bridge-details/huewi-bridge-details.component.css")]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_1__["HuepiService"]])
    ], HuewiBridgeDetailsComponent);
    return HuewiBridgeDetailsComponent;
}());



/***/ }),

/***/ "./src/app/huewi-bridges/huewi-bridge/huewi-bridge.component.css":
/*!***********************************************************************!*\
  !*** ./src/app/huewi-bridges/huewi-bridge/huewi-bridge.component.css ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/huewi-bridges/huewi-bridge/huewi-bridge.component.html":
/*!************************************************************************!*\
  !*** ./src/app/huewi-bridges/huewi-bridge/huewi-bridge.component.html ***!
  \************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div class=\"flexcontainer\" (click)=\"select(bridge)\">\r\n  <div style=\"flex: 1 1 128px\">\r\n    {{bridge.id.toLowerCase()}}\r\n    <mat-icon *ngIf=\"bridge.id.toLowerCase() === config.bridgeid.toLowerCase()\">link</mat-icon>\r\n  </div>\r\n  <div style=\"flex: 1 1 128px\" *ngIf=\"bridge.name\">\r\n    Name: {{bridge.name}}\r\n  </div>\r\n  <div style=\"flex: 1 1 128px\">\r\n    {{bridge.internalipaddress}}\r\n  </div>\r\n</div>\r\n"

/***/ }),

/***/ "./src/app/huewi-bridges/huewi-bridge/huewi-bridge.component.ts":
/*!**********************************************************************!*\
  !*** ./src/app/huewi-bridges/huewi-bridge/huewi-bridge.component.ts ***!
  \**********************************************************************/
/*! exports provided: HuewiBridgeComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiBridgeComponent", function() { return HuewiBridgeComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var HuewiBridgeComponent = /** @class */ (function () {
    function HuewiBridgeComponent(huepiService, router) {
        this.huepiService = huepiService;
        this.router = router;
        this.config = this.huepiService.MyHue.BridgeConfig;
    }
    HuewiBridgeComponent.prototype.ngOnInit = function () {
    };
    HuewiBridgeComponent.prototype.select = function (bridge) {
        var _this = this;
        this.huepiService.MyHue.BridgeGetConfig(bridge.internalipaddress).then(function (data) {
            _this.huepiService.connect(bridge.internalipaddress);
            _this.config = _this.huepiService.MyHue.BridgeConfig;
            _this.huepiService.MyHue.BridgeIP = bridge.internalipaddress;
            _this.router.navigate(['/bridges', bridge.__key], { replaceUrl: true });
        });
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiBridgeComponent.prototype, "bridge", void 0);
    HuewiBridgeComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-bridge',
            template: __webpack_require__(/*! ./huewi-bridge.component.html */ "./src/app/huewi-bridges/huewi-bridge/huewi-bridge.component.html"),
            styles: [__webpack_require__(/*! ./huewi-bridge.component.css */ "./src/app/huewi-bridges/huewi-bridge/huewi-bridge.component.css")]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_2__["HuepiService"], _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], HuewiBridgeComponent);
    return HuewiBridgeComponent;
}());



/***/ }),

/***/ "./src/app/huewi-bridges/huewi-bridges-routing.module.ts":
/*!***************************************************************!*\
  !*** ./src/app/huewi-bridges/huewi-bridges-routing.module.ts ***!
  \***************************************************************/
/*! exports provided: HuewiBridgesRoutingModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiBridgesRoutingModule", function() { return HuewiBridgesRoutingModule; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _huewi_bridges_component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./huewi-bridges.component */ "./src/app/huewi-bridges/huewi-bridges.component.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};



var huewiBridgesRoutes = [
    { path: 'bridges', component: _huewi_bridges_component__WEBPACK_IMPORTED_MODULE_2__["HuewiBridgesComponent"] },
    { path: 'bridges/:id', component: _huewi_bridges_component__WEBPACK_IMPORTED_MODULE_2__["HuewiBridgesComponent"] }
];
var HuewiBridgesRoutingModule = /** @class */ (function () {
    function HuewiBridgesRoutingModule() {
    }
    HuewiBridgesRoutingModule = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["NgModule"])({
            imports: [
                _angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"].forChild(huewiBridgesRoutes)
            ],
            exports: [
                _angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"]
            ]
        })
    ], HuewiBridgesRoutingModule);
    return HuewiBridgesRoutingModule;
}());



/***/ }),

/***/ "./src/app/huewi-bridges/huewi-bridges.component.css":
/*!***********************************************************!*\
  !*** ./src/app/huewi-bridges/huewi-bridges.component.css ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "input {\r\n    text-align: center;\r\n    font-size: 14px;\r\n}"

/***/ }),

/***/ "./src/app/huewi-bridges/huewi-bridges.component.html":
/*!************************************************************!*\
  !*** ./src/app/huewi-bridges/huewi-bridges.component.html ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<mat-card [@RoutingAnimations]>\r\n\r\n  <div *ngIf=\"!selectedBridge\">\r\n  <mat-card-title>Bridges</mat-card-title>\r\n    <div class=\"flexcontainer wrap justify-center\">\r\n      <button mat-raised-button style=\"flex: 0 1 128px\" (click)=\"discover()\">Discover</button>\r\n      <button mat-raised-button style=\"flex: 0 1 128px\" (click)=\"scan()\" *ngIf=\"!isScanning()\">Scan</button>\r\n      <button mat-raised-button style=\"flex: 0 1 128px\" (click)=\"cancelScan()\" color=\"accent\" *ngIf=\"isScanning()\">Cancel Scan</button>\r\n      <button mat-raised-button style=\"flex: 0 1 128px\" [disabled]=\"true\">Manual IP:</button>\r\n      <input style=\"flex: 0 1 128px\" [(ngModel)]=\"manualIP\" (keydown.enter)=\"connect()\">\r\n      <button mat-raised-button style=\"flex: 0 1 128px\" (click)=\"connect()\">Connect</button>\r\n      <button mat-raised-button style=\"flex: 0 1 128px\" (click)=\"reload()\">Reload</button>\r\n    </div>\r\n    <br>\r\n    <mat-list>\r\n      <huewi-bridge mat-list-item *ngFor=\"let bridge of bridges\" [bridge]=\"bridge\">\r\n      </huewi-bridge>\r\n    </mat-list>\r\n  </div>\r\n\r\n  <div *ngIf=\"selectedBridge\">\r\n    <mat-card-title>\r\n      <a *ngIf=\"back\" [routerLink]=\"['/bridges']\" [replaceUrl]=\"true\"><mat-icon>navigate_before</mat-icon></a>\r\n      Bridge Details\r\n    </mat-card-title>    \r\n    <huewi-bridge-details [bridge]=\"selectedBridge\">\r\n    </huewi-bridge-details>\r\n  </div>\r\n\r\n</mat-card>\r\n"

/***/ }),

/***/ "./src/app/huewi-bridges/huewi-bridges.component.ts":
/*!**********************************************************!*\
  !*** ./src/app/huewi-bridges/huewi-bridges.component.ts ***!
  \**********************************************************/
/*! exports provided: HuewiBridgesComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiBridgesComponent", function() { return HuewiBridgesComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _app_routing_animations__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./../app-routing.animations */ "./src/app/app-routing.animations.ts");
/* harmony import */ var _huewi_bridges_mock__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./huewi-bridges.mock */ "./src/app/huewi-bridges/huewi-bridges.mock.ts");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
/* harmony import */ var _shared_parameters_service__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../shared/parameters.service */ "./src/app/shared/parameters.service.ts");
/* harmony import */ var rxjs_Observable__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! rxjs/Observable */ "./node_modules/rxjs-compat/_esm5/Observable.js");
/* harmony import */ var rxjs_add_observable_of__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! rxjs/add/observable/of */ "./node_modules/rxjs-compat/_esm5/add/observable/of.js");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};









var HuewiBridgesComponent = /** @class */ (function () {
    function HuewiBridgesComponent(huepiService, parametersService, activatedRoute, router) {
        this.huepiService = huepiService;
        this.parametersService = parametersService;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.bridges = _huewi_bridges_mock__WEBPACK_IMPORTED_MODULE_3__["HUEWI_BRIDGES_MOCK"];
        this.back = true;
        this.manualIP = '192.168.0.2';
        this.bridgeObserver = rxjs_Observable__WEBPACK_IMPORTED_MODULE_6__["Observable"].of(this.bridges);
        this.selectedBridge = undefined;
    }
    Object.defineProperty(HuewiBridgesComponent.prototype, "RoutingAnimations", {
        get: function () { return true; },
        enumerable: true,
        configurable: true
    });
    ;
    HuewiBridgesComponent.prototype.ngOnInit = function () {
        var _this = this;
        var parameters = this.parametersService.getParameters();
        if (parameters['widget']) {
            this.back = false;
        }
        this.bridgeObserver = this.huepiService.getBridges();
        this.bridgesSubscription = this.bridgeObserver.subscribe(function (value) {
            _this.bridges = value;
            _this.updateSelected();
        });
    };
    HuewiBridgesComponent.prototype.ngOnDestroy = function () {
        this.bridgesSubscription.unsubscribe();
    };
    HuewiBridgesComponent.prototype.updateSelected = function () {
        var id = this.activatedRoute.snapshot.paramMap.get('id') || '';
        if (id.indexOf(':') > 0) { // Parameters contain bridgeId:whitelistKey
            var bridgeId = id.substr(0, id.indexOf(':'));
            var whitelistKey = id.substr(id.indexOf(':') + 1);
            this.huepiService.MyHue.BridgeCache[bridgeId] = whitelistKey;
            this.huepiService.MyHue._BridgeCacheSave();
            this.router.navigate(['/bridges'], { replaceUrl: true });
            this.reload();
        }
        this.selectedBridge = this.huepiService.MyHue.LocalBridges[id];
    };
    HuewiBridgesComponent.prototype.discover = function () {
        this.huepiService.discover();
    };
    HuewiBridgesComponent.prototype.scan = function () {
        this.huepiService.scan();
    };
    HuewiBridgesComponent.prototype.isScanning = function () {
        return this.huepiService.isScanning();
    };
    HuewiBridgesComponent.prototype.cancelScan = function () {
        this.huepiService.cancelScan();
    };
    HuewiBridgesComponent.prototype.reload = function () {
        delete localStorage.MyHueBridgeIP;
        window.location.reload(true);
    };
    HuewiBridgesComponent.prototype.connect = function () {
        this.huepiService.connect(this.manualIP);
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["HostBinding"])('@RoutingAnimations'),
        __metadata("design:type", Object),
        __metadata("design:paramtypes", [])
    ], HuewiBridgesComponent.prototype, "RoutingAnimations", null);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiBridgesComponent.prototype, "bridges", void 0);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiBridgesComponent.prototype, "back", void 0);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiBridgesComponent.prototype, "manualIP", void 0);
    HuewiBridgesComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-bridges',
            template: __webpack_require__(/*! ./huewi-bridges.component.html */ "./src/app/huewi-bridges/huewi-bridges.component.html"),
            styles: [__webpack_require__(/*! ./huewi-bridges.component.css */ "./src/app/huewi-bridges/huewi-bridges.component.css")],
            animations: [Object(_app_routing_animations__WEBPACK_IMPORTED_MODULE_2__["RoutingAnimations"])()]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_4__["HuepiService"], _shared_parameters_service__WEBPACK_IMPORTED_MODULE_5__["ParametersService"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["ActivatedRoute"], _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], HuewiBridgesComponent);
    return HuewiBridgesComponent;
}());



/***/ }),

/***/ "./src/app/huewi-bridges/huewi-bridges.mock.ts":
/*!*****************************************************!*\
  !*** ./src/app/huewi-bridges/huewi-bridges.mock.ts ***!
  \*****************************************************/
/*! exports provided: HUEWI_BRIDGES_MOCK */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HUEWI_BRIDGES_MOCK", function() { return HUEWI_BRIDGES_MOCK; });
var HUEWI_BRIDGES_MOCK = [];


/***/ }),

/***/ "./src/app/huewi-bridges/huewi-bridges.module.ts":
/*!*******************************************************!*\
  !*** ./src/app/huewi-bridges/huewi-bridges.module.ts ***!
  \*******************************************************/
/*! exports provided: HuewiBridgesModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiBridgesModule", function() { return HuewiBridgesModule; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/common */ "./node_modules/@angular/common/fesm5/common.js");
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/forms */ "./node_modules/@angular/forms/fesm5/forms.js");
/* harmony import */ var _pipes_pipes_module__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../pipes/pipes.module */ "./src/app/pipes/pipes.module.ts");
/* harmony import */ var _app_material_module__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../app-material.module */ "./src/app/app-material.module.ts");
/* harmony import */ var _huewi_bridges_component__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./huewi-bridges.component */ "./src/app/huewi-bridges/huewi-bridges.component.ts");
/* harmony import */ var _huewi_bridge_huewi_bridge_component__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./huewi-bridge/huewi-bridge.component */ "./src/app/huewi-bridges/huewi-bridge/huewi-bridge.component.ts");
/* harmony import */ var _huewi_bridge_details_huewi_bridge_details_component__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./huewi-bridge-details/huewi-bridge-details.component */ "./src/app/huewi-bridges/huewi-bridge-details/huewi-bridge-details.component.ts");
/* harmony import */ var _huewi_bridges_routing_module__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./huewi-bridges-routing.module */ "./src/app/huewi-bridges/huewi-bridges-routing.module.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};









var HuewiBridgesModule = /** @class */ (function () {
    function HuewiBridgesModule() {
    }
    HuewiBridgesModule = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["NgModule"])({
            imports: [
                _angular_common__WEBPACK_IMPORTED_MODULE_1__["CommonModule"],
                _angular_forms__WEBPACK_IMPORTED_MODULE_2__["FormsModule"],
                _pipes_pipes_module__WEBPACK_IMPORTED_MODULE_3__["PipesModule"],
                _app_material_module__WEBPACK_IMPORTED_MODULE_4__["MaterialModule"],
                _huewi_bridges_routing_module__WEBPACK_IMPORTED_MODULE_8__["HuewiBridgesRoutingModule"]
            ],
            declarations: [
                _huewi_bridges_component__WEBPACK_IMPORTED_MODULE_5__["HuewiBridgesComponent"],
                _huewi_bridge_huewi_bridge_component__WEBPACK_IMPORTED_MODULE_6__["HuewiBridgeComponent"],
                _huewi_bridge_details_huewi_bridge_details_component__WEBPACK_IMPORTED_MODULE_7__["HuewiBridgeDetailsComponent"]
            ],
            exports: [
                _huewi_bridges_component__WEBPACK_IMPORTED_MODULE_5__["HuewiBridgesComponent"],
                _huewi_bridge_huewi_bridge_component__WEBPACK_IMPORTED_MODULE_6__["HuewiBridgeComponent"],
                _huewi_bridge_details_huewi_bridge_details_component__WEBPACK_IMPORTED_MODULE_7__["HuewiBridgeDetailsComponent"]
            ]
        })
    ], HuewiBridgesModule);
    return HuewiBridgesModule;
}());



/***/ }),

/***/ "./src/app/huewi-connectionstatus/huewi-connectionstatus.component.css":
/*!*****************************************************************************!*\
  !*** ./src/app/huewi-connectionstatus/huewi-connectionstatus.component.css ***!
  \*****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ".status {\r\n    text-align: center;\r\n    position: fixed;\r\n    width: 100%;\r\n    left: -8px;\r\n    bottom: -8px;\r\n    z-index: 999;\r\n}\r\n"

/***/ }),

/***/ "./src/app/huewi-connectionstatus/huewi-connectionstatus.component.html":
/*!******************************************************************************!*\
  !*** ./src/app/huewi-connectionstatus/huewi-connectionstatus.component.html ***!
  \******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<mat-card class=\"status\" *ngIf=\"getStatus() !== 'Connected'\" [@StatusAnimations]>\r\n\r\n  <mat-progress-bar [color]=\"warn\" mode=\"indeterminate\"></mat-progress-bar>\r\n  <mat-toolbar  >\r\n    <div>{{getStatus()}}</div>\r\n  </mat-toolbar>\r\n  <mat-toolbar [color]=\"accent\" *ngIf=\"getMessage() !== ''\" [@StatusAnimations]>\r\n    <small><small><div>{{getMessage()}}</div></small></small>\r\n  </mat-toolbar>\r\n\r\n</mat-card>\r\n"

/***/ }),

/***/ "./src/app/huewi-connectionstatus/huewi-connectionstatus.component.ts":
/*!****************************************************************************!*\
  !*** ./src/app/huewi-connectionstatus/huewi-connectionstatus.component.ts ***!
  \****************************************************************************/
/*! exports provided: HuewiConnectionstatusComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiConnectionstatusComponent", function() { return HuewiConnectionstatusComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_animations__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/animations */ "./node_modules/@angular/animations/fesm5/animations.js");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var HuewiConnectionstatusComponent = /** @class */ (function () {
    function HuewiConnectionstatusComponent(huepiService) {
        this.huepiService = huepiService;
    }
    Object.defineProperty(HuewiConnectionstatusComponent.prototype, "StatusAnimations", {
        get: function () { return true; },
        enumerable: true,
        configurable: true
    });
    ;
    HuewiConnectionstatusComponent.prototype.ngOnInit = function () {
    };
    HuewiConnectionstatusComponent.prototype.getStatus = function () {
        return this.huepiService.getStatus();
    };
    HuewiConnectionstatusComponent.prototype.getMessage = function () {
        return this.huepiService.getMessage();
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["HostBinding"])('@StatusAnimations'),
        __metadata("design:type", Object),
        __metadata("design:paramtypes", [])
    ], HuewiConnectionstatusComponent.prototype, "StatusAnimations", null);
    HuewiConnectionstatusComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-connectionstatus',
            template: __webpack_require__(/*! ./huewi-connectionstatus.component.html */ "./src/app/huewi-connectionstatus/huewi-connectionstatus.component.html"),
            styles: [__webpack_require__(/*! ./huewi-connectionstatus.component.css */ "./src/app/huewi-connectionstatus/huewi-connectionstatus.component.css")],
            animations: [
                Object(_angular_animations__WEBPACK_IMPORTED_MODULE_1__["trigger"])('StatusAnimations', [
                    Object(_angular_animations__WEBPACK_IMPORTED_MODULE_1__["state"])('void', Object(_angular_animations__WEBPACK_IMPORTED_MODULE_1__["style"])({ opacity: 0, transform: 'translate3d(0, 32px, 0)' })),
                    Object(_angular_animations__WEBPACK_IMPORTED_MODULE_1__["state"])('*', Object(_angular_animations__WEBPACK_IMPORTED_MODULE_1__["style"])({ opacity: 1, transform: 'translate3d(0, 0, 0)' })),
                    Object(_angular_animations__WEBPACK_IMPORTED_MODULE_1__["transition"])(':enter', [
                        Object(_angular_animations__WEBPACK_IMPORTED_MODULE_1__["animate"])('0.5s ease-in-out')
                    ]),
                    Object(_angular_animations__WEBPACK_IMPORTED_MODULE_1__["transition"])(':leave', [
                        Object(_angular_animations__WEBPACK_IMPORTED_MODULE_1__["animate"])('1.0s ease-in-out')
                    ])
                ])
            ]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_2__["HuepiService"]])
    ], HuewiConnectionstatusComponent);
    return HuewiConnectionstatusComponent;
}());



/***/ }),

/***/ "./src/app/huewi-groups/huewi-group-details/huewi-group-details.component.css":
/*!************************************************************************************!*\
  !*** ./src/app/huewi-groups/huewi-group-details/huewi-group-details.component.css ***!
  \************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/huewi-groups/huewi-group-details/huewi-group-details.component.html":
/*!*************************************************************************************!*\
  !*** ./src/app/huewi-groups/huewi-group-details/huewi-group-details.component.html ***!
  \*************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<huewi-group [group]=\"group\" [editable]=\"group.__key !== '0'\">\r\n</huewi-group>\r\n\r\n<br>\r\n\r\n<div class=\"flexcontainer wrap justify-center\">\r\n  <button mat-raised-button style=\"flex: 1 1 128px\" (click)=\"relax(group)\">Relax</button>\r\n  <button mat-raised-button style=\"flex: 1 1 128px\" (click)=\"reading(group)\">Reading</button>\r\n  <button mat-raised-button style=\"flex: 1 1 128px\" (click)=\"concentrate(group)\">Concentrate</button>\r\n  <button mat-raised-button style=\"flex: 1 1 128px\" (click)=\"energize(group)\">Energize</button>\r\n  <button mat-raised-button style=\"flex: 1 1 128px\" (click)=\"bright(group)\">Bright</button>\r\n  <button mat-raised-button style=\"flex: 1 1 128px\" (click)=\"dimmed(group)\">Dimmed</button>\r\n  <button mat-raised-button style=\"flex: 1 1 128px\" (click)=\"nightLight(group)\">Nightlight</button>\r\n  <button mat-raised-button style=\"flex: 1 1 128px\" (click)=\"goldenHour(group)\">Golden hour</button>\r\n</div>\r\n\r\n<br>\r\n\r\n<div class=\"flexcontainer wrap justify-center\" *ngIf=\"group.__key !== '0'\">\r\n  <mat-checkbox style=\"flex: 0 1 128px\" *ngFor=\"let light of lights | orderBy : '+name'\"\r\n  [checked]=\"hasLight(light.__key)\" (click)=\"toggleLight(light.__key)\">\r\n    {{light.name}}\r\n  </mat-checkbox>\r\n</div>\r\n\r\n<br>\r\n\r\n<div class=\"flexcontainer justify-end\" *ngIf=\"group.__key !== '0'\">\r\n  <small>\r\n    <i>Lights can be part of multple LightGroups but only one Room.</i>\r\n    <mat-icon>info_outline</mat-icon>\r\n  </small>\r\n</div>\r\n"

/***/ }),

/***/ "./src/app/huewi-groups/huewi-group-details/huewi-group-details.component.ts":
/*!***********************************************************************************!*\
  !*** ./src/app/huewi-groups/huewi-group-details/huewi-group-details.component.ts ***!
  \***********************************************************************************/
/*! exports provided: HuewiGroupDetailsComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiGroupDetailsComponent", function() { return HuewiGroupDetailsComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var HuewiGroupDetailsComponent = /** @class */ (function () {
    function HuewiGroupDetailsComponent(huepiService) {
        this.huepiService = huepiService;
        this.group = { __key: '0' };
    }
    HuewiGroupDetailsComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.lightsSubscription = this.huepiService.getLights().subscribe(function (value) {
            _this.lights = value;
        });
    };
    HuewiGroupDetailsComponent.prototype.ngOnDestroy = function () {
        this.lightsSubscription.unsubscribe();
    };
    HuewiGroupDetailsComponent.prototype.setCTBrightness = function (group, CT, Brightness) {
        this.huepiService.MyHue.GroupOn(group.__key);
        this.huepiService.MyHue.GroupSetCT(group.__key, CT);
        this.huepiService.MyHue.GroupSetBrightness(group.__key, Brightness);
    };
    HuewiGroupDetailsComponent.prototype.relax = function (group) {
        this.setCTBrightness(group, 447, 144);
    };
    HuewiGroupDetailsComponent.prototype.reading = function (group) {
        this.setCTBrightness(group, 346, 254);
    };
    HuewiGroupDetailsComponent.prototype.concentrate = function (group) {
        this.setCTBrightness(group, 234, 254);
    };
    HuewiGroupDetailsComponent.prototype.energize = function (group) {
        this.setCTBrightness(group, 153, 254);
    };
    HuewiGroupDetailsComponent.prototype.bright = function (group) {
        this.setCTBrightness(group, 367, 254);
    };
    HuewiGroupDetailsComponent.prototype.dimmed = function (group) {
        this.setCTBrightness(group, 365, 77);
    };
    HuewiGroupDetailsComponent.prototype.nightLight = function (group) {
        this.setCTBrightness(group, 500, 1);
    };
    HuewiGroupDetailsComponent.prototype.goldenHour = function (group) {
        this.setCTBrightness(group, 400, 125);
    };
    HuewiGroupDetailsComponent.prototype.hasLight = function (lightId) {
        return this.huepiService.MyHue.GroupHasLight(this.group.__key, lightId);
    };
    HuewiGroupDetailsComponent.prototype.toggleLight = function (lightId) {
        this.huepiService.MyHue.LightAlertSelect(lightId);
        this.huepiService.MyHue.GroupToggleLight(this.group.__key, lightId);
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiGroupDetailsComponent.prototype, "group", void 0);
    HuewiGroupDetailsComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-group-details',
            template: __webpack_require__(/*! ./huewi-group-details.component.html */ "./src/app/huewi-groups/huewi-group-details/huewi-group-details.component.html"),
            styles: [__webpack_require__(/*! ./huewi-group-details.component.css */ "./src/app/huewi-groups/huewi-group-details/huewi-group-details.component.css")]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_1__["HuepiService"]])
    ], HuewiGroupDetailsComponent);
    return HuewiGroupDetailsComponent;
}());



/***/ }),

/***/ "./src/app/huewi-groups/huewi-group/huewi-group.component.css":
/*!********************************************************************!*\
  !*** ./src/app/huewi-groups/huewi-group/huewi-group.component.css ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/huewi-groups/huewi-group/huewi-group.component.html":
/*!*********************************************************************!*\
  !*** ./src/app/huewi-groups/huewi-group/huewi-group.component.html ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div class=\"flexcontainer\">\r\n  <mat-form-field *ngIf=\"editable\" style=\"flex: 1 1 50px\">\r\n    <input matInput [(ngModel)]=\"group.name\" (keyup)=\"rename(group, $event.target.value)\">\r\n  </mat-form-field>\r\n  <div *ngIf=\"!editable\" style=\"flex: 1 1 50px\"\r\n    (click)=\"select(group)\">\r\n    {{group.name}}\r\n  </div>\r\n  <mat-slider style=\"flex: 5 1 100px\"\r\n    (change)=\"brightness(group, $event.value)\"\r\n    disabled=\"{{!group.action.on}}\"\r\n    [min]=\"0\" [max]=\"255\" [step]=\"1\" [value]=\"group.action.bri\">\r\n  </mat-slider>\r\n  <mat-slide-toggle style=\"flex: 0 1 10px\"\r\n    [checked]=\"group.action.on\"\r\n    (change)=\"toggle(group)\">\r\n  </mat-slide-toggle>\r\n</div>\r\n"

/***/ }),

/***/ "./src/app/huewi-groups/huewi-group/huewi-group.component.ts":
/*!*******************************************************************!*\
  !*** ./src/app/huewi-groups/huewi-group/huewi-group.component.ts ***!
  \*******************************************************************/
/*! exports provided: HuewiGroupComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiGroupComponent", function() { return HuewiGroupComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var HuewiGroupComponent = /** @class */ (function () {
    function HuewiGroupComponent(huepiService, router) {
        this.huepiService = huepiService;
        this.router = router;
        this.editable = false;
    }
    HuewiGroupComponent.prototype.ngOnInit = function () {
    };
    HuewiGroupComponent.prototype.select = function (group) {
        this.huepiService.MyHue.GroupAlertSelect(group.__key);
        this.router.navigate(['/groups', group.__key], { replaceUrl: true });
    };
    HuewiGroupComponent.prototype.rename = function (group, name) {
        this.huepiService.MyHue.GroupSetName(group.__key, name);
    };
    HuewiGroupComponent.prototype.brightness = function (group, value) {
        this.huepiService.MyHue.GroupSetBrightness(group.__key, value);
    };
    HuewiGroupComponent.prototype.toggle = function (group) {
        if (group.action.on === true) {
            this.huepiService.MyHue.GroupOff(group.__key);
        }
        else {
            this.huepiService.MyHue.GroupOn(group.__key);
        }
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiGroupComponent.prototype, "group", void 0);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiGroupComponent.prototype, "editable", void 0);
    HuewiGroupComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-group',
            template: __webpack_require__(/*! ./huewi-group.component.html */ "./src/app/huewi-groups/huewi-group/huewi-group.component.html"),
            styles: [__webpack_require__(/*! ./huewi-group.component.css */ "./src/app/huewi-groups/huewi-group/huewi-group.component.css")]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_2__["HuepiService"], _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], HuewiGroupComponent);
    return HuewiGroupComponent;
}());



/***/ }),

/***/ "./src/app/huewi-groups/huewi-groups-routing.module.ts":
/*!*************************************************************!*\
  !*** ./src/app/huewi-groups/huewi-groups-routing.module.ts ***!
  \*************************************************************/
/*! exports provided: HuewiGroupsRoutingModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiGroupsRoutingModule", function() { return HuewiGroupsRoutingModule; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _huewi_groups_component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./huewi-groups.component */ "./src/app/huewi-groups/huewi-groups.component.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};



var huewiGroupsRoutes = [
    { path: 'groups', component: _huewi_groups_component__WEBPACK_IMPORTED_MODULE_2__["HuewiGroupsComponent"] },
    { path: 'groups/:id', component: _huewi_groups_component__WEBPACK_IMPORTED_MODULE_2__["HuewiGroupsComponent"] }
];
var HuewiGroupsRoutingModule = /** @class */ (function () {
    function HuewiGroupsRoutingModule() {
    }
    HuewiGroupsRoutingModule = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["NgModule"])({
            imports: [
                _angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"].forChild(huewiGroupsRoutes)
            ],
            exports: [
                _angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"]
            ]
        })
    ], HuewiGroupsRoutingModule);
    return HuewiGroupsRoutingModule;
}());



/***/ }),

/***/ "./src/app/huewi-groups/huewi-groups.component.css":
/*!*********************************************************!*\
  !*** ./src/app/huewi-groups/huewi-groups.component.css ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/huewi-groups/huewi-groups.component.html":
/*!**********************************************************!*\
  !*** ./src/app/huewi-groups/huewi-groups.component.html ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<mat-card [@RoutingAnimations]>\r\n\r\n  <div *ngIf=\"!selectedGroup\">\r\n    <mat-card-title>\r\n      <span (click)=\"changeGroupsType()\">{{groupsType}}</span>\r\n      <small>\r\n        <mat-form-field>\r\n          <input matInput placeholder=\"Filter\" [(ngModel)]=\"searchText\">\r\n        </mat-form-field>\r\n      </small>\r\n    </mat-card-title>\r\n    <huewi-group \r\n      *ngFor=\"let group of groups | HuewiGroupsFilter:groupsType | orderBy:['+type','+name'] | filter:searchText:'name'\"\r\n      [group]=\"group\">\r\n    </huewi-group>\r\n  </div> \r\n\r\n  <div *ngIf=\"selectedGroup\">\r\n    <mat-card-title>\r\n      <a *ngIf=\"back\" [routerLink]=\"['/groups']\" [replaceUrl]=\"true\"><mat-icon>navigate_before</mat-icon></a>\r\n      {{selectedGroup.name}} - Details\r\n    </mat-card-title>\r\n    <huewi-group-details\r\n      [group]=\"selectedGroup\">\r\n    </huewi-group-details>\r\n  </div>\r\n\r\n</mat-card>\r\n"

/***/ }),

/***/ "./src/app/huewi-groups/huewi-groups.component.ts":
/*!********************************************************!*\
  !*** ./src/app/huewi-groups/huewi-groups.component.ts ***!
  \********************************************************/
/*! exports provided: HuewiGroupsComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiGroupsComponent", function() { return HuewiGroupsComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _app_routing_animations__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./../app-routing.animations */ "./src/app/app-routing.animations.ts");
/* harmony import */ var _huewi_groups_mock__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./huewi-groups.mock */ "./src/app/huewi-groups/huewi-groups.mock.ts");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
/* harmony import */ var _shared_parameters_service__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../shared/parameters.service */ "./src/app/shared/parameters.service.ts");
/* harmony import */ var rxjs_Observable__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! rxjs/Observable */ "./node_modules/rxjs-compat/_esm5/Observable.js");
/* harmony import */ var rxjs_add_observable_of__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! rxjs/add/observable/of */ "./node_modules/rxjs-compat/_esm5/add/observable/of.js");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};









var HuewiGroupsComponent = /** @class */ (function () {
    function HuewiGroupsComponent(huepiService, parametersService, activatedRoute, router) {
        this.huepiService = huepiService;
        this.parametersService = parametersService;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.groupsType = 'Rooms';
        this.groups = _huewi_groups_mock__WEBPACK_IMPORTED_MODULE_3__["HUEWI_GROUPS_MOCK"];
        this.back = true;
        this.groupObserver = rxjs_Observable__WEBPACK_IMPORTED_MODULE_6__["Observable"].of(this.groups);
        this.selectedGroup = undefined;
    }
    Object.defineProperty(HuewiGroupsComponent.prototype, "RoutingAnimations", {
        get: function () { return true; },
        enumerable: true,
        configurable: true
    });
    ;
    HuewiGroupsComponent.prototype.ngOnInit = function () {
        var _this = this;
        var parameters = this.parametersService.getParameters();
        if (parameters['widget']) {
            this.back = false;
        }
        this.groupObserver = this.huepiService.getGroups();
        this.groupsSubscription = this.groupObserver.subscribe(function (value) {
            _this.groups = value;
            _this.updateSelected();
        });
    };
    HuewiGroupsComponent.prototype.ngOnDestroy = function () {
        this.groupsSubscription.unsubscribe();
    };
    HuewiGroupsComponent.prototype.updateSelected = function () {
        var id = this.activatedRoute.snapshot.paramMap.get('id');
        this.selectedGroup = this.huepiService.MyHue.Groups[id];
    };
    HuewiGroupsComponent.prototype.changeGroupsType = function () {
        if (this.groupsType === 'Rooms') {
            this.groupsType = 'LightGroups';
        }
        else if (this.groupsType === 'LightGroups') {
            this.groupsType = 'LightGroups & Rooms';
        }
        else {
            this.groupsType = 'Rooms';
        }
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["HostBinding"])('@RoutingAnimations'),
        __metadata("design:type", Object),
        __metadata("design:paramtypes", [])
    ], HuewiGroupsComponent.prototype, "RoutingAnimations", null);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiGroupsComponent.prototype, "groups", void 0);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiGroupsComponent.prototype, "back", void 0);
    HuewiGroupsComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-groups',
            template: __webpack_require__(/*! ./huewi-groups.component.html */ "./src/app/huewi-groups/huewi-groups.component.html"),
            styles: [__webpack_require__(/*! ./huewi-groups.component.css */ "./src/app/huewi-groups/huewi-groups.component.css")],
            animations: [Object(_app_routing_animations__WEBPACK_IMPORTED_MODULE_2__["RoutingAnimations"])()]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_4__["HuepiService"], _shared_parameters_service__WEBPACK_IMPORTED_MODULE_5__["ParametersService"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["ActivatedRoute"], _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], HuewiGroupsComponent);
    return HuewiGroupsComponent;
}());



/***/ }),

/***/ "./src/app/huewi-groups/huewi-groups.filter.ts":
/*!*****************************************************!*\
  !*** ./src/app/huewi-groups/huewi-groups.filter.ts ***!
  \*****************************************************/
/*! exports provided: HuewiGroupsFilter */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiGroupsFilter", function() { return HuewiGroupsFilter; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};

var HuewiGroupsFilter = /** @class */ (function () {
    function HuewiGroupsFilter() {
    }
    HuewiGroupsFilter.prototype.transform = function (groups, type) {
        if (type === 'Rooms') {
            return groups.filter(function (group) { return group.type === 'Room'; });
        }
        else if (type === 'LightGroups') {
            return groups.filter(function (group) { return group.type === 'LightGroup'; });
        }
        else {
            return groups;
        }
    };
    HuewiGroupsFilter = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Pipe"])({ name: 'HuewiGroupsFilter' })
    ], HuewiGroupsFilter);
    return HuewiGroupsFilter;
}());



/***/ }),

/***/ "./src/app/huewi-groups/huewi-groups.mock.ts":
/*!***************************************************!*\
  !*** ./src/app/huewi-groups/huewi-groups.mock.ts ***!
  \***************************************************/
/*! exports provided: HUEWI_GROUPS_MOCK */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HUEWI_GROUPS_MOCK", function() { return HUEWI_GROUPS_MOCK; });
var HUEWI_GROUPS_MOCK = [
    {
        "name": "Living Group",
        "lights": ["10", "9", "6", "7", "8", "3", "2"],
        "type": "LightGroup",
        "state": {
            "all_on": true,
            "any_on": true
        },
        "recycle": false,
        "action": {
            "on": true,
            "bri": 144,
            "hue": 13524,
            "sat": 200,
            "effect": "none",
            "xy": [0.5017, 0.4152],
            "ct": 443,
            "alert": "none",
            "colormode": "xy"
        }
    },
    {
        "name": "Salon Group",
        "lights": ["6", "8", "7"],
        "type": "LightGroup",
        "state": {
            "all_on": true,
            "any_on": true
        },
        "recycle": false,
        "action": {
            "on": true,
            "bri": 144,
            "hue": 13524,
            "sat": 200,
            "effect": "none",
            "xy": [0.5017, 0.4152],
            "ct": 443,
            "alert": "select",
            "colormode": "xy"
        }
    },
    {
        "name": "Dining Group",
        "lights": ["14", "13", "11", "12"],
        "type": "LightGroup",
        "state": {
            "all_on": false,
            "any_on": false
        },
        "recycle": false,
        "action": {
            "on": false,
            "bri": 16,
            "hue": 13524,
            "sat": 200,
            "effect": "none",
            "xy": [0.5017, 0.4152],
            "ct": 443,
            "alert": "none",
            "colormode": "xy"
        }
    },
    {
        "name": "Room Living",
        "lights": ["9", "2", "10", "3"],
        "type": "Room",
        "state": {
            "all_on": true,
            "any_on": true
        },
        "recycle": false,
        "class": "Living room",
        "action": {
            "on": true,
            "bri": 144,
            "hue": 13524,
            "sat": 200,
            "effect": "none",
            "xy": [0.5017, 0.4152],
            "ct": 443,
            "alert": "none",
            "colormode": "xy"
        }
    },
    {
        "name": "Room Salon",
        "lights": ["6", "7", "8"],
        "type": "Room",
        "state": {
            "all_on": true,
            "any_on": true
        },
        "recycle": false,
        "class": "Living room",
        "action": {
            "on": true,
            "bri": 144,
            "hue": 13524,
            "sat": 200,
            "effect": "none",
            "xy": [0.5017, 0.4152],
            "ct": 443,
            "alert": "select",
            "colormode": "xy"
        }
    }
];


/***/ }),

/***/ "./src/app/huewi-groups/huewi-groups.module.ts":
/*!*****************************************************!*\
  !*** ./src/app/huewi-groups/huewi-groups.module.ts ***!
  \*****************************************************/
/*! exports provided: HuewiGroupsModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiGroupsModule", function() { return HuewiGroupsModule; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/common */ "./node_modules/@angular/common/fesm5/common.js");
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/forms */ "./node_modules/@angular/forms/fesm5/forms.js");
/* harmony import */ var _pipes_pipes_module__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../pipes/pipes.module */ "./src/app/pipes/pipes.module.ts");
/* harmony import */ var _app_material_module__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../app-material.module */ "./src/app/app-material.module.ts");
/* harmony import */ var _huewi_groups_component__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./huewi-groups.component */ "./src/app/huewi-groups/huewi-groups.component.ts");
/* harmony import */ var _huewi_group_huewi_group_component__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./huewi-group/huewi-group.component */ "./src/app/huewi-groups/huewi-group/huewi-group.component.ts");
/* harmony import */ var _huewi_group_details_huewi_group_details_component__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./huewi-group-details/huewi-group-details.component */ "./src/app/huewi-groups/huewi-group-details/huewi-group-details.component.ts");
/* harmony import */ var _huewi_groups_filter__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./huewi-groups.filter */ "./src/app/huewi-groups/huewi-groups.filter.ts");
/* harmony import */ var _huewi_groups_routing_module__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./huewi-groups-routing.module */ "./src/app/huewi-groups/huewi-groups-routing.module.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};










var HuewiGroupsModule = /** @class */ (function () {
    function HuewiGroupsModule() {
    }
    HuewiGroupsModule = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["NgModule"])({
            imports: [
                _angular_common__WEBPACK_IMPORTED_MODULE_1__["CommonModule"],
                _angular_forms__WEBPACK_IMPORTED_MODULE_2__["FormsModule"],
                _pipes_pipes_module__WEBPACK_IMPORTED_MODULE_3__["PipesModule"],
                _app_material_module__WEBPACK_IMPORTED_MODULE_4__["MaterialModule"],
                _huewi_groups_routing_module__WEBPACK_IMPORTED_MODULE_9__["HuewiGroupsRoutingModule"]
            ],
            declarations: [
                _huewi_groups_component__WEBPACK_IMPORTED_MODULE_5__["HuewiGroupsComponent"],
                _huewi_group_huewi_group_component__WEBPACK_IMPORTED_MODULE_6__["HuewiGroupComponent"],
                _huewi_group_details_huewi_group_details_component__WEBPACK_IMPORTED_MODULE_7__["HuewiGroupDetailsComponent"],
                _huewi_groups_filter__WEBPACK_IMPORTED_MODULE_8__["HuewiGroupsFilter"]
            ],
            exports: [
                _huewi_groups_component__WEBPACK_IMPORTED_MODULE_5__["HuewiGroupsComponent"],
                _huewi_group_huewi_group_component__WEBPACK_IMPORTED_MODULE_6__["HuewiGroupComponent"],
                _huewi_group_details_huewi_group_details_component__WEBPACK_IMPORTED_MODULE_7__["HuewiGroupDetailsComponent"]
            ]
        })
    ], HuewiGroupsModule);
    return HuewiGroupsModule;
}());



/***/ }),

/***/ "./src/app/huewi-home/huewi-home.component.css":
/*!*****************************************************!*\
  !*** ./src/app/huewi-home/huewi-home.component.css ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "@media screen and (orientation:landscape) {\r\n  div.sized {\r\n    float: left;\r\n    width: 50%;\r\n  }\r\n}\r\n@media screen and (orientation:portrait) {\r\n  div.sized {\r\n    float: left;\r\n    width: 100%;\r\n  }\r\n}\r\nembed {\r\n  width: 100%;\r\n  min-height: 100vh;\r\n}"

/***/ }),

/***/ "./src/app/huewi-home/huewi-home.component.html":
/*!******************************************************!*\
  !*** ./src/app/huewi-home/huewi-home.component.html ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div *ngIf=\"customElements.length === 0\">\r\n    <div class=\"sized\">\r\n        <huewi-groups>\r\n        </huewi-groups>\r\n    </div>\r\n    <div class=\"sized\">\r\n        <huewi-lights>\r\n        </huewi-lights>\r\n    </div>\r\n</div>\r\n\r\n<div *ngIf=\"customElements.length >= 1\">\r\n    <div [class.sized]=\"customElements.length >= 2\" *ngFor=\"let element of customElements\">\r\n        <embed [src]=\"element | safe\">\r\n    </div>\r\n</div>\r\n"

/***/ }),

/***/ "./src/app/huewi-home/huewi-home.component.ts":
/*!****************************************************!*\
  !*** ./src/app/huewi-home/huewi-home.component.ts ***!
  \****************************************************/
/*! exports provided: HuewiHomeComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiHomeComponent", function() { return HuewiHomeComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _shared_parameters_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../shared/parameters.service */ "./src/app/shared/parameters.service.ts");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var HuewiHomeComponent = /** @class */ (function () {
    function HuewiHomeComponent(activatedRoute, parametersService) {
        this.activatedRoute = activatedRoute;
        this.parametersService = parametersService;
    }
    HuewiHomeComponent.prototype.ngOnInit = function () {
        var parameters = this.parametersService.getParameters();
        this.customElements = [];
        for (var key in parameters) {
            if ((key === 'groups') || (key === 'lights') || (key === 'bridges') ||
                (key === 'rules') || (key === 'scenes') || (key === 'schedules') || (key === 'sensors')) {
                if (parseInt(parameters[key], 10) === NaN) {
                    this.customElements.push('#/' + key + '?widget=true');
                }
                else {
                    this.customElements.push('#/' + key + '/' + parseInt(parameters[key], 10) + '?widget=true');
                }
            }
            else if (key === 'about') {
                this.customElements.push('#/' + key + '?widget=true');
            }
        }
    };
    HuewiHomeComponent.prototype.ngOnDestroy = function () {
    };
    HuewiHomeComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-home',
            template: __webpack_require__(/*! ./huewi-home.component.html */ "./src/app/huewi-home/huewi-home.component.html"),
            styles: [__webpack_require__(/*! ./huewi-home.component.css */ "./src/app/huewi-home/huewi-home.component.css")]
        }),
        __metadata("design:paramtypes", [_angular_router__WEBPACK_IMPORTED_MODULE_2__["ActivatedRoute"], _shared_parameters_service__WEBPACK_IMPORTED_MODULE_1__["ParametersService"]])
    ], HuewiHomeComponent);
    return HuewiHomeComponent;
}());



/***/ }),

/***/ "./src/app/huewi-lights/huewi-light-details/huewi-light-details.component.css":
/*!************************************************************************************!*\
  !*** ./src/app/huewi-lights/huewi-light-details/huewi-light-details.component.css ***!
  \************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/huewi-lights/huewi-light-details/huewi-light-details.component.html":
/*!*************************************************************************************!*\
  !*** ./src/app/huewi-lights/huewi-light-details/huewi-light-details.component.html ***!
  \*************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<huewi-light [light]=\"light\" [editable]=\"true\">\r\n</huewi-light>\r\n\r\n<br>\r\n\r\n<div class=\"flexcontainer wrap justify-center\">\r\n  <button mat-raised-button style=\"flex: 1 1 128px\" (click)=\"relax(light)\">Relax</button>\r\n  <button mat-raised-button style=\"flex: 1 1 128px\" (click)=\"reading(light)\">Reading</button>\r\n  <button mat-raised-button style=\"flex: 1 1 128px\" (click)=\"concentrate(light)\">Concentrate</button>\r\n  <button mat-raised-button style=\"flex: 1 1 128px\" (click)=\"energize(light)\">Energize</button>\r\n  <button mat-raised-button style=\"flex: 1 1 128px\" (click)=\"bright(light)\">Bright</button>\r\n  <button mat-raised-button style=\"flex: 1 1 128px\" (click)=\"dimmed(light)\">Dimmed</button>\r\n  <button mat-raised-button style=\"flex: 1 1 128px\" (click)=\"nightLight(light)\">Nightlight</button>\r\n  <button mat-raised-button style=\"flex: 1 1 128px\" (click)=\"goldenHour(light)\">Golden hour</button>\r\n</div>\r\n"

/***/ }),

/***/ "./src/app/huewi-lights/huewi-light-details/huewi-light-details.component.ts":
/*!***********************************************************************************!*\
  !*** ./src/app/huewi-lights/huewi-light-details/huewi-light-details.component.ts ***!
  \***********************************************************************************/
/*! exports provided: HuewiLightDetailsComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiLightDetailsComponent", function() { return HuewiLightDetailsComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var HuewiLightDetailsComponent = /** @class */ (function () {
    function HuewiLightDetailsComponent(huepiService) {
        this.huepiService = huepiService;
        this.light = { name: 'None' };
    }
    HuewiLightDetailsComponent.prototype.ngOnInit = function () {
    };
    HuewiLightDetailsComponent.prototype.setCTBrightness = function (light, CT, Brightness) {
        this.huepiService.MyHue.LightOn(light.__key);
        this.huepiService.MyHue.LightSetCT(light.__key, CT);
        this.huepiService.MyHue.LightSetBrightness(light.__key, Brightness);
    };
    HuewiLightDetailsComponent.prototype.relax = function (light) {
        this.setCTBrightness(light, 447, 144);
    };
    HuewiLightDetailsComponent.prototype.reading = function (light) {
        this.setCTBrightness(light, 346, 254);
    };
    HuewiLightDetailsComponent.prototype.concentrate = function (light) {
        this.setCTBrightness(light, 234, 254);
    };
    HuewiLightDetailsComponent.prototype.energize = function (light) {
        this.setCTBrightness(light, 153, 254);
    };
    HuewiLightDetailsComponent.prototype.bright = function (light) {
        this.setCTBrightness(light, 367, 254);
    };
    HuewiLightDetailsComponent.prototype.dimmed = function (light) {
        this.setCTBrightness(light, 365, 77);
    };
    HuewiLightDetailsComponent.prototype.nightLight = function (light) {
        this.setCTBrightness(light, 500, 1);
    };
    HuewiLightDetailsComponent.prototype.goldenHour = function (light) {
        this.setCTBrightness(light, 400, 125);
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiLightDetailsComponent.prototype, "light", void 0);
    HuewiLightDetailsComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-light-details',
            template: __webpack_require__(/*! ./huewi-light-details.component.html */ "./src/app/huewi-lights/huewi-light-details/huewi-light-details.component.html"),
            styles: [__webpack_require__(/*! ./huewi-light-details.component.css */ "./src/app/huewi-lights/huewi-light-details/huewi-light-details.component.css")]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_1__["HuepiService"]])
    ], HuewiLightDetailsComponent);
    return HuewiLightDetailsComponent;
}());



/***/ }),

/***/ "./src/app/huewi-lights/huewi-light/huewi-light.component.css":
/*!********************************************************************!*\
  !*** ./src/app/huewi-lights/huewi-light/huewi-light.component.css ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/huewi-lights/huewi-light/huewi-light.component.html":
/*!*********************************************************************!*\
  !*** ./src/app/huewi-lights/huewi-light/huewi-light.component.html ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div class=\"flexcontainer\">\r\n  <mat-form-field *ngIf=\"editable\" style=\"flex: 1 1 50px\">\r\n    <input matInput [(ngModel)]=\"light.name\" (keyup)=\"rename(light, $event.target.value)\">\r\n  </mat-form-field>\r\n  <div *ngIf=\"!editable\" style=\"flex: 1 1 50px\"\r\n    (click)=\"select(light)\">\r\n    {{light.name}}\r\n  </div>\r\n  <mat-slider style=\"flex: 5 1 100px\"\r\n    (change)=\"brightness(light, $event.value)\"\r\n    disabled=\"{{!light.state.on}}\"\r\n    [min]=\"0\" [max]=\"255\" [step]=\"1\" [value]=\"light.state.bri\">\r\n  </mat-slider>\r\n  <mat-slide-toggle style=\"flex: 0 1 10px\" disabled=\"{{!light.state.reachable}}\"\r\n    [checked]=\"light.state.on\"\r\n    (change)=\"toggle(light)\">\r\n  </mat-slide-toggle>\r\n</div>\r\n"

/***/ }),

/***/ "./src/app/huewi-lights/huewi-light/huewi-light.component.ts":
/*!*******************************************************************!*\
  !*** ./src/app/huewi-lights/huewi-light/huewi-light.component.ts ***!
  \*******************************************************************/
/*! exports provided: HuewiLightComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiLightComponent", function() { return HuewiLightComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var HuewiLightComponent = /** @class */ (function () {
    function HuewiLightComponent(huepiService, router) {
        this.huepiService = huepiService;
        this.router = router;
        this.editable = false;
    }
    HuewiLightComponent.prototype.ngOnInit = function () {
    };
    HuewiLightComponent.prototype.select = function (light) {
        this.huepiService.MyHue.LightAlertSelect(light.__key);
        this.router.navigate(['/lights', light.__key], { replaceUrl: true });
    };
    HuewiLightComponent.prototype.rename = function (light, name) {
        this.huepiService.MyHue.LightSetName(light.__key, name);
    };
    HuewiLightComponent.prototype.brightness = function (light, value) {
        this.huepiService.MyHue.LightSetBrightness(light.__key, value);
    };
    HuewiLightComponent.prototype.toggle = function (light) {
        if (light.state.on === true) {
            this.huepiService.MyHue.LightOff(light.__key);
        }
        else {
            this.huepiService.MyHue.LightOn(light.__key);
        }
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiLightComponent.prototype, "light", void 0);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiLightComponent.prototype, "editable", void 0);
    HuewiLightComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-light',
            template: __webpack_require__(/*! ./huewi-light.component.html */ "./src/app/huewi-lights/huewi-light/huewi-light.component.html"),
            styles: [__webpack_require__(/*! ./huewi-light.component.css */ "./src/app/huewi-lights/huewi-light/huewi-light.component.css")]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_2__["HuepiService"], _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], HuewiLightComponent);
    return HuewiLightComponent;
}());



/***/ }),

/***/ "./src/app/huewi-lights/huewi-lights-routing.module.ts":
/*!*************************************************************!*\
  !*** ./src/app/huewi-lights/huewi-lights-routing.module.ts ***!
  \*************************************************************/
/*! exports provided: HuewiLightsRoutingModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiLightsRoutingModule", function() { return HuewiLightsRoutingModule; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _huewi_lights_component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./huewi-lights.component */ "./src/app/huewi-lights/huewi-lights.component.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};



var huewiLightsRoutes = [
    { path: 'lights', component: _huewi_lights_component__WEBPACK_IMPORTED_MODULE_2__["HuewiLightsComponent"] },
    { path: 'lights/:id', component: _huewi_lights_component__WEBPACK_IMPORTED_MODULE_2__["HuewiLightsComponent"] }
];
var HuewiLightsRoutingModule = /** @class */ (function () {
    function HuewiLightsRoutingModule() {
    }
    HuewiLightsRoutingModule = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["NgModule"])({
            imports: [
                _angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"].forChild(huewiLightsRoutes)
            ],
            exports: [
                _angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"]
            ]
        })
    ], HuewiLightsRoutingModule);
    return HuewiLightsRoutingModule;
}());



/***/ }),

/***/ "./src/app/huewi-lights/huewi-lights.component.css":
/*!*********************************************************!*\
  !*** ./src/app/huewi-lights/huewi-lights.component.css ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/huewi-lights/huewi-lights.component.html":
/*!**********************************************************!*\
  !*** ./src/app/huewi-lights/huewi-lights.component.html ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<mat-card [@RoutingAnimations]>\r\n\r\n  <div *ngIf=\"!selectedLight\">\r\n    <mat-card-title>\r\n      Lights\r\n      <small>\r\n        <mat-form-field>\r\n          <input matInput placeholder=\"Filter\" [(ngModel)]=\"searchText\">\r\n        </mat-form-field>\r\n      </small>\r\n    </mat-card-title>\r\n    <huewi-light \r\n      *ngFor=\"let light of lights | orderBy:['+name'] | filter:searchText:'name'\"\r\n      [light]=\"light\">\r\n    </huewi-light>\r\n  </div>\r\n\r\n  <div *ngIf=\"selectedLight\">\r\n    <mat-card-title>\r\n      <a *ngIf=\"back\" [routerLink]=\"['/lights']\" [replaceUrl]=\"true\"><mat-icon>navigate_before</mat-icon></a>\r\n      {{selectedLight.name}} - Details\r\n    </mat-card-title>\r\n    <huewi-light-details\r\n      [light]=\"selectedLight\">\r\n    </huewi-light-details>\r\n  </div>\r\n\r\n</mat-card>\r\n"

/***/ }),

/***/ "./src/app/huewi-lights/huewi-lights.component.ts":
/*!********************************************************!*\
  !*** ./src/app/huewi-lights/huewi-lights.component.ts ***!
  \********************************************************/
/*! exports provided: HuewiLightsComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiLightsComponent", function() { return HuewiLightsComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _app_routing_animations__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./../app-routing.animations */ "./src/app/app-routing.animations.ts");
/* harmony import */ var _huewi_lights_mock__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./huewi-lights.mock */ "./src/app/huewi-lights/huewi-lights.mock.ts");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
/* harmony import */ var _shared_parameters_service__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../shared/parameters.service */ "./src/app/shared/parameters.service.ts");
/* harmony import */ var rxjs_Observable__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! rxjs/Observable */ "./node_modules/rxjs-compat/_esm5/Observable.js");
/* harmony import */ var rxjs_add_observable_of__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! rxjs/add/observable/of */ "./node_modules/rxjs-compat/_esm5/add/observable/of.js");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};









var HuewiLightsComponent = /** @class */ (function () {
    function HuewiLightsComponent(huepiService, parametersService, activatedRoute, router) {
        this.huepiService = huepiService;
        this.parametersService = parametersService;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.lights = _huewi_lights_mock__WEBPACK_IMPORTED_MODULE_3__["HUEWI_LIGHTS_MOCK"];
        this.back = true;
        this.lightObserver = rxjs_Observable__WEBPACK_IMPORTED_MODULE_6__["Observable"].of(this.lights);
        this.selectedLight = undefined;
    }
    Object.defineProperty(HuewiLightsComponent.prototype, "RoutingAnimations", {
        get: function () { return true; },
        enumerable: true,
        configurable: true
    });
    ;
    HuewiLightsComponent.prototype.ngOnInit = function () {
        var _this = this;
        var parameters = this.parametersService.getParameters();
        if (parameters['widget']) {
            this.back = false;
        }
        this.lightObserver = this.huepiService.getLights();
        this.lightsSubscription = this.lightObserver.subscribe(function (value) {
            _this.lights = value;
            _this.updateSelected();
        });
    };
    HuewiLightsComponent.prototype.ngOnDestroy = function () {
        this.lightsSubscription.unsubscribe();
    };
    HuewiLightsComponent.prototype.updateSelected = function () {
        var id = this.activatedRoute.snapshot.paramMap.get('id');
        this.selectedLight = this.huepiService.MyHue.Lights[id];
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["HostBinding"])('@RoutingAnimations'),
        __metadata("design:type", Object),
        __metadata("design:paramtypes", [])
    ], HuewiLightsComponent.prototype, "RoutingAnimations", null);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiLightsComponent.prototype, "lights", void 0);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiLightsComponent.prototype, "back", void 0);
    HuewiLightsComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-lights',
            template: __webpack_require__(/*! ./huewi-lights.component.html */ "./src/app/huewi-lights/huewi-lights.component.html"),
            styles: [__webpack_require__(/*! ./huewi-lights.component.css */ "./src/app/huewi-lights/huewi-lights.component.css")],
            animations: [Object(_app_routing_animations__WEBPACK_IMPORTED_MODULE_2__["RoutingAnimations"])()]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_4__["HuepiService"], _shared_parameters_service__WEBPACK_IMPORTED_MODULE_5__["ParametersService"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["ActivatedRoute"], _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], HuewiLightsComponent);
    return HuewiLightsComponent;
}());



/***/ }),

/***/ "./src/app/huewi-lights/huewi-lights.mock.ts":
/*!***************************************************!*\
  !*** ./src/app/huewi-lights/huewi-lights.mock.ts ***!
  \***************************************************/
/*! exports provided: HUEWI_LIGHTS_MOCK */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HUEWI_LIGHTS_MOCK", function() { return HUEWI_LIGHTS_MOCK; });
var HUEWI_LIGHTS_MOCK = [
    {
        "state": {
            "on": true,
            "bri": 144,
            "hue": 13524,
            "sat": 200,
            "effect": "none",
            "xy": [0.5017, 0.4152],
            "ct": 443,
            "alert": "none",
            "colormode": "xy",
            "reachable": true
        },
        "swupdate": {
            "state": "noupdates",
            "lastinstall": null
        },
        "type": "Extended color light",
        "name": "Living TV",
        "modelid": "LCT001",
        "manufacturername": "Philips",
        "uniqueid": "00:17:88:01:00:b5:90:08-0b",
        "swversion": "5.23.1.13452"
    },
    {
        "state": {
            "on": true,
            "bri": 144,
            "hue": 13524,
            "sat": 200,
            "effect": "none",
            "xy": [0.5017, 0.4152],
            "ct": 443,
            "alert": "none",
            "colormode": "xy",
            "reachable": true
        },
        "swupdate": {
            "state": "noupdates",
            "lastinstall": null
        },
        "type": "Extended color light",
        "name": "Living Stand",
        "modelid": "LCT001",
        "manufacturername": "Philips",
        "uniqueid": "00:17:88:01:00:b5:a8:73-0b",
        "swversion": "5.23.1.13452"
    },
    {
        "state": {
            "on": true,
            "bri": 144,
            "hue": 13524,
            "sat": 200,
            "effect": "none",
            "xy": [0.5017, 0.4152],
            "ct": 443,
            "alert": "select",
            "colormode": "xy",
            "reachable": true
        },
        "swupdate": {
            "state": "noupdates",
            "lastinstall": null
        },
        "type": "Extended color light",
        "name": "Salon Wall",
        "modelid": "LCT001",
        "manufacturername": "Philips",
        "uniqueid": "00:17:88:01:00:fe:5c:f2-0b",
        "swversion": "5.23.1.13452"
    },
    {
        "state": {
            "on": true,
            "bri": 144,
            "hue": 13524,
            "sat": 200,
            "effect": "none",
            "xy": [0.5017, 0.4152],
            "ct": 443,
            "alert": "select",
            "colormode": "xy",
            "reachable": true
        },
        "swupdate": {
            "state": "noupdates",
            "lastinstall": null
        },
        "type": "Extended color light",
        "name": "Salon Middle",
        "modelid": "LCT001",
        "manufacturername": "Philips",
        "uniqueid": "00:17:88:01:00:fe:60:c8-0b",
        "swversion": "5.23.1.13452"
    },
    {
        "state": {
            "on": true,
            "bri": 144,
            "hue": 13524,
            "sat": 200,
            "effect": "none",
            "xy": [0.5017, 0.4152],
            "ct": 443,
            "alert": "select",
            "colormode": "xy",
            "reachable": true
        },
        "swupdate": {
            "state": "noupdates",
            "lastinstall": null
        },
        "type": "Extended color light",
        "name": "Salon TV",
        "modelid": "LCT001",
        "manufacturername": "Philips",
        "uniqueid": "00:17:88:01:00:fe:58:8e-0b",
        "swversion": "5.23.1.13452"
    },
    {
        "state": {
            "on": true,
            "bri": 144,
            "hue": 13524,
            "sat": 200,
            "effect": "none",
            "xy": [0.5017, 0.4152],
            "ct": 443,
            "alert": "none",
            "colormode": "xy",
            "reachable": true
        },
        "swupdate": {
            "state": "noupdates",
            "lastinstall": null
        },
        "type": "Extended color light",
        "name": "Living Phone",
        "modelid": "LCT001",
        "manufacturername": "Philips",
        "uniqueid": "00:17:88:01:00:dd:1e:d1-0b",
        "swversion": "5.50.1.19085"
    },
    {
        "state": {
            "on": true,
            "bri": 144,
            "hue": 13524,
            "sat": 200,
            "effect": "none",
            "xy": [0.5017, 0.4152],
            "ct": 443,
            "alert": "none",
            "colormode": "xy",
            "reachable": true
        },
        "swupdate": {
            "state": "noupdates",
            "lastinstall": null
        },
        "type": "Extended color light",
        "name": "Living Corner",
        "modelid": "LCT001",
        "manufacturername": "Philips",
        "uniqueid": "00:17:88:01:00:b3:9e:63-0b",
        "swversion": "5.23.1.13452"
    },
    {
        "state": {
            "on": false,
            "bri": 16,
            "hue": 13524,
            "sat": 200,
            "effect": "none",
            "xy": [0.5017, 0.4152],
            "ct": 443,
            "alert": "none",
            "colormode": "xy",
            "reachable": true
        },
        "swupdate": {
            "state": "noupdates",
            "lastinstall": null
        },
        "type": "Extended color light",
        "name": "Dinner Back",
        "modelid": "LCT001",
        "manufacturername": "Philips",
        "uniqueid": "00:17:88:01:00:e0:2f:67-0b",
        "swversion": "5.23.1.13452"
    },
    {
        "state": {
            "on": false,
            "bri": 16,
            "hue": 13524,
            "sat": 200,
            "effect": "none",
            "xy": [0.5017, 0.4152],
            "ct": 443,
            "alert": "none",
            "colormode": "xy",
            "reachable": true
        },
        "swupdate": {
            "state": "noupdates",
            "lastinstall": null
        },
        "type": "Extended color light",
        "name": "Dinner Front",
        "modelid": "LCT001",
        "manufacturername": "Philips",
        "uniqueid": "00:17:88:01:00:e0:64:a6-0b",
        "swversion": "5.23.1.13452"
    },
    {
        "state": {
            "on": false,
            "bri": 16,
            "ct": 443,
            "alert": "none",
            "colormode": "ct",
            "reachable": true
        },
        "swupdate": {
            "state": "noupdates",
            "lastinstall": null
        },
        "type": "Color temperature light",
        "name": "Dinect Front",
        "modelid": "LTW001",
        "manufacturername": "Philips",
        "uniqueid": "00:17:88:01:02:04:c6:5a-0b",
        "swversion": "5.50.1.19085"
    },
    {
        "state": {
            "on": false,
            "bri": 16,
            "ct": 443,
            "alert": "none",
            "colormode": "ct",
            "reachable": true
        },
        "swupdate": {
            "state": "noupdates",
            "lastinstall": null
        },
        "type": "Color temperature light",
        "name": "Dinect Back",
        "modelid": "LTW001",
        "manufacturername": "Philips",
        "uniqueid": "00:17:88:01:02:04:c7:38-0b",
        "swversion": "5.50.1.19085"
    }
];


/***/ }),

/***/ "./src/app/huewi-lights/huewi-lights.module.ts":
/*!*****************************************************!*\
  !*** ./src/app/huewi-lights/huewi-lights.module.ts ***!
  \*****************************************************/
/*! exports provided: HuewiLightsModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiLightsModule", function() { return HuewiLightsModule; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/common */ "./node_modules/@angular/common/fesm5/common.js");
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/forms */ "./node_modules/@angular/forms/fesm5/forms.js");
/* harmony import */ var _pipes_pipes_module__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../pipes/pipes.module */ "./src/app/pipes/pipes.module.ts");
/* harmony import */ var _app_material_module__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../app-material.module */ "./src/app/app-material.module.ts");
/* harmony import */ var _huewi_lights_component__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./huewi-lights.component */ "./src/app/huewi-lights/huewi-lights.component.ts");
/* harmony import */ var _huewi_light_huewi_light_component__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./huewi-light/huewi-light.component */ "./src/app/huewi-lights/huewi-light/huewi-light.component.ts");
/* harmony import */ var _huewi_light_details_huewi_light_details_component__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./huewi-light-details/huewi-light-details.component */ "./src/app/huewi-lights/huewi-light-details/huewi-light-details.component.ts");
/* harmony import */ var _huewi_lights_routing_module__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./huewi-lights-routing.module */ "./src/app/huewi-lights/huewi-lights-routing.module.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};









var HuewiLightsModule = /** @class */ (function () {
    function HuewiLightsModule() {
    }
    HuewiLightsModule = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["NgModule"])({
            imports: [
                _angular_common__WEBPACK_IMPORTED_MODULE_1__["CommonModule"],
                _angular_forms__WEBPACK_IMPORTED_MODULE_2__["FormsModule"],
                _pipes_pipes_module__WEBPACK_IMPORTED_MODULE_3__["PipesModule"],
                _app_material_module__WEBPACK_IMPORTED_MODULE_4__["MaterialModule"],
                _huewi_lights_routing_module__WEBPACK_IMPORTED_MODULE_8__["HuewiLightsRoutingModule"]
            ],
            declarations: [
                _huewi_lights_component__WEBPACK_IMPORTED_MODULE_5__["HuewiLightsComponent"],
                _huewi_light_huewi_light_component__WEBPACK_IMPORTED_MODULE_6__["HuewiLightComponent"],
                _huewi_light_details_huewi_light_details_component__WEBPACK_IMPORTED_MODULE_7__["HuewiLightDetailsComponent"]
            ],
            exports: [
                _huewi_lights_component__WEBPACK_IMPORTED_MODULE_5__["HuewiLightsComponent"],
                _huewi_light_huewi_light_component__WEBPACK_IMPORTED_MODULE_6__["HuewiLightComponent"],
                _huewi_light_details_huewi_light_details_component__WEBPACK_IMPORTED_MODULE_7__["HuewiLightDetailsComponent"]
            ]
        })
    ], HuewiLightsModule);
    return HuewiLightsModule;
}());



/***/ }),

/***/ "./src/app/huewi-rules/huewi-rule-details/huewi-rule-details.component.css":
/*!*********************************************************************************!*\
  !*** ./src/app/huewi-rules/huewi-rule-details/huewi-rule-details.component.css ***!
  \*********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "mat-icon {\r\n    float: right;\r\n}\r\n"

/***/ }),

/***/ "./src/app/huewi-rules/huewi-rule-details/huewi-rule-details.component.html":
/*!**********************************************************************************!*\
  !*** ./src/app/huewi-rules/huewi-rule-details/huewi-rule-details.component.html ***!
  \**********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<huewi-rule \r\n  [rule]=\"rule\">\r\n</huewi-rule>\r\n\r\n<div>\r\n  <div>rule {{rule.__key}}</div>\r\n  <mat-icon *ngIf=\"!expand\" (click)=\"expand=true\">expand_more</mat-icon>\r\n  <div *ngIf=\"expand\">\r\n    <small>\r\n      <mat-icon (click)=\"expand=false\">expand_less</mat-icon>\r\n      <mat-divider></mat-divider>\r\n\r\n      <b>conditions :</b><br>\r\n      <span *ngFor='let condition of rule.conditions; let last = last'>\r\n        {{'{'}} {{condition.address}} {{condition.operator}}\r\n        <span *ngIf='condition.value!==\"\"'>'{{condition.value}}'</span> {{'}'}}\r\n        <span *ngIf='!last'> & <br></span>\r\n      </span>\r\n      <br>\r\n      <b>actions :</b><br>\r\n      <span *ngFor='let action of rule.actions; let last = last'>\r\n        {{'{'}} {{action.method}} {{action.address}} {{action.body | json}} {{'}'}}\r\n        <span *ngIf='!last'> + <br></span>\r\n      </span>\r\n    </small>\r\n  </div>\r\n</div>\r\n"

/***/ }),

/***/ "./src/app/huewi-rules/huewi-rule-details/huewi-rule-details.component.ts":
/*!********************************************************************************!*\
  !*** ./src/app/huewi-rules/huewi-rule-details/huewi-rule-details.component.ts ***!
  \********************************************************************************/
/*! exports provided: HuewiRuleDetailsComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiRuleDetailsComponent", function() { return HuewiRuleDetailsComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
/* harmony import */ var _shared_parameters_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../shared/parameters.service */ "./src/app/shared/parameters.service.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var HuewiRuleDetailsComponent = /** @class */ (function () {
    function HuewiRuleDetailsComponent(huepiService, parametersService) {
        this.huepiService = huepiService;
        this.parametersService = parametersService;
        this.expand = false;
    }
    HuewiRuleDetailsComponent.prototype.ngOnInit = function () {
        var parameters = this.parametersService.getParameters();
        if (parameters['expand']) {
            this.expand = parameters['expand'];
        }
    };
    HuewiRuleDetailsComponent.prototype.ngOnDestroy = function () {
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiRuleDetailsComponent.prototype, "rule", void 0);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiRuleDetailsComponent.prototype, "expand", void 0);
    HuewiRuleDetailsComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-rule-details',
            template: __webpack_require__(/*! ./huewi-rule-details.component.html */ "./src/app/huewi-rules/huewi-rule-details/huewi-rule-details.component.html"),
            styles: [__webpack_require__(/*! ./huewi-rule-details.component.css */ "./src/app/huewi-rules/huewi-rule-details/huewi-rule-details.component.css")]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_1__["HuepiService"], _shared_parameters_service__WEBPACK_IMPORTED_MODULE_2__["ParametersService"]])
    ], HuewiRuleDetailsComponent);
    return HuewiRuleDetailsComponent;
}());



/***/ }),

/***/ "./src/app/huewi-rules/huewi-rule/huewi-rule.component.css":
/*!*****************************************************************!*\
  !*** ./src/app/huewi-rules/huewi-rule/huewi-rule.component.css ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/huewi-rules/huewi-rule/huewi-rule.component.html":
/*!******************************************************************!*\
  !*** ./src/app/huewi-rules/huewi-rule/huewi-rule.component.html ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div class=\"flexcontainer\"\r\n  (click)=\"select(rule)\">\r\n  <div style=\"flex: 1 1 128px\">\r\n    {{rule.name}}\r\n  </div>\r\n  <div style=\"flex: 0 1 10px\">\r\n    <mat-icon *ngIf=\"rule.status === 'enabled'\">radio_button_checked</mat-icon>\r\n    <mat-icon *ngIf=\"rule.status === 'disabled'\">radio_button_unchecked</mat-icon>      \r\n  </div>\r\n</div>\r\n"

/***/ }),

/***/ "./src/app/huewi-rules/huewi-rule/huewi-rule.component.ts":
/*!****************************************************************!*\
  !*** ./src/app/huewi-rules/huewi-rule/huewi-rule.component.ts ***!
  \****************************************************************/
/*! exports provided: HuewiRuleComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiRuleComponent", function() { return HuewiRuleComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var HuewiRuleComponent = /** @class */ (function () {
    function HuewiRuleComponent(huepiService, router) {
        this.huepiService = huepiService;
        this.router = router;
    }
    HuewiRuleComponent.prototype.ngOnInit = function () {
    };
    HuewiRuleComponent.prototype.select = function (rule) {
        this.router.navigate(['/rules', rule.__key], { replaceUrl: true });
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiRuleComponent.prototype, "rule", void 0);
    HuewiRuleComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-rule',
            template: __webpack_require__(/*! ./huewi-rule.component.html */ "./src/app/huewi-rules/huewi-rule/huewi-rule.component.html"),
            styles: [__webpack_require__(/*! ./huewi-rule.component.css */ "./src/app/huewi-rules/huewi-rule/huewi-rule.component.css")]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_2__["HuepiService"], _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], HuewiRuleComponent);
    return HuewiRuleComponent;
}());



/***/ }),

/***/ "./src/app/huewi-rules/huewi-rules-routing.module.ts":
/*!***********************************************************!*\
  !*** ./src/app/huewi-rules/huewi-rules-routing.module.ts ***!
  \***********************************************************/
/*! exports provided: HuewiRulesRoutingModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiRulesRoutingModule", function() { return HuewiRulesRoutingModule; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _huewi_rules_component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./huewi-rules.component */ "./src/app/huewi-rules/huewi-rules.component.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};



var huewiRulesRoutes = [
    { path: 'rules', component: _huewi_rules_component__WEBPACK_IMPORTED_MODULE_2__["HuewiRulesComponent"] },
    { path: 'rules/:id', component: _huewi_rules_component__WEBPACK_IMPORTED_MODULE_2__["HuewiRulesComponent"] }
];
var HuewiRulesRoutingModule = /** @class */ (function () {
    function HuewiRulesRoutingModule() {
    }
    HuewiRulesRoutingModule = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["NgModule"])({
            imports: [
                _angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"].forChild(huewiRulesRoutes)
            ],
            exports: [
                _angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"]
            ]
        })
    ], HuewiRulesRoutingModule);
    return HuewiRulesRoutingModule;
}());



/***/ }),

/***/ "./src/app/huewi-rules/huewi-rules.component.css":
/*!*******************************************************!*\
  !*** ./src/app/huewi-rules/huewi-rules.component.css ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/huewi-rules/huewi-rules.component.html":
/*!********************************************************!*\
  !*** ./src/app/huewi-rules/huewi-rules.component.html ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<mat-card [@RoutingAnimations]>\r\n\r\n  <div *ngIf=\"!selectedRule\">\r\n    <mat-card-title>\r\n      Rules\r\n      <small>\r\n        <mat-form-field>\r\n          <input matInput placeholder=\"Filter\" [(ngModel)]=\"searchText\">\r\n        </mat-form-field>\r\n      </small>\r\n    </mat-card-title>\r\n    <mat-list>\r\n      <huewi-rule mat-list-item \r\n        *ngFor=\"let rule of rules | orderBy:['+name'] | filter:searchText:'name'\"\r\n        [rule]=\"rule\" >\r\n      </huewi-rule>\r\n    </mat-list>\r\n  </div>\r\n\r\n  <div *ngIf=\"selectedRule\">\r\n    <mat-card-title>\r\n      <a *ngIf=\"back\" [routerLink]=\"['/rules']\" [replaceUrl]=\"true\"><mat-icon>navigate_before</mat-icon></a>\r\n      {{selectedRule.name}} - Details\r\n    </mat-card-title>\r\n    <huewi-rule-details\r\n      [rule]=\"selectedRule\">\r\n    </huewi-rule-details>\r\n  </div>\r\n\r\n</mat-card>"

/***/ }),

/***/ "./src/app/huewi-rules/huewi-rules.component.ts":
/*!******************************************************!*\
  !*** ./src/app/huewi-rules/huewi-rules.component.ts ***!
  \******************************************************/
/*! exports provided: HuewiRulesComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiRulesComponent", function() { return HuewiRulesComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _app_routing_animations__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./../app-routing.animations */ "./src/app/app-routing.animations.ts");
/* harmony import */ var _huewi_rules_mock__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./huewi-rules.mock */ "./src/app/huewi-rules/huewi-rules.mock.ts");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
/* harmony import */ var _shared_parameters_service__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../shared/parameters.service */ "./src/app/shared/parameters.service.ts");
/* harmony import */ var rxjs_Observable__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! rxjs/Observable */ "./node_modules/rxjs-compat/_esm5/Observable.js");
/* harmony import */ var rxjs_add_observable_of__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! rxjs/add/observable/of */ "./node_modules/rxjs-compat/_esm5/add/observable/of.js");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};









var HuewiRulesComponent = /** @class */ (function () {
    function HuewiRulesComponent(huepiService, parametersService, activatedRoute, router) {
        this.huepiService = huepiService;
        this.parametersService = parametersService;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.rules = _huewi_rules_mock__WEBPACK_IMPORTED_MODULE_3__["HUEWI_RULES_MOCK"];
        this.back = true;
        this.ruleObserver = rxjs_Observable__WEBPACK_IMPORTED_MODULE_6__["Observable"].of(this.rules);
        this.selectedRule = undefined;
    }
    Object.defineProperty(HuewiRulesComponent.prototype, "RoutingAnimations", {
        get: function () { return true; },
        enumerable: true,
        configurable: true
    });
    ;
    HuewiRulesComponent.prototype.ngOnInit = function () {
        var _this = this;
        var parameters = this.parametersService.getParameters();
        if (parameters['widget']) {
            this.back = false;
        }
        this.ruleObserver = this.huepiService.getRules();
        this.rulesSubscription = this.ruleObserver.subscribe(function (value) {
            _this.rules = value;
            _this.updateSelected();
        });
    };
    HuewiRulesComponent.prototype.ngOnDestroy = function () {
        this.rulesSubscription.unsubscribe();
    };
    HuewiRulesComponent.prototype.updateSelected = function () {
        var id = this.activatedRoute.snapshot.paramMap.get('id');
        this.selectedRule = this.huepiService.MyHue.Rules[id];
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["HostBinding"])('@RoutingAnimations'),
        __metadata("design:type", Object),
        __metadata("design:paramtypes", [])
    ], HuewiRulesComponent.prototype, "RoutingAnimations", null);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiRulesComponent.prototype, "rules", void 0);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiRulesComponent.prototype, "back", void 0);
    HuewiRulesComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-rules',
            template: __webpack_require__(/*! ./huewi-rules.component.html */ "./src/app/huewi-rules/huewi-rules.component.html"),
            styles: [__webpack_require__(/*! ./huewi-rules.component.css */ "./src/app/huewi-rules/huewi-rules.component.css")],
            animations: [Object(_app_routing_animations__WEBPACK_IMPORTED_MODULE_2__["RoutingAnimations"])()]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_4__["HuepiService"], _shared_parameters_service__WEBPACK_IMPORTED_MODULE_5__["ParametersService"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["ActivatedRoute"], _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], HuewiRulesComponent);
    return HuewiRulesComponent;
}());



/***/ }),

/***/ "./src/app/huewi-rules/huewi-rules.mock.ts":
/*!*************************************************!*\
  !*** ./src/app/huewi-rules/huewi-rules.mock.ts ***!
  \*************************************************/
/*! exports provided: HUEWI_RULES_MOCK */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HUEWI_RULES_MOCK", function() { return HUEWI_RULES_MOCK; });
var HUEWI_RULES_MOCK = [];


/***/ }),

/***/ "./src/app/huewi-rules/huewi-rules.module.ts":
/*!***************************************************!*\
  !*** ./src/app/huewi-rules/huewi-rules.module.ts ***!
  \***************************************************/
/*! exports provided: HuewiRulesModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiRulesModule", function() { return HuewiRulesModule; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/common */ "./node_modules/@angular/common/fesm5/common.js");
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/forms */ "./node_modules/@angular/forms/fesm5/forms.js");
/* harmony import */ var _pipes_pipes_module__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../pipes/pipes.module */ "./src/app/pipes/pipes.module.ts");
/* harmony import */ var _app_material_module__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../app-material.module */ "./src/app/app-material.module.ts");
/* harmony import */ var _huewi_rules_component__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./huewi-rules.component */ "./src/app/huewi-rules/huewi-rules.component.ts");
/* harmony import */ var _huewi_rule_huewi_rule_component__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./huewi-rule/huewi-rule.component */ "./src/app/huewi-rules/huewi-rule/huewi-rule.component.ts");
/* harmony import */ var _huewi_rule_details_huewi_rule_details_component__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./huewi-rule-details/huewi-rule-details.component */ "./src/app/huewi-rules/huewi-rule-details/huewi-rule-details.component.ts");
/* harmony import */ var _huewi_rules_routing_module__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./huewi-rules-routing.module */ "./src/app/huewi-rules/huewi-rules-routing.module.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};









var HuewiRulesModule = /** @class */ (function () {
    function HuewiRulesModule() {
    }
    HuewiRulesModule = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["NgModule"])({
            imports: [
                _angular_common__WEBPACK_IMPORTED_MODULE_1__["CommonModule"],
                _angular_forms__WEBPACK_IMPORTED_MODULE_2__["FormsModule"],
                _pipes_pipes_module__WEBPACK_IMPORTED_MODULE_3__["PipesModule"],
                _app_material_module__WEBPACK_IMPORTED_MODULE_4__["MaterialModule"],
                _huewi_rules_routing_module__WEBPACK_IMPORTED_MODULE_8__["HuewiRulesRoutingModule"]
            ],
            declarations: [
                _huewi_rules_component__WEBPACK_IMPORTED_MODULE_5__["HuewiRulesComponent"],
                _huewi_rule_huewi_rule_component__WEBPACK_IMPORTED_MODULE_6__["HuewiRuleComponent"],
                _huewi_rule_details_huewi_rule_details_component__WEBPACK_IMPORTED_MODULE_7__["HuewiRuleDetailsComponent"]
            ],
            exports: [
                _huewi_rules_component__WEBPACK_IMPORTED_MODULE_5__["HuewiRulesComponent"],
                _huewi_rule_huewi_rule_component__WEBPACK_IMPORTED_MODULE_6__["HuewiRuleComponent"],
                _huewi_rule_details_huewi_rule_details_component__WEBPACK_IMPORTED_MODULE_7__["HuewiRuleDetailsComponent"]
            ]
        })
    ], HuewiRulesModule);
    return HuewiRulesModule;
}());



/***/ }),

/***/ "./src/app/huewi-scenes/huewi-scene-details/huewi-scene-details.component.css":
/*!************************************************************************************!*\
  !*** ./src/app/huewi-scenes/huewi-scene-details/huewi-scene-details.component.css ***!
  \************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "mat-icon {\r\n    float: right;\r\n}\r\n"

/***/ }),

/***/ "./src/app/huewi-scenes/huewi-scene-details/huewi-scene-details.component.html":
/*!*************************************************************************************!*\
  !*** ./src/app/huewi-scenes/huewi-scene-details/huewi-scene-details.component.html ***!
  \*************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<huewi-scene \r\n  [scene]=\"scene\">\r\n</huewi-scene>\r\n\r\n<div>\r\n  <div>scene {{scene.__key}}</div>\r\n  <mat-icon *ngIf=\"!expand\" (click)=\"expand=true\">expand_more</mat-icon>\r\n  <div *ngIf=\"expand\">\r\n    <small>\r\n      <mat-icon (click)=\"expand=false\">expand_less</mat-icon>\r\n      <mat-divider></mat-divider>\r\n      Lights: {{scene.lights}}<br>\r\n      Lastupdated: {{scene.lastupdated}}<br>\r\n      owned by {{scene.owner}}<br>\r\n    </small>\r\n  </div>\r\n</div>\r\n"

/***/ }),

/***/ "./src/app/huewi-scenes/huewi-scene-details/huewi-scene-details.component.ts":
/*!***********************************************************************************!*\
  !*** ./src/app/huewi-scenes/huewi-scene-details/huewi-scene-details.component.ts ***!
  \***********************************************************************************/
/*! exports provided: HuewiSceneDetailsComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiSceneDetailsComponent", function() { return HuewiSceneDetailsComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
/* harmony import */ var _shared_parameters_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../shared/parameters.service */ "./src/app/shared/parameters.service.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var HuewiSceneDetailsComponent = /** @class */ (function () {
    function HuewiSceneDetailsComponent(huepiService, parametersService) {
        this.huepiService = huepiService;
        this.parametersService = parametersService;
        this.expand = false;
    }
    HuewiSceneDetailsComponent.prototype.ngOnInit = function () {
        var parameters = this.parametersService.getParameters();
        if (parameters['expand']) {
            this.expand = parameters['expand'];
        }
    };
    HuewiSceneDetailsComponent.prototype.ngOnDestroy = function () {
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiSceneDetailsComponent.prototype, "scene", void 0);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiSceneDetailsComponent.prototype, "expand", void 0);
    HuewiSceneDetailsComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-scene-details',
            template: __webpack_require__(/*! ./huewi-scene-details.component.html */ "./src/app/huewi-scenes/huewi-scene-details/huewi-scene-details.component.html"),
            styles: [__webpack_require__(/*! ./huewi-scene-details.component.css */ "./src/app/huewi-scenes/huewi-scene-details/huewi-scene-details.component.css")]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_1__["HuepiService"], _shared_parameters_service__WEBPACK_IMPORTED_MODULE_2__["ParametersService"]])
    ], HuewiSceneDetailsComponent);
    return HuewiSceneDetailsComponent;
}());



/***/ }),

/***/ "./src/app/huewi-scenes/huewi-scene/huewi-scene.component.css":
/*!********************************************************************!*\
  !*** ./src/app/huewi-scenes/huewi-scene/huewi-scene.component.css ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/huewi-scenes/huewi-scene/huewi-scene.component.html":
/*!*********************************************************************!*\
  !*** ./src/app/huewi-scenes/huewi-scene/huewi-scene.component.html ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div class=\"flexcontainer\"\r\n  (click)=\"select(scene)\">\r\n  <div style=\"flex: 1 1 128px\">\r\n    {{scene.name}}\r\n  </div>\r\n  <div style=\"flex: 0 1 10px\">\r\n  </div>\r\n</div>\r\n"

/***/ }),

/***/ "./src/app/huewi-scenes/huewi-scene/huewi-scene.component.ts":
/*!*******************************************************************!*\
  !*** ./src/app/huewi-scenes/huewi-scene/huewi-scene.component.ts ***!
  \*******************************************************************/
/*! exports provided: HuewiSceneComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiSceneComponent", function() { return HuewiSceneComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var HuewiSceneComponent = /** @class */ (function () {
    function HuewiSceneComponent(huepiService, router) {
        this.huepiService = huepiService;
        this.router = router;
    }
    HuewiSceneComponent.prototype.ngOnInit = function () {
    };
    HuewiSceneComponent.prototype.select = function (scene) {
        this.router.navigate(['/scenes', scene.__key], { replaceUrl: true });
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiSceneComponent.prototype, "scene", void 0);
    HuewiSceneComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-scene',
            template: __webpack_require__(/*! ./huewi-scene.component.html */ "./src/app/huewi-scenes/huewi-scene/huewi-scene.component.html"),
            styles: [__webpack_require__(/*! ./huewi-scene.component.css */ "./src/app/huewi-scenes/huewi-scene/huewi-scene.component.css")]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_2__["HuepiService"], _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], HuewiSceneComponent);
    return HuewiSceneComponent;
}());



/***/ }),

/***/ "./src/app/huewi-scenes/huewi-scenes-routing.module.ts":
/*!*************************************************************!*\
  !*** ./src/app/huewi-scenes/huewi-scenes-routing.module.ts ***!
  \*************************************************************/
/*! exports provided: HuewiScenesRoutingModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiScenesRoutingModule", function() { return HuewiScenesRoutingModule; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _huewi_scenes_component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./huewi-scenes.component */ "./src/app/huewi-scenes/huewi-scenes.component.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};



var huewiScenesRoutes = [
    { path: 'scenes', component: _huewi_scenes_component__WEBPACK_IMPORTED_MODULE_2__["HuewiScenesComponent"] },
    { path: 'scenes/:id', component: _huewi_scenes_component__WEBPACK_IMPORTED_MODULE_2__["HuewiScenesComponent"] }
];
var HuewiScenesRoutingModule = /** @class */ (function () {
    function HuewiScenesRoutingModule() {
    }
    HuewiScenesRoutingModule = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["NgModule"])({
            imports: [
                _angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"].forChild(huewiScenesRoutes)
            ],
            exports: [
                _angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"]
            ]
        })
    ], HuewiScenesRoutingModule);
    return HuewiScenesRoutingModule;
}());



/***/ }),

/***/ "./src/app/huewi-scenes/huewi-scenes.component.css":
/*!*********************************************************!*\
  !*** ./src/app/huewi-scenes/huewi-scenes.component.css ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/huewi-scenes/huewi-scenes.component.html":
/*!**********************************************************!*\
  !*** ./src/app/huewi-scenes/huewi-scenes.component.html ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<mat-card>\r\n\r\n  <div *ngIf=\"!selectedScene\">\r\n    <mat-card-title>\r\n      Scenes\r\n      <small>\r\n        <mat-form-field>\r\n          <input matInput placeholder=\"Filter\" [(ngModel)]=\"searchText\">\r\n        </mat-form-field>\r\n      </small>\r\n    </mat-card-title>\r\n    <mat-list>\r\n      <huewi-scene mat-list-item\r\n        *ngFor=\"let scene of scenes | orderBy:['+name'] | filter:searchText:'name'\"\r\n        [scene]=\"scene\">\r\n      </huewi-scene>\r\n    </mat-list>\r\n  </div>\r\n\r\n  <div *ngIf=\"selectedScene\">\r\n    <mat-card-title>\r\n      <a *ngIf=\"back\" [routerLink]=\"['/scenes']\" [replaceUrl]=\"true\"><mat-icon>navigate_before</mat-icon></a>\r\n      {{selectedScene.name}} - Details\r\n    </mat-card-title>\r\n    <huewi-scene-details\r\n      [scene]=\"selectedScene\">\r\n    </huewi-scene-details>\r\n  </div>\r\n\r\n</mat-card>\r\n"

/***/ }),

/***/ "./src/app/huewi-scenes/huewi-scenes.component.ts":
/*!********************************************************!*\
  !*** ./src/app/huewi-scenes/huewi-scenes.component.ts ***!
  \********************************************************/
/*! exports provided: HuewiScenesComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiScenesComponent", function() { return HuewiScenesComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _app_routing_animations__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./../app-routing.animations */ "./src/app/app-routing.animations.ts");
/* harmony import */ var _huewi_scenes_mock__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./huewi-scenes.mock */ "./src/app/huewi-scenes/huewi-scenes.mock.ts");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
/* harmony import */ var _shared_parameters_service__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../shared/parameters.service */ "./src/app/shared/parameters.service.ts");
/* harmony import */ var rxjs_Observable__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! rxjs/Observable */ "./node_modules/rxjs-compat/_esm5/Observable.js");
/* harmony import */ var rxjs_add_observable_of__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! rxjs/add/observable/of */ "./node_modules/rxjs-compat/_esm5/add/observable/of.js");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};









var HuewiScenesComponent = /** @class */ (function () {
    function HuewiScenesComponent(huepiService, parametersService, activatedRoute, router) {
        this.huepiService = huepiService;
        this.parametersService = parametersService;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.scenes = _huewi_scenes_mock__WEBPACK_IMPORTED_MODULE_3__["HUEWI_SCENES_MOCK"];
        this.back = true;
        this.sceneObserver = rxjs_Observable__WEBPACK_IMPORTED_MODULE_6__["Observable"].of(this.scenes);
        this.selectedScene = undefined;
    }
    Object.defineProperty(HuewiScenesComponent.prototype, "RoutingAnimations", {
        get: function () { return true; },
        enumerable: true,
        configurable: true
    });
    ;
    HuewiScenesComponent.prototype.ngOnInit = function () {
        var _this = this;
        var parameters = this.parametersService.getParameters();
        if (parameters['widget']) {
            this.back = false;
        }
        this.sceneObserver = this.huepiService.getScenes();
        this.scenesSubscription = this.sceneObserver.subscribe(function (value) {
            _this.scenes = value;
            _this.updateSelected();
        });
    };
    HuewiScenesComponent.prototype.ngOnDestroy = function () {
        this.scenesSubscription.unsubscribe();
    };
    HuewiScenesComponent.prototype.updateSelected = function () {
        var id = this.activatedRoute.snapshot.paramMap.get('id');
        this.selectedScene = this.huepiService.MyHue.Scenes[id];
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["HostBinding"])('@RoutingAnimations'),
        __metadata("design:type", Object),
        __metadata("design:paramtypes", [])
    ], HuewiScenesComponent.prototype, "RoutingAnimations", null);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiScenesComponent.prototype, "scenes", void 0);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiScenesComponent.prototype, "back", void 0);
    HuewiScenesComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-scenes',
            template: __webpack_require__(/*! ./huewi-scenes.component.html */ "./src/app/huewi-scenes/huewi-scenes.component.html"),
            styles: [__webpack_require__(/*! ./huewi-scenes.component.css */ "./src/app/huewi-scenes/huewi-scenes.component.css")],
            animations: [Object(_app_routing_animations__WEBPACK_IMPORTED_MODULE_2__["RoutingAnimations"])()]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_4__["HuepiService"], _shared_parameters_service__WEBPACK_IMPORTED_MODULE_5__["ParametersService"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["ActivatedRoute"], _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], HuewiScenesComponent);
    return HuewiScenesComponent;
}());



/***/ }),

/***/ "./src/app/huewi-scenes/huewi-scenes.mock.ts":
/*!***************************************************!*\
  !*** ./src/app/huewi-scenes/huewi-scenes.mock.ts ***!
  \***************************************************/
/*! exports provided: HUEWI_SCENES_MOCK */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HUEWI_SCENES_MOCK", function() { return HUEWI_SCENES_MOCK; });
var HUEWI_SCENES_MOCK = [];


/***/ }),

/***/ "./src/app/huewi-scenes/huewi-scenes.module.ts":
/*!*****************************************************!*\
  !*** ./src/app/huewi-scenes/huewi-scenes.module.ts ***!
  \*****************************************************/
/*! exports provided: HuewiScenesModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiScenesModule", function() { return HuewiScenesModule; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/common */ "./node_modules/@angular/common/fesm5/common.js");
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/forms */ "./node_modules/@angular/forms/fesm5/forms.js");
/* harmony import */ var _pipes_pipes_module__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../pipes/pipes.module */ "./src/app/pipes/pipes.module.ts");
/* harmony import */ var _app_material_module__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../app-material.module */ "./src/app/app-material.module.ts");
/* harmony import */ var _huewi_scenes_component__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./huewi-scenes.component */ "./src/app/huewi-scenes/huewi-scenes.component.ts");
/* harmony import */ var _huewi_scene_huewi_scene_component__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./huewi-scene/huewi-scene.component */ "./src/app/huewi-scenes/huewi-scene/huewi-scene.component.ts");
/* harmony import */ var _huewi_scene_details_huewi_scene_details_component__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./huewi-scene-details/huewi-scene-details.component */ "./src/app/huewi-scenes/huewi-scene-details/huewi-scene-details.component.ts");
/* harmony import */ var _huewi_scenes_routing_module__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./huewi-scenes-routing.module */ "./src/app/huewi-scenes/huewi-scenes-routing.module.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};









var HuewiScenesModule = /** @class */ (function () {
    function HuewiScenesModule() {
    }
    HuewiScenesModule = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["NgModule"])({
            imports: [
                _angular_common__WEBPACK_IMPORTED_MODULE_1__["CommonModule"],
                _angular_forms__WEBPACK_IMPORTED_MODULE_2__["FormsModule"],
                _pipes_pipes_module__WEBPACK_IMPORTED_MODULE_3__["PipesModule"],
                _app_material_module__WEBPACK_IMPORTED_MODULE_4__["MaterialModule"],
                _huewi_scenes_routing_module__WEBPACK_IMPORTED_MODULE_8__["HuewiScenesRoutingModule"]
            ],
            declarations: [
                _huewi_scenes_component__WEBPACK_IMPORTED_MODULE_5__["HuewiScenesComponent"],
                _huewi_scene_huewi_scene_component__WEBPACK_IMPORTED_MODULE_6__["HuewiSceneComponent"],
                _huewi_scene_details_huewi_scene_details_component__WEBPACK_IMPORTED_MODULE_7__["HuewiSceneDetailsComponent"]
            ],
            exports: [
                _huewi_scenes_component__WEBPACK_IMPORTED_MODULE_5__["HuewiScenesComponent"],
                _huewi_scene_huewi_scene_component__WEBPACK_IMPORTED_MODULE_6__["HuewiSceneComponent"],
                _huewi_scene_details_huewi_scene_details_component__WEBPACK_IMPORTED_MODULE_7__["HuewiSceneDetailsComponent"]
            ]
        })
    ], HuewiScenesModule);
    return HuewiScenesModule;
}());



/***/ }),

/***/ "./src/app/huewi-schedules/huewi-schedule-details/huewi-schedule-details.component.css":
/*!*********************************************************************************************!*\
  !*** ./src/app/huewi-schedules/huewi-schedule-details/huewi-schedule-details.component.css ***!
  \*********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "mat-icon {\r\n    float: right;\r\n}\r\n"

/***/ }),

/***/ "./src/app/huewi-schedules/huewi-schedule-details/huewi-schedule-details.component.html":
/*!**********************************************************************************************!*\
  !*** ./src/app/huewi-schedules/huewi-schedule-details/huewi-schedule-details.component.html ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<huewi-schedule \r\n  [schedule]=\"schedule\">\r\n</huewi-schedule>\r\n\r\n<div>\r\n  <div>schedule {{schedule.__key}}</div>\r\n  <mat-icon *ngIf=\"!expand\" (click)=\"expand=true\">expand_more</mat-icon>\r\n  <div *ngIf=\"expand\">\r\n    <small>\r\n      <mat-icon (click)=\"expand=false\">expand_less</mat-icon>\r\n      <mat-divider></mat-divider>\r\n      Localtime: {{schedule.localtime}} Time: {{schedule.time}} (Created: {{schedule.created}})<br>\r\n      {{schedule.command.method}} {{schedule.command.address}} {{schedule.command.body | json}}\r\n    </small>\r\n  </div>\r\n</div>\r\n"

/***/ }),

/***/ "./src/app/huewi-schedules/huewi-schedule-details/huewi-schedule-details.component.ts":
/*!********************************************************************************************!*\
  !*** ./src/app/huewi-schedules/huewi-schedule-details/huewi-schedule-details.component.ts ***!
  \********************************************************************************************/
/*! exports provided: HuewiScheduleDetailsComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiScheduleDetailsComponent", function() { return HuewiScheduleDetailsComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
/* harmony import */ var _shared_parameters_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../shared/parameters.service */ "./src/app/shared/parameters.service.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var HuewiScheduleDetailsComponent = /** @class */ (function () {
    function HuewiScheduleDetailsComponent(huepiService, parametersService) {
        this.huepiService = huepiService;
        this.parametersService = parametersService;
        this.expand = false;
    }
    HuewiScheduleDetailsComponent.prototype.ngOnInit = function () {
        var parameters = this.parametersService.getParameters();
        if (parameters['expand']) {
            this.expand = parameters['expand'];
        }
    };
    HuewiScheduleDetailsComponent.prototype.ngOnDestroy = function () {
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiScheduleDetailsComponent.prototype, "schedule", void 0);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiScheduleDetailsComponent.prototype, "expand", void 0);
    HuewiScheduleDetailsComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-schedule-details',
            template: __webpack_require__(/*! ./huewi-schedule-details.component.html */ "./src/app/huewi-schedules/huewi-schedule-details/huewi-schedule-details.component.html"),
            styles: [__webpack_require__(/*! ./huewi-schedule-details.component.css */ "./src/app/huewi-schedules/huewi-schedule-details/huewi-schedule-details.component.css")]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_1__["HuepiService"], _shared_parameters_service__WEBPACK_IMPORTED_MODULE_2__["ParametersService"]])
    ], HuewiScheduleDetailsComponent);
    return HuewiScheduleDetailsComponent;
}());



/***/ }),

/***/ "./src/app/huewi-schedules/huewi-schedule/huewi-schedule.component.css":
/*!*****************************************************************************!*\
  !*** ./src/app/huewi-schedules/huewi-schedule/huewi-schedule.component.css ***!
  \*****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/huewi-schedules/huewi-schedule/huewi-schedule.component.html":
/*!******************************************************************************!*\
  !*** ./src/app/huewi-schedules/huewi-schedule/huewi-schedule.component.html ***!
  \******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div class=\"flexcontainer\"\r\n  (click)=\"select(schedule)\">\r\n  <div style=\"flex: 1 1 128px\">\r\n    {{schedule.name}}\r\n  </div>\r\n  <div style=\"flex: 0 1 10px\">\r\n    <mat-icon *ngIf=\"schedule.status === 'enabled'\">radio_button_checked</mat-icon>\r\n    <mat-icon *ngIf=\"schedule.status === 'disabled'\">radio_button_unchecked</mat-icon>      \r\n  </div>\r\n</div>\r\n"

/***/ }),

/***/ "./src/app/huewi-schedules/huewi-schedule/huewi-schedule.component.ts":
/*!****************************************************************************!*\
  !*** ./src/app/huewi-schedules/huewi-schedule/huewi-schedule.component.ts ***!
  \****************************************************************************/
/*! exports provided: HuewiScheduleComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiScheduleComponent", function() { return HuewiScheduleComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var HuewiScheduleComponent = /** @class */ (function () {
    function HuewiScheduleComponent(huepiService, router) {
        this.huepiService = huepiService;
        this.router = router;
    }
    HuewiScheduleComponent.prototype.ngOnInit = function () {
    };
    HuewiScheduleComponent.prototype.select = function (schedule) {
        this.router.navigate(['/schedules', schedule.__key], { replaceUrl: true });
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiScheduleComponent.prototype, "schedule", void 0);
    HuewiScheduleComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-schedule',
            template: __webpack_require__(/*! ./huewi-schedule.component.html */ "./src/app/huewi-schedules/huewi-schedule/huewi-schedule.component.html"),
            styles: [__webpack_require__(/*! ./huewi-schedule.component.css */ "./src/app/huewi-schedules/huewi-schedule/huewi-schedule.component.css")]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_2__["HuepiService"], _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], HuewiScheduleComponent);
    return HuewiScheduleComponent;
}());



/***/ }),

/***/ "./src/app/huewi-schedules/huewi-schedules-routing.module.ts":
/*!*******************************************************************!*\
  !*** ./src/app/huewi-schedules/huewi-schedules-routing.module.ts ***!
  \*******************************************************************/
/*! exports provided: HuewiSchedulesRoutingModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiSchedulesRoutingModule", function() { return HuewiSchedulesRoutingModule; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _huewi_schedules_component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./huewi-schedules.component */ "./src/app/huewi-schedules/huewi-schedules.component.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};



var huewiSchedulesRoutes = [
    { path: 'schedules', component: _huewi_schedules_component__WEBPACK_IMPORTED_MODULE_2__["HuewiSchedulesComponent"] },
    { path: 'schedules/:id', component: _huewi_schedules_component__WEBPACK_IMPORTED_MODULE_2__["HuewiSchedulesComponent"] }
];
var HuewiSchedulesRoutingModule = /** @class */ (function () {
    function HuewiSchedulesRoutingModule() {
    }
    HuewiSchedulesRoutingModule = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["NgModule"])({
            imports: [
                _angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"].forChild(huewiSchedulesRoutes)
            ],
            exports: [
                _angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"]
            ]
        })
    ], HuewiSchedulesRoutingModule);
    return HuewiSchedulesRoutingModule;
}());



/***/ }),

/***/ "./src/app/huewi-schedules/huewi-schedules.component.css":
/*!***************************************************************!*\
  !*** ./src/app/huewi-schedules/huewi-schedules.component.css ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/huewi-schedules/huewi-schedules.component.html":
/*!****************************************************************!*\
  !*** ./src/app/huewi-schedules/huewi-schedules.component.html ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<mat-card [@RoutingAnimations]>\r\n\r\n  <div *ngIf=\"!selectedSchedule\">\r\n    <mat-card-title>\r\n      Schedules\r\n      <small>\r\n        <mat-form-field>\r\n          <input matInput placeholder=\"Filter\" [(ngModel)]=\"searchText\">\r\n        </mat-form-field>\r\n      </small>\r\n    </mat-card-title>\r\n    <mat-list>\r\n      <huewi-schedule mat-list-item\r\n        *ngFor=\"let schedule of schedules | orderBy:['+name'] | filter:searchText:'name'\"\r\n        [schedule]=\"schedule\">\r\n      </huewi-schedule>\r\n    </mat-list>\r\n  </div>\r\n\r\n  <div *ngIf=\"selectedSchedule\">\r\n    <mat-card-title>\r\n      <a *ngIf=\"back\" [routerLink]=\"['/schedules']\" [replaceUrl]=\"true\"><mat-icon>navigate_before</mat-icon></a>\r\n      {{selectedSchedule.name}} - Details\r\n    </mat-card-title>\r\n    <huewi-schedule-details\r\n      [schedule]=\"selectedSchedule\">\r\n    </huewi-schedule-details>\r\n  </div>\r\n\r\n</mat-card>\r\n"

/***/ }),

/***/ "./src/app/huewi-schedules/huewi-schedules.component.ts":
/*!**************************************************************!*\
  !*** ./src/app/huewi-schedules/huewi-schedules.component.ts ***!
  \**************************************************************/
/*! exports provided: HuewiSchedulesComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiSchedulesComponent", function() { return HuewiSchedulesComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _app_routing_animations__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./../app-routing.animations */ "./src/app/app-routing.animations.ts");
/* harmony import */ var _huewi_schedules_mock__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./huewi-schedules.mock */ "./src/app/huewi-schedules/huewi-schedules.mock.ts");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
/* harmony import */ var _shared_parameters_service__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../shared/parameters.service */ "./src/app/shared/parameters.service.ts");
/* harmony import */ var rxjs_Observable__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! rxjs/Observable */ "./node_modules/rxjs-compat/_esm5/Observable.js");
/* harmony import */ var rxjs_add_observable_of__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! rxjs/add/observable/of */ "./node_modules/rxjs-compat/_esm5/add/observable/of.js");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};









var HuewiSchedulesComponent = /** @class */ (function () {
    function HuewiSchedulesComponent(huepiService, parametersService, activatedRoute, router) {
        this.huepiService = huepiService;
        this.parametersService = parametersService;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.schedules = _huewi_schedules_mock__WEBPACK_IMPORTED_MODULE_3__["HUEWI_SCHEDULES_MOCK"];
        this.back = true;
        this.scheduleObserver = rxjs_Observable__WEBPACK_IMPORTED_MODULE_6__["Observable"].of(this.schedules);
        this.selectedSchedule = undefined;
    }
    Object.defineProperty(HuewiSchedulesComponent.prototype, "RoutingAnimations", {
        get: function () { return true; },
        enumerable: true,
        configurable: true
    });
    ;
    HuewiSchedulesComponent.prototype.ngOnInit = function () {
        var _this = this;
        var parameters = this.parametersService.getParameters();
        if (parameters['widget']) {
            this.back = false;
        }
        this.scheduleObserver = this.huepiService.getSchedules();
        this.schedulesSubscription = this.scheduleObserver.subscribe(function (value) {
            _this.schedules = value;
            _this.updateSelected();
        });
    };
    HuewiSchedulesComponent.prototype.ngOnDestroy = function () {
        this.schedulesSubscription.unsubscribe();
    };
    HuewiSchedulesComponent.prototype.updateSelected = function () {
        var id = this.activatedRoute.snapshot.paramMap.get('id');
        this.selectedSchedule = this.huepiService.MyHue.Schedules[id];
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["HostBinding"])('@RoutingAnimations'),
        __metadata("design:type", Object),
        __metadata("design:paramtypes", [])
    ], HuewiSchedulesComponent.prototype, "RoutingAnimations", null);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiSchedulesComponent.prototype, "schedules", void 0);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiSchedulesComponent.prototype, "back", void 0);
    HuewiSchedulesComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-schedules',
            template: __webpack_require__(/*! ./huewi-schedules.component.html */ "./src/app/huewi-schedules/huewi-schedules.component.html"),
            styles: [__webpack_require__(/*! ./huewi-schedules.component.css */ "./src/app/huewi-schedules/huewi-schedules.component.css")],
            animations: [Object(_app_routing_animations__WEBPACK_IMPORTED_MODULE_2__["RoutingAnimations"])()]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_4__["HuepiService"], _shared_parameters_service__WEBPACK_IMPORTED_MODULE_5__["ParametersService"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["ActivatedRoute"], _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], HuewiSchedulesComponent);
    return HuewiSchedulesComponent;
}());



/***/ }),

/***/ "./src/app/huewi-schedules/huewi-schedules.mock.ts":
/*!*********************************************************!*\
  !*** ./src/app/huewi-schedules/huewi-schedules.mock.ts ***!
  \*********************************************************/
/*! exports provided: HUEWI_SCHEDULES_MOCK */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HUEWI_SCHEDULES_MOCK", function() { return HUEWI_SCHEDULES_MOCK; });
var HUEWI_SCHEDULES_MOCK = [];


/***/ }),

/***/ "./src/app/huewi-schedules/huewi-schedules.module.ts":
/*!***********************************************************!*\
  !*** ./src/app/huewi-schedules/huewi-schedules.module.ts ***!
  \***********************************************************/
/*! exports provided: HuewiSchedulesModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiSchedulesModule", function() { return HuewiSchedulesModule; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/common */ "./node_modules/@angular/common/fesm5/common.js");
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/forms */ "./node_modules/@angular/forms/fesm5/forms.js");
/* harmony import */ var _pipes_pipes_module__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../pipes/pipes.module */ "./src/app/pipes/pipes.module.ts");
/* harmony import */ var _app_material_module__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../app-material.module */ "./src/app/app-material.module.ts");
/* harmony import */ var _huewi_schedules_component__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./huewi-schedules.component */ "./src/app/huewi-schedules/huewi-schedules.component.ts");
/* harmony import */ var _huewi_schedule_huewi_schedule_component__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./huewi-schedule/huewi-schedule.component */ "./src/app/huewi-schedules/huewi-schedule/huewi-schedule.component.ts");
/* harmony import */ var _huewi_schedule_details_huewi_schedule_details_component__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./huewi-schedule-details/huewi-schedule-details.component */ "./src/app/huewi-schedules/huewi-schedule-details/huewi-schedule-details.component.ts");
/* harmony import */ var _huewi_schedules_routing_module__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./huewi-schedules-routing.module */ "./src/app/huewi-schedules/huewi-schedules-routing.module.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};









var HuewiSchedulesModule = /** @class */ (function () {
    function HuewiSchedulesModule() {
    }
    HuewiSchedulesModule = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["NgModule"])({
            imports: [
                _angular_common__WEBPACK_IMPORTED_MODULE_1__["CommonModule"],
                _angular_forms__WEBPACK_IMPORTED_MODULE_2__["FormsModule"],
                _pipes_pipes_module__WEBPACK_IMPORTED_MODULE_3__["PipesModule"],
                _app_material_module__WEBPACK_IMPORTED_MODULE_4__["MaterialModule"],
                _huewi_schedules_routing_module__WEBPACK_IMPORTED_MODULE_8__["HuewiSchedulesRoutingModule"]
            ],
            declarations: [
                _huewi_schedules_component__WEBPACK_IMPORTED_MODULE_5__["HuewiSchedulesComponent"],
                _huewi_schedule_huewi_schedule_component__WEBPACK_IMPORTED_MODULE_6__["HuewiScheduleComponent"],
                _huewi_schedule_details_huewi_schedule_details_component__WEBPACK_IMPORTED_MODULE_7__["HuewiScheduleDetailsComponent"]
            ],
            exports: [
                _huewi_schedules_component__WEBPACK_IMPORTED_MODULE_5__["HuewiSchedulesComponent"],
                _huewi_schedule_huewi_schedule_component__WEBPACK_IMPORTED_MODULE_6__["HuewiScheduleComponent"],
                _huewi_schedule_details_huewi_schedule_details_component__WEBPACK_IMPORTED_MODULE_7__["HuewiScheduleDetailsComponent"]
            ]
        })
    ], HuewiSchedulesModule);
    return HuewiSchedulesModule;
}());



/***/ }),

/***/ "./src/app/huewi-sensors/huewi-sensor-details/huewi-sensor-details.component.css":
/*!***************************************************************************************!*\
  !*** ./src/app/huewi-sensors/huewi-sensor-details/huewi-sensor-details.component.css ***!
  \***************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "mat-icon {\r\n    float: right;\r\n}\r\n"

/***/ }),

/***/ "./src/app/huewi-sensors/huewi-sensor-details/huewi-sensor-details.component.html":
/*!****************************************************************************************!*\
  !*** ./src/app/huewi-sensors/huewi-sensor-details/huewi-sensor-details.component.html ***!
  \****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<huewi-sensor \r\n  [sensor]=\"sensor\">\r\n</huewi-sensor>\r\n\r\n<div>\r\n  <div>sensor {{sensor.__key}}</div>\r\n  {{sensor.type}} - {{sensor.modelid}}<br>\r\n  <mat-icon *ngIf=\"!expand\" (click)=\"expand=true\">expand_more</mat-icon>\r\n  <div *ngIf=\"expand\">\r\n    <small>\r\n      <mat-icon (click)=\"expand=false\">expand_less</mat-icon>\r\n      <mat-divider></mat-divider>\r\n      <b>config: </b><br>\r\n      {{sensor.config | json}}\r\n      <br>\r\n      <b>state: </b><br>\r\n      {{sensor.state | json}}\r\n    </small>\r\n  </div>\r\n</div>\r\n"

/***/ }),

/***/ "./src/app/huewi-sensors/huewi-sensor-details/huewi-sensor-details.component.ts":
/*!**************************************************************************************!*\
  !*** ./src/app/huewi-sensors/huewi-sensor-details/huewi-sensor-details.component.ts ***!
  \**************************************************************************************/
/*! exports provided: HuewiSensorDetailsComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiSensorDetailsComponent", function() { return HuewiSensorDetailsComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
/* harmony import */ var _shared_parameters_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../shared/parameters.service */ "./src/app/shared/parameters.service.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var HuewiSensorDetailsComponent = /** @class */ (function () {
    function HuewiSensorDetailsComponent(huepiService, parametersService) {
        this.huepiService = huepiService;
        this.parametersService = parametersService;
        this.back = true;
        this.expand = false;
    }
    HuewiSensorDetailsComponent.prototype.ngOnInit = function () {
        var parameters = this.parametersService.getParameters();
        if (parameters['expand']) {
            this.expand = parameters['expand'];
        }
    };
    HuewiSensorDetailsComponent.prototype.ngOnDestroy = function () {
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiSensorDetailsComponent.prototype, "sensor", void 0);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiSensorDetailsComponent.prototype, "back", void 0);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiSensorDetailsComponent.prototype, "expand", void 0);
    HuewiSensorDetailsComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-sensor-details',
            template: __webpack_require__(/*! ./huewi-sensor-details.component.html */ "./src/app/huewi-sensors/huewi-sensor-details/huewi-sensor-details.component.html"),
            styles: [__webpack_require__(/*! ./huewi-sensor-details.component.css */ "./src/app/huewi-sensors/huewi-sensor-details/huewi-sensor-details.component.css")]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_1__["HuepiService"], _shared_parameters_service__WEBPACK_IMPORTED_MODULE_2__["ParametersService"]])
    ], HuewiSensorDetailsComponent);
    return HuewiSensorDetailsComponent;
}());



/***/ }),

/***/ "./src/app/huewi-sensors/huewi-sensor/huewi-sensor.component.css":
/*!***********************************************************************!*\
  !*** ./src/app/huewi-sensors/huewi-sensor/huewi-sensor.component.css ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/huewi-sensors/huewi-sensor/huewi-sensor.component.html":
/*!************************************************************************!*\
  !*** ./src/app/huewi-sensors/huewi-sensor/huewi-sensor.component.html ***!
  \************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div class=\"flexcontainer\">\r\n  <div style=\"flex: 3 1 128px\" (click)=\"select(sensor)\">\r\n    {{sensor.name}}\r\n  </div>\r\n  <div style=\"flex: 2 1 128px\" >\r\n    <small>{{sensor.type}}</small>\r\n  </div>\r\n  <div style=\"flex: 1 1 32px\">\r\n    <div *ngIf=\"sensor.type=='ZLLPresence'\">{{sensor.state.presence}}</div>\r\n    <div *ngIf=\"sensor.type=='ZLLLightLevel'\">{{sensor.state.lightlevel}}</div>\r\n    <div *ngIf=\"sensor.type=='ZLLTemperature'\">{{sensor.state.temperature}}</div>\r\n    <div *ngIf=\"sensor.type=='ZLLSwitch'\">{{sensor.state.buttonevent}}</div>\r\n    <div *ngIf=\"sensor.type=='ZGPSwitch'\">{{sensor.state.buttonevent}}</div>\r\n    <div *ngIf=\"sensor.type=='CLIPGenericStatus'\">{{sensor.state.status}}</div>\r\n    <div *ngIf=\"sensor.type=='CLIPPresence'\">{{sensor.state.presence}}</div>\r\n    <div *ngIf=\"sensor.type=='Geofence'\">{{sensor.state.presence}}</div>\r\n    <div *ngIf=\"sensor.type=='Daylight'\">{{sensor.state.daylight}}</div>\r\n  </div>\r\n  <div style=\"flex: 0 1 10px\">\r\n    <mat-icon *ngIf=\"sensor.config.on\">radio_button_checked</mat-icon>\r\n    <mat-icon *ngIf=\"!sensor.config.on\">radio_button_unchecked</mat-icon>      \r\n  </div>\r\n</div>\r\n"

/***/ }),

/***/ "./src/app/huewi-sensors/huewi-sensor/huewi-sensor.component.ts":
/*!**********************************************************************!*\
  !*** ./src/app/huewi-sensors/huewi-sensor/huewi-sensor.component.ts ***!
  \**********************************************************************/
/*! exports provided: HuewiSensorComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiSensorComponent", function() { return HuewiSensorComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var HuewiSensorComponent = /** @class */ (function () {
    function HuewiSensorComponent(huepiService, router) {
        this.huepiService = huepiService;
        this.router = router;
    }
    HuewiSensorComponent.prototype.ngOnInit = function () {
    };
    HuewiSensorComponent.prototype.select = function (sensor) {
        this.router.navigate(['/sensors', sensor.__key], { replaceUrl: true });
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiSensorComponent.prototype, "sensor", void 0);
    HuewiSensorComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-sensor',
            template: __webpack_require__(/*! ./huewi-sensor.component.html */ "./src/app/huewi-sensors/huewi-sensor/huewi-sensor.component.html"),
            styles: [__webpack_require__(/*! ./huewi-sensor.component.css */ "./src/app/huewi-sensors/huewi-sensor/huewi-sensor.component.css")]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_2__["HuepiService"], _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], HuewiSensorComponent);
    return HuewiSensorComponent;
}());



/***/ }),

/***/ "./src/app/huewi-sensors/huewi-sensors-routing.module.ts":
/*!***************************************************************!*\
  !*** ./src/app/huewi-sensors/huewi-sensors-routing.module.ts ***!
  \***************************************************************/
/*! exports provided: HuewiSensorsRoutingModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiSensorsRoutingModule", function() { return HuewiSensorsRoutingModule; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _huewi_sensors_component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./huewi-sensors.component */ "./src/app/huewi-sensors/huewi-sensors.component.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};



var huewiSensorsRoutes = [
    { path: 'sensors', component: _huewi_sensors_component__WEBPACK_IMPORTED_MODULE_2__["HuewiSensorsComponent"] },
    { path: 'sensors/:id', component: _huewi_sensors_component__WEBPACK_IMPORTED_MODULE_2__["HuewiSensorsComponent"] }
];
var HuewiSensorsRoutingModule = /** @class */ (function () {
    function HuewiSensorsRoutingModule() {
    }
    HuewiSensorsRoutingModule = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["NgModule"])({
            imports: [
                _angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"].forChild(huewiSensorsRoutes)
            ],
            exports: [
                _angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"]
            ]
        })
    ], HuewiSensorsRoutingModule);
    return HuewiSensorsRoutingModule;
}());



/***/ }),

/***/ "./src/app/huewi-sensors/huewi-sensors.component.css":
/*!***********************************************************!*\
  !*** ./src/app/huewi-sensors/huewi-sensors.component.css ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/huewi-sensors/huewi-sensors.component.html":
/*!************************************************************!*\
  !*** ./src/app/huewi-sensors/huewi-sensors.component.html ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<mat-card [@RoutingAnimations]>\r\n\r\n  <div *ngIf=\"!selectedSensor\">\r\n    <mat-card-title>\r\n      Sensors\r\n      <small>\r\n        <mat-form-field>\r\n          <input matInput placeholder=\"Filter\" [(ngModel)]=\"searchText\">\r\n        </mat-form-field>\r\n      </small>\r\n    </mat-card-title>\r\n    <mat-list>\r\n      <huewi-sensor mat-list-item\r\n        *ngFor=\"let sensor of sensors | orderBy:['+name'] | filter:searchText:'name'\"\r\n        [sensor]=\"sensor\">\r\n      </huewi-sensor>\r\n    </mat-list>\r\n  </div>\r\n\r\n  <div *ngIf=\"selectedSensor\">\r\n    <mat-card-title>\r\n      <a *ngIf=\"back\" [routerLink]=\"['/sensors']\" [replaceUrl]=\"true\"><mat-icon>navigate_before</mat-icon></a>\r\n      {{selectedSensor.name}} - Details\r\n    </mat-card-title>\r\n    <huewi-sensor-details\r\n      [sensor]=\"selectedSensor\">\r\n    </huewi-sensor-details>\r\n  </div>\r\n \r\n</mat-card>\r\n"

/***/ }),

/***/ "./src/app/huewi-sensors/huewi-sensors.component.ts":
/*!**********************************************************!*\
  !*** ./src/app/huewi-sensors/huewi-sensors.component.ts ***!
  \**********************************************************/
/*! exports provided: HuewiSensorsComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiSensorsComponent", function() { return HuewiSensorsComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _app_routing_animations__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./../app-routing.animations */ "./src/app/app-routing.animations.ts");
/* harmony import */ var _huewi_sensors_mock__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./huewi-sensors.mock */ "./src/app/huewi-sensors/huewi-sensors.mock.ts");
/* harmony import */ var _shared_huepi_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../shared/huepi.service */ "./src/app/shared/huepi.service.ts");
/* harmony import */ var _shared_parameters_service__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../shared/parameters.service */ "./src/app/shared/parameters.service.ts");
/* harmony import */ var rxjs_Observable__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! rxjs/Observable */ "./node_modules/rxjs-compat/_esm5/Observable.js");
/* harmony import */ var rxjs_add_observable_of__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! rxjs/add/observable/of */ "./node_modules/rxjs-compat/_esm5/add/observable/of.js");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};









var HuewiSensorsComponent = /** @class */ (function () {
    function HuewiSensorsComponent(huepiService, parametersService, activatedRoute, router) {
        this.huepiService = huepiService;
        this.parametersService = parametersService;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.sensors = _huewi_sensors_mock__WEBPACK_IMPORTED_MODULE_3__["HUEWI_SENSORS_MOCK"];
        this.back = true;
        this.sensorObserver = rxjs_Observable__WEBPACK_IMPORTED_MODULE_6__["Observable"].of(this.sensors);
        this.selectedSensor = undefined;
    }
    Object.defineProperty(HuewiSensorsComponent.prototype, "RoutingAnimations", {
        get: function () { return true; },
        enumerable: true,
        configurable: true
    });
    ;
    HuewiSensorsComponent.prototype.ngOnInit = function () {
        var _this = this;
        var parameters = this.parametersService.getParameters();
        if (parameters['widget']) {
            this.back = false;
        }
        this.sensorObserver = this.huepiService.getSensors();
        this.sensorsSubscription = this.sensorObserver.subscribe(function (value) {
            _this.sensors = value;
            _this.updateSelected();
        });
    };
    HuewiSensorsComponent.prototype.ngOnDestroy = function () {
        this.sensorsSubscription.unsubscribe();
    };
    HuewiSensorsComponent.prototype.updateSelected = function () {
        var id = this.activatedRoute.snapshot.paramMap.get('id');
        this.selectedSensor = this.huepiService.MyHue.Sensors[id];
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["HostBinding"])('@RoutingAnimations'),
        __metadata("design:type", Object),
        __metadata("design:paramtypes", [])
    ], HuewiSensorsComponent.prototype, "RoutingAnimations", null);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiSensorsComponent.prototype, "sensors", void 0);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Object)
    ], HuewiSensorsComponent.prototype, "back", void 0);
    HuewiSensorsComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'huewi-sensors',
            template: __webpack_require__(/*! ./huewi-sensors.component.html */ "./src/app/huewi-sensors/huewi-sensors.component.html"),
            styles: [__webpack_require__(/*! ./huewi-sensors.component.css */ "./src/app/huewi-sensors/huewi-sensors.component.css")],
            animations: [Object(_app_routing_animations__WEBPACK_IMPORTED_MODULE_2__["RoutingAnimations"])()]
        }),
        __metadata("design:paramtypes", [_shared_huepi_service__WEBPACK_IMPORTED_MODULE_4__["HuepiService"], _shared_parameters_service__WEBPACK_IMPORTED_MODULE_5__["ParametersService"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["ActivatedRoute"], _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], HuewiSensorsComponent);
    return HuewiSensorsComponent;
}());



/***/ }),

/***/ "./src/app/huewi-sensors/huewi-sensors.mock.ts":
/*!*****************************************************!*\
  !*** ./src/app/huewi-sensors/huewi-sensors.mock.ts ***!
  \*****************************************************/
/*! exports provided: HUEWI_SENSORS_MOCK */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HUEWI_SENSORS_MOCK", function() { return HUEWI_SENSORS_MOCK; });
var HUEWI_SENSORS_MOCK = [];


/***/ }),

/***/ "./src/app/huewi-sensors/huewi-sensors.module.ts":
/*!*******************************************************!*\
  !*** ./src/app/huewi-sensors/huewi-sensors.module.ts ***!
  \*******************************************************/
/*! exports provided: HuewiSensorsModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuewiSensorsModule", function() { return HuewiSensorsModule; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/common */ "./node_modules/@angular/common/fesm5/common.js");
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/forms */ "./node_modules/@angular/forms/fesm5/forms.js");
/* harmony import */ var _pipes_pipes_module__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../pipes/pipes.module */ "./src/app/pipes/pipes.module.ts");
/* harmony import */ var _app_material_module__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../app-material.module */ "./src/app/app-material.module.ts");
/* harmony import */ var _huewi_sensors_component__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./huewi-sensors.component */ "./src/app/huewi-sensors/huewi-sensors.component.ts");
/* harmony import */ var _huewi_sensor_huewi_sensor_component__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./huewi-sensor/huewi-sensor.component */ "./src/app/huewi-sensors/huewi-sensor/huewi-sensor.component.ts");
/* harmony import */ var _huewi_sensor_details_huewi_sensor_details_component__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./huewi-sensor-details/huewi-sensor-details.component */ "./src/app/huewi-sensors/huewi-sensor-details/huewi-sensor-details.component.ts");
/* harmony import */ var _huewi_sensors_routing_module__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./huewi-sensors-routing.module */ "./src/app/huewi-sensors/huewi-sensors-routing.module.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};









var HuewiSensorsModule = /** @class */ (function () {
    function HuewiSensorsModule() {
    }
    HuewiSensorsModule = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["NgModule"])({
            imports: [
                _angular_common__WEBPACK_IMPORTED_MODULE_1__["CommonModule"],
                _angular_forms__WEBPACK_IMPORTED_MODULE_2__["FormsModule"],
                _pipes_pipes_module__WEBPACK_IMPORTED_MODULE_3__["PipesModule"],
                _app_material_module__WEBPACK_IMPORTED_MODULE_4__["MaterialModule"],
                _huewi_sensors_routing_module__WEBPACK_IMPORTED_MODULE_8__["HuewiSensorsRoutingModule"]
            ],
            declarations: [
                _huewi_sensors_component__WEBPACK_IMPORTED_MODULE_5__["HuewiSensorsComponent"],
                _huewi_sensor_huewi_sensor_component__WEBPACK_IMPORTED_MODULE_6__["HuewiSensorComponent"],
                _huewi_sensor_details_huewi_sensor_details_component__WEBPACK_IMPORTED_MODULE_7__["HuewiSensorDetailsComponent"]
            ],
            exports: [
                _huewi_sensors_component__WEBPACK_IMPORTED_MODULE_5__["HuewiSensorsComponent"],
                _huewi_sensor_huewi_sensor_component__WEBPACK_IMPORTED_MODULE_6__["HuewiSensorComponent"],
                _huewi_sensor_details_huewi_sensor_details_component__WEBPACK_IMPORTED_MODULE_7__["HuewiSensorDetailsComponent"]
            ]
        })
    ], HuewiSensorsModule);
    return HuewiSensorsModule;
}());



/***/ }),

/***/ "./src/app/pipes/filter.pipe.ts":
/*!**************************************!*\
  !*** ./src/app/pipes/filter.pipe.ts ***!
  \**************************************/
/*! exports provided: FilterPipe */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FilterPipe", function() { return FilterPipe; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};

var FilterPipe = /** @class */ (function () {
    function FilterPipe() {
    }
    FilterPipe.prototype.transform = function (items, filter, field) {
        if (filter && Array.isArray(items)) {
            filter = filter.toLowerCase();
            if (field) {
                return items.filter(function (item) { return item[field].toLowerCase().indexOf(filter) >= 0; });
            }
            else {
                return items.filter(function (item) { return JSON.stringify(item).indexOf(filter) >= 0; });
            }
        }
        else {
            return items;
        }
    };
    FilterPipe = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Pipe"])({ name: 'filter', pure: false })
    ], FilterPipe);
    return FilterPipe;
}());



/***/ }),

/***/ "./src/app/pipes/orderby.pipe.ts":
/*!***************************************!*\
  !*** ./src/app/pipes/orderby.pipe.ts ***!
  \***************************************/
/*! exports provided: OrderByPipe */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OrderByPipe", function() { return OrderByPipe; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};

var OrderByPipe = /** @class */ (function () {
    function OrderByPipe() {
        this.value = [];
    }
    OrderByPipe_1 = OrderByPipe;
    OrderByPipe._orderByComparator = function (a, b) {
        if (a === null || typeof a === 'undefined') {
            a = 0;
        }
        ;
        if (b === null || typeof b === 'undefined') {
            b = 0;
        }
        ;
        if ((isNaN(parseFloat(a)) || !isFinite(a)) || (isNaN(parseFloat(b)) || !isFinite(b))) {
            // Isn't a number so lowercase the string to properly compare
            if (a.toLowerCase() < b.toLowerCase()) {
                return -1;
            }
            ;
            if (a.toLowerCase() > b.toLowerCase()) {
                return 1;
            }
            ;
        }
        else {
            // Parse strings as numbers to compare properly
            if (parseFloat(a) < parseFloat(b)) {
                return -1;
            }
            ;
            if (parseFloat(a) > parseFloat(b)) {
                return 1;
            }
            ;
        }
        return 0; // equal each other
    };
    OrderByPipe.prototype.transform = function (input, config) {
        if (config === void 0) { config = '+'; }
        // invalid input given
        if (!input) {
            return input;
        }
        ;
        // make a copy of the input's reference
        this.value = input.slice();
        var value = this.value;
        if (!Array.isArray(value)) {
            return value;
        }
        ;
        if (!Array.isArray(config) || (Array.isArray(config) && config.length === 1)) {
            var propertyToCheck = !Array.isArray(config) ? config : config[0];
            var desc_1 = propertyToCheck.substr(0, 1) === '-';
            // Basic array
            if (!propertyToCheck || propertyToCheck === '-' || propertyToCheck === '+') {
                return !desc_1 ? value.sort() : value.sort().reverse();
            }
            else {
                var property_1 = propertyToCheck.substr(0, 1) === '+' || propertyToCheck.substr(0, 1) === '-'
                    ? propertyToCheck.substr(1)
                    : propertyToCheck;
                return value.sort(function (a, b) {
                    var aValue = a[property_1];
                    var bValue = b[property_1];
                    var propertySplit = property_1.split('.');
                    if (typeof aValue === 'undefined' && typeof bValue === 'undefined' && propertySplit.length > 1) {
                        aValue = a;
                        bValue = b;
                        for (var j = 0; j < propertySplit.length; j++) {
                            aValue = aValue[propertySplit[j]];
                            bValue = bValue[propertySplit[j]];
                        }
                    }
                    return !desc_1
                        ? OrderByPipe_1._orderByComparator(aValue, bValue)
                        : -OrderByPipe_1._orderByComparator(aValue, bValue);
                });
            }
        }
        else {
            // Loop over property of the array in order and sort
            return value.sort(function (a, b) {
                for (var i = 0; i < config.length; i++) {
                    var desc = config[i].substr(0, 1) === '-';
                    var property = config[i].substr(0, 1) === '+' || config[i].substr(0, 1) === '-'
                        ? config[i].substr(1)
                        : config[i];
                    var aValue = a[property];
                    var bValue = b[property];
                    var propertySplit = property.split('.');
                    if (typeof aValue === 'undefined' && typeof bValue === 'undefined' && propertySplit.length > 1) {
                        aValue = a;
                        bValue = b;
                        for (var j = 0; j < propertySplit.length; j++) {
                            aValue = aValue[propertySplit[j]];
                            bValue = bValue[propertySplit[j]];
                        }
                    }
                    var comparison = !desc
                        ? OrderByPipe_1._orderByComparator(aValue, bValue)
                        : -OrderByPipe_1._orderByComparator(aValue, bValue);
                    // Don't return 0 yet in case of needing to sort by next property
                    if (comparison !== 0) {
                        return comparison;
                    }
                    ;
                }
                return 0; // equal each other
            });
        }
    };
    var OrderByPipe_1;
    OrderByPipe = OrderByPipe_1 = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Pipe"])({ name: 'orderBy', pure: false })
    ], OrderByPipe);
    return OrderByPipe;
}());



/***/ }),

/***/ "./src/app/pipes/pipes.module.ts":
/*!***************************************!*\
  !*** ./src/app/pipes/pipes.module.ts ***!
  \***************************************/
/*! exports provided: PipesModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PipesModule", function() { return PipesModule; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/common */ "./node_modules/@angular/common/fesm5/common.js");
/* harmony import */ var _orderby_pipe__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./orderby.pipe */ "./src/app/pipes/orderby.pipe.ts");
/* harmony import */ var _filter_pipe__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./filter.pipe */ "./src/app/pipes/filter.pipe.ts");
/* harmony import */ var _safe_pipe__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./safe.pipe */ "./src/app/pipes/safe.pipe.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};





var PipesModule = /** @class */ (function () {
    function PipesModule() {
    }
    PipesModule = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["NgModule"])({
            imports: [_angular_common__WEBPACK_IMPORTED_MODULE_1__["CommonModule"]],
            declarations: [
                _orderby_pipe__WEBPACK_IMPORTED_MODULE_2__["OrderByPipe"],
                _filter_pipe__WEBPACK_IMPORTED_MODULE_3__["FilterPipe"],
                _safe_pipe__WEBPACK_IMPORTED_MODULE_4__["SafePipe"]
            ],
            exports: [
                _orderby_pipe__WEBPACK_IMPORTED_MODULE_2__["OrderByPipe"],
                _filter_pipe__WEBPACK_IMPORTED_MODULE_3__["FilterPipe"],
                _safe_pipe__WEBPACK_IMPORTED_MODULE_4__["SafePipe"]
            ]
        })
    ], PipesModule);
    return PipesModule;
}());



/***/ }),

/***/ "./src/app/pipes/safe.pipe.ts":
/*!************************************!*\
  !*** ./src/app/pipes/safe.pipe.ts ***!
  \************************************/
/*! exports provided: SafePipe */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SafePipe", function() { return SafePipe; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_platform_browser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/platform-browser */ "./node_modules/@angular/platform-browser/fesm5/platform-browser.js");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var SafePipe = /** @class */ (function () {
    function SafePipe(sanitizer) {
        this.sanitizer = sanitizer;
    }
    SafePipe.prototype.transform = function (url) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    };
    SafePipe = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Pipe"])({ name: 'safe' }),
        __metadata("design:paramtypes", [_angular_platform_browser__WEBPACK_IMPORTED_MODULE_1__["DomSanitizer"]])
    ], SafePipe);
    return SafePipe;
}());



/***/ }),

/***/ "./src/app/shared/huepi.mock.ts":
/*!**************************************!*\
  !*** ./src/app/shared/huepi.mock.ts ***!
  \**************************************/
/*! exports provided: HUEPI_MOCK */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HUEPI_MOCK", function() { return HUEPI_MOCK; });
var HUEPI_MOCK = {
    "lights": {
        "1": {
            "state": {
                "on": false,
                "bri": 0,
                "hue": 0,
                "sat": 0,
                "xy": [0.0000, 0.0000],
                "ct": 0,
                "alert": "none",
                "effect": "none",
                "colormode": "hs",
                "reachable": true
            },
            "type": "Extended color light",
            "name": "Hue Lamp 1",
            "modelid": "LCT001",
            "swversion": "65003148",
            "pointsymbol": {
                "1": "none",
                "2": "none",
                "3": "none",
                "4": "none",
                "5": "none",
                "6": "none",
                "7": "none",
                "8": "none"
            }
        },
        "2": {
            "state": {
                "on": true,
                "bri": 254,
                "hue": 33536,
                "sat": 144,
                "xy": [0.3460, 0.3568],
                "ct": 201,
                "alert": "none",
                "effect": "none",
                "colormode": "hs",
                "reachable": true
            },
            "type": "Extended color light",
            "name": "Hue Lamp 2",
            "modelid": "LCT001",
            "swversion": "65003148",
            "pointsymbol": {
                "1": "none",
                "2": "none",
                "3": "none",
                "4": "none",
                "5": "none",
                "6": "none",
                "7": "none",
                "8": "none"
            }
        }
    },
    "groups": {
        "1": {
            "action": {
                "on": true,
                "bri": 254,
                "hue": 33536,
                "sat": 144,
                "xy": [0.3460, 0.3568],
                "ct": 201,
                "effect": "none",
                "colormode": "xy"
            },
            "lights": ["1", "2"],
            "type": "Room",
            "name": "Room 1"
        }
    },
    "config": {
        "name": "Philips hue",
        "mac": "00:00:88:00:bb:ee",
        "dhcp": true,
        "ipaddress": "192.168.1.74",
        "netmask": "255.255.255.0",
        "gateway": "192.168.1.254",
        "proxyaddress": "",
        "proxyport": 0,
        "UTC": "2012-10-29T12:00:00",
        "whitelist": {
            "1028d66426293e821ecfd9ef1a0731df": {
                "last use date": "2012-10-29T12:00:00",
                "create date": "2012-10-29T12:00:00",
                "name": "test user"
            }
        },
        "swversion": "01003372",
        "swupdate": {
            "updatestate": 0,
            "url": "",
            "text": "",
            "notify": false
        },
        "linkbutton": false,
        "portalservices": false
    },
    "swupdate2": {
        "checkforupdate": false,
        "lastchange": "2017-06-21T19:44:36",
        "bridge": {
            "state": "noupdates",
            "lastinstall": "2017-06-21T19:44:18"
        },
        "state": "noupdates",
        "autoinstall": {
            "updatetime": "T14:00:00",
            "on": false
        }
    },
    "schedules": {
        "1": {
            "name": "schedule",
            "description": "",
            "command": {
                "address": "/api/<username>/groups/0/action",
                "body": {
                    "on": true
                },
                "method": "PUT"
            },
            "time": "2012-10-29T12:00:00"
        }
    }
};


/***/ }),

/***/ "./src/app/shared/huepi.service.ts":
/*!*****************************************!*\
  !*** ./src/app/shared/huepi.service.ts ***!
  \*****************************************/
/*! exports provided: HuepiService */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HuepiService", function() { return HuepiService; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! axios */ "./node_modules/axios/index.js");
/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(axios__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _huepi_huepi_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./../../../../huepi/huepi.js */ "../huepi/huepi.js");
/* harmony import */ var _huepi_huepi_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_huepi_huepi_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _huepi_mock__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./huepi.mock */ "./src/app/shared/huepi.mock.ts");
/* harmony import */ var rxjs_BehaviorSubject__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! rxjs/BehaviorSubject */ "./node_modules/rxjs-compat/_esm5/BehaviorSubject.js");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};






var HuepiService = /** @class */ (function () {
    function HuepiService(router) {
        var _this = this;
        this.router = router;
        this.status = new rxjs_BehaviorSubject__WEBPACK_IMPORTED_MODULE_5__["BehaviorSubject"]('Connecting');
        this.message = new rxjs_BehaviorSubject__WEBPACK_IMPORTED_MODULE_5__["BehaviorSubject"]('');
        this.bridges = new rxjs_BehaviorSubject__WEBPACK_IMPORTED_MODULE_5__["BehaviorSubject"](Array([]));
        this.whitelist = new rxjs_BehaviorSubject__WEBPACK_IMPORTED_MODULE_5__["BehaviorSubject"](Array([]));
        this.groups = new rxjs_BehaviorSubject__WEBPACK_IMPORTED_MODULE_5__["BehaviorSubject"](Array([]));
        this.lights = new rxjs_BehaviorSubject__WEBPACK_IMPORTED_MODULE_5__["BehaviorSubject"](Array([]));
        this.rules = new rxjs_BehaviorSubject__WEBPACK_IMPORTED_MODULE_5__["BehaviorSubject"](Array([]));
        this.scenes = new rxjs_BehaviorSubject__WEBPACK_IMPORTED_MODULE_5__["BehaviorSubject"](Array([]));
        this.schedules = new rxjs_BehaviorSubject__WEBPACK_IMPORTED_MODULE_5__["BehaviorSubject"](Array([]));
        this.sensors = new rxjs_BehaviorSubject__WEBPACK_IMPORTED_MODULE_5__["BehaviorSubject"](Array([]));
        _huepi_huepi_js__WEBPACK_IMPORTED_MODULE_3__["Huepi"].http = axios__WEBPACK_IMPORTED_MODULE_2___default.a.create();
        window["MyHue"] = // DEBUGCODE
            this.MyHue = new _huepi_huepi_js__WEBPACK_IMPORTED_MODULE_3__["Huepi"]();
        this.MyHue['Groups'] = _huepi_mock__WEBPACK_IMPORTED_MODULE_4__["HUEPI_MOCK"]['groups'];
        this.MyHue['Lights'] = _huepi_mock__WEBPACK_IMPORTED_MODULE_4__["HUEPI_MOCK"]['lights'];
        this.MyHue['Schedules'] = _huepi_mock__WEBPACK_IMPORTED_MODULE_4__["HUEPI_MOCK"]['schedules'];
        this.MyHue['BridgeConfig'] = _huepi_mock__WEBPACK_IMPORTED_MODULE_4__["HUEPI_MOCK"]['config'];
        this.dataReceived(); // Show Mockdata
        this.startup();
        this.statusSubscription = this.status.subscribe(function (value) {
            _this.statusChanged();
        });
    }
    HuepiService.prototype.ngOnInit = function () {
    };
    HuepiService.prototype.ngOnDestroy = function () {
        this.statusSubscription.unsubscribe();
    };
    HuepiService.prototype.startup = function () {
        this.resume();
    };
    HuepiService.prototype.pause = function () {
        this.stopHeartbeat();
    };
    HuepiService.prototype.resume = function () {
        this.MyHue.PortalDiscoverLocalBridges(); // Parallel PortalDiscoverLocalBridges
        this.connect();
    };
    HuepiService.prototype.statusChanged = function () {
        var _this = this;
        if (this.status.value.search('Unable') >= 0) {
            setTimeout(function () { _this.connect(); }, 1250);
        }
    };
    // Entry Point for Starting a Connection
    HuepiService.prototype.connect = function (NewBridgeAddress) {
        this.cancelScan();
        this.stopHeartbeat();
        this.MyHue.BridgeIP = NewBridgeAddress || this.MyHue.BridgeIP || localStorage.MyHueBridgeIP || '';
        this.MyHue.BridgeID = '';
        this.MyHue.BridgeName = '';
        this.MyHue.Username = '';
        if (this.MyHue.BridgeIP !== '') {
            this.reConnect();
        }
        else {
            this.discover();
        }
    };
    // IP is known and stored in this.MyHue.BridgeIP
    HuepiService.prototype.reConnect = function () {
        var _this = this;
        this.stopHeartbeat();
        this.status.next('Getting Bridge Config');
        this.MyHue.BridgeGetConfig().then(function () {
            _this.status.next('Bridge Config Received, Getting Data');
            _this.resumeConnection();
        }).catch(function () {
            _this.status.next('Unable to Retreive Bridge Configuration');
            delete localStorage.MyHueBridgeIP; // un-Cache BridgeIP
        });
    };
    // IP,ID & Username is known and stored in this.MyHue.IP,ID & Username
    HuepiService.prototype.resumeConnection = function () {
        var _this = this;
        this.MyHue.BridgeGetData().then(function () {
            localStorage.MyHueBridgeIP = _this.MyHue.BridgeIP; // Cache BridgeIP
            _this.MyHue.GroupsGetZero().then(function () {
                _this.dataReceived();
            });
            _this.status.next('Bridge Connected');
            setTimeout(function () { return _this.status.next('Connected'); }, 500);
            _this.startHeartbeat();
        }).catch(function () {
            _this.message.next('Please press Connectbutton on the hue Bridge');
            _this.MyHue.BridgeCreateUser('huewi2').then(function () {
                localStorage.MyHueBridgeIP = _this.MyHue.BridgeIP; // Cache BridgeIP
                _this.status.next('Whitelisting Succeded');
                setTimeout(function () { return _this.status.next('Connected'); }, 500);
                _this.startHeartbeat();
            }).catch(function () {
                _this.status.next('Unable to Whitelist');
            });
        });
    };
    HuepiService.prototype.discover = function () {
        var _this = this;
        this.cancelScan();
        this.stopHeartbeat();
        this.status.next('Discovering Bridge via Portal');
        this.MyHue.PortalDiscoverLocalBridges().then(function () {
            _this.status.next('Bridge Discovered');
            _this.reConnect();
        }).catch(function () {
            _this.status.next('Unable to Discover Bridge via Portal');
        });
    };
    HuepiService.prototype.scan = function () {
        var _this = this;
        this.stopHeartbeat();
        this.status.next('Scanning Network for Bridge');
        this.MyHue.ScanningNetwork = true;
        this.MyHue.NetworkDiscoverLocalBridges().then(function () {
            _this.status.next('Bridge Found');
            _this.reConnect();
        }).catch(function () {
            _this.status.next('Unable to Locate Bridge with Network Scan');
        });
        this.updateScanProgress();
    };
    HuepiService.prototype.updateScanProgress = function () {
        var _this = this;
        this.status.next('Scanning Network for Bridge: ' + this.MyHue.ScanProgress + '% Progress');
        setTimeout(function () {
            if (_this.isScanning()) {
                _this.updateScanProgress();
            }
        }, 450);
    };
    HuepiService.prototype.isScanning = function () {
        return this.MyHue.ScanningNetwork;
    };
    HuepiService.prototype.cancelScan = function () {
        this.MyHue.ScanningNetwork = false;
    };
    HuepiService.prototype.startHeartbeat = function () {
        var _this = this;
        this.heartbeat = setInterval(function () { _this.onHeartbeat(); }, 2500);
    };
    HuepiService.prototype.stopHeartbeat = function () {
        clearInterval(this.heartbeat);
        this.heartbeat = -1;
    };
    HuepiService.prototype.onHeartbeat = function () {
        var _this = this;
        this.MyHue.BridgeGetData().then(function () {
            _this.MyHue.GroupsGetZero().then(function () {
                _this.dataReceived();
            });
        }).catch(function () {
            _this.stopHeartbeat();
            _this.status.next('Unable to Receive Bridge Data');
        });
    };
    HuepiService.prototype.asArray = function (input) {
        var output = [];
        if (input) {
            Object.keys(input).forEach(function (key) {
                input[key].__key = key;
                output.push(input[key]);
            });
        }
        return output;
    };
    HuepiService.prototype.dataReceived = function () {
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
    };
    HuepiService.prototype.getStatus = function () {
        return this.status.getValue();
    };
    HuepiService.prototype.getMessage = function () {
        return this.message.getValue();
    };
    HuepiService.prototype.getWhitelist = function () {
        return this.whitelist;
    };
    HuepiService.prototype.getBridges = function () {
        return this.bridges;
    };
    HuepiService.prototype.getGroups = function () {
        return this.groups;
    };
    HuepiService.prototype.getLights = function () {
        return this.lights;
    };
    HuepiService.prototype.getRules = function () {
        return this.rules;
    };
    HuepiService.prototype.getScenes = function () {
        return this.scenes;
    };
    HuepiService.prototype.getSchedules = function () {
        return this.schedules;
    };
    HuepiService.prototype.getSensors = function () {
        return this.sensors;
    };
    HuepiService = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injectable"])(),
        __metadata("design:paramtypes", [_angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], HuepiService);
    return HuepiService;
}());



/***/ }),

/***/ "./src/app/shared/parameters.service.ts":
/*!**********************************************!*\
  !*** ./src/app/shared/parameters.service.ts ***!
  \**********************************************/
/*! exports provided: ParametersService */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ParametersService", function() { return ParametersService; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var rxjs_BehaviorSubject__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! rxjs/BehaviorSubject */ "./node_modules/rxjs-compat/_esm5/BehaviorSubject.js");
var __assign = (undefined && undefined.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var ParametersService = /** @class */ (function () {
    function ParametersService(activatedRoute) {
        var _this = this;
        this.activatedRoute = activatedRoute;
        this.parameters = new rxjs_BehaviorSubject__WEBPACK_IMPORTED_MODULE_2__["BehaviorSubject"](Array([]));
        this.parametersSubscription = this.activatedRoute.queryParams.subscribe(function (params) {
            _this.parameters.next(__assign({}, params.keys, params));
            console.log(_this.parameters.value);
        });
    }
    ParametersService.prototype.ngOnInit = function () {
    };
    ParametersService.prototype.ngOnDestroy = function () {
        this.parametersSubscription.unsubscribe();
    };
    ParametersService.prototype.getParameters = function () {
        return this.parameters.value;
    };
    ParametersService = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injectable"])(),
        __metadata("design:paramtypes", [_angular_router__WEBPACK_IMPORTED_MODULE_1__["ActivatedRoute"]])
    ], ParametersService);
    return ParametersService;
}());



/***/ }),

/***/ "./src/environments/environment.ts":
/*!*****************************************!*\
  !*** ./src/environments/environment.ts ***!
  \*****************************************/
/*! exports provided: environment */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "environment", function() { return environment; });
// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.
var environment = {
    production: false
};


/***/ }),

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_platform_browser_dynamic__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/platform-browser-dynamic */ "./node_modules/@angular/platform-browser-dynamic/fesm5/platform-browser-dynamic.js");
/* harmony import */ var _app_app_module__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./app/app.module */ "./src/app/app.module.ts");
/* harmony import */ var _environments_environment__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./environments/environment */ "./src/environments/environment.ts");




if (_environments_environment__WEBPACK_IMPORTED_MODULE_3__["environment"].production) {
    Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["enableProdMode"])();
}
Object(_angular_platform_browser_dynamic__WEBPACK_IMPORTED_MODULE_1__["platformBrowserDynamic"])().bootstrapModule(_app_app_module__WEBPACK_IMPORTED_MODULE_2__["AppModule"]);


/***/ }),

/***/ 0:
/*!***************************!*\
  !*** multi ./src/main.ts ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! D:\Developer\huewi2\src\main.ts */"./src/main.ts");


/***/ })

},[[0,"runtime","vendor"]]]);
//# sourceMappingURL=main.js.map