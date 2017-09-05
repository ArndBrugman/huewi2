webpackJsonp([1],{

/***/ 0:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__("cDNt");


/***/ }),

/***/ "1BZ0":
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
        let fs = __webpack_require__("z1aO");
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
        let fs = __webpack_require__("z1aO");

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
    ConfigTimeOut = ConfigTimeOut || 60000;

    return new Promise((resolve, reject) => {
      Huepi.http.get('http://' + ConfigBridgeIP + '/api/config/', { timeout: ConfigTimeOut }).then((response) => {
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
    ConfigTimeOut = ConfigTimeOut || 60000;

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

}) ( true ? exports : this);


/***/ }),

/***/ "cDNt":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });

// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/environments/environment.ts
var environment = {
    production: true
};
//# sourceMappingURL=environment.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/app.module.ts
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_hammerjs_hammer__ = __webpack_require__("rgUS");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_hammerjs_hammer___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_hammerjs_hammer__);
// import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

var AppModule = (function () {
    function AppModule() {
    }
    return AppModule;
}());

//# sourceMappingURL=app.module.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/shared/huepi.mock.ts
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
//# sourceMappingURL=huepi.mock.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/shared/huepi.service.ts
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_axios__ = __webpack_require__("uG74");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_axios___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_axios__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__huepi_huepi_js__ = __webpack_require__("1BZ0");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__huepi_huepi_js___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__huepi_huepi_js__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_rxjs_BehaviorSubject__ = __webpack_require__("gvep");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_rxjs_BehaviorSubject___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_rxjs_BehaviorSubject__);





var huepi_service_HuepiService = (function () {
    function HuepiService(router) {
        var _this = this;
        this.router = router;
        this.status = new __WEBPACK_IMPORTED_MODULE_4_rxjs_BehaviorSubject__["BehaviorSubject"]('Connecting');
        this.message = new __WEBPACK_IMPORTED_MODULE_4_rxjs_BehaviorSubject__["BehaviorSubject"]('');
        this.bridges = new __WEBPACK_IMPORTED_MODULE_4_rxjs_BehaviorSubject__["BehaviorSubject"](Array([]));
        this.whitelist = new __WEBPACK_IMPORTED_MODULE_4_rxjs_BehaviorSubject__["BehaviorSubject"](Array([]));
        this.groups = new __WEBPACK_IMPORTED_MODULE_4_rxjs_BehaviorSubject__["BehaviorSubject"](Array([]));
        this.lights = new __WEBPACK_IMPORTED_MODULE_4_rxjs_BehaviorSubject__["BehaviorSubject"](Array([]));
        this.rules = new __WEBPACK_IMPORTED_MODULE_4_rxjs_BehaviorSubject__["BehaviorSubject"](Array([]));
        this.scenes = new __WEBPACK_IMPORTED_MODULE_4_rxjs_BehaviorSubject__["BehaviorSubject"](Array([]));
        this.schedules = new __WEBPACK_IMPORTED_MODULE_4_rxjs_BehaviorSubject__["BehaviorSubject"](Array([]));
        this.sensors = new __WEBPACK_IMPORTED_MODULE_4_rxjs_BehaviorSubject__["BehaviorSubject"](Array([]));
        __WEBPACK_IMPORTED_MODULE_2__huepi_huepi_js__["Huepi"].http = __WEBPACK_IMPORTED_MODULE_1_axios___default.a.create();
        window["MyHue"] =
            this.MyHue = new __WEBPACK_IMPORTED_MODULE_2__huepi_huepi_js__["Huepi"]();
        this.MyHue['Groups'] = HUEPI_MOCK['groups'];
        this.MyHue['Lights'] = HUEPI_MOCK['lights'];
        this.MyHue['Schedules'] = HUEPI_MOCK['schedules'];
        this.MyHue['BridgeConfig'] = HUEPI_MOCK['config'];
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
    HuepiService.ctorParameters = function () { return [{ type: __WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return HuepiService;
}());

//# sourceMappingURL=huepi.service.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/app.component.ts
/* harmony import */ var app_component___WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};



var app_component_AppComponent = (function () {
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
    AppComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: app_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["a" /* ActivatedRoute */] }, { type: app_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return AppComponent;
}());

//# sourceMappingURL=app.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-groups/huewi-groups.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var styles = [''];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWdyb3Vwcy9odWV3aS1ncm91cHMuY29tcG9uZW50LmNzcy5zaGltLm5nc3R5bGUudHMiLCJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZzovLy9Vc2Vycy9hcm5kL0RldmVsb3Blci9odWV3aTIvc3JjL2FwcC9odWV3aS1ncm91cHMvaHVld2ktZ3JvdXBzLmNvbXBvbmVudC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiICJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7OyJ9
//# sourceMappingURL=huewi-groups.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-groups/huewi-group/huewi-group.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_group_component_css_shim_ngstyle_styles = [''];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWdyb3Vwcy9odWV3aS1ncm91cC9odWV3aS1ncm91cC5jb21wb25lbnQuY3NzLnNoaW0ubmdzdHlsZS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWdyb3Vwcy9odWV3aS1ncm91cC9odWV3aS1ncm91cC5jb21wb25lbnQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIiAiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7OzsifQ==
//# sourceMappingURL=huewi-group.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-groups/huewi-group/huewi-group.component.ts
/* harmony import */ var huewi_group_component___WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");


var huewi_group_component_HuewiGroupComponent = (function () {
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
    HuewiGroupComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: huewi_group_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return HuewiGroupComponent;
}());

//# sourceMappingURL=huewi-group.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-groups/huewi-group/huewi-group.component.ngfactory.ts
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__angular_forms__ = __webpack_require__("bm2B");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__angular_cdk_platform__ = __webpack_require__("JYHx");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__angular_cdk_bidi__ = __webpack_require__("UPmf");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__angular_router__ = __webpack_require__("BkNc");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */











var styles_HuewiGroupComponent = [huewi_group_component_css_shim_ngstyle_styles];
var RenderType_HuewiGroupComponent = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiGroupComponent, data: {} });
function View_HuewiGroupComponent_1(_l) {
    return __WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 19, 'md-input-container', [['class', 'mat-input-container mat-form-field'], ['style', 'flex: 1 1 50px']], [[2, 'mat-input-invalid', null], [2, 'mat-form-field-invalid', null],
            [2, 'mat-focused', null], [2, 'ng-untouched', null], [2, 'ng-touched',
                null], [2, 'ng-pristine', null], [2, 'ng-dirty', null],
            [2, 'ng-valid', null], [2, 'ng-invalid', null], [2, 'ng-pending',
                null]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2)._control.focus() !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["w" /* View_MdFormField_0 */], __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdFormField */])), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], __WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](7389184, null, 6, __WEBPACK_IMPORTED_MODULE_3__angular_material__["_16" /* MdFormField */], [__WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */],
            __WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */], [2, __WEBPACK_IMPORTED_MODULE_3__angular_material__["u" /* MD_PLACEHOLDER_GLOBAL_OPTIONS */]]], null, null),
        __WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 1, { _control: 0 }), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 2, { _placeholderChild: 0 }),
        __WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 3, { _errorChildren: 1 }), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 4, { _hintChildren: 1 }),
        __WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 5, { _prefixChildren: 1 }), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 6, { _suffixChildren: 1 }),
        (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](1, ['\n    '])), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 1, 8, 'input', [['class',
                'mat-input-element'], ['mdInput', '']], [[8, 'id', 0], [8, 'placeholder', 0], [8,
                'disabled', 0], [8, 'required', 0], [1, 'aria-describedby', 0], [1, 'aria-invalid',
                0], [2, 'ng-untouched', null], [2, 'ng-touched', null], [2, 'ng-pristine',
                null], [2, 'ng-dirty', null], [2, 'ng-valid', null],
            [2, 'ng-invalid', null], [2, 'ng-pending', null]], [[null,
                'ngModelChange'], [null, 'keyup'], [null, 'input'], [null,
                'blur'], [null, 'compositionstart'], [null, 'compositionend'],
            [null, 'focus']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('input' === en)) {
                var pd_0 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12)._handleInput($event.target.value) !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).onTouched() !== false);
                ad = (pd_1 && ad);
            }
            if (('compositionstart' === en)) {
                var pd_2 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12)._compositionStart() !== false);
                ad = (pd_2 && ad);
            }
            if (('compositionend' === en)) {
                var pd_3 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12)._compositionEnd($event.target.value) !== false);
                ad = (pd_3 && ad);
            }
            if (('blur' === en)) {
                var pd_4 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16)._focusChanged(false) !== false);
                ad = (pd_4 && ad);
            }
            if (('focus' === en)) {
                var pd_5 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16)._focusChanged(true) !== false);
                ad = (pd_5 && ad);
            }
            if (('input' === en)) {
                var pd_6 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16)._onInput() !== false);
                ad = (pd_6 && ad);
            }
            if (('ngModelChange' === en)) {
                var pd_7 = ((_co.group.name = $event) !== false);
                ad = (pd_7 && ad);
            }
            if (('keyup' === en)) {
                var pd_8 = (_co.rename(_co.group, $event.target.value) !== false);
                ad = (pd_8 && ad);
            }
            return ad;
        }, null, null)), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], __WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        __WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_forms__["c" /* DefaultValueAccessor */], [__WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], __WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */],
            [2, __WEBPACK_IMPORTED_MODULE_4__angular_forms__["a" /* COMPOSITION_BUFFER_MODE */]]], null, null), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](1024, null, __WEBPACK_IMPORTED_MODULE_4__angular_forms__["g" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [__WEBPACK_IMPORTED_MODULE_4__angular_forms__["c" /* DefaultValueAccessor */]]), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_forms__["k" /* NgModel */], [[8,
                null], [8, null], [8, null], [2, __WEBPACK_IMPORTED_MODULE_4__angular_forms__["g" /* NG_VALUE_ACCESSOR */]]], { model: [0, 'model'] }, { update: 'ngModelChange' }), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](2048, null, __WEBPACK_IMPORTED_MODULE_4__angular_forms__["h" /* NgControl */], null, [__WEBPACK_IMPORTED_MODULE_4__angular_forms__["k" /* NgModel */]]), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](933888, null, 0, __WEBPACK_IMPORTED_MODULE_3__angular_material__["_28" /* MdInput */], [__WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], __WEBPACK_IMPORTED_MODULE_5__angular_cdk_platform__["a" /* Platform */], [2, __WEBPACK_IMPORTED_MODULE_4__angular_forms__["h" /* NgControl */]], [2, __WEBPACK_IMPORTED_MODULE_4__angular_forms__["j" /* NgForm */]],
            [2, __WEBPACK_IMPORTED_MODULE_4__angular_forms__["d" /* FormGroupDirective */]], [2, __WEBPACK_IMPORTED_MODULE_3__angular_material__["r" /* MD_ERROR_GLOBAL_OPTIONS */]]], null, null), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_forms__["i" /* NgControlStatus */], [__WEBPACK_IMPORTED_MODULE_4__angular_forms__["h" /* NgControl */]], null, null), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](2048, [[1, 4]], __WEBPACK_IMPORTED_MODULE_3__angular_material__["_17" /* MdFormFieldControl */], null, [__WEBPACK_IMPORTED_MODULE_3__angular_material__["_28" /* MdInput */]]), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](1, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_23 = _co.group.name;
        _ck(_v, 14, 0, currVal_23);
        _ck(_v, 16, 0);
    }, function (_ck, _v) {
        var currVal_0 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2)._control.errorState;
        var currVal_1 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2)._control.errorState;
        var currVal_2 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2)._control.focused;
        var currVal_3 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2)._shouldForward('untouched');
        var currVal_4 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2)._shouldForward('touched');
        var currVal_5 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2)._shouldForward('pristine');
        var currVal_6 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2)._shouldForward('dirty');
        var currVal_7 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2)._shouldForward('valid');
        var currVal_8 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2)._shouldForward('invalid');
        var currVal_9 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2)._shouldForward('pending');
        _ck(_v, 0, 0, currVal_0, currVal_1, currVal_2, currVal_3, currVal_4, currVal_5, currVal_6, currVal_7, currVal_8, currVal_9);
        var currVal_10 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16).id;
        var currVal_11 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16).placeholder;
        var currVal_12 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16).disabled;
        var currVal_13 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16).required;
        var currVal_14 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16)._ariaDescribedby || null);
        var currVal_15 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16).errorState;
        var currVal_16 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 17).ngClassUntouched;
        var currVal_17 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 17).ngClassTouched;
        var currVal_18 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 17).ngClassPristine;
        var currVal_19 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 17).ngClassDirty;
        var currVal_20 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 17).ngClassValid;
        var currVal_21 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 17).ngClassInvalid;
        var currVal_22 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 17).ngClassPending;
        _ck(_v, 10, 1, [currVal_10, currVal_11, currVal_12, currVal_13, currVal_14, currVal_15,
            currVal_16, currVal_17, currVal_18, currVal_19, currVal_20, currVal_21, currVal_22]);
    });
}
function View_HuewiGroupComponent_2(_l) {
    return __WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [['style',
                'flex: 1 1 50px']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.select(_co.group) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    ', '\n  ']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.group.name;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiGroupComponent_0(_l) {
    return __WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 18, 'div', [['class',
                'flexcontainer']], null, null, null, null, null)),
        (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiGroupComponent_1)), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_6__angular_common__["k" /* NgIf */], [__WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], __WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiGroupComponent_2)),
        __WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_6__angular_common__["k" /* NgIf */], [__WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], __WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(),
            __WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'md-slider', [['class', 'mat-slider'],
                ['role', 'slider'], ['style', 'flex: 5 1 100px'], ['tabindex', '0']], [[1,
                    'aria-disabled', 0], [1, 'aria-valuemax', 0], [1, 'aria-valuemin', 0], [1, 'aria-valuenow',
                    0], [1, 'aria-orientation', 0], [2, 'mat-slider-disabled', null],
                [2, 'mat-slider-has-ticks', null], [2, 'mat-slider-horizontal',
                    null], [2, 'mat-slider-axis-inverted', null], [2, 'mat-slider-sliding',
                    null], [2, 'mat-slider-thumb-label-showing', null],
                [2, 'mat-slider-vertical', null], [2, 'mat-slider-min-value', null],
                [2, 'mat-slider-hide-last-tick', null]], [[null, 'change'],
                [null, 'focus'], [null, 'blur'], [null, 'click'],
                [null, 'keydown'], [null, 'keyup'], [null, 'mouseenter'],
                [null, 'slide'], [null, 'slideend'], [null, 'slidestart']], function (_v, en, $event) {
                var ad = true;
                var _co = _v.component;
                if (('focus' === en)) {
                    var pd_0 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onFocus() !== false);
                    ad = (pd_0 && ad);
                }
                if (('blur' === en)) {
                    var pd_1 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onBlur() !== false);
                    ad = (pd_1 && ad);
                }
                if (('click' === en)) {
                    var pd_2 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onClick($event) !== false);
                    ad = (pd_2 && ad);
                }
                if (('keydown' === en)) {
                    var pd_3 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onKeydown($event) !== false);
                    ad = (pd_3 && ad);
                }
                if (('keyup' === en)) {
                    var pd_4 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onKeyup() !== false);
                    ad = (pd_4 && ad);
                }
                if (('mouseenter' === en)) {
                    var pd_5 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onMouseenter() !== false);
                    ad = (pd_5 && ad);
                }
                if (('slide' === en)) {
                    var pd_6 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onSlide($event) !== false);
                    ad = (pd_6 && ad);
                }
                if (('slideend' === en)) {
                    var pd_7 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onSlideEnd() !== false);
                    ad = (pd_7 && ad);
                }
                if (('slidestart' === en)) {
                    var pd_8 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onSlideStart($event) !== false);
                    ad = (pd_8 && ad);
                }
                if (('change' === en)) {
                    var pd_9 = (_co.brightness(_co.group, $event.value) !== false);
                    ad = (pd_9 && ad);
                }
                return ad;
            }, __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["E" /* View_MdSlider_0 */], __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["o" /* RenderType_MdSlider */])), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](5120, null, __WEBPACK_IMPORTED_MODULE_4__angular_forms__["g" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [__WEBPACK_IMPORTED_MODULE_3__angular_material__["_71" /* MdSlider */]]), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            __WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_3__angular_material__["_71" /* MdSlider */], [__WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], __WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_3__angular_material__["f" /* FocusOriginMonitor */], __WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */],
            [2, __WEBPACK_IMPORTED_MODULE_8__angular_cdk_bidi__["c" /* Directionality */]]], { disabled: [0, 'disabled'], max: [1, 'max'], min: [2,
                'min'], step: [3, 'step'], value: [4, 'value'] }, { change: 'change' }), (_l()(),
            __WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])),
        (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-slide-toggle', [['class',
                'mat-slide-toggle'], ['style', 'flex: 0 1 10px']], [[8, 'id', 0], [2, 'mat-checked',
                null], [2, 'mat-disabled', null], [2, 'mat-slide-toggle-label-before',
                null]], [[null, 'change']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('change' === en)) {
                var pd_0 = (_co.toggle(_co.group) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["D" /* View_MdSlideToggle_0 */], __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["n" /* RenderType_MdSlideToggle */])), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](5120, null, __WEBPACK_IMPORTED_MODULE_4__angular_forms__["g" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [__WEBPACK_IMPORTED_MODULE_3__angular_material__["_69" /* MdSlideToggle */]]), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1228800, null, 0, __WEBPACK_IMPORTED_MODULE_3__angular_material__["_69" /* MdSlideToggle */], [__WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */],
            __WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], __WEBPACK_IMPORTED_MODULE_5__angular_cdk_platform__["a" /* Platform */], __WEBPACK_IMPORTED_MODULE_3__angular_material__["f" /* FocusOriginMonitor */], __WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { checked: [0,
                'checked'] }, { change: 'change' }), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n  '])), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n'])), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.editable;
        _ck(_v, 3, 0, currVal_0);
        var currVal_1 = !_co.editable;
        _ck(_v, 6, 0, currVal_1);
        var currVal_16 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_24" /* ɵinlineInterpolate */](1, '', !_co.group.action.on, '');
        var currVal_17 = 255;
        var currVal_18 = 0;
        var currVal_19 = 1;
        var currVal_20 = _co.group.action.bri;
        _ck(_v, 11, 0, currVal_16, currVal_17, currVal_18, currVal_19, currVal_20);
        var currVal_25 = _co.group.action.on;
        _ck(_v, 16, 0, currVal_25);
    }, function (_ck, _v) {
        var currVal_2 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).disabled;
        var currVal_3 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).max;
        var currVal_4 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).min;
        var currVal_5 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).value;
        var currVal_6 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).vertical ? 'vertical' : 'horizontal');
        var currVal_7 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).disabled;
        var currVal_8 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).tickInterval;
        var currVal_9 = !__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).vertical;
        var currVal_10 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._invertAxis;
        var currVal_11 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._isSliding;
        var currVal_12 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).thumbLabel;
        var currVal_13 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).vertical;
        var currVal_14 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._isMinValue;
        var currVal_15 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).disabled || ((__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._isMinValue && __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._thumbGap) && __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._invertAxis));
        _ck(_v, 8, 1, [currVal_2, currVal_3, currVal_4, currVal_5, currVal_6, currVal_7, currVal_8,
            currVal_9, currVal_10, currVal_11, currVal_12, currVal_13, currVal_14, currVal_15]);
        var currVal_21 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16).id;
        var currVal_22 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16).checked;
        var currVal_23 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16).disabled;
        var currVal_24 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16).labelPosition == 'before');
        _ck(_v, 14, 0, currVal_21, currVal_22, currVal_23, currVal_24);
    });
}
function View_HuewiGroupComponent_Host_0(_l) {
    return __WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-group', [], null, null, null, View_HuewiGroupComponent_0, RenderType_HuewiGroupComponent)), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_group_component_HuewiGroupComponent, [huepi_service_HuepiService, __WEBPACK_IMPORTED_MODULE_10__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiGroupComponentNgFactory = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-group', huewi_group_component_HuewiGroupComponent, View_HuewiGroupComponent_Host_0, { group: 'group', editable: 'editable' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWdyb3Vwcy9odWV3aS1ncm91cC9odWV3aS1ncm91cC5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktZ3JvdXBzL2h1ZXdpLWdyb3VwL2h1ZXdpLWdyb3VwLmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWdyb3Vwcy9odWV3aS1ncm91cC9odWV3aS1ncm91cC5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWdyb3Vwcy9odWV3aS1ncm91cC9odWV3aS1ncm91cC5jb21wb25lbnQudHMuSHVld2lHcm91cENvbXBvbmVudF9Ib3N0Lmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiICIsIjxkaXYgY2xhc3M9XCJmbGV4Y29udGFpbmVyXCI+XG4gIDxtZC1pbnB1dC1jb250YWluZXIgKm5nSWY9XCJlZGl0YWJsZVwiIHN0eWxlPVwiZmxleDogMSAxIDUwcHhcIj5cbiAgICA8aW5wdXQgbWRJbnB1dCBbKG5nTW9kZWwpXT1cImdyb3VwLm5hbWVcIiAoa2V5dXApPVwicmVuYW1lKGdyb3VwLCAkZXZlbnQudGFyZ2V0LnZhbHVlKVwiPlxuICA8L21kLWlucHV0LWNvbnRhaW5lcj5cbiAgPGRpdiAqbmdJZj1cIiFlZGl0YWJsZVwiIHN0eWxlPVwiZmxleDogMSAxIDUwcHhcIlxuICAgIChjbGljayk9XCJzZWxlY3QoZ3JvdXApXCI+XG4gICAge3tncm91cC5uYW1lfX1cbiAgPC9kaXY+XG4gIDxtZC1zbGlkZXIgc3R5bGU9XCJmbGV4OiA1IDEgMTAwcHhcIlxuICAgIChjaGFuZ2UpPVwiYnJpZ2h0bmVzcyhncm91cCwgJGV2ZW50LnZhbHVlKVwiXG4gICAgZGlzYWJsZWQ9XCJ7eyFncm91cC5hY3Rpb24ub259fVwiXG4gICAgW21pbl09XCIwXCIgW21heF09XCIyNTVcIiBbc3RlcF09XCIxXCIgW3ZhbHVlXT1cImdyb3VwLmFjdGlvbi5icmlcIj5cbiAgPC9tZC1zbGlkZXI+XG4gIDxtZC1zbGlkZS10b2dnbGUgc3R5bGU9XCJmbGV4OiAwIDEgMTBweFwiXG4gICAgW2NoZWNrZWRdPVwiZ3JvdXAuYWN0aW9uLm9uXCJcbiAgICAoY2hhbmdlKT1cInRvZ2dsZShncm91cClcIj5cbiAgPC9tZC1zbGlkZS10b2dnbGU+XG48L2Rpdj5cbiIsIjxodWV3aS1ncm91cD48L2h1ZXdpLWdyb3VwPiJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O29CQ0NFO01BQUE7TUFBQTtVQUFBO2NBQUE7VUFBQTtjQUFBO1FBQUE7UUFBQTtVQUFBO1VBQUE7UUFBQTtRQUFBO01BQUEsMkRBQUE7TUFBQTtNQUFBLHNCQUFBOzJCQUFBO2FBQUE7YUFBQTthQUFBO01BQTRELCtCQUMxRDtVQUFBO1VBQUE7VUFBQTtVQUFBO1VBQUE7VUFBQTtVQUFBO1VBQUE7UUFBQTtRQUFBO1FBQUE7VUFBQTtVQUFBO1FBQUE7UUFBQTtVQUFBO1VBQUE7UUFBQTtRQUFBO1VBQUE7VUFBQTtRQUFBO1FBQUE7VUFBQTtVQUFBO1FBQUE7UUFBQTtVQUFBO1VBQUE7UUFBQTtRQUFBO1VBQUE7VUFBQTtRQUFBO1FBQUE7VUFBQTtVQUFBO1FBQUE7UUFBZTtVQUFBO1VBQUE7UUFBQTtRQUF5QjtVQUFBO1VBQUE7UUFBQTtRQUF4QztNQUFBLHVDQUFBO1VBQUE7YUFBQTtVQUFBLG9FQUFBO1VBQUE7WUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQSxxREFBQTt1QkFBQSxtQ0FBQTtxQkFBQTtjQUFBO1VBQUEsc0JBQUE7VUFBQSxvQ0FBQTtVQUFBLDRCQUFxRjs7SUFBdEU7SUFBZixZQUFlLFVBQWY7SUFBQTs7SUFERjtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBLFdBQUE7UUFBQSw2QkFBQTtJQUNFO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUEsYUFBQTtRQUFBLDRFQUFBOzs7O29CQUVGO01BQUE7SUFBQTtJQUFBO0lBQ0U7TUFBQTtNQUFBO0lBQUE7SUFERjtFQUFBLGdDQUMwQjs7O1FBQUE7UUFBQTs7OztvQkFMNUI7TUFBQTtNQUEyQix5Q0FDekI7VUFBQSxrRUFBQTtVQUFBO1VBQUEsZUFFcUIseUNBQ3JCO1VBQUE7YUFBQTtVQUFBLHdCQUdNLHlDQUNOO2lCQUFBO2NBQUE7Y0FBQTtjQUFBO2NBQUE7a0JBQUE7a0JBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO2NBQUE7Z0JBQUE7Z0JBQUE7Z0JBQUE7a0JBQUE7a0JBQUE7Z0JBQUE7Z0JBQUE7a0JBQUE7a0JBQUE7Z0JBQUE7Z0JBQUE7a0JBQUE7a0JBQUE7Z0JBQUE7Z0JBQUE7a0JBQUE7a0JBQUE7Z0JBQUE7Z0JBQUE7a0JBQUE7a0JBQUE7Z0JBQUE7Z0JBQUE7a0JBQUE7a0JBQUE7Z0JBQUE7Z0JBQUE7a0JBQUE7a0JBQUE7Z0JBQUE7Z0JBQUE7a0JBQUE7a0JBQUE7Z0JBQUE7Z0JBQUE7a0JBQUE7a0JBQUE7Z0JBQUE7Z0JBQ0U7a0JBQUE7a0JBQUE7Z0JBQUE7Z0JBREY7Y0FBQTsrQkFBQTtZQUFBO1VBQUEsd0JBQUE7dUJBQUEsc0NBQUE7VUFBQTtjQUFBO2NBQUEsNkRBRzhEO2lCQUFBLDBCQUNsRDtNQUNaO1VBQUE7VUFBQTtVQUFBO1FBQUE7UUFBQTtRQUVFO1VBQUE7VUFBQTtRQUFBO1FBRkY7TUFBQTsrQkFBQTtZQUFBO1VBQUEsNkJBQUE7NkVBQUE7VUFBQSwrQkFFMkIsNkJBQ1Q7VUFBQSxTQUNkOztJQWhCZ0I7SUFBcEIsV0FBb0IsU0FBcEI7SUFHSztJQUFMLFdBQUssU0FBTDtJQU1FO0lBQ1U7SUFBVjtJQUFzQjtJQUFXO0lBSG5DLFlBRUUsV0FDVSxXQUFWLFdBQXNCLFdBQVcsVUFIbkM7SUFNRTtJQURGLFlBQ0UsVUFERjs7SUFMQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO1FBQUE7SUFBQSxZQUFBO1FBQUEsMkVBQUE7SUFLQTtJQUFBO0lBQUE7SUFBQTtJQUFBLFlBQUEsMkNBQUE7Ozs7b0JDYkY7TUFBQTtvQ0FBQSxVQUFBO01BQUE7SUFBQTs7Ozs7In0=
//# sourceMappingURL=huewi-group.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/pipes/orderby.pipe.ts
var OrderByPipe = (function () {
    function OrderByPipe() {
        this.value = [];
    }
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
                        ? OrderByPipe._orderByComparator(aValue, bValue)
                        : -OrderByPipe._orderByComparator(aValue, bValue);
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
                        ? OrderByPipe._orderByComparator(aValue, bValue)
                        : -OrderByPipe._orderByComparator(aValue, bValue);
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
    return OrderByPipe;
}());

//# sourceMappingURL=orderby.pipe.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/pipes/filter.pipe.ts
var FilterPipe = (function () {
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
    return FilterPipe;
}());

//# sourceMappingURL=filter.pipe.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-groups/huewi-group-details/huewi-group-details.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_group_details_component_css_shim_ngstyle_styles = [''];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWdyb3Vwcy9odWV3aS1ncm91cC1kZXRhaWxzL2h1ZXdpLWdyb3VwLWRldGFpbHMuY29tcG9uZW50LmNzcy5zaGltLm5nc3R5bGUudHMiLCJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZzovLy9Vc2Vycy9hcm5kL0RldmVsb3Blci9odWV3aTIvc3JjL2FwcC9odWV3aS1ncm91cHMvaHVld2ktZ3JvdXAtZGV0YWlscy9odWV3aS1ncm91cC1kZXRhaWxzLmNvbXBvbmVudC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiICJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7OyJ9
//# sourceMappingURL=huewi-group-details.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-groups/huewi-group-details/huewi-group-details.component.ts

var huewi_group_details_component_HuewiGroupDetailsComponent = (function () {
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
    HuewiGroupDetailsComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }]; };
    return HuewiGroupDetailsComponent;
}());

//# sourceMappingURL=huewi-group-details.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-groups/huewi-group-details/huewi-group-details.component.ngfactory.ts
/* harmony import */ var huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__angular_forms__ = __webpack_require__("bm2B");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__angular_cdk_platform__ = __webpack_require__("JYHx");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */













var styles_HuewiGroupDetailsComponent = [huewi_group_details_component_css_shim_ngstyle_styles];
var RenderType_HuewiGroupDetailsComponent = huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiGroupDetailsComponent, data: {} });
function View_HuewiGroupDetailsComponent_2(_l) {
    return huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'md-checkbox', [['class', 'mat-checkbox'], ['style', 'flex: 0 1 128px']], [[8, 'id', 0], [2, 'mat-checkbox-indeterminate',
                null], [2, 'mat-checkbox-checked', null], [2, 'mat-checkbox-disabled',
                null], [2, 'mat-checkbox-label-before', null]], [[null,
                'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.toggleLight(_v.context.$implicit.__key) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdCheckbox_0 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["f" /* RenderType_MdCheckbox */])), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](5120, null, __WEBPACK_IMPORTED_MODULE_3__angular_forms__["g" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [__WEBPACK_IMPORTED_MODULE_4__angular_material__["W" /* MdCheckbox */]]), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_4__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](4374528, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["W" /* MdCheckbox */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */], __WEBPACK_IMPORTED_MODULE_4__angular_material__["f" /* FocusOriginMonitor */]], { checked: [0, 'checked'] }, null), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n    ', '\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_5 = _co.hasLight(_v.context.$implicit.__key);
        _ck(_v, 3, 0, currVal_5);
    }, function (_ck, _v) {
        var currVal_0 = huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 3).id;
        var currVal_1 = huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 3).indeterminate;
        var currVal_2 = huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 3).checked;
        var currVal_3 = huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 3).disabled;
        var currVal_4 = (huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 3).labelPosition == 'before');
        _ck(_v, 0, 0, currVal_0, currVal_1, currVal_2, currVal_3, currVal_4);
        var currVal_6 = _v.context.$implicit.name;
        _ck(_v, 4, 0, currVal_6);
    });
}
function View_HuewiGroupDetailsComponent_1(_l) {
    return huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 5, 'div', [['class',
                'flexcontainer wrap justify-center']], null, null, null, null, null)), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 2, null, View_HuewiGroupDetailsComponent_2)),
        huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, __WEBPACK_IMPORTED_MODULE_5__angular_common__["j" /* NgForOf */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */],
            huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, OrderByPipe, []), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵunv */](_v, 3, 0, huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 4).transform(_co.lights, '+name'));
        _ck(_v, 3, 0, currVal_0);
    }, null);
}
function View_HuewiGroupDetailsComponent_3(_l) {
    return huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 12, 'div', [['class',
                'flexcontainer justify-end']], null, null, null, null, null)), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 9, 'small', [], null, null, null, null, null)), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'i', [], null, null, null, null, null)), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['Lights can be part of multple LightGroups but only one Room.'])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, null, null, huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_49" /* MdPrefixRejector */], [[2,
                __WEBPACK_IMPORTED_MODULE_4__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_23" /* MdIcon */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_4__angular_material__["_26" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['info_outline'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        _ck(_v, 9, 0);
    }, null);
}
function View_HuewiGroupDetailsComponent_0(_l) {
    return huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-group', [], null, null, null, View_HuewiGroupComponent_0, RenderType_HuewiGroupComponent)), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_group_component_HuewiGroupComponent, [huepi_service_HuepiService, huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_router__["k" /* Router */]], { group: [0, 'group'], editable: [1, 'editable'] }, null),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n'])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n\n'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n\n'])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 49, 'div', [['class',
                'flexcontainer wrap justify-center']], null, null, null, null, null)), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'mat-raised-button'],
                ['md-raised-button', ''], ['style', 'flex: 1 1 128px']], [[8, 'disabled',
                    0]], [[null, 'click']], function (_v, en, $event) {
                var ad = true;
                var _co = _v.component;
                if (('click' === en)) {
                    var pd_0 = (_co.relax(_co.group) !== false);
                    ad = (pd_0 && ad);
                }
                return ad;
            }, huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_4__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["H" /* MdButton */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_12__angular_cdk_platform__["a" /* Platform */], __WEBPACK_IMPORTED_MODULE_4__angular_material__["f" /* FocusOriginMonitor */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['Relax'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'mat-raised-button'], ['md-raised-button', ''], ['style',
                'flex: 1 1 128px']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.reading(_co.group) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_4__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["H" /* MdButton */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_12__angular_cdk_platform__["a" /* Platform */], __WEBPACK_IMPORTED_MODULE_4__angular_material__["f" /* FocusOriginMonitor */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['Reading'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'mat-raised-button'], ['md-raised-button', ''], ['style',
                'flex: 1 1 128px']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.concentrate(_co.group) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_4__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["H" /* MdButton */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_12__angular_cdk_platform__["a" /* Platform */], __WEBPACK_IMPORTED_MODULE_4__angular_material__["f" /* FocusOriginMonitor */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['Concentrate'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'mat-raised-button'], ['md-raised-button', ''], ['style',
                'flex: 1 1 128px']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.energize(_co.group) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_4__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["H" /* MdButton */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_12__angular_cdk_platform__["a" /* Platform */], __WEBPACK_IMPORTED_MODULE_4__angular_material__["f" /* FocusOriginMonitor */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['Energize'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'mat-raised-button'], ['md-raised-button', ''], ['style',
                'flex: 1 1 128px']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.bright(_co.group) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_4__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["H" /* MdButton */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_12__angular_cdk_platform__["a" /* Platform */], __WEBPACK_IMPORTED_MODULE_4__angular_material__["f" /* FocusOriginMonitor */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['Bright'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'mat-raised-button'], ['md-raised-button', ''], ['style',
                'flex: 1 1 128px']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.dimmed(_co.group) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_4__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["H" /* MdButton */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_12__angular_cdk_platform__["a" /* Platform */], __WEBPACK_IMPORTED_MODULE_4__angular_material__["f" /* FocusOriginMonitor */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['Dimmed'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'mat-raised-button'], ['md-raised-button', ''], ['style',
                'flex: 1 1 128px']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.nightLight(_co.group) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_4__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["H" /* MdButton */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_12__angular_cdk_platform__["a" /* Platform */], __WEBPACK_IMPORTED_MODULE_4__angular_material__["f" /* FocusOriginMonitor */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['Nightlight'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'mat-raised-button'], ['md-raised-button', ''], ['style',
                'flex: 1 1 128px']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.goldenHour(_co.group) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_4__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["H" /* MdButton */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_12__angular_cdk_platform__["a" /* Platform */], __WEBPACK_IMPORTED_MODULE_4__angular_material__["f" /* FocusOriginMonitor */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['Golden hour'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n'])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n\n'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n\n'])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiGroupDetailsComponent_1)), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(),
            huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n\n'])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n\n'])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiGroupDetailsComponent_3)),
        huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.group;
        var currVal_1 = (_co.group.__key !== '0');
        _ck(_v, 1, 0, currVal_0, currVal_1);
        var currVal_10 = (_co.group.__key !== '0');
        _ck(_v, 60, 0, currVal_10);
        var currVal_11 = (_co.group.__key !== '0');
        _ck(_v, 65, 0, currVal_11);
    }, function (_ck, _v) {
        var currVal_2 = (huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10).disabled || null);
        _ck(_v, 8, 0, currVal_2);
        var currVal_3 = (huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16).disabled || null);
        _ck(_v, 14, 0, currVal_3);
        var currVal_4 = (huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 22).disabled || null);
        _ck(_v, 20, 0, currVal_4);
        var currVal_5 = (huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 28).disabled || null);
        _ck(_v, 26, 0, currVal_5);
        var currVal_6 = (huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 34).disabled || null);
        _ck(_v, 32, 0, currVal_6);
        var currVal_7 = (huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 40).disabled || null);
        _ck(_v, 38, 0, currVal_7);
        var currVal_8 = (huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 46).disabled || null);
        _ck(_v, 44, 0, currVal_8);
        var currVal_9 = (huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 52).disabled || null);
        _ck(_v, 50, 0, currVal_9);
    });
}
function View_HuewiGroupDetailsComponent_Host_0(_l) {
    return huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-group-details', [], null, null, null, View_HuewiGroupDetailsComponent_0, RenderType_HuewiGroupDetailsComponent)), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_group_details_component_HuewiGroupDetailsComponent, [huepi_service_HuepiService], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiGroupDetailsComponentNgFactory = huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-group-details', huewi_group_details_component_HuewiGroupDetailsComponent, View_HuewiGroupDetailsComponent_Host_0, { group: 'group' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWdyb3Vwcy9odWV3aS1ncm91cC1kZXRhaWxzL2h1ZXdpLWdyb3VwLWRldGFpbHMuY29tcG9uZW50Lm5nZmFjdG9yeS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWdyb3Vwcy9odWV3aS1ncm91cC1kZXRhaWxzL2h1ZXdpLWdyb3VwLWRldGFpbHMuY29tcG9uZW50LnRzIiwibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktZ3JvdXBzL2h1ZXdpLWdyb3VwLWRldGFpbHMvaHVld2ktZ3JvdXAtZGV0YWlscy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWdyb3Vwcy9odWV3aS1ncm91cC1kZXRhaWxzL2h1ZXdpLWdyb3VwLWRldGFpbHMuY29tcG9uZW50LnRzLkh1ZXdpR3JvdXBEZXRhaWxzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPGh1ZXdpLWdyb3VwIFtncm91cF09XCJncm91cFwiIFtlZGl0YWJsZV09XCJncm91cC5fX2tleSAhPT0gJzAnXCI+XG48L2h1ZXdpLWdyb3VwPlxuXG48YnI+XG5cbjxkaXYgY2xhc3M9XCJmbGV4Y29udGFpbmVyIHdyYXAganVzdGlmeS1jZW50ZXJcIj5cbiAgPGJ1dHRvbiBtZC1yYWlzZWQtYnV0dG9uIHN0eWxlPVwiZmxleDogMSAxIDEyOHB4XCIgKGNsaWNrKT1cInJlbGF4KGdyb3VwKVwiPlJlbGF4PC9idXR0b24+XG4gIDxidXR0b24gbWQtcmFpc2VkLWJ1dHRvbiBzdHlsZT1cImZsZXg6IDEgMSAxMjhweFwiIChjbGljayk9XCJyZWFkaW5nKGdyb3VwKVwiPlJlYWRpbmc8L2J1dHRvbj5cbiAgPGJ1dHRvbiBtZC1yYWlzZWQtYnV0dG9uIHN0eWxlPVwiZmxleDogMSAxIDEyOHB4XCIgKGNsaWNrKT1cImNvbmNlbnRyYXRlKGdyb3VwKVwiPkNvbmNlbnRyYXRlPC9idXR0b24+XG4gIDxidXR0b24gbWQtcmFpc2VkLWJ1dHRvbiBzdHlsZT1cImZsZXg6IDEgMSAxMjhweFwiIChjbGljayk9XCJlbmVyZ2l6ZShncm91cClcIj5FbmVyZ2l6ZTwvYnV0dG9uPlxuICA8YnV0dG9uIG1kLXJhaXNlZC1idXR0b24gc3R5bGU9XCJmbGV4OiAxIDEgMTI4cHhcIiAoY2xpY2spPVwiYnJpZ2h0KGdyb3VwKVwiPkJyaWdodDwvYnV0dG9uPlxuICA8YnV0dG9uIG1kLXJhaXNlZC1idXR0b24gc3R5bGU9XCJmbGV4OiAxIDEgMTI4cHhcIiAoY2xpY2spPVwiZGltbWVkKGdyb3VwKVwiPkRpbW1lZDwvYnV0dG9uPlxuICA8YnV0dG9uIG1kLXJhaXNlZC1idXR0b24gc3R5bGU9XCJmbGV4OiAxIDEgMTI4cHhcIiAoY2xpY2spPVwibmlnaHRMaWdodChncm91cClcIj5OaWdodGxpZ2h0PC9idXR0b24+XG4gIDxidXR0b24gbWQtcmFpc2VkLWJ1dHRvbiBzdHlsZT1cImZsZXg6IDEgMSAxMjhweFwiIChjbGljayk9XCJnb2xkZW5Ib3VyKGdyb3VwKVwiPkdvbGRlbiBob3VyPC9idXR0b24+XG48L2Rpdj5cblxuPGJyPlxuXG48ZGl2IGNsYXNzPVwiZmxleGNvbnRhaW5lciB3cmFwIGp1c3RpZnktY2VudGVyXCIgKm5nSWY9XCJncm91cC5fX2tleSAhPT0gJzAnXCI+XG4gIDxtZC1jaGVja2JveCBzdHlsZT1cImZsZXg6IDAgMSAxMjhweFwiICpuZ0Zvcj1cImxldCBsaWdodCBvZiBsaWdodHMgfCBvcmRlckJ5IDogJytuYW1lJ1wiXG4gIFtjaGVja2VkXT1cImhhc0xpZ2h0KGxpZ2h0Ll9fa2V5KVwiIChjbGljayk9XCJ0b2dnbGVMaWdodChsaWdodC5fX2tleSlcIj5cbiAgICB7e2xpZ2h0Lm5hbWV9fVxuICA8L21kLWNoZWNrYm94PlxuPC9kaXY+XG5cbjxicj5cblxuPGRpdiBjbGFzcz1cImZsZXhjb250YWluZXIganVzdGlmeS1lbmRcIiAqbmdJZj1cImdyb3VwLl9fa2V5ICE9PSAnMCdcIj5cbiAgPHNtYWxsPlxuICAgIDxpPkxpZ2h0cyBjYW4gYmUgcGFydCBvZiBtdWx0cGxlIExpZ2h0R3JvdXBzIGJ1dCBvbmx5IG9uZSBSb29tLjwvaT5cbiAgICA8bWQtaWNvbj5pbmZvX291dGxpbmU8L21kLWljb24+XG4gIDwvc21hbGw+XG48L2Rpdj5cbiIsIjxodWV3aS1ncm91cC1kZXRhaWxzPjwvaHVld2ktZ3JvdXAtZGV0YWlscz4iXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O29CQ21CRTtNQUFBO1VBQUE7VUFBQTtVQUFBO1FBQUE7UUFBQTtRQUNrQztVQUFBO1VBQUE7UUFBQTtRQURsQztNQUFBOzJCQUFBO1FBQUE7TUFBQSwwQkFBQTttQkFBQSxzQ0FBQTtvQkFBQTtNQUFBLHVDQUNxRTs7O1FBQXJFO1FBREEsV0FDQSxTQURBOztRQUFBO1FBQUE7UUFBQTtRQUFBO1FBQUE7UUFBQSxXQUFBLGlEQUFBO1FBQ3FFO1FBQUE7Ozs7b0JBRnZFO01BQUE7TUFBQSw4QkFBMkUseUNBQ3pFO2FBQUE7YUFBQTs0QkFBQSxnREFBcUM7VUFBQSxlQUd2Qjs7SUFIdUI7SUFBckMsV0FBcUMsU0FBckM7Ozs7b0JBUUY7TUFBQTtNQUFBLGdCQUFtRSx5Q0FDakU7TUFBQTtNQUFBLDhCQUFPLDJDQUNMO2FBQUE7VUFBQSw0Q0FBRztNQUFBLG1FQUFnRTtNQUFBLGFBQ25FO01BQUE7MEJBQUEsVUFBQTtvQ0FBQTthQUFBO1VBQUEsZ0RBQVM7TUFBc0IseUNBQ3pCOztRQUROOzs7O29CQTlCSjtNQUFBO3VDQUFBLFVBQUE7TUFBQTtNQUE4RCx1Q0FDaEQ7TUFFZDtVQUFBLDBEQUFJO1VBQUEsV0FFSjtVQUFBO1VBQUEsOEJBQStDLHlDQUM3QztpQkFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO1lBQWlEO2NBQUE7Y0FBQTtZQUFBO1lBQWpEO1VBQUEscURBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQSxzQkFBQTtVQUFBLDJDQUF3RTtNQUFjLHlDQUN0RjtVQUFBO2NBQUE7dUJBQUE7WUFBQTtZQUFBO1lBQWlEO2NBQUE7Y0FBQTtZQUFBO1lBQWpEO1VBQUEscURBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQSxzQkFBQTtVQUFBLDJDQUEwRTtNQUFnQix5Q0FDMUY7VUFBQTtjQUFBO3VCQUFBO1lBQUE7WUFBQTtZQUFpRDtjQUFBO2NBQUE7WUFBQTtZQUFqRDtVQUFBLHFEQUFBO1VBQUE7VUFBQSxvQ0FBQTtVQUFBO1VBQUEsc0JBQUE7VUFBQSwyQ0FBOEU7TUFBb0IseUNBQ2xHO1VBQUE7Y0FBQTt1QkFBQTtZQUFBO1lBQUE7WUFBaUQ7Y0FBQTtjQUFBO1lBQUE7WUFBakQ7VUFBQSxxREFBQTtVQUFBO1VBQUEsb0NBQUE7VUFBQTtVQUFBLHNCQUFBO1VBQUEsMkNBQTJFO01BQWlCLHlDQUM1RjtVQUFBO2NBQUE7dUJBQUE7WUFBQTtZQUFBO1lBQWlEO2NBQUE7Y0FBQTtZQUFBO1lBQWpEO1VBQUEscURBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQSxzQkFBQTtVQUFBLDJDQUF5RTtNQUFlLHlDQUN4RjtVQUFBO2NBQUE7dUJBQUE7WUFBQTtZQUFBO1lBQWlEO2NBQUE7Y0FBQTtZQUFBO1lBQWpEO1VBQUEscURBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQSxzQkFBQTtVQUFBLDJDQUF5RTtNQUFlLHlDQUN4RjtVQUFBO2NBQUE7dUJBQUE7WUFBQTtZQUFBO1lBQWlEO2NBQUE7Y0FBQTtZQUFBO1lBQWpEO1VBQUEscURBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQSxzQkFBQTtVQUFBLDJDQUE2RTtNQUFtQix5Q0FDaEc7VUFBQTtjQUFBO3VCQUFBO1lBQUE7WUFBQTtZQUFpRDtjQUFBO2NBQUE7WUFBQTtZQUFqRDtVQUFBLHFEQUFBO1VBQUE7VUFBQSxvQ0FBQTtVQUFBO1VBQUEsc0JBQUE7VUFBQSwyQ0FBNkU7TUFBb0IsdUNBQzdGO01BRU47VUFBQSwwREFBSTtVQUFBLFdBRUo7VUFBQSwyQ0FBQTtVQUFBLHNFQUtNO2lCQUFBLDBCQUVOO1VBQUE7VUFBQSxnQkFBSSx5Q0FFSjtVQUFBO2FBQUE7VUFBQSx3QkFLTTs7SUFoQ087SUFBZ0I7SUFBN0IsV0FBYSxVQUFnQixTQUE3QjtJQWtCK0M7SUFBL0MsWUFBK0MsVUFBL0M7SUFTdUM7SUFBdkMsWUFBdUMsVUFBdkM7O0lBckJFO0lBQUEsV0FBQSxTQUFBO0lBQ0E7SUFBQSxZQUFBLFNBQUE7SUFDQTtJQUFBLFlBQUEsU0FBQTtJQUNBO0lBQUEsWUFBQSxTQUFBO0lBQ0E7SUFBQSxZQUFBLFNBQUE7SUFDQTtJQUFBLFlBQUEsU0FBQTtJQUNBO0lBQUEsWUFBQSxTQUFBO0lBQ0E7SUFBQSxZQUFBLFNBQUE7Ozs7b0JDYkY7TUFBQTsyQ0FBQSxVQUFBO01BQUE7SUFBQTs7Ozs7In0=
//# sourceMappingURL=huewi-group-details.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-groups/huewi-groups.filter.ts
var HuewiGroupsFilter = (function () {
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
    return HuewiGroupsFilter;
}());

//# sourceMappingURL=huewi-groups.filter.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-groups/huewi-groups.mock.ts
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
//# sourceMappingURL=huewi-groups.mock.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/shared/parameters.service.ts
/* harmony import */ var parameters_service___WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_rxjs_BehaviorSubject__ = __webpack_require__("gvep");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_rxjs_BehaviorSubject___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_rxjs_BehaviorSubject__);
var parameters_service___assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};


var ParametersService = (function () {
    function ParametersService(activatedRoute) {
        var _this = this;
        this.activatedRoute = activatedRoute;
        this.parameters = new __WEBPACK_IMPORTED_MODULE_1_rxjs_BehaviorSubject__["BehaviorSubject"](Array([]));
        this.parametersSubscription = this.activatedRoute.queryParams.subscribe(function (params) {
            _this.parameters.next(parameters_service___assign({}, params.keys, params));
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
    ParametersService.ctorParameters = function () { return [{ type: parameters_service___WEBPACK_IMPORTED_MODULE_0__angular_router__["a" /* ActivatedRoute */] }]; };
    return ParametersService;
}());

//# sourceMappingURL=parameters.service.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-groups/huewi-groups.component.ts
/* harmony import */ var huewi_groups_component___WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_rxjs_Observable__ = __webpack_require__("bKpL");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_rxjs_Observable___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_rxjs_Observable__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of__ = __webpack_require__("/zHi");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of__);







var huewi_groups_component_HuewiGroupsComponent = (function () {
    function HuewiGroupsComponent(huepiService, parametersService, activatedRoute, router) {
        this.huepiService = huepiService;
        this.parametersService = parametersService;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.groupsType = 'Rooms';
        this.groups = HUEWI_GROUPS_MOCK;
        this.back = true;
        this.groupObserver = __WEBPACK_IMPORTED_MODULE_4_rxjs_Observable__["Observable"].of(this.groups);
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
    HuewiGroupsComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: ParametersService }, { type: huewi_groups_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["a" /* ActivatedRoute */] }, { type: huewi_groups_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return HuewiGroupsComponent;
}());

//# sourceMappingURL=huewi-groups.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-groups/huewi-groups.component.ngfactory.ts
/* harmony import */ var huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__angular_forms__ = __webpack_require__("bm2B");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__angular_cdk_platform__ = __webpack_require__("JYHx");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__angular_common__ = __webpack_require__("qbdv");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */


















var styles_HuewiGroupsComponent = [styles];
var RenderType_HuewiGroupsComponent = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiGroupsComponent, data: { 'animation': [{ type: 7, name: 'RoutingAnimations',
                definitions: [{ type: 0, name: 'void', styles: { type: 6, styles: { top: -32, left: 0, opacity: 0 },
                            offset: null }, options: undefined }, { type: 0, name: '*', styles: { type: 6,
                            styles: { top: 0, left: 0, opacity: 1 }, offset: null }, options: undefined },
                    { type: 1, expr: ':enter', animation: [{ type: 4, styles: { type: 6, styles: { top: 0,
                                        left: 0, opacity: 1 }, offset: null }, timings: '0.2s ease-in-out' }],
                        options: null }, { type: 1, expr: ':leave', animation: [{ type: 4, styles: { type: 6,
                                    styles: { top: -32, left: 0, opacity: 0 }, offset: null }, timings: '0s ease-in-out' }],
                        options: null }], options: {} }] } });
function View_HuewiGroupsComponent_2(_l) {
    return huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-group', [], null, null, null, View_HuewiGroupComponent_0, RenderType_HuewiGroupComponent)), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_group_component_HuewiGroupComponent, [huepi_service_HuepiService, __WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], { group: [0, 'group'] }, null), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    ']))], function (_ck, _v) {
        var currVal_0 = _v.context.$implicit;
        _ck(_v, 1, 0, currVal_0);
    }, null);
}
function View_HuewiGroupsComponent_1(_l) {
    return huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 40, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 30, 'md-card-title', [['class', 'mat-card-title']], null, null, null, null, null)), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_6__angular_material__["U" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.changeGroupsType() !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['', ''])),
        (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 22, 'small', [], null, null, null, null, null)), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n        '])),
        (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 19, 'md-input-container', [['class',
                'mat-input-container mat-form-field']], [[2, 'mat-input-invalid', null],
            [2, 'mat-form-field-invalid', null], [2, 'mat-focused', null],
            [2, 'ng-untouched', null], [2, 'ng-touched', null], [2, 'ng-pristine',
                null], [2, 'ng-dirty', null], [2, 'ng-valid', null],
            [2, 'ng-invalid', null], [2, 'ng-pending', null]], [[null,
                'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._control.focus() !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["w" /* View_MdFormField_0 */], __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdFormField */])), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](7389184, null, 6, __WEBPACK_IMPORTED_MODULE_6__angular_material__["_16" /* MdFormField */], [huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */], [2, __WEBPACK_IMPORTED_MODULE_6__angular_material__["u" /* MD_PLACEHOLDER_GLOBAL_OPTIONS */]]], null, null), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 1, { _control: 0 }), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 2, { _placeholderChild: 0 }), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 3, { _errorChildren: 1 }), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 4, { _hintChildren: 1 }), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 5, { _prefixChildren: 1 }), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 6, { _suffixChildren: 1 }), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](1, ['\n          '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 1, 8, 'input', [['class', 'mat-input-element'], ['mdInput', ''],
            ['placeholder', 'Filter']], [[8, 'id', 0], [8, 'placeholder', 0], [8, 'disabled',
                0], [8, 'required', 0], [1, 'aria-describedby', 0], [1, 'aria-invalid', 0], [2,
                'ng-untouched', null], [2, 'ng-touched', null], [2, 'ng-pristine',
                null], [2, 'ng-dirty', null], [2, 'ng-valid', null],
            [2, 'ng-invalid', null], [2, 'ng-pending', null]], [[null,
                'ngModelChange'], [null, 'input'], [null, 'blur'], [null,
                'compositionstart'], [null, 'compositionend'], [null,
                'focus']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('input' === en)) {
                var pd_0 = (huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 23)._handleInput($event.target.value) !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 23).onTouched() !== false);
                ad = (pd_1 && ad);
            }
            if (('compositionstart' === en)) {
                var pd_2 = (huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 23)._compositionStart() !== false);
                ad = (pd_2 && ad);
            }
            if (('compositionend' === en)) {
                var pd_3 = (huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 23)._compositionEnd($event.target.value) !== false);
                ad = (pd_3 && ad);
            }
            if (('blur' === en)) {
                var pd_4 = (huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 27)._focusChanged(false) !== false);
                ad = (pd_4 && ad);
            }
            if (('focus' === en)) {
                var pd_5 = (huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 27)._focusChanged(true) !== false);
                ad = (pd_5 && ad);
            }
            if (('input' === en)) {
                var pd_6 = (huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 27)._onInput() !== false);
                ad = (pd_6 && ad);
            }
            if (('ngModelChange' === en)) {
                var pd_7 = ((_co.searchText = $event) !== false);
                ad = (pd_7 && ad);
            }
            return ad;
        }, null, null)), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_forms__["c" /* DefaultValueAccessor */], [huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */],
            [2, __WEBPACK_IMPORTED_MODULE_8__angular_forms__["a" /* COMPOSITION_BUFFER_MODE */]]], null, null), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](1024, null, __WEBPACK_IMPORTED_MODULE_8__angular_forms__["g" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [__WEBPACK_IMPORTED_MODULE_8__angular_forms__["c" /* DefaultValueAccessor */]]), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_forms__["k" /* NgModel */], [[8,
                null], [8, null], [8, null], [2, __WEBPACK_IMPORTED_MODULE_8__angular_forms__["g" /* NG_VALUE_ACCESSOR */]]], { model: [0, 'model'] }, { update: 'ngModelChange' }), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](2048, null, __WEBPACK_IMPORTED_MODULE_8__angular_forms__["h" /* NgControl */], null, [__WEBPACK_IMPORTED_MODULE_8__angular_forms__["k" /* NgModel */]]), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](933888, null, 0, __WEBPACK_IMPORTED_MODULE_6__angular_material__["_28" /* MdInput */], [huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], __WEBPACK_IMPORTED_MODULE_9__angular_cdk_platform__["a" /* Platform */], [2, __WEBPACK_IMPORTED_MODULE_8__angular_forms__["h" /* NgControl */]], [2, __WEBPACK_IMPORTED_MODULE_8__angular_forms__["j" /* NgForm */]],
            [2, __WEBPACK_IMPORTED_MODULE_8__angular_forms__["d" /* FormGroupDirective */]], [2, __WEBPACK_IMPORTED_MODULE_6__angular_material__["r" /* MD_ERROR_GLOBAL_OPTIONS */]]], { placeholder: [0,
                'placeholder'] }, null), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_forms__["i" /* NgControlStatus */], [__WEBPACK_IMPORTED_MODULE_8__angular_forms__["h" /* NgControl */]], null, null), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](2048, [[1, 4]], __WEBPACK_IMPORTED_MODULE_6__angular_material__["_17" /* MdFormFieldControl */], null, [__WEBPACK_IMPORTED_MODULE_6__angular_material__["_28" /* MdInput */]]), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](1, ['\n        '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 5, null, View_HuewiGroupsComponent_2)), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, __WEBPACK_IMPORTED_MODULE_10__angular_common__["j" /* NgForOf */], [huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */], huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵppd */](2), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](2), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, OrderByPipe, []),
        huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, FilterPipe, []), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_24 = _co.searchText;
        _ck(_v, 25, 0, currVal_24);
        var currVal_25 = 'Filter';
        _ck(_v, 27, 0, currVal_25);
        var currVal_26 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵunv */](_v, 35, 0, huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 39).transform(huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵunv */](_v, 35, 0, huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 38).transform(huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵunv */](_v, 35, 0, _ck(_v, 36, 0, huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v.parent, 0), _co.groups, _co.groupsType)), _ck(_v, 37, 0, '+type', '+name'))), _co.searchText, 'name'));
        _ck(_v, 35, 0, currVal_26);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.groupsType;
        _ck(_v, 7, 0, currVal_0);
        var currVal_1 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._control.errorState;
        var currVal_2 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._control.errorState;
        var currVal_3 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._control.focused;
        var currVal_4 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._shouldForward('untouched');
        var currVal_5 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._shouldForward('touched');
        var currVal_6 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._shouldForward('pristine');
        var currVal_7 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._shouldForward('dirty');
        var currVal_8 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._shouldForward('valid');
        var currVal_9 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._shouldForward('invalid');
        var currVal_10 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._shouldForward('pending');
        _ck(_v, 11, 0, currVal_1, currVal_2, currVal_3, currVal_4, currVal_5, currVal_6, currVal_7, currVal_8, currVal_9, currVal_10);
        var currVal_11 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 27).id;
        var currVal_12 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 27).placeholder;
        var currVal_13 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 27).disabled;
        var currVal_14 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 27).required;
        var currVal_15 = (huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 27)._ariaDescribedby || null);
        var currVal_16 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 27).errorState;
        var currVal_17 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 28).ngClassUntouched;
        var currVal_18 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 28).ngClassTouched;
        var currVal_19 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 28).ngClassPristine;
        var currVal_20 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 28).ngClassDirty;
        var currVal_21 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 28).ngClassValid;
        var currVal_22 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 28).ngClassInvalid;
        var currVal_23 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 28).ngClassPending;
        _ck(_v, 21, 1, [currVal_11, currVal_12, currVal_13, currVal_14, currVal_15, currVal_16,
            currVal_17, currVal_18, currVal_19, currVal_20, currVal_21, currVal_22, currVal_23]);
    });
}
function View_HuewiGroupsComponent_4(_l) {
    return huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'a', [], [[1, 'target', 0], [8, 'href', 4]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, __WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [__WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], __WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], __WEBPACK_IMPORTED_MODULE_10__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])),
        huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, __WEBPACK_IMPORTED_MODULE_6__angular_material__["_23" /* MdIcon */], [huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_6__angular_material__["_26" /* MdIconRegistry */], [8, null]], null, null), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['navigate_before']))], function (_ck, _v) {
        var currVal_2 = true;
        var currVal_3 = _ck(_v, 2, 0, '/groups');
        _ck(_v, 1, 0, currVal_2, currVal_3);
        _ck(_v, 5, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).target;
        var currVal_1 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).href;
        _ck(_v, 0, 0, currVal_0, currVal_1);
    });
}
function View_HuewiGroupsComponent_3(_l) {
    return huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 13, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'md-card-title', [['class', 'mat-card-title']], null, null, null, null, null)), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_6__angular_material__["U" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiGroupsComponent_4)), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_10__angular_common__["k" /* NgIf */], [huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      ', ' - Details\n    '])),
        (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-group-details', [], null, null, null, View_HuewiGroupDetailsComponent_0, RenderType_HuewiGroupDetailsComponent)),
        huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_group_details_component_HuewiGroupDetailsComponent, [huepi_service_HuepiService], { group: [0, 'group'] }, null), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])),
        (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.back;
        _ck(_v, 7, 0, currVal_0);
        var currVal_2 = _co.selectedGroup;
        _ck(_v, 11, 0, currVal_2);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = _co.selectedGroup.name;
        _ck(_v, 8, 0, currVal_1);
    });
}
function View_HuewiGroupsComponent_0(_l) {
    return huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, HuewiGroupsFilter, []), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 9, 'md-card', [['class', 'mat-card']], [[24, '@RoutingAnimations',
                0]], null, null, __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["u" /* View_MdCard_0 */], __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])),
        huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, __WEBPACK_IMPORTED_MODULE_6__angular_material__["Q" /* MdCard */], [], null, null), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiGroupsComponent_1)),
        huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_10__angular_common__["k" /* NgIf */], [huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, [' \n\n  '])), (_l()(),
            huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiGroupsComponent_3)),
        huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_10__angular_common__["k" /* NgIf */], [huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n'])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = !_co.selectedGroup;
        _ck(_v, 6, 0, currVal_1);
        var currVal_2 = _co.selectedGroup;
        _ck(_v, 9, 0, currVal_2);
    }, function (_ck, _v) {
        var currVal_0 = undefined;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiGroupsComponent_Host_0(_l) {
    return huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-groups', [], [[40, '@RoutingAnimations', 0]], null, null, View_HuewiGroupsComponent_0, RenderType_HuewiGroupsComponent)), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_groups_component_HuewiGroupsComponent, [huepi_service_HuepiService, ParametersService, __WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], __WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).RoutingAnimations;
        _ck(_v, 0, 0, currVal_0);
    });
}
var HuewiGroupsComponentNgFactory = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-groups', huewi_groups_component_HuewiGroupsComponent, View_HuewiGroupsComponent_Host_0, { groups: 'groups', back: 'back' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWdyb3Vwcy9odWV3aS1ncm91cHMuY29tcG9uZW50Lm5nZmFjdG9yeS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWdyb3Vwcy9odWV3aS1ncm91cHMuY29tcG9uZW50LnRzIiwibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktZ3JvdXBzL2h1ZXdpLWdyb3Vwcy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWdyb3Vwcy9odWV3aS1ncm91cHMuY29tcG9uZW50LnRzLkh1ZXdpR3JvdXBzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPG1kLWNhcmQgW0BSb3V0aW5nQW5pbWF0aW9uc10+XG5cbiAgPGRpdiAqbmdJZj1cIiFzZWxlY3RlZEdyb3VwXCI+XG4gICAgPG1kLWNhcmQtdGl0bGU+XG4gICAgICA8c3BhbiAoY2xpY2spPVwiY2hhbmdlR3JvdXBzVHlwZSgpXCI+e3tncm91cHNUeXBlfX08L3NwYW4+XG4gICAgICA8c21hbGw+XG4gICAgICAgIDxtZC1pbnB1dC1jb250YWluZXI+XG4gICAgICAgICAgPGlucHV0IG1kSW5wdXQgcGxhY2Vob2xkZXI9XCJGaWx0ZXJcIiBbKG5nTW9kZWwpXT1cInNlYXJjaFRleHRcIj5cbiAgICAgICAgPC9tZC1pbnB1dC1jb250YWluZXI+XG4gICAgICA8L3NtYWxsPlxuICAgIDwvbWQtY2FyZC10aXRsZT5cbiAgICA8aHVld2ktZ3JvdXAgXG4gICAgICAqbmdGb3I9XCJsZXQgZ3JvdXAgb2YgZ3JvdXBzIHwgSHVld2lHcm91cHNGaWx0ZXI6Z3JvdXBzVHlwZSB8IG9yZGVyQnk6WycrdHlwZScsJytuYW1lJ10gfCBmaWx0ZXI6c2VhcmNoVGV4dDonbmFtZSdcIlxuICAgICAgW2dyb3VwXT1cImdyb3VwXCI+XG4gICAgPC9odWV3aS1ncm91cD5cbiAgPC9kaXY+IFxuXG4gIDxkaXYgKm5nSWY9XCJzZWxlY3RlZEdyb3VwXCI+XG4gICAgPG1kLWNhcmQtdGl0bGU+XG4gICAgICA8YSAqbmdJZj1cImJhY2tcIiBbcm91dGVyTGlua109XCJbJy9ncm91cHMnXVwiIFtyZXBsYWNlVXJsXT1cInRydWVcIj48bWQtaWNvbj5uYXZpZ2F0ZV9iZWZvcmU8L21kLWljb24+PC9hPlxuICAgICAge3tzZWxlY3RlZEdyb3VwLm5hbWV9fSAtIERldGFpbHNcbiAgICA8L21kLWNhcmQtdGl0bGU+XG4gICAgPGh1ZXdpLWdyb3VwLWRldGFpbHNcbiAgICAgIFtncm91cF09XCJzZWxlY3RlZEdyb3VwXCI+XG4gICAgPC9odWV3aS1ncm91cC1kZXRhaWxzPlxuICA8L2Rpdj5cblxuPC9tZC1jYXJkPlxuIiwiPGh1ZXdpLWdyb3Vwcz48L2h1ZXdpLWdyb3Vwcz4iXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkNXSTtNQUFBO3VDQUFBLFVBQUE7TUFBQSwrREFFa0I7TUFBQTtJQUFoQjtJQUZGLFdBRUUsU0FGRjs7OztvQkFURjtNQUFBLHdFQUE0QjthQUFBLDRCQUMxQjtNQUFBO01BQUEsbURBQUE7TUFBQTthQUFBO01BQWUsNkNBQ2I7VUFBQTtVQUFBO1lBQUE7WUFBQTtZQUFNO2NBQUE7Y0FBQTtZQUFBO1lBQU47VUFBQSxnQ0FBbUM7TUFBcUIsNkNBQ3hEO1VBQUE7VUFBQSw4QkFBTztNQUNMO1VBQUE7VUFBQTtVQUFBO2NBQUE7VUFBQTtVQUFBO1FBQUE7UUFBQTtVQUFBO1VBQUE7UUFBQTtRQUFBO01BQUEsMkRBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQTtVQUFBO1VBQUE7VUFBQSx1QkFBb0IscUNBQ2xCO1VBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQW9DO2NBQUE7Y0FBQTtZQUFBO1lBQXBDO1VBQUEsdUNBQUE7VUFBQTthQUFBO1VBQUEsb0VBQUE7VUFBQTtZQUFBO1VBQUEsb0NBQUE7VUFBQTtVQUFBLHFEQUFBO3VCQUFBLG1DQUFBO3FCQUFBO2NBQUE7Y0FBQSxzQ0FBQTtVQUFBLG1EQUFBO1VBQUEsNEJBQTZELG1DQUMxQztVQUFBLGVBQ2YsMkNBQ007VUFBQSxhQUNoQjtVQUFBLHFDQUFBO1VBQUE7VUFBQSxzQkFDRTthQUFBLGlDQUVZOzs7UUFQNEI7UUFBcEMsWUFBb0MsVUFBcEM7UUFBZTtRQUFmLFlBQWUsVUFBZjtRQUtKO1lBQUE7Z0JBQUE7WUFBQTtRQURGLFlBQ0UsVUFERjs7O1FBUHFDO1FBQUE7UUFFakM7UUFBQTtRQUFBO1FBQUE7UUFBQTtRQUFBO1FBQUE7UUFBQTtRQUFBO1FBQUE7UUFBQSxZQUFBO1lBQUEsOEJBQUE7UUFDRTtRQUFBO1FBQUE7UUFBQTtRQUFBO1FBQUE7UUFBQTtRQUFBO1FBQUE7UUFBQTtRQUFBO1FBQUE7UUFBQTtRQUFBLGFBQUE7WUFBQSw0RUFBQTs7OztvQkFZSjtNQUFBO1FBQUE7UUFBQTtVQUFBO2NBQUE7VUFBQTtRQUFBO1FBQUE7TUFBQSx1Q0FBQTtNQUFBO1VBQUEsbURBQWdCLElBQStDO01BQUE7TUFBQTthQUFBO3VCQUFBLHNDQUFBO1VBQUE7VUFBQSw2QkFBUzs7SUFBN0I7SUFBM0I7SUFBaEIsV0FBMkMsVUFBM0IsU0FBaEI7SUFBK0Q7O0lBQS9EO0lBQUE7SUFBQSxXQUFBLG1CQUFBOzs7O29CQUZKO01BQUEsd0VBQTJCO2FBQUEsNEJBQ3pCO01BQUE7TUFBQSxxQ0FBQTtNQUFBO2FBQUE7TUFBZSw2Q0FDYjtVQUFBLG1FQUFBO1VBQUE7VUFBQSxlQUFxRztNQUV2RiwyQ0FDaEI7VUFBQTt5RkFBQTthQUFBO1VBQUEsbUNBQzBCO01BQ0o7O0lBTGpCO0lBQUgsV0FBRyxTQUFIO0lBSUE7SUFERixZQUNFLFNBREY7OztJQUh1RztJQUFBOzs7O21FQW5CM0c7TUFBQTtVQUFBO2FBQUE7dUJBQUEsc0NBQUE7VUFBQSx1REFBOEI7VUFBQSxhQUU1QjthQUFBO1VBQUEsaUNBYU0sZ0NBRU47aUJBQUE7YUFBQTtVQUFBLGlDQVFNLDZCQUVFO1VBQUE7O0lBekJIO0lBQUwsV0FBSyxTQUFMO0lBZUs7SUFBTCxXQUFLLFNBQUw7O0lBakJPO0lBQVQsV0FBUyxTQUFUOzs7O29CQ0FBO01BQUE7cUNBQUEsVUFBQTtNQUFBO01BQUE7SUFBQTs7SUFBQTtJQUFBLFdBQUEsU0FBQTs7Ozs7In0=
//# sourceMappingURL=huewi-groups.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-lights/huewi-lights.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_lights_component_css_shim_ngstyle_styles = [''];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWxpZ2h0cy9odWV3aS1saWdodHMuY29tcG9uZW50LmNzcy5zaGltLm5nc3R5bGUudHMiLCJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZzovLy9Vc2Vycy9hcm5kL0RldmVsb3Blci9odWV3aTIvc3JjL2FwcC9odWV3aS1saWdodHMvaHVld2ktbGlnaHRzLmNvbXBvbmVudC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiICJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7OyJ9
//# sourceMappingURL=huewi-lights.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-lights/huewi-light/huewi-light.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_light_component_css_shim_ngstyle_styles = [''];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWxpZ2h0cy9odWV3aS1saWdodC9odWV3aS1saWdodC5jb21wb25lbnQuY3NzLnNoaW0ubmdzdHlsZS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWxpZ2h0cy9odWV3aS1saWdodC9odWV3aS1saWdodC5jb21wb25lbnQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIiAiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7OzsifQ==
//# sourceMappingURL=huewi-light.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-lights/huewi-light/huewi-light.component.ts
/* harmony import */ var huewi_light_component___WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");


var huewi_light_component_HuewiLightComponent = (function () {
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
    HuewiLightComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: huewi_light_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return HuewiLightComponent;
}());

//# sourceMappingURL=huewi-light.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-lights/huewi-light/huewi-light.component.ngfactory.ts
/* harmony import */ var huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_forms__ = __webpack_require__("bm2B");
/* harmony import */ var huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_cdk_platform__ = __webpack_require__("JYHx");
/* harmony import */ var huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_cdk_bidi__ = __webpack_require__("UPmf");
/* harmony import */ var huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_router__ = __webpack_require__("BkNc");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */











var styles_HuewiLightComponent = [huewi_light_component_css_shim_ngstyle_styles];
var RenderType_HuewiLightComponent = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiLightComponent, data: {} });
function View_HuewiLightComponent_1(_l) {
    return huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 19, 'md-input-container', [['class', 'mat-input-container mat-form-field'], ['style', 'flex: 1 1 50px']], [[2, 'mat-input-invalid', null], [2, 'mat-form-field-invalid', null],
            [2, 'mat-focused', null], [2, 'ng-untouched', null], [2, 'ng-touched',
                null], [2, 'ng-pristine', null], [2, 'ng-dirty', null],
            [2, 'ng-valid', null], [2, 'ng-invalid', null], [2, 'ng-pending',
                null]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2)._control.focus() !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["w" /* View_MdFormField_0 */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdFormField */])), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](7389184, null, 6, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_16" /* MdFormField */], [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */],
            huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */], [2, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["u" /* MD_PLACEHOLDER_GLOBAL_OPTIONS */]]], null, null),
        huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 1, { _control: 0 }), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 2, { _placeholderChild: 0 }),
        huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 3, { _errorChildren: 1 }), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 4, { _hintChildren: 1 }),
        huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 5, { _prefixChildren: 1 }), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 6, { _suffixChildren: 1 }),
        (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](1, ['\n    '])), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 1, 8, 'input', [['class',
                'mat-input-element'], ['mdInput', '']], [[8, 'id', 0], [8, 'placeholder', 0], [8,
                'disabled', 0], [8, 'required', 0], [1, 'aria-describedby', 0], [1, 'aria-invalid',
                0], [2, 'ng-untouched', null], [2, 'ng-touched', null], [2, 'ng-pristine',
                null], [2, 'ng-dirty', null], [2, 'ng-valid', null],
            [2, 'ng-invalid', null], [2, 'ng-pending', null]], [[null,
                'ngModelChange'], [null, 'keyup'], [null, 'input'], [null,
                'blur'], [null, 'compositionstart'], [null, 'compositionend'],
            [null, 'focus']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('input' === en)) {
                var pd_0 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12)._handleInput($event.target.value) !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).onTouched() !== false);
                ad = (pd_1 && ad);
            }
            if (('compositionstart' === en)) {
                var pd_2 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12)._compositionStart() !== false);
                ad = (pd_2 && ad);
            }
            if (('compositionend' === en)) {
                var pd_3 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12)._compositionEnd($event.target.value) !== false);
                ad = (pd_3 && ad);
            }
            if (('blur' === en)) {
                var pd_4 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16)._focusChanged(false) !== false);
                ad = (pd_4 && ad);
            }
            if (('focus' === en)) {
                var pd_5 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16)._focusChanged(true) !== false);
                ad = (pd_5 && ad);
            }
            if (('input' === en)) {
                var pd_6 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16)._onInput() !== false);
                ad = (pd_6 && ad);
            }
            if (('ngModelChange' === en)) {
                var pd_7 = ((_co.light.name = $event) !== false);
                ad = (pd_7 && ad);
            }
            if (('keyup' === en)) {
                var pd_8 = (_co.rename(_co.light, $event.target.value) !== false);
                ad = (pd_8 && ad);
            }
            return ad;
        }, null, null)), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_forms__["c" /* DefaultValueAccessor */], [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */],
            [2, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_forms__["a" /* COMPOSITION_BUFFER_MODE */]]], null, null), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](1024, null, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_forms__["g" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_forms__["c" /* DefaultValueAccessor */]]), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_forms__["k" /* NgModel */], [[8,
                null], [8, null], [8, null], [2, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_forms__["g" /* NG_VALUE_ACCESSOR */]]], { model: [0, 'model'] }, { update: 'ngModelChange' }), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](2048, null, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_forms__["h" /* NgControl */], null, [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_forms__["k" /* NgModel */]]), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](933888, null, 0, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_28" /* MdInput */], [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_cdk_platform__["a" /* Platform */], [2, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_forms__["h" /* NgControl */]], [2, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_forms__["j" /* NgForm */]],
            [2, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_forms__["d" /* FormGroupDirective */]], [2, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["r" /* MD_ERROR_GLOBAL_OPTIONS */]]], null, null), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_forms__["i" /* NgControlStatus */], [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_forms__["h" /* NgControl */]], null, null), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](2048, [[1, 4]], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_17" /* MdFormFieldControl */], null, [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_28" /* MdInput */]]), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](1, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_23 = _co.light.name;
        _ck(_v, 14, 0, currVal_23);
        _ck(_v, 16, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2)._control.errorState;
        var currVal_1 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2)._control.errorState;
        var currVal_2 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2)._control.focused;
        var currVal_3 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2)._shouldForward('untouched');
        var currVal_4 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2)._shouldForward('touched');
        var currVal_5 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2)._shouldForward('pristine');
        var currVal_6 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2)._shouldForward('dirty');
        var currVal_7 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2)._shouldForward('valid');
        var currVal_8 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2)._shouldForward('invalid');
        var currVal_9 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2)._shouldForward('pending');
        _ck(_v, 0, 0, currVal_0, currVal_1, currVal_2, currVal_3, currVal_4, currVal_5, currVal_6, currVal_7, currVal_8, currVal_9);
        var currVal_10 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16).id;
        var currVal_11 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16).placeholder;
        var currVal_12 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16).disabled;
        var currVal_13 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16).required;
        var currVal_14 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16)._ariaDescribedby || null);
        var currVal_15 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16).errorState;
        var currVal_16 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 17).ngClassUntouched;
        var currVal_17 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 17).ngClassTouched;
        var currVal_18 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 17).ngClassPristine;
        var currVal_19 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 17).ngClassDirty;
        var currVal_20 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 17).ngClassValid;
        var currVal_21 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 17).ngClassInvalid;
        var currVal_22 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 17).ngClassPending;
        _ck(_v, 10, 1, [currVal_10, currVal_11, currVal_12, currVal_13, currVal_14, currVal_15,
            currVal_16, currVal_17, currVal_18, currVal_19, currVal_20, currVal_21, currVal_22]);
    });
}
function View_HuewiLightComponent_2(_l) {
    return huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [['style',
                'flex: 1 1 50px']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.select(_co.light) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    ', '\n  ']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.light.name;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiLightComponent_0(_l) {
    return huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 18, 'div', [['class',
                'flexcontainer']], null, null, null, null, null)),
        (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiLightComponent_1)), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_common__["k" /* NgIf */], [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiLightComponent_2)),
        huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_common__["k" /* NgIf */], [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'md-slider', [['class', 'mat-slider'],
                ['role', 'slider'], ['style', 'flex: 5 1 100px'], ['tabindex', '0']], [[1,
                    'aria-disabled', 0], [1, 'aria-valuemax', 0], [1, 'aria-valuemin', 0], [1, 'aria-valuenow',
                    0], [1, 'aria-orientation', 0], [2, 'mat-slider-disabled', null],
                [2, 'mat-slider-has-ticks', null], [2, 'mat-slider-horizontal',
                    null], [2, 'mat-slider-axis-inverted', null], [2, 'mat-slider-sliding',
                    null], [2, 'mat-slider-thumb-label-showing', null],
                [2, 'mat-slider-vertical', null], [2, 'mat-slider-min-value', null],
                [2, 'mat-slider-hide-last-tick', null]], [[null, 'change'],
                [null, 'focus'], [null, 'blur'], [null, 'click'],
                [null, 'keydown'], [null, 'keyup'], [null, 'mouseenter'],
                [null, 'slide'], [null, 'slideend'], [null, 'slidestart']], function (_v, en, $event) {
                var ad = true;
                var _co = _v.component;
                if (('focus' === en)) {
                    var pd_0 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onFocus() !== false);
                    ad = (pd_0 && ad);
                }
                if (('blur' === en)) {
                    var pd_1 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onBlur() !== false);
                    ad = (pd_1 && ad);
                }
                if (('click' === en)) {
                    var pd_2 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onClick($event) !== false);
                    ad = (pd_2 && ad);
                }
                if (('keydown' === en)) {
                    var pd_3 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onKeydown($event) !== false);
                    ad = (pd_3 && ad);
                }
                if (('keyup' === en)) {
                    var pd_4 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onKeyup() !== false);
                    ad = (pd_4 && ad);
                }
                if (('mouseenter' === en)) {
                    var pd_5 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onMouseenter() !== false);
                    ad = (pd_5 && ad);
                }
                if (('slide' === en)) {
                    var pd_6 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onSlide($event) !== false);
                    ad = (pd_6 && ad);
                }
                if (('slideend' === en)) {
                    var pd_7 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onSlideEnd() !== false);
                    ad = (pd_7 && ad);
                }
                if (('slidestart' === en)) {
                    var pd_8 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onSlideStart($event) !== false);
                    ad = (pd_8 && ad);
                }
                if (('change' === en)) {
                    var pd_9 = (_co.brightness(_co.light, $event.value) !== false);
                    ad = (pd_9 && ad);
                }
                return ad;
            }, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["E" /* View_MdSlider_0 */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["o" /* RenderType_MdSlider */])), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](5120, null, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_forms__["g" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_71" /* MdSlider */]]), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_71" /* MdSlider */], [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["f" /* FocusOriginMonitor */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */],
            [2, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_cdk_bidi__["c" /* Directionality */]]], { disabled: [0, 'disabled'], max: [1, 'max'], min: [2,
                'min'], step: [3, 'step'], value: [4, 'value'] }, { change: 'change' }), (_l()(),
            huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])),
        (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-slide-toggle', [['class',
                'mat-slide-toggle'], ['style', 'flex: 0 1 10px']], [[8, 'id', 0], [2, 'mat-checked',
                null], [2, 'mat-disabled', null], [2, 'mat-slide-toggle-label-before',
                null]], [[null, 'change']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('change' === en)) {
                var pd_0 = (_co.toggle(_co.light) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["D" /* View_MdSlideToggle_0 */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["n" /* RenderType_MdSlideToggle */])), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](5120, null, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_forms__["g" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_69" /* MdSlideToggle */]]), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1228800, null, 0, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_69" /* MdSlideToggle */], [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */],
            huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_cdk_platform__["a" /* Platform */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["f" /* FocusOriginMonitor */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { disabled: [0,
                'disabled'], checked: [1, 'checked'] }, { change: 'change' }), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n  '])), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n'])), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.editable;
        _ck(_v, 3, 0, currVal_0);
        var currVal_1 = !_co.editable;
        _ck(_v, 6, 0, currVal_1);
        var currVal_16 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_24" /* ɵinlineInterpolate */](1, '', !_co.light.state.on, '');
        var currVal_17 = 255;
        var currVal_18 = 0;
        var currVal_19 = 1;
        var currVal_20 = _co.light.state.bri;
        _ck(_v, 11, 0, currVal_16, currVal_17, currVal_18, currVal_19, currVal_20);
        var currVal_25 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_24" /* ɵinlineInterpolate */](1, '', !_co.light.state.reachable, '');
        var currVal_26 = _co.light.state.on;
        _ck(_v, 16, 0, currVal_25, currVal_26);
    }, function (_ck, _v) {
        var currVal_2 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).disabled;
        var currVal_3 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).max;
        var currVal_4 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).min;
        var currVal_5 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).value;
        var currVal_6 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).vertical ? 'vertical' : 'horizontal');
        var currVal_7 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).disabled;
        var currVal_8 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).tickInterval;
        var currVal_9 = !huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).vertical;
        var currVal_10 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._invertAxis;
        var currVal_11 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._isSliding;
        var currVal_12 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).thumbLabel;
        var currVal_13 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).vertical;
        var currVal_14 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._isMinValue;
        var currVal_15 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).disabled || ((huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._isMinValue && huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._thumbGap) && huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._invertAxis));
        _ck(_v, 8, 1, [currVal_2, currVal_3, currVal_4, currVal_5, currVal_6, currVal_7, currVal_8,
            currVal_9, currVal_10, currVal_11, currVal_12, currVal_13, currVal_14, currVal_15]);
        var currVal_21 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16).id;
        var currVal_22 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16).checked;
        var currVal_23 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16).disabled;
        var currVal_24 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16).labelPosition == 'before');
        _ck(_v, 14, 0, currVal_21, currVal_22, currVal_23, currVal_24);
    });
}
function View_HuewiLightComponent_Host_0(_l) {
    return huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-light', [], null, null, null, View_HuewiLightComponent_0, RenderType_HuewiLightComponent)), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_light_component_HuewiLightComponent, [huepi_service_HuepiService, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiLightComponentNgFactory = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-light', huewi_light_component_HuewiLightComponent, View_HuewiLightComponent_Host_0, { light: 'light', editable: 'editable' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWxpZ2h0cy9odWV3aS1saWdodC9odWV3aS1saWdodC5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktbGlnaHRzL2h1ZXdpLWxpZ2h0L2h1ZXdpLWxpZ2h0LmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWxpZ2h0cy9odWV3aS1saWdodC9odWV3aS1saWdodC5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWxpZ2h0cy9odWV3aS1saWdodC9odWV3aS1saWdodC5jb21wb25lbnQudHMuSHVld2lMaWdodENvbXBvbmVudF9Ib3N0Lmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiICIsIjxkaXYgY2xhc3M9XCJmbGV4Y29udGFpbmVyXCI+XG4gIDxtZC1pbnB1dC1jb250YWluZXIgKm5nSWY9XCJlZGl0YWJsZVwiIHN0eWxlPVwiZmxleDogMSAxIDUwcHhcIj5cbiAgICA8aW5wdXQgbWRJbnB1dCBbKG5nTW9kZWwpXT1cImxpZ2h0Lm5hbWVcIiAoa2V5dXApPVwicmVuYW1lKGxpZ2h0LCAkZXZlbnQudGFyZ2V0LnZhbHVlKVwiPlxuICA8L21kLWlucHV0LWNvbnRhaW5lcj5cbiAgPGRpdiAqbmdJZj1cIiFlZGl0YWJsZVwiIHN0eWxlPVwiZmxleDogMSAxIDUwcHhcIlxuICAgIChjbGljayk9XCJzZWxlY3QobGlnaHQpXCI+XG4gICAge3tsaWdodC5uYW1lfX1cbiAgPC9kaXY+XG4gIDxtZC1zbGlkZXIgc3R5bGU9XCJmbGV4OiA1IDEgMTAwcHhcIlxuICAgIChjaGFuZ2UpPVwiYnJpZ2h0bmVzcyhsaWdodCwgJGV2ZW50LnZhbHVlKVwiXG4gICAgZGlzYWJsZWQ9XCJ7eyFsaWdodC5zdGF0ZS5vbn19XCJcbiAgICBbbWluXT1cIjBcIiBbbWF4XT1cIjI1NVwiIFtzdGVwXT1cIjFcIiBbdmFsdWVdPVwibGlnaHQuc3RhdGUuYnJpXCI+XG4gIDwvbWQtc2xpZGVyPlxuICA8bWQtc2xpZGUtdG9nZ2xlIHN0eWxlPVwiZmxleDogMCAxIDEwcHhcIiBkaXNhYmxlZD1cInt7IWxpZ2h0LnN0YXRlLnJlYWNoYWJsZX19XCJcbiAgICBbY2hlY2tlZF09XCJsaWdodC5zdGF0ZS5vblwiXG4gICAgKGNoYW5nZSk9XCJ0b2dnbGUobGlnaHQpXCI+XG4gIDwvbWQtc2xpZGUtdG9nZ2xlPlxuPC9kaXY+XG4iLCI8aHVld2ktbGlnaHQ+PC9odWV3aS1saWdodD4iXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkNDRTtNQUFBO01BQUE7VUFBQTtjQUFBO1VBQUE7Y0FBQTtRQUFBO1FBQUE7VUFBQTtVQUFBO1FBQUE7UUFBQTtNQUFBLDJEQUFBO01BQUE7TUFBQSxzQkFBQTsyQkFBQTthQUFBO2FBQUE7YUFBQTtNQUE0RCwrQkFDMUQ7VUFBQTtVQUFBO1VBQUE7VUFBQTtVQUFBO1VBQUE7VUFBQTtVQUFBO1FBQUE7UUFBQTtRQUFBO1VBQUE7VUFBQTtRQUFBO1FBQUE7VUFBQTtVQUFBO1FBQUE7UUFBQTtVQUFBO1VBQUE7UUFBQTtRQUFBO1VBQUE7VUFBQTtRQUFBO1FBQUE7VUFBQTtVQUFBO1FBQUE7UUFBQTtVQUFBO1VBQUE7UUFBQTtRQUFBO1VBQUE7VUFBQTtRQUFBO1FBQWU7VUFBQTtVQUFBO1FBQUE7UUFBeUI7VUFBQTtVQUFBO1FBQUE7UUFBeEM7TUFBQSx1Q0FBQTtVQUFBO2FBQUE7VUFBQSxvRUFBQTtVQUFBO1lBQUE7VUFBQSxvQ0FBQTtVQUFBO1VBQUEscURBQUE7dUJBQUEsbUNBQUE7cUJBQUE7Y0FBQTtVQUFBLHNCQUFBO1VBQUEsb0NBQUE7VUFBQSw0QkFBcUY7O0lBQXRFO0lBQWYsWUFBZSxVQUFmO0lBQUE7O0lBREY7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQSxXQUFBO1FBQUEsNkJBQUE7SUFDRTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBLGFBQUE7UUFBQSw0RUFBQTs7OztvQkFFRjtNQUFBO0lBQUE7SUFBQTtJQUNFO01BQUE7TUFBQTtJQUFBO0lBREY7RUFBQSxnQ0FDMEI7OztRQUFBO1FBQUE7Ozs7b0JBTDVCO01BQUE7TUFBMkIseUNBQ3pCO1VBQUEsa0VBQUE7VUFBQTtVQUFBLGVBRXFCLHlDQUNyQjtVQUFBO2FBQUE7VUFBQSx3QkFHTSx5Q0FDTjtpQkFBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO2tCQUFBO2tCQUFBO2NBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO2dCQUFBO2dCQUFBO2dCQUFBO2tCQUFBO2tCQUFBO2dCQUFBO2dCQUFBO2tCQUFBO2tCQUFBO2dCQUFBO2dCQUFBO2tCQUFBO2tCQUFBO2dCQUFBO2dCQUFBO2tCQUFBO2tCQUFBO2dCQUFBO2dCQUFBO2tCQUFBO2tCQUFBO2dCQUFBO2dCQUFBO2tCQUFBO2tCQUFBO2dCQUFBO2dCQUFBO2tCQUFBO2tCQUFBO2dCQUFBO2dCQUFBO2tCQUFBO2tCQUFBO2dCQUFBO2dCQUFBO2tCQUFBO2tCQUFBO2dCQUFBO2dCQUNFO2tCQUFBO2tCQUFBO2dCQUFBO2dCQURGO2NBQUE7K0JBQUE7WUFBQTtVQUFBLHdCQUFBO3VCQUFBLHNDQUFBO1VBQUE7Y0FBQTtjQUFBLDZEQUc2RDtpQkFBQSwwQkFDakQ7TUFDWjtVQUFBO1VBQUE7VUFBQTtRQUFBO1FBQUE7UUFFRTtVQUFBO1VBQUE7UUFBQTtRQUZGO01BQUE7K0JBQUE7WUFBQTtVQUFBLDZCQUFBOzZFQUFBO1VBQUEsc0RBRTJCO1VBQUEsV0FDVCx1Q0FDZDtVQUFBOztJQWhCZ0I7SUFBcEIsV0FBb0IsU0FBcEI7SUFHSztJQUFMLFdBQUssU0FBTDtJQU1FO0lBQ1U7SUFBVjtJQUFzQjtJQUFXO0lBSG5DLFlBRUUsV0FDVSxXQUFWLFdBQXNCLFdBQVcsVUFIbkM7SUFLd0M7SUFDdEM7SUFERixZQUF3QyxXQUN0QyxVQURGOztJQUxBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7UUFBQTtJQUFBLFlBQUE7UUFBQSwyRUFBQTtJQUtBO0lBQUE7SUFBQTtJQUFBO0lBQUEsWUFBQSwyQ0FBQTs7OztvQkNiRjtNQUFBO29DQUFBLFVBQUE7TUFBQTtJQUFBOzs7OzsifQ==
//# sourceMappingURL=huewi-light.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-lights/huewi-light-details/huewi-light-details.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_light_details_component_css_shim_ngstyle_styles = [''];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWxpZ2h0cy9odWV3aS1saWdodC1kZXRhaWxzL2h1ZXdpLWxpZ2h0LWRldGFpbHMuY29tcG9uZW50LmNzcy5zaGltLm5nc3R5bGUudHMiLCJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZzovLy9Vc2Vycy9hcm5kL0RldmVsb3Blci9odWV3aTIvc3JjL2FwcC9odWV3aS1saWdodHMvaHVld2ktbGlnaHQtZGV0YWlscy9odWV3aS1saWdodC1kZXRhaWxzLmNvbXBvbmVudC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiICJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7OyJ9
//# sourceMappingURL=huewi-light-details.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-lights/huewi-light-details/huewi-light-details.component.ts

var huewi_light_details_component_HuewiLightDetailsComponent = (function () {
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
    HuewiLightDetailsComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }]; };
    return HuewiLightDetailsComponent;
}());

//# sourceMappingURL=huewi-light-details.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-lights/huewi-light-details/huewi-light-details.component.ngfactory.ts
/* harmony import */ var huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_cdk_platform__ = __webpack_require__("JYHx");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */










var styles_HuewiLightDetailsComponent = [huewi_light_details_component_css_shim_ngstyle_styles];
var RenderType_HuewiLightDetailsComponent = huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiLightDetailsComponent, data: {} });
function View_HuewiLightDetailsComponent_0(_l) {
    return huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-light', [], null, null, null, View_HuewiLightComponent_0, RenderType_HuewiLightComponent)), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_light_component_HuewiLightComponent, [huepi_service_HuepiService, huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], { light: [0, 'light'], editable: [1, 'editable'] }, null),
        (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n'])), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n\n'])),
        (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n\n'])), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 49, 'div', [['class',
                'flexcontainer wrap justify-center']], null, null, null, null, null)), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'mat-raised-button'],
                ['md-raised-button', ''], ['style', 'flex: 1 1 128px']], [[8, 'disabled',
                    0]], [[null, 'click']], function (_v, en, $event) {
                var ad = true;
                var _co = _v.component;
                if (('click' === en)) {
                    var pd_0 = (_co.relax(_co.light) !== false);
                    ad = (pd_0 && ad);
                }
                return ad;
            }, huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_8__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["H" /* MdButton */], [huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_cdk_platform__["a" /* Platform */], __WEBPACK_IMPORTED_MODULE_8__angular_material__["f" /* FocusOriginMonitor */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['Relax'])),
        (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'mat-raised-button'], ['md-raised-button', ''], ['style',
                'flex: 1 1 128px']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.reading(_co.light) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_8__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["H" /* MdButton */], [huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_cdk_platform__["a" /* Platform */], __WEBPACK_IMPORTED_MODULE_8__angular_material__["f" /* FocusOriginMonitor */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['Reading'])),
        (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'mat-raised-button'], ['md-raised-button', ''], ['style',
                'flex: 1 1 128px']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.concentrate(_co.light) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_8__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["H" /* MdButton */], [huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_cdk_platform__["a" /* Platform */], __WEBPACK_IMPORTED_MODULE_8__angular_material__["f" /* FocusOriginMonitor */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['Concentrate'])),
        (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'mat-raised-button'], ['md-raised-button', ''], ['style',
                'flex: 1 1 128px']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.energize(_co.light) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_8__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["H" /* MdButton */], [huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_cdk_platform__["a" /* Platform */], __WEBPACK_IMPORTED_MODULE_8__angular_material__["f" /* FocusOriginMonitor */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['Energize'])),
        (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'mat-raised-button'], ['md-raised-button', ''], ['style',
                'flex: 1 1 128px']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.bright(_co.light) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_8__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["H" /* MdButton */], [huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_cdk_platform__["a" /* Platform */], __WEBPACK_IMPORTED_MODULE_8__angular_material__["f" /* FocusOriginMonitor */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['Bright'])),
        (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'mat-raised-button'], ['md-raised-button', ''], ['style',
                'flex: 1 1 128px']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.dimmed(_co.light) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_8__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["H" /* MdButton */], [huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_cdk_platform__["a" /* Platform */], __WEBPACK_IMPORTED_MODULE_8__angular_material__["f" /* FocusOriginMonitor */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['Dimmed'])),
        (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'mat-raised-button'], ['md-raised-button', ''], ['style',
                'flex: 1 1 128px']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.nightLight(_co.light) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_8__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["H" /* MdButton */], [huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_cdk_platform__["a" /* Platform */], __WEBPACK_IMPORTED_MODULE_8__angular_material__["f" /* FocusOriginMonitor */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['Nightlight'])),
        (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'mat-raised-button'], ['md-raised-button', ''], ['style',
                'flex: 1 1 128px']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.goldenHour(_co.light) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_49" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_8__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["H" /* MdButton */], [huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_cdk_platform__["a" /* Platform */], __WEBPACK_IMPORTED_MODULE_8__angular_material__["f" /* FocusOriginMonitor */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['Golden hour'])),
        (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n'])), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.light;
        var currVal_1 = true;
        _ck(_v, 1, 0, currVal_0, currVal_1);
    }, function (_ck, _v) {
        var currVal_2 = (huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10).disabled || null);
        _ck(_v, 8, 0, currVal_2);
        var currVal_3 = (huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16).disabled || null);
        _ck(_v, 14, 0, currVal_3);
        var currVal_4 = (huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 22).disabled || null);
        _ck(_v, 20, 0, currVal_4);
        var currVal_5 = (huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 28).disabled || null);
        _ck(_v, 26, 0, currVal_5);
        var currVal_6 = (huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 34).disabled || null);
        _ck(_v, 32, 0, currVal_6);
        var currVal_7 = (huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 40).disabled || null);
        _ck(_v, 38, 0, currVal_7);
        var currVal_8 = (huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 46).disabled || null);
        _ck(_v, 44, 0, currVal_8);
        var currVal_9 = (huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 52).disabled || null);
        _ck(_v, 50, 0, currVal_9);
    });
}
function View_HuewiLightDetailsComponent_Host_0(_l) {
    return huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-light-details', [], null, null, null, View_HuewiLightDetailsComponent_0, RenderType_HuewiLightDetailsComponent)), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_light_details_component_HuewiLightDetailsComponent, [huepi_service_HuepiService], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiLightDetailsComponentNgFactory = huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-light-details', huewi_light_details_component_HuewiLightDetailsComponent, View_HuewiLightDetailsComponent_Host_0, { light: 'light' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWxpZ2h0cy9odWV3aS1saWdodC1kZXRhaWxzL2h1ZXdpLWxpZ2h0LWRldGFpbHMuY29tcG9uZW50Lm5nZmFjdG9yeS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWxpZ2h0cy9odWV3aS1saWdodC1kZXRhaWxzL2h1ZXdpLWxpZ2h0LWRldGFpbHMuY29tcG9uZW50LnRzIiwibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktbGlnaHRzL2h1ZXdpLWxpZ2h0LWRldGFpbHMvaHVld2ktbGlnaHQtZGV0YWlscy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWxpZ2h0cy9odWV3aS1saWdodC1kZXRhaWxzL2h1ZXdpLWxpZ2h0LWRldGFpbHMuY29tcG9uZW50LnRzLkh1ZXdpTGlnaHREZXRhaWxzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPGh1ZXdpLWxpZ2h0IFtsaWdodF09XCJsaWdodFwiIFtlZGl0YWJsZV09XCJ0cnVlXCI+XG48L2h1ZXdpLWxpZ2h0PlxuXG48YnI+XG5cbjxkaXYgY2xhc3M9XCJmbGV4Y29udGFpbmVyIHdyYXAganVzdGlmeS1jZW50ZXJcIj5cbiAgPGJ1dHRvbiBtZC1yYWlzZWQtYnV0dG9uIHN0eWxlPVwiZmxleDogMSAxIDEyOHB4XCIgKGNsaWNrKT1cInJlbGF4KGxpZ2h0KVwiPlJlbGF4PC9idXR0b24+XG4gIDxidXR0b24gbWQtcmFpc2VkLWJ1dHRvbiBzdHlsZT1cImZsZXg6IDEgMSAxMjhweFwiIChjbGljayk9XCJyZWFkaW5nKGxpZ2h0KVwiPlJlYWRpbmc8L2J1dHRvbj5cbiAgPGJ1dHRvbiBtZC1yYWlzZWQtYnV0dG9uIHN0eWxlPVwiZmxleDogMSAxIDEyOHB4XCIgKGNsaWNrKT1cImNvbmNlbnRyYXRlKGxpZ2h0KVwiPkNvbmNlbnRyYXRlPC9idXR0b24+XG4gIDxidXR0b24gbWQtcmFpc2VkLWJ1dHRvbiBzdHlsZT1cImZsZXg6IDEgMSAxMjhweFwiIChjbGljayk9XCJlbmVyZ2l6ZShsaWdodClcIj5FbmVyZ2l6ZTwvYnV0dG9uPlxuICA8YnV0dG9uIG1kLXJhaXNlZC1idXR0b24gc3R5bGU9XCJmbGV4OiAxIDEgMTI4cHhcIiAoY2xpY2spPVwiYnJpZ2h0KGxpZ2h0KVwiPkJyaWdodDwvYnV0dG9uPlxuICA8YnV0dG9uIG1kLXJhaXNlZC1idXR0b24gc3R5bGU9XCJmbGV4OiAxIDEgMTI4cHhcIiAoY2xpY2spPVwiZGltbWVkKGxpZ2h0KVwiPkRpbW1lZDwvYnV0dG9uPlxuICA8YnV0dG9uIG1kLXJhaXNlZC1idXR0b24gc3R5bGU9XCJmbGV4OiAxIDEgMTI4cHhcIiAoY2xpY2spPVwibmlnaHRMaWdodChsaWdodClcIj5OaWdodGxpZ2h0PC9idXR0b24+XG4gIDxidXR0b24gbWQtcmFpc2VkLWJ1dHRvbiBzdHlsZT1cImZsZXg6IDEgMSAxMjhweFwiIChjbGljayk9XCJnb2xkZW5Ib3VyKGxpZ2h0KVwiPkdvbGRlbiBob3VyPC9idXR0b24+XG48L2Rpdj5cbiIsIjxodWV3aS1saWdodC1kZXRhaWxzPjwvaHVld2ktbGlnaHQtZGV0YWlscz4iXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O29CQ0FBO01BQUE7dUNBQUEsVUFBQTtNQUFBO01BQStDLHVDQUNqQztNQUVkO1VBQUEsMERBQUk7VUFBQSxXQUVKO1VBQUE7VUFBQSw4QkFBK0MseUNBQzdDO2lCQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7WUFBaUQ7Y0FBQTtjQUFBO1lBQUE7WUFBakQ7VUFBQSxxREFBQTtVQUFBO1VBQUEsb0NBQUE7VUFBQTtVQUFBLHNCQUFBO1VBQUEsMkNBQXdFO01BQWMseUNBQ3RGO1VBQUE7Y0FBQTt1QkFBQTtZQUFBO1lBQUE7WUFBaUQ7Y0FBQTtjQUFBO1lBQUE7WUFBakQ7VUFBQSxxREFBQTtVQUFBO1VBQUEsb0NBQUE7VUFBQTtVQUFBLHNCQUFBO1VBQUEsMkNBQTBFO01BQWdCLHlDQUMxRjtVQUFBO2NBQUE7dUJBQUE7WUFBQTtZQUFBO1lBQWlEO2NBQUE7Y0FBQTtZQUFBO1lBQWpEO1VBQUEscURBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQSxzQkFBQTtVQUFBLDJDQUE4RTtNQUFvQix5Q0FDbEc7VUFBQTtjQUFBO3VCQUFBO1lBQUE7WUFBQTtZQUFpRDtjQUFBO2NBQUE7WUFBQTtZQUFqRDtVQUFBLHFEQUFBO1VBQUE7VUFBQSxvQ0FBQTtVQUFBO1VBQUEsc0JBQUE7VUFBQSwyQ0FBMkU7TUFBaUIseUNBQzVGO1VBQUE7Y0FBQTt1QkFBQTtZQUFBO1lBQUE7WUFBaUQ7Y0FBQTtjQUFBO1lBQUE7WUFBakQ7VUFBQSxxREFBQTtVQUFBO1VBQUEsb0NBQUE7VUFBQTtVQUFBLHNCQUFBO1VBQUEsMkNBQXlFO01BQWUseUNBQ3hGO1VBQUE7Y0FBQTt1QkFBQTtZQUFBO1lBQUE7WUFBaUQ7Y0FBQTtjQUFBO1lBQUE7WUFBakQ7VUFBQSxxREFBQTtVQUFBO1VBQUEsb0NBQUE7VUFBQTtVQUFBLHNCQUFBO1VBQUEsMkNBQXlFO01BQWUseUNBQ3hGO1VBQUE7Y0FBQTt1QkFBQTtZQUFBO1lBQUE7WUFBaUQ7Y0FBQTtjQUFBO1lBQUE7WUFBakQ7VUFBQSxxREFBQTtVQUFBO1VBQUEsb0NBQUE7VUFBQTtVQUFBLHNCQUFBO1VBQUEsMkNBQTZFO01BQW1CLHlDQUNoRztVQUFBO2NBQUE7dUJBQUE7WUFBQTtZQUFBO1lBQWlEO2NBQUE7Y0FBQTtZQUFBO1lBQWpEO1VBQUEscURBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQSxzQkFBQTtVQUFBLDJDQUE2RTtNQUFvQix1Q0FDN0Y7OztRQWRPO1FBQWdCO1FBQTdCLFdBQWEsVUFBZ0IsU0FBN0I7O1FBTUU7UUFBQSxXQUFBLFNBQUE7UUFDQTtRQUFBLFlBQUEsU0FBQTtRQUNBO1FBQUEsWUFBQSxTQUFBO1FBQ0E7UUFBQSxZQUFBLFNBQUE7UUFDQTtRQUFBLFlBQUEsU0FBQTtRQUNBO1FBQUEsWUFBQSxTQUFBO1FBQ0E7UUFBQSxZQUFBLFNBQUE7UUFDQTtRQUFBLFlBQUEsU0FBQTs7OztvQkNiRjtNQUFBOzJDQUFBLFVBQUE7TUFBQTtJQUFBOzs7OzsifQ==
//# sourceMappingURL=huewi-light-details.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-lights/huewi-lights.mock.ts
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
//# sourceMappingURL=huewi-lights.mock.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-lights/huewi-lights.component.ts
/* harmony import */ var huewi_lights_component___WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_lights_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable__ = __webpack_require__("bKpL");
/* harmony import */ var huewi_lights_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable___default = __webpack_require__.n(huewi_lights_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable__);
/* harmony import */ var huewi_lights_component___WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of__ = __webpack_require__("/zHi");
/* harmony import */ var huewi_lights_component___WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of___default = __webpack_require__.n(huewi_lights_component___WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of__);







var huewi_lights_component_HuewiLightsComponent = (function () {
    function HuewiLightsComponent(huepiService, parametersService, activatedRoute, router) {
        this.huepiService = huepiService;
        this.parametersService = parametersService;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.lights = HUEWI_LIGHTS_MOCK;
        this.back = true;
        this.lightObserver = huewi_lights_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable__["Observable"].of(this.lights);
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
    HuewiLightsComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: ParametersService }, { type: huewi_lights_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["a" /* ActivatedRoute */] }, { type: huewi_lights_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return HuewiLightsComponent;
}());

//# sourceMappingURL=huewi-lights.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-lights/huewi-lights.component.ngfactory.ts
/* harmony import */ var huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__ = __webpack_require__("bm2B");
/* harmony import */ var huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_cdk_platform__ = __webpack_require__("JYHx");
/* harmony import */ var huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__ = __webpack_require__("qbdv");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */

















var styles_HuewiLightsComponent = [huewi_lights_component_css_shim_ngstyle_styles];
var RenderType_HuewiLightsComponent = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiLightsComponent, data: { 'animation': [{ type: 7, name: 'RoutingAnimations',
                definitions: [{ type: 0, name: 'void', styles: { type: 6, styles: { top: -32, left: 0, opacity: 0 },
                            offset: null }, options: undefined }, { type: 0, name: '*', styles: { type: 6,
                            styles: { top: 0, left: 0, opacity: 1 }, offset: null }, options: undefined },
                    { type: 1, expr: ':enter', animation: [{ type: 4, styles: { type: 6, styles: { top: 0,
                                        left: 0, opacity: 1 }, offset: null }, timings: '0.2s ease-in-out' }],
                        options: null }, { type: 1, expr: ':leave', animation: [{ type: 4, styles: { type: 6,
                                    styles: { top: -32, left: 0, opacity: 0 }, offset: null }, timings: '0s ease-in-out' }],
                        options: null }], options: {} }] } });
function View_HuewiLightsComponent_2(_l) {
    return huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-light', [], null, null, null, View_HuewiLightComponent_0, RenderType_HuewiLightComponent)), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_light_component_HuewiLightComponent, [huepi_service_HuepiService, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], { light: [0, 'light'] }, null), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    ']))], function (_ck, _v) {
        var currVal_0 = _v.context.$implicit;
        _ck(_v, 1, 0, currVal_0);
    }, null);
}
function View_HuewiLightsComponent_1(_l) {
    return huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 36, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 27, 'md-card-title', [['class', 'mat-card-title']], null, null, null, null, null)), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["U" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      Lights\n      '])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 22, 'small', [], null, null, null, null, null)), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n        '])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 19, 'md-input-container', [['class', 'mat-input-container mat-form-field']], [[2, 'mat-input-invalid',
                null], [2, 'mat-form-field-invalid', null], [2, 'mat-focused',
                null], [2, 'ng-untouched', null], [2, 'ng-touched', null],
            [2, 'ng-pristine', null], [2, 'ng-dirty', null], [2, 'ng-valid',
                null], [2, 'ng-invalid', null], [2, 'ng-pending', null]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._control.focus() !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["w" /* View_MdFormField_0 */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdFormField */])), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](7389184, null, 6, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_16" /* MdFormField */], [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */], [2, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["u" /* MD_PLACEHOLDER_GLOBAL_OPTIONS */]]], null, null), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 1, { _control: 0 }), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 2, { _placeholderChild: 0 }), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 3, { _errorChildren: 1 }), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 4, { _hintChildren: 1 }), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 5, { _prefixChildren: 1 }), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 6, { _suffixChildren: 1 }), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](1, ['\n          '])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 1, 8, 'input', [['class', 'mat-input-element'], ['mdInput', ''],
            ['placeholder', 'Filter']], [[8, 'id', 0], [8, 'placeholder', 0], [8, 'disabled',
                0], [8, 'required', 0], [1, 'aria-describedby', 0], [1, 'aria-invalid', 0], [2,
                'ng-untouched', null], [2, 'ng-touched', null], [2, 'ng-pristine',
                null], [2, 'ng-dirty', null], [2, 'ng-valid', null],
            [2, 'ng-invalid', null], [2, 'ng-pending', null]], [[null,
                'ngModelChange'], [null, 'input'], [null, 'blur'], [null,
                'compositionstart'], [null, 'compositionend'], [null,
                'focus']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('input' === en)) {
                var pd_0 = (huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 20)._handleInput($event.target.value) !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 20).onTouched() !== false);
                ad = (pd_1 && ad);
            }
            if (('compositionstart' === en)) {
                var pd_2 = (huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 20)._compositionStart() !== false);
                ad = (pd_2 && ad);
            }
            if (('compositionend' === en)) {
                var pd_3 = (huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 20)._compositionEnd($event.target.value) !== false);
                ad = (pd_3 && ad);
            }
            if (('blur' === en)) {
                var pd_4 = (huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24)._focusChanged(false) !== false);
                ad = (pd_4 && ad);
            }
            if (('focus' === en)) {
                var pd_5 = (huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24)._focusChanged(true) !== false);
                ad = (pd_5 && ad);
            }
            if (('input' === en)) {
                var pd_6 = (huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24)._onInput() !== false);
                ad = (pd_6 && ad);
            }
            if (('ngModelChange' === en)) {
                var pd_7 = ((_co.searchText = $event) !== false);
                ad = (pd_7 && ad);
            }
            return ad;
        }, null, null)), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["c" /* DefaultValueAccessor */], [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */],
            [2, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["a" /* COMPOSITION_BUFFER_MODE */]]], null, null), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](1024, null, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["g" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["c" /* DefaultValueAccessor */]]), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["k" /* NgModel */], [[8,
                null], [8, null], [8, null], [2, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["g" /* NG_VALUE_ACCESSOR */]]], { model: [0, 'model'] }, { update: 'ngModelChange' }), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](2048, null, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["h" /* NgControl */], null, [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["k" /* NgModel */]]), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](933888, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_28" /* MdInput */], [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_cdk_platform__["a" /* Platform */], [2, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["h" /* NgControl */]], [2, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["j" /* NgForm */]],
            [2, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["d" /* FormGroupDirective */]], [2, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["r" /* MD_ERROR_GLOBAL_OPTIONS */]]], { placeholder: [0,
                'placeholder'] }, null), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["i" /* NgControlStatus */], [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["h" /* NgControl */]], null, null), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](2048, [[1, 4]], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_17" /* MdFormFieldControl */], null, [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_28" /* MdInput */]]), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](1, ['\n        '])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 4, null, View_HuewiLightsComponent_2)), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["j" /* NgForOf */], [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, OrderByPipe, []), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, FilterPipe, []), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_23 = _co.searchText;
        _ck(_v, 22, 0, currVal_23);
        var currVal_24 = 'Filter';
        _ck(_v, 24, 0, currVal_24);
        var currVal_25 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵunv */](_v, 32, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 35).transform(huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵunv */](_v, 32, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 34).transform(_co.lights, _ck(_v, 33, 0, '+name'))), _co.searchText, 'name'));
        _ck(_v, 32, 0, currVal_25);
    }, function (_ck, _v) {
        var currVal_0 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._control.errorState;
        var currVal_1 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._control.errorState;
        var currVal_2 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._control.focused;
        var currVal_3 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('untouched');
        var currVal_4 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('touched');
        var currVal_5 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('pristine');
        var currVal_6 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('dirty');
        var currVal_7 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('valid');
        var currVal_8 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('invalid');
        var currVal_9 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('pending');
        _ck(_v, 8, 0, currVal_0, currVal_1, currVal_2, currVal_3, currVal_4, currVal_5, currVal_6, currVal_7, currVal_8, currVal_9);
        var currVal_10 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).id;
        var currVal_11 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).placeholder;
        var currVal_12 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).disabled;
        var currVal_13 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).required;
        var currVal_14 = (huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24)._ariaDescribedby || null);
        var currVal_15 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).errorState;
        var currVal_16 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassUntouched;
        var currVal_17 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassTouched;
        var currVal_18 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassPristine;
        var currVal_19 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassDirty;
        var currVal_20 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassValid;
        var currVal_21 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassInvalid;
        var currVal_22 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassPending;
        _ck(_v, 18, 1, [currVal_10, currVal_11, currVal_12, currVal_13, currVal_14, currVal_15,
            currVal_16, currVal_17, currVal_18, currVal_19, currVal_20, currVal_21, currVal_22]);
    });
}
function View_HuewiLightsComponent_4(_l) {
    return huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'a', [], [[1, 'target', 0], [8, 'href', 4]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])),
        huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_23" /* MdIcon */], [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_26" /* MdIconRegistry */], [8, null]], null, null), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['navigate_before']))], function (_ck, _v) {
        var currVal_2 = true;
        var currVal_3 = _ck(_v, 2, 0, '/lights');
        _ck(_v, 1, 0, currVal_2, currVal_3);
        _ck(_v, 5, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).target;
        var currVal_1 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).href;
        _ck(_v, 0, 0, currVal_0, currVal_1);
    });
}
function View_HuewiLightsComponent_3(_l) {
    return huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 13, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'md-card-title', [['class', 'mat-card-title']], null, null, null, null, null)), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["U" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiLightsComponent_4)), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["k" /* NgIf */], [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      ', ' - Details\n    '])),
        (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-light-details', [], null, null, null, View_HuewiLightDetailsComponent_0, RenderType_HuewiLightDetailsComponent)),
        huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_light_details_component_HuewiLightDetailsComponent, [huepi_service_HuepiService], { light: [0, 'light'] }, null), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])),
        (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.back;
        _ck(_v, 7, 0, currVal_0);
        var currVal_2 = _co.selectedLight;
        _ck(_v, 11, 0, currVal_2);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = _co.selectedLight.name;
        _ck(_v, 8, 0, currVal_1);
    });
}
function View_HuewiLightsComponent_0(_l) {
    return huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 9, 'md-card', [['class',
                'mat-card']], [[24, '@RoutingAnimations', 0]], null, null, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["u" /* View_MdCard_0 */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2,
                huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["Q" /* MdCard */], [], null, null),
        (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiLightsComponent_1)), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["k" /* NgIf */], [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */],
            huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n  '])),
        (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiLightsComponent_3)),
        huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["k" /* NgIf */], [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n'])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = !_co.selectedLight;
        _ck(_v, 5, 0, currVal_1);
        var currVal_2 = _co.selectedLight;
        _ck(_v, 8, 0, currVal_2);
    }, function (_ck, _v) {
        var currVal_0 = undefined;
        _ck(_v, 0, 0, currVal_0);
    });
}
function View_HuewiLightsComponent_Host_0(_l) {
    return huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-lights', [], [[40, '@RoutingAnimations', 0]], null, null, View_HuewiLightsComponent_0, RenderType_HuewiLightsComponent)), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_lights_component_HuewiLightsComponent, [huepi_service_HuepiService, ParametersService, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).RoutingAnimations;
        _ck(_v, 0, 0, currVal_0);
    });
}
var HuewiLightsComponentNgFactory = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-lights', huewi_lights_component_HuewiLightsComponent, View_HuewiLightsComponent_Host_0, { lights: 'lights', back: 'back' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWxpZ2h0cy9odWV3aS1saWdodHMuY29tcG9uZW50Lm5nZmFjdG9yeS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWxpZ2h0cy9odWV3aS1saWdodHMuY29tcG9uZW50LnRzIiwibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktbGlnaHRzL2h1ZXdpLWxpZ2h0cy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWxpZ2h0cy9odWV3aS1saWdodHMuY29tcG9uZW50LnRzLkh1ZXdpTGlnaHRzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPG1kLWNhcmQgW0BSb3V0aW5nQW5pbWF0aW9uc10+XG5cbiAgPGRpdiAqbmdJZj1cIiFzZWxlY3RlZExpZ2h0XCI+XG4gICAgPG1kLWNhcmQtdGl0bGU+XG4gICAgICBMaWdodHNcbiAgICAgIDxzbWFsbD5cbiAgICAgICAgPG1kLWlucHV0LWNvbnRhaW5lcj5cbiAgICAgICAgICA8aW5wdXQgbWRJbnB1dCBwbGFjZWhvbGRlcj1cIkZpbHRlclwiIFsobmdNb2RlbCldPVwic2VhcmNoVGV4dFwiPlxuICAgICAgICA8L21kLWlucHV0LWNvbnRhaW5lcj5cbiAgICAgIDwvc21hbGw+XG4gICAgPC9tZC1jYXJkLXRpdGxlPlxuICAgIDxodWV3aS1saWdodCBcbiAgICAgICpuZ0Zvcj1cImxldCBsaWdodCBvZiBsaWdodHMgfCBvcmRlckJ5OlsnK25hbWUnXSB8IGZpbHRlcjpzZWFyY2hUZXh0OiduYW1lJ1wiXG4gICAgICBbbGlnaHRdPVwibGlnaHRcIj5cbiAgICA8L2h1ZXdpLWxpZ2h0PlxuICA8L2Rpdj5cblxuICA8ZGl2ICpuZ0lmPVwic2VsZWN0ZWRMaWdodFwiPlxuICAgIDxtZC1jYXJkLXRpdGxlPlxuICAgICAgPGEgKm5nSWY9XCJiYWNrXCIgW3JvdXRlckxpbmtdPVwiWycvbGlnaHRzJ11cIiBbcmVwbGFjZVVybF09XCJ0cnVlXCI+PG1kLWljb24+bmF2aWdhdGVfYmVmb3JlPC9tZC1pY29uPjwvYT5cbiAgICAgIHt7c2VsZWN0ZWRMaWdodC5uYW1lfX0gLSBEZXRhaWxzXG4gICAgPC9tZC1jYXJkLXRpdGxlPlxuICAgIDxodWV3aS1saWdodC1kZXRhaWxzXG4gICAgICBbbGlnaHRdPVwic2VsZWN0ZWRMaWdodFwiPlxuICAgIDwvaHVld2ktbGlnaHQtZGV0YWlscz5cbiAgPC9kaXY+XG5cbjwvbWQtY2FyZD5cbiIsIjxodWV3aS1saWdodHM+PC9odWV3aS1saWdodHM+Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkNXSTtNQUFBO3VDQUFBLFVBQUE7TUFBQSwrREFFa0I7TUFBQTtJQUFoQjtJQUZGLFdBRUUsU0FGRjs7OztvQkFURjtNQUFBLHdFQUE0QjthQUFBLDRCQUMxQjtNQUFBO01BQUEsbURBQUE7TUFBQTthQUFBO01BQWUsMkRBRWI7VUFBQTtVQUFBLDRDQUFPO1VBQUEsaUJBQ0w7VUFBQTtjQUFBO2NBQUE7Y0FBQTtrQkFBQTtVQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO1VBQUEsMkRBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQTtVQUFBO1VBQUE7VUFBQSx1QkFBb0IscUNBQ2xCO1VBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQW9DO2NBQUE7Y0FBQTtZQUFBO1lBQXBDO1VBQUEsdUNBQUE7VUFBQTthQUFBO1VBQUEsb0VBQUE7VUFBQTtZQUFBO1VBQUEsb0NBQUE7VUFBQTtVQUFBLHFEQUFBO3VCQUFBLG1DQUFBO3FCQUFBO2NBQUE7Y0FBQSxzQ0FBQTtVQUFBLG1EQUFBO1VBQUEsNEJBQTZELG1DQUMxQztVQUFBLGVBQ2YsMkNBQ007VUFBQSxhQUNoQjtVQUFBLHFDQUFBO1VBQUE7VUFBQSxzQkFDRTt5QkFBQSxlQUVZOzs7UUFQNEI7UUFBcEMsWUFBb0MsVUFBcEM7UUFBZTtRQUFmLFlBQWUsVUFBZjtRQUtKO1lBQUE7WUFBQTtRQURGLFlBQ0UsVUFERjs7UUFMSTtRQUFBO1FBQUE7UUFBQTtRQUFBO1FBQUE7UUFBQTtRQUFBO1FBQUE7UUFBQTtRQUFBLFdBQUE7WUFBQSw2QkFBQTtRQUNFO1FBQUE7UUFBQTtRQUFBO1FBQUE7UUFBQTtRQUFBO1FBQUE7UUFBQTtRQUFBO1FBQUE7UUFBQTtRQUFBO1FBQUEsYUFBQTtZQUFBLDRFQUFBOzs7O29CQVlKO01BQUE7UUFBQTtRQUFBO1VBQUE7Y0FBQTtVQUFBO1FBQUE7UUFBQTtNQUFBLHVDQUFBO01BQUE7VUFBQSxtREFBZ0IsSUFBK0M7TUFBQTtNQUFBO2FBQUE7dUJBQUEsc0NBQUE7VUFBQTtVQUFBLDZCQUFTOztJQUE3QjtJQUEzQjtJQUFoQixXQUEyQyxVQUEzQixTQUFoQjtJQUErRDs7SUFBL0Q7SUFBQTtJQUFBLFdBQUEsbUJBQUE7Ozs7b0JBRko7TUFBQSx3RUFBMkI7YUFBQSw0QkFDekI7TUFBQTtNQUFBLHFDQUFBO01BQUE7YUFBQTtNQUFlLDZDQUNiO1VBQUEsbUVBQUE7VUFBQTtVQUFBLGVBQXFHO01BRXZGLDJDQUNoQjtVQUFBO3lGQUFBO2FBQUE7VUFBQSxtQ0FDMEI7TUFDSjs7SUFMakI7SUFBSCxXQUFHLFNBQUg7SUFJQTtJQURGLFlBQ0UsU0FERjs7O0lBSHVHO0lBQUE7Ozs7b0JBbkIzRztNQUFBOzBCQUFBLFVBQUE7b0NBQUE7YUFBQTtNQUE4QiwrQkFFNUI7VUFBQSxxQ0FBQTt3QkFBQSxtQ0FhTTtNQUVOO2FBQUE7VUFBQSxpQ0FRTSw2QkFFRTtVQUFBOztJQXpCSDtJQUFMLFdBQUssU0FBTDtJQWVLO0lBQUwsV0FBSyxTQUFMOztJQWpCTztJQUFULFdBQVMsU0FBVDs7OztvQkNBQTtNQUFBO3FDQUFBLFVBQUE7TUFBQTtNQUFBO0lBQUE7O0lBQUE7SUFBQSxXQUFBLFNBQUE7Ozs7OyJ9
//# sourceMappingURL=huewi-lights.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-rules/huewi-rules.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_rules_component_css_shim_ngstyle_styles = [''];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXJ1bGVzL2h1ZXdpLXJ1bGVzLmNvbXBvbmVudC5jc3Muc2hpbS5uZ3N0eWxlLnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktcnVsZXMvaHVld2ktcnVsZXMuY29tcG9uZW50LmNzcyJdLCJzb3VyY2VzQ29udGVudCI6WyIgIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7In0=
//# sourceMappingURL=huewi-rules.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-rules/huewi-rule/huewi-rule.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_rule_component_css_shim_ngstyle_styles = [''];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXJ1bGVzL2h1ZXdpLXJ1bGUvaHVld2ktcnVsZS5jb21wb25lbnQuY3NzLnNoaW0ubmdzdHlsZS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXJ1bGVzL2h1ZXdpLXJ1bGUvaHVld2ktcnVsZS5jb21wb25lbnQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIiAiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7OzsifQ==
//# sourceMappingURL=huewi-rule.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-rules/huewi-rule/huewi-rule.component.ts
/* harmony import */ var huewi_rule_component___WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");


var huewi_rule_component_HuewiRuleComponent = (function () {
    function HuewiRuleComponent(huepiService, router) {
        this.huepiService = huepiService;
        this.router = router;
    }
    HuewiRuleComponent.prototype.ngOnInit = function () {
    };
    HuewiRuleComponent.prototype.select = function (rule) {
        this.router.navigate(['/rules', rule.__key], { replaceUrl: true });
    };
    HuewiRuleComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: huewi_rule_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return HuewiRuleComponent;
}());

//# sourceMappingURL=huewi-rule.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-rules/huewi-rule/huewi-rule.component.ngfactory.ts
/* harmony import */ var huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__angular_router__ = __webpack_require__("BkNc");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */








var styles_HuewiRuleComponent = [huewi_rule_component_css_shim_ngstyle_styles];
var RenderType_HuewiRuleComponent = huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiRuleComponent, data: {} });
function View_HuewiRuleComponent_1(_l) {
    return huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, null, null, huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2,
                huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['radio_button_checked']))], function (_ck, _v) {
        _ck(_v, 2, 0);
    }, null);
}
function View_HuewiRuleComponent_2(_l) {
    return huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, null, null, huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2,
                huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['radio_button_unchecked']))], function (_ck, _v) {
        _ck(_v, 2, 0);
    }, null);
}
function View_HuewiRuleComponent_0(_l) {
    return huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 13, 'div', [['class',
                'flexcontainer']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.select(_co.rule) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), (_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [['style', 'flex: 1 1 128px']], null, null, null, null, null)),
        (_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    ', '\n  '])), (_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 7, 'div', [['style',
                'flex: 0 1 10px']], null, null, null, null, null)), (_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiRuleComponent_1)),
        huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiRuleComponent_2)),
        huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['      \n  '])), (_l()(),
            huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n'])), (_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = (_co.rule.status === 'enabled');
        _ck(_v, 8, 0, currVal_1);
        var currVal_2 = (_co.rule.status === 'disabled');
        _ck(_v, 11, 0, currVal_2);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.rule.name;
        _ck(_v, 3, 0, currVal_0);
    });
}
function View_HuewiRuleComponent_Host_0(_l) {
    return huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-rule', [], null, null, null, View_HuewiRuleComponent_0, RenderType_HuewiRuleComponent)),
        huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_rule_component_HuewiRuleComponent, [huepi_service_HuepiService, __WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiRuleComponentNgFactory = huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-rule', huewi_rule_component_HuewiRuleComponent, View_HuewiRuleComponent_Host_0, { rule: 'rule' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXJ1bGVzL2h1ZXdpLXJ1bGUvaHVld2ktcnVsZS5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktcnVsZXMvaHVld2ktcnVsZS9odWV3aS1ydWxlLmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXJ1bGVzL2h1ZXdpLXJ1bGUvaHVld2ktcnVsZS5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXJ1bGVzL2h1ZXdpLXJ1bGUvaHVld2ktcnVsZS5jb21wb25lbnQudHMuSHVld2lSdWxlQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPGRpdiBjbGFzcz1cImZsZXhjb250YWluZXJcIlxuICAoY2xpY2spPVwic2VsZWN0KHJ1bGUpXCI+XG4gIDxkaXYgc3R5bGU9XCJmbGV4OiAxIDEgMTI4cHhcIj5cbiAgICB7e3J1bGUubmFtZX19XG4gIDwvZGl2PlxuICA8ZGl2IHN0eWxlPVwiZmxleDogMCAxIDEwcHhcIj5cbiAgICA8bWQtaWNvbiAqbmdJZj1cInJ1bGUuc3RhdHVzID09PSAnZW5hYmxlZCdcIj5yYWRpb19idXR0b25fY2hlY2tlZDwvbWQtaWNvbj5cbiAgICA8bWQtaWNvbiAqbmdJZj1cInJ1bGUuc3RhdHVzID09PSAnZGlzYWJsZWQnXCI+cmFkaW9fYnV0dG9uX3VuY2hlY2tlZDwvbWQtaWNvbj4gICAgICBcbiAgPC9kaXY+XG48L2Rpdj5cbiIsIjxodWV3aS1ydWxlPjwvaHVld2ktcnVsZT4iXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkNNSTtNQUFBOzBCQUFBLFVBQUE7b0NBQUE7YUFBQTtVQUFBLGdEQUEyQzs7UUFBM0M7Ozs7b0JBQ0E7TUFBQTswQkFBQSxVQUFBO29DQUFBO2FBQUE7VUFBQSxnREFBNEM7O1FBQTVDOzs7O29CQVBKO01BQUE7SUFBQTtJQUFBO0lBQ0U7TUFBQTtNQUFBO0lBQUE7SUFERjtFQUFBLGdDQUN5Qix5Q0FDdkI7YUFBQTtVQUFBO01BQTZCLGtEQUV2QjtVQUFBLFdBQ047VUFBQTtVQUFBLGdCQUE0QiwyQ0FDMUI7VUFBQTthQUFBO1VBQUEsd0JBQXlFLDJDQUN6RTtpQkFBQTthQUFBO1VBQUEsd0JBQTRFLCtDQUN4RTtpQkFBQSx3QkFDRjs7O0lBSE87SUFBVCxXQUFTLFNBQVQ7SUFDUztJQUFULFlBQVMsU0FBVDs7O0lBTDJCO0lBQUE7Ozs7b0JDRi9CO01BQUE7YUFBQTtVQUFBO0lBQUE7Ozs7In0=
//# sourceMappingURL=huewi-rule.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-rules/huewi-rule-details/huewi-rule-details.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_rule_details_component_css_shim_ngstyle_styles = ['md-icon[_ngcontent-%COMP%]{float:right}'];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXJ1bGVzL2h1ZXdpLXJ1bGUtZGV0YWlscy9odWV3aS1ydWxlLWRldGFpbHMuY29tcG9uZW50LmNzcy5zaGltLm5nc3R5bGUudHMiLCJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZzovLy9Vc2Vycy9hcm5kL0RldmVsb3Blci9odWV3aTIvc3JjL2FwcC9odWV3aS1ydWxlcy9odWV3aS1ydWxlLWRldGFpbHMvaHVld2ktcnVsZS1kZXRhaWxzLmNvbXBvbmVudC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiICJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7OyJ9
//# sourceMappingURL=huewi-rule-details.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-rules/huewi-rule-details/huewi-rule-details.component.ts


var huewi_rule_details_component_HuewiRuleDetailsComponent = (function () {
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
    HuewiRuleDetailsComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: ParametersService }]; };
    return HuewiRuleDetailsComponent;
}());

//# sourceMappingURL=huewi-rule-details.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-rules/huewi-rule-details/huewi-rule-details.component.ngfactory.ts
/* harmony import */ var huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__angular_router__ = __webpack_require__("BkNc");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */











var styles_HuewiRuleDetailsComponent = [huewi_rule_details_component_css_shim_ngstyle_styles];
var RenderType_HuewiRuleDetailsComponent = huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiRuleDetailsComponent, data: {} });
function View_HuewiRuleDetailsComponent_1(_l) {
    return huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = ((_co.expand = true) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['expand_more']))], function (_ck, _v) {
        _ck(_v, 2, 0);
    }, null);
}
function View_HuewiRuleDetailsComponent_4(_l) {
    return huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [], null, null, null, null, null)), (_l()(),
            huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\'', '\'']))], null, function (_ck, _v) {
        var currVal_0 = _v.parent.context.$implicit.value;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiRuleDetailsComponent_5(_l) {
    return huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'span', [], null, null, null, null, null)), (_l()(),
            huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, [' & '])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null))], null, null);
}
function View_HuewiRuleDetailsComponent_3(_l) {
    return huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 7, 'span', [], null, null, null, null, null)), (_l()(),
            huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n        ', ' ', ' ', '\n        '])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiRuleDetailsComponent_4)),
        huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_common__["k" /* NgIf */], [huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, [' ', '\n        '])),
        (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiRuleDetailsComponent_5)),
        huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_common__["k" /* NgIf */], [huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      ']))], function (_ck, _v) {
        var currVal_3 = (_v.context.$implicit.value !== '');
        _ck(_v, 3, 0, currVal_3);
        var currVal_5 = !_v.context.last;
        _ck(_v, 6, 0, currVal_5);
    }, function (_ck, _v) {
        var currVal_0 = '{';
        var currVal_1 = _v.context.$implicit.address;
        var currVal_2 = _v.context.$implicit.operator;
        _ck(_v, 1, 0, currVal_0, currVal_1, currVal_2);
        var currVal_4 = '}';
        _ck(_v, 4, 0, currVal_4);
    });
}
function View_HuewiRuleDetailsComponent_7(_l) {
    return huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'span', [], null, null, null, null, null)), (_l()(),
            huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, [' + '])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null))], null, null);
}
function View_HuewiRuleDetailsComponent_6(_l) {
    return huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 5, 'span', [], null, null, null, null, null)), (_l()(),
            huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n        ', ' ', ' ', ' ', ' ', '\n        '])), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, __WEBPACK_IMPORTED_MODULE_4__angular_common__["e" /* JsonPipe */], []), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiRuleDetailsComponent_7)), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_common__["k" /* NgIf */], [huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null),
        (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      ']))], function (_ck, _v) {
        var currVal_5 = !_v.context.last;
        _ck(_v, 4, 0, currVal_5);
    }, function (_ck, _v) {
        var currVal_0 = '{';
        var currVal_1 = _v.context.$implicit.method;
        var currVal_2 = _v.context.$implicit.address;
        var currVal_3 = huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵunv */](_v, 1, 3, huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2).transform(_v.context.$implicit.body));
        var currVal_4 = '}';
        _ck(_v, 1, 0, currVal_0, currVal_1, currVal_2, currVal_3, currVal_4);
    });
}
function View_HuewiRuleDetailsComponent_2(_l) {
    return huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 30, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 27, 'small', [], null, null, null, null, null)), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = ((_co.expand = false) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['expand_less'])),
        (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-divider', [['aria-orientation', 'horizontal'], ['class',
                'mat-divider'], ['role', 'separator']], null, null, null, null, null)), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_33" /* MdListDivider */], [], null, null),
        huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdDividerCssMatStyler */], [], null, null), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n\n      '])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'b', [], null, null, null, null, null)), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['conditions :'])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)),
        (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiRuleDetailsComponent_3)), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_common__["j" /* NgForOf */], [huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */], huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])),
        (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'b', [], null, null, null, null, null)),
        (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['actions :'])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])),
        (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiRuleDetailsComponent_6)),
        huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_common__["j" /* NgForOf */], [huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */],
            huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        _ck(_v, 6, 0);
        var currVal_0 = _co.rule.conditions;
        _ck(_v, 19, 0, currVal_0);
        var currVal_1 = _co.rule.actions;
        _ck(_v, 28, 0, currVal_1);
    }, null);
}
function View_HuewiRuleDetailsComponent_0(_l) {
    return huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-rule', [], null, null, null, View_HuewiRuleComponent_0, RenderType_HuewiRuleComponent)),
        huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_rule_component_HuewiRuleComponent, [huepi_service_HuepiService, __WEBPACK_IMPORTED_MODULE_8__angular_router__["k" /* Router */]], { rule: [0, 'rule'] }, null), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n'])),
        (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n\n'])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 10, 'div', [], null, null, null, null, null)), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [], null, null, null, null, null)), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['rule ', ''])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiRuleDetailsComponent_1)),
        huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_common__["k" /* NgIf */], [huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiRuleDetailsComponent_2)),
        huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_common__["k" /* NgIf */], [huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n'])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.rule;
        _ck(_v, 1, 0, currVal_0);
        var currVal_2 = !_co.expand;
        _ck(_v, 10, 0, currVal_2);
        var currVal_3 = _co.expand;
        _ck(_v, 13, 0, currVal_3);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = _co.rule.__key;
        _ck(_v, 7, 0, currVal_1);
    });
}
function View_HuewiRuleDetailsComponent_Host_0(_l) {
    return huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-rule-details', [], null, null, null, View_HuewiRuleDetailsComponent_0, RenderType_HuewiRuleDetailsComponent)), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_rule_details_component_HuewiRuleDetailsComponent, [huepi_service_HuepiService, ParametersService], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiRuleDetailsComponentNgFactory = huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-rule-details', huewi_rule_details_component_HuewiRuleDetailsComponent, View_HuewiRuleDetailsComponent_Host_0, { rule: 'rule',
    expand: 'expand' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXJ1bGVzL2h1ZXdpLXJ1bGUtZGV0YWlscy9odWV3aS1ydWxlLWRldGFpbHMuY29tcG9uZW50Lm5nZmFjdG9yeS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXJ1bGVzL2h1ZXdpLXJ1bGUtZGV0YWlscy9odWV3aS1ydWxlLWRldGFpbHMuY29tcG9uZW50LnRzIiwibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktcnVsZXMvaHVld2ktcnVsZS1kZXRhaWxzL2h1ZXdpLXJ1bGUtZGV0YWlscy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXJ1bGVzL2h1ZXdpLXJ1bGUtZGV0YWlscy9odWV3aS1ydWxlLWRldGFpbHMuY29tcG9uZW50LnRzLkh1ZXdpUnVsZURldGFpbHNDb21wb25lbnRfSG9zdC5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIiAiLCI8aHVld2ktcnVsZSBcbiAgW3J1bGVdPVwicnVsZVwiPlxuPC9odWV3aS1ydWxlPlxuXG48ZGl2PlxuICA8ZGl2PnJ1bGUge3tydWxlLl9fa2V5fX08L2Rpdj5cbiAgPG1kLWljb24gKm5nSWY9XCIhZXhwYW5kXCIgKGNsaWNrKT1cImV4cGFuZD10cnVlXCI+ZXhwYW5kX21vcmU8L21kLWljb24+XG4gIDxkaXYgKm5nSWY9XCJleHBhbmRcIj5cbiAgICA8c21hbGw+XG4gICAgICA8bWQtaWNvbiAoY2xpY2spPVwiZXhwYW5kPWZhbHNlXCI+ZXhwYW5kX2xlc3M8L21kLWljb24+XG4gICAgICA8bWQtZGl2aWRlcj48L21kLWRpdmlkZXI+XG5cbiAgICAgIDxiPmNvbmRpdGlvbnMgOjwvYj48YnI+XG4gICAgICA8c3BhbiAqbmdGb3I9J2xldCBjb25kaXRpb24gb2YgcnVsZS5jb25kaXRpb25zOyBsZXQgbGFzdCA9IGxhc3QnPlxuICAgICAgICB7eyd7J319IHt7Y29uZGl0aW9uLmFkZHJlc3N9fSB7e2NvbmRpdGlvbi5vcGVyYXRvcn19XG4gICAgICAgIDxzcGFuICpuZ0lmPSdjb25kaXRpb24udmFsdWUhPT1cIlwiJz4ne3tjb25kaXRpb24udmFsdWV9fSc8L3NwYW4+IHt7J30nfX1cbiAgICAgICAgPHNwYW4gKm5nSWY9JyFsYXN0Jz4gJiA8YnI+PC9zcGFuPlxuICAgICAgPC9zcGFuPlxuICAgICAgPGJyPlxuICAgICAgPGI+YWN0aW9ucyA6PC9iPjxicj5cbiAgICAgIDxzcGFuICpuZ0Zvcj0nbGV0IGFjdGlvbiBvZiBydWxlLmFjdGlvbnM7IGxldCBsYXN0ID0gbGFzdCc+XG4gICAgICAgIHt7J3snfX0ge3thY3Rpb24ubWV0aG9kfX0ge3thY3Rpb24uYWRkcmVzc319IHt7YWN0aW9uLmJvZHkgfCBqc29ufX0ge3snfSd9fVxuICAgICAgICA8c3BhbiAqbmdJZj0nIWxhc3QnPiArIDxicj48L3NwYW4+XG4gICAgICA8L3NwYW4+XG4gICAgPC9zbWFsbD5cbiAgPC9kaXY+XG48L2Rpdj5cbiIsIjxodWV3aS1ydWxlLWRldGFpbHM+PC9odWV3aS1ydWxlLWRldGFpbHM+Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JDTUU7TUFBQTtJQUFBO0lBQUE7SUFBeUI7TUFBQTtNQUFBO0lBQUE7SUFBekI7RUFBQSxpREFBQTtNQUFBO2FBQUE7VUFBQSxnREFBK0M7O1FBQS9DOzs7O29CQVNNO01BQUEsd0VBQW1DO2FBQUE7SUFBQTtJQUFBOzs7O29CQUNuQztNQUFBLHdFQUFvQjthQUFBLHlCQUFHO01BQUE7TUFBQTs7O29CQUh6QjtNQUFBLHdFQUFpRTthQUFBLHFEQUUvRDtNQUFBO2FBQUE7VUFBQSx3QkFBK0Q7TUFDL0Q7YUFBQTtVQUFBLHdCQUFrQzs7SUFENUI7SUFBTixXQUFNLFNBQU47SUFDTTtJQUFOLFdBQU0sU0FBTjs7SUFIK0Q7SUFBQTtJQUFBO0lBQUE7SUFFQTtJQUFBOzs7O29CQU8vRDtNQUFBLHdFQUFvQjthQUFBLHlCQUFHO01BQUE7TUFBQTs7O29CQUZ6QjtNQUFBLHdFQUEyRDthQUFBO2tCQUFBLGVBRXpEO01BQUEsMERBQUE7TUFBQTtNQUFrQztJQUE1QjtJQUFOLFdBQU0sU0FBTjs7SUFGeUQ7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBOzs7O29CQWIvRDtNQUFBLHdFQUFvQjthQUFBLDRCQUNsQjtNQUFBO01BQUEsZ0JBQU8sNkNBQ0w7TUFBQTtNQUFBO1FBQUE7UUFBQTtRQUFTO1VBQUE7VUFBQTtRQUFBO1FBQVQ7TUFBQSxpREFBQTtNQUFBO2FBQUE7VUFBQSxnREFBZ0M7TUFBcUIsNkNBQ3JEO1VBQUE7Y0FBQTtVQUFBLHFDQUFBO1VBQUE7YUFBQTthQUFBO1VBQUEsZUFBeUIsK0NBRXpCO1VBQUE7VUFBQSw0Q0FBRztVQUFBLG1CQUFnQjtVQUFBO01BQUksNkNBQ3ZCO1VBQUEsd0VBQUE7VUFBQTtVQUFBLHVDQUlPO01BQ1A7VUFBQSwwREFBSTtVQUFBLGVBQ0o7VUFBQTtNQUFHLDhDQUFhO1VBQUE7VUFBQSw4QkFBSTtNQUNwQjthQUFBOzRCQUFBLHlDQUdPO1VBQUEsYUFDRDs7SUFmTjtJQUlNO0lBQU4sWUFBTSxTQUFOO0lBT007SUFBTixZQUFNLFNBQU47Ozs7b0JBcEJOO01BQUE7YUFBQTtVQUFBLGlDQUNnQjtNQUNILHlDQUViO1VBQUE7VUFBQSxnQkFBSyx5Q0FDSDtVQUFBO1VBQUEsNENBQUs7VUFBQSxlQUF5Qix5Q0FDOUI7VUFBQTthQUFBO1VBQUEsd0JBQW9FLHlDQUNwRTtpQkFBQTthQUFBO1VBQUEsd0JBa0JNLHVDQUNGO1VBQUE7O0lBekJKO0lBREYsV0FDRSxTQURGO0lBTVc7SUFBVCxZQUFTLFNBQVQ7SUFDSztJQUFMLFlBQUssU0FBTDs7O0lBRks7SUFBQTs7OztvQkNMUDtNQUFBOzBDQUFBLFVBQUE7TUFBQTtJQUFBOzs7OzsifQ==
//# sourceMappingURL=huewi-rule-details.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-rules/huewi-rules.mock.ts
var HUEWI_RULES_MOCK = [];
//# sourceMappingURL=huewi-rules.mock.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-rules/huewi-rules.component.ts
/* harmony import */ var huewi_rules_component___WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_rules_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable__ = __webpack_require__("bKpL");
/* harmony import */ var huewi_rules_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable___default = __webpack_require__.n(huewi_rules_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable__);
/* harmony import */ var huewi_rules_component___WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of__ = __webpack_require__("/zHi");
/* harmony import */ var huewi_rules_component___WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of___default = __webpack_require__.n(huewi_rules_component___WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of__);







var huewi_rules_component_HuewiRulesComponent = (function () {
    function HuewiRulesComponent(huepiService, parametersService, activatedRoute, router) {
        this.huepiService = huepiService;
        this.parametersService = parametersService;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.rules = HUEWI_RULES_MOCK;
        this.back = true;
        this.ruleObserver = huewi_rules_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable__["Observable"].of(this.rules);
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
    HuewiRulesComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: ParametersService }, { type: huewi_rules_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["a" /* ActivatedRoute */] }, { type: huewi_rules_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return HuewiRulesComponent;
}());

//# sourceMappingURL=huewi-rules.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-rules/huewi-rules.component.ngfactory.ts
/* harmony import */ var huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__ = __webpack_require__("bm2B");
/* harmony import */ var huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_cdk_platform__ = __webpack_require__("JYHx");
/* harmony import */ var huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__ = __webpack_require__("qbdv");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */

















var styles_HuewiRulesComponent = [huewi_rules_component_css_shim_ngstyle_styles];
var RenderType_HuewiRulesComponent = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiRulesComponent, data: { 'animation': [{ type: 7, name: 'RoutingAnimations',
                definitions: [{ type: 0, name: 'void', styles: { type: 6, styles: { top: -32, left: 0, opacity: 0 },
                            offset: null }, options: undefined }, { type: 0, name: '*', styles: { type: 6,
                            styles: { top: 0, left: 0, opacity: 1 }, offset: null }, options: undefined },
                    { type: 1, expr: ':enter', animation: [{ type: 4, styles: { type: 6, styles: { top: 0,
                                        left: 0, opacity: 1 }, offset: null }, timings: '0.2s ease-in-out' }],
                        options: null }, { type: 1, expr: ':leave', animation: [{ type: 4, styles: { type: 6,
                                    styles: { top: -32, left: 0, opacity: 0 }, offset: null }, timings: '0s ease-in-out' }],
                        options: null }], options: {} }] } });
function View_HuewiRulesComponent_2(_l) {
    return huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-rule', [['md-list-item',
                '']], null, null, null, View_HuewiRuleComponent_0, RenderType_HuewiRuleComponent)), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_rule_component_HuewiRuleComponent, [huepi_service_HuepiService, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], { rule: [0, 'rule'] }, null), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      ']))], function (_ck, _v) {
        var currVal_0 = _v.context.$implicit;
        _ck(_v, 1, 0, currVal_0);
    }, null);
}
function View_HuewiRulesComponent_1(_l) {
    return huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 42, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 27, 'md-card-title', [['class', 'mat-card-title']], null, null, null, null, null)), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["U" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      Rules\n      '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 22, 'small', [], null, null, null, null, null)), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n        '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 19, 'md-input-container', [['class', 'mat-input-container mat-form-field']], [[2, 'mat-input-invalid',
                null], [2, 'mat-form-field-invalid', null], [2, 'mat-focused',
                null], [2, 'ng-untouched', null], [2, 'ng-touched', null],
            [2, 'ng-pristine', null], [2, 'ng-dirty', null], [2, 'ng-valid',
                null], [2, 'ng-invalid', null], [2, 'ng-pending', null]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._control.focus() !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["w" /* View_MdFormField_0 */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdFormField */])), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](7389184, null, 6, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_16" /* MdFormField */], [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */], [2, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["u" /* MD_PLACEHOLDER_GLOBAL_OPTIONS */]]], null, null), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 1, { _control: 0 }), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 2, { _placeholderChild: 0 }), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 3, { _errorChildren: 1 }), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 4, { _hintChildren: 1 }), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 5, { _prefixChildren: 1 }), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 6, { _suffixChildren: 1 }), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](1, ['\n          '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 1, 8, 'input', [['class', 'mat-input-element'], ['mdInput', ''],
            ['placeholder', 'Filter']], [[8, 'id', 0], [8, 'placeholder', 0], [8, 'disabled',
                0], [8, 'required', 0], [1, 'aria-describedby', 0], [1, 'aria-invalid', 0], [2,
                'ng-untouched', null], [2, 'ng-touched', null], [2, 'ng-pristine',
                null], [2, 'ng-dirty', null], [2, 'ng-valid', null],
            [2, 'ng-invalid', null], [2, 'ng-pending', null]], [[null,
                'ngModelChange'], [null, 'input'], [null, 'blur'], [null,
                'compositionstart'], [null, 'compositionend'], [null,
                'focus']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('input' === en)) {
                var pd_0 = (huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 20)._handleInput($event.target.value) !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 20).onTouched() !== false);
                ad = (pd_1 && ad);
            }
            if (('compositionstart' === en)) {
                var pd_2 = (huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 20)._compositionStart() !== false);
                ad = (pd_2 && ad);
            }
            if (('compositionend' === en)) {
                var pd_3 = (huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 20)._compositionEnd($event.target.value) !== false);
                ad = (pd_3 && ad);
            }
            if (('blur' === en)) {
                var pd_4 = (huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24)._focusChanged(false) !== false);
                ad = (pd_4 && ad);
            }
            if (('focus' === en)) {
                var pd_5 = (huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24)._focusChanged(true) !== false);
                ad = (pd_5 && ad);
            }
            if (('input' === en)) {
                var pd_6 = (huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24)._onInput() !== false);
                ad = (pd_6 && ad);
            }
            if (('ngModelChange' === en)) {
                var pd_7 = ((_co.searchText = $event) !== false);
                ad = (pd_7 && ad);
            }
            return ad;
        }, null, null)), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["c" /* DefaultValueAccessor */], [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */],
            [2, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["a" /* COMPOSITION_BUFFER_MODE */]]], null, null), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](1024, null, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["g" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["c" /* DefaultValueAccessor */]]), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["k" /* NgModel */], [[8,
                null], [8, null], [8, null], [2, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["g" /* NG_VALUE_ACCESSOR */]]], { model: [0, 'model'] }, { update: 'ngModelChange' }), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](2048, null, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["h" /* NgControl */], null, [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["k" /* NgModel */]]), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](933888, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_28" /* MdInput */], [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_cdk_platform__["a" /* Platform */], [2, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["h" /* NgControl */]], [2, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["j" /* NgForm */]],
            [2, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["d" /* FormGroupDirective */]], [2, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["r" /* MD_ERROR_GLOBAL_OPTIONS */]]], { placeholder: [0,
                'placeholder'] }, null), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["i" /* NgControlStatus */], [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["h" /* NgControl */]], null, null), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](2048, [[1, 4]], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_17" /* MdFormFieldControl */], null, [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_28" /* MdInput */]]), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](1, ['\n        '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 10, 'md-list', [['class', 'mat-list'], ['role', 'list']], null, null, null, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["z" /* View_MdList_0 */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["i" /* RenderType_MdList */])), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdList */], [], null, null),
        huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_32" /* MdListCssMatStyler */], [], null, null), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 4, null, View_HuewiRulesComponent_2)), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["j" /* NgForOf */], [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, OrderByPipe, []), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, FilterPipe, []), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n    '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_23 = _co.searchText;
        _ck(_v, 22, 0, currVal_23);
        var currVal_24 = 'Filter';
        _ck(_v, 24, 0, currVal_24);
        var currVal_25 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵunv */](_v, 37, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 40).transform(huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵunv */](_v, 37, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 39).transform(_co.rules, _ck(_v, 38, 0, '+name'))), _co.searchText, 'name'));
        _ck(_v, 37, 0, currVal_25);
    }, function (_ck, _v) {
        var currVal_0 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._control.errorState;
        var currVal_1 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._control.errorState;
        var currVal_2 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._control.focused;
        var currVal_3 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('untouched');
        var currVal_4 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('touched');
        var currVal_5 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('pristine');
        var currVal_6 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('dirty');
        var currVal_7 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('valid');
        var currVal_8 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('invalid');
        var currVal_9 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('pending');
        _ck(_v, 8, 0, currVal_0, currVal_1, currVal_2, currVal_3, currVal_4, currVal_5, currVal_6, currVal_7, currVal_8, currVal_9);
        var currVal_10 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).id;
        var currVal_11 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).placeholder;
        var currVal_12 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).disabled;
        var currVal_13 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).required;
        var currVal_14 = (huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24)._ariaDescribedby || null);
        var currVal_15 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).errorState;
        var currVal_16 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassUntouched;
        var currVal_17 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassTouched;
        var currVal_18 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassPristine;
        var currVal_19 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassDirty;
        var currVal_20 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassValid;
        var currVal_21 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassInvalid;
        var currVal_22 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassPending;
        _ck(_v, 18, 1, [currVal_10, currVal_11, currVal_12, currVal_13, currVal_14, currVal_15,
            currVal_16, currVal_17, currVal_18, currVal_19, currVal_20, currVal_21, currVal_22]);
    });
}
function View_HuewiRulesComponent_4(_l) {
    return huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'a', [], [[1, 'target', 0], [8, 'href', 4]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])),
        huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_23" /* MdIcon */], [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_26" /* MdIconRegistry */], [8, null]], null, null), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['navigate_before']))], function (_ck, _v) {
        var currVal_2 = true;
        var currVal_3 = _ck(_v, 2, 0, '/rules');
        _ck(_v, 1, 0, currVal_2, currVal_3);
        _ck(_v, 5, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).target;
        var currVal_1 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).href;
        _ck(_v, 0, 0, currVal_0, currVal_1);
    });
}
function View_HuewiRulesComponent_3(_l) {
    return huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 13, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'md-card-title', [['class', 'mat-card-title']], null, null, null, null, null)), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["U" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiRulesComponent_4)), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["k" /* NgIf */], [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      ', ' - Details\n    '])),
        (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-rule-details', [], null, null, null, View_HuewiRuleDetailsComponent_0, RenderType_HuewiRuleDetailsComponent)),
        huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_rule_details_component_HuewiRuleDetailsComponent, [huepi_service_HuepiService,
            ParametersService], { rule: [0, 'rule'] }, null), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.back;
        _ck(_v, 7, 0, currVal_0);
        var currVal_2 = _co.selectedRule;
        _ck(_v, 11, 0, currVal_2);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = _co.selectedRule.name;
        _ck(_v, 8, 0, currVal_1);
    });
}
function View_HuewiRulesComponent_0(_l) {
    return huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 9, 'md-card', [['class',
                'mat-card']], [[24, '@RoutingAnimations', 0]], null, null, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["u" /* View_MdCard_0 */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2,
                huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["Q" /* MdCard */], [], null, null),
        (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiRulesComponent_1)), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["k" /* NgIf */], [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */],
            huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n  '])),
        (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiRulesComponent_3)),
        huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["k" /* NgIf */], [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = !_co.selectedRule;
        _ck(_v, 5, 0, currVal_1);
        var currVal_2 = _co.selectedRule;
        _ck(_v, 8, 0, currVal_2);
    }, function (_ck, _v) {
        var currVal_0 = undefined;
        _ck(_v, 0, 0, currVal_0);
    });
}
function View_HuewiRulesComponent_Host_0(_l) {
    return huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-rules', [], [[40, '@RoutingAnimations', 0]], null, null, View_HuewiRulesComponent_0, RenderType_HuewiRulesComponent)), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_rules_component_HuewiRulesComponent, [huepi_service_HuepiService, ParametersService, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).RoutingAnimations;
        _ck(_v, 0, 0, currVal_0);
    });
}
var HuewiRulesComponentNgFactory = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-rules', huewi_rules_component_HuewiRulesComponent, View_HuewiRulesComponent_Host_0, { rules: 'rules', back: 'back' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXJ1bGVzL2h1ZXdpLXJ1bGVzLmNvbXBvbmVudC5uZ2ZhY3RvcnkudHMiLCJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZzovLy9Vc2Vycy9hcm5kL0RldmVsb3Blci9odWV3aTIvc3JjL2FwcC9odWV3aS1ydWxlcy9odWV3aS1ydWxlcy5jb21wb25lbnQudHMiLCJuZzovLy9Vc2Vycy9hcm5kL0RldmVsb3Blci9odWV3aTIvc3JjL2FwcC9odWV3aS1ydWxlcy9odWV3aS1ydWxlcy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXJ1bGVzL2h1ZXdpLXJ1bGVzLmNvbXBvbmVudC50cy5IdWV3aVJ1bGVzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPG1kLWNhcmQgW0BSb3V0aW5nQW5pbWF0aW9uc10+XG5cbiAgPGRpdiAqbmdJZj1cIiFzZWxlY3RlZFJ1bGVcIj5cbiAgICA8bWQtY2FyZC10aXRsZT5cbiAgICAgIFJ1bGVzXG4gICAgICA8c21hbGw+XG4gICAgICAgIDxtZC1pbnB1dC1jb250YWluZXI+XG4gICAgICAgICAgPGlucHV0IG1kSW5wdXQgcGxhY2Vob2xkZXI9XCJGaWx0ZXJcIiBbKG5nTW9kZWwpXT1cInNlYXJjaFRleHRcIj5cbiAgICAgICAgPC9tZC1pbnB1dC1jb250YWluZXI+XG4gICAgICA8L3NtYWxsPlxuICAgIDwvbWQtY2FyZC10aXRsZT5cbiAgICA8bWQtbGlzdD5cbiAgICAgIDxodWV3aS1ydWxlIG1kLWxpc3QtaXRlbSBcbiAgICAgICAgKm5nRm9yPVwibGV0IHJ1bGUgb2YgcnVsZXMgfCBvcmRlckJ5OlsnK25hbWUnXSB8IGZpbHRlcjpzZWFyY2hUZXh0OiduYW1lJ1wiXG4gICAgICAgIFtydWxlXT1cInJ1bGVcIiA+XG4gICAgICA8L2h1ZXdpLXJ1bGU+XG4gICAgPC9tZC1saXN0PlxuICA8L2Rpdj5cblxuICA8ZGl2ICpuZ0lmPVwic2VsZWN0ZWRSdWxlXCI+XG4gICAgPG1kLWNhcmQtdGl0bGU+XG4gICAgICA8YSAqbmdJZj1cImJhY2tcIiBbcm91dGVyTGlua109XCJbJy9ydWxlcyddXCIgW3JlcGxhY2VVcmxdPVwidHJ1ZVwiPjxtZC1pY29uPm5hdmlnYXRlX2JlZm9yZTwvbWQtaWNvbj48L2E+XG4gICAgICB7e3NlbGVjdGVkUnVsZS5uYW1lfX0gLSBEZXRhaWxzXG4gICAgPC9tZC1jYXJkLXRpdGxlPlxuICAgIDxodWV3aS1ydWxlLWRldGFpbHNcbiAgICAgIFtydWxlXT1cInNlbGVjdGVkUnVsZVwiPlxuICAgIDwvaHVld2ktcnVsZS1kZXRhaWxzPlxuICA8L2Rpdj5cblxuPC9tZC1jYXJkPiIsIjxodWV3aS1ydWxlcz48L2h1ZXdpLXJ1bGVzPiJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JDWU07TUFBQTtzQ0FBQSxVQUFBO01BQUEsNkRBRWlCO01BQUE7SUFBZjtJQUZGLFdBRUUsU0FGRjs7OztvQkFWSjtNQUFBLHdFQUEyQjthQUFBLDRCQUN6QjtNQUFBO01BQUEsbURBQUE7TUFBQTthQUFBO01BQWUsMERBRWI7VUFBQTtVQUFBLDRDQUFPO1VBQUEsaUJBQ0w7VUFBQTtjQUFBO2NBQUE7Y0FBQTtrQkFBQTtVQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO1VBQUEsMkRBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQTtVQUFBO1VBQUE7VUFBQSx1QkFBb0IscUNBQ2xCO1VBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQW9DO2NBQUE7Y0FBQTtZQUFBO1lBQXBDO1VBQUEsdUNBQUE7VUFBQTthQUFBO1VBQUEsb0VBQUE7VUFBQTtZQUFBO1VBQUEsb0NBQUE7VUFBQTtVQUFBLHFEQUFBO3VCQUFBLG1DQUFBO3FCQUFBO2NBQUE7Y0FBQSxzQ0FBQTtVQUFBLG1EQUFBO1VBQUEsNEJBQTZELG1DQUMxQztVQUFBLGVBQ2YsMkNBQ007VUFBQSxhQUNoQjtVQUFBOytDQUFBLFVBQUE7VUFBQTthQUFBO2FBQUE7VUFBQSxlQUFTLGlDQUNQO1VBQUEsb0VBQUE7VUFBQTtVQUFBLDhDQUNFO1VBQUEsdURBRVc7VUFBQSxhQUNMOztJQVRnQztJQUFwQyxZQUFvQyxVQUFwQztJQUFlO0lBQWYsWUFBZSxVQUFmO0lBTUY7UUFBQTtRQUFBO0lBREYsWUFDRSxVQURGOztJQU5FO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUEsV0FBQTtRQUFBLDZCQUFBO0lBQ0U7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQSxhQUFBO1FBQUEsNEVBQUE7Ozs7b0JBY0o7TUFBQTtRQUFBO1FBQUE7VUFBQTtjQUFBO1VBQUE7UUFBQTtRQUFBO01BQUEsdUNBQUE7TUFBQTtVQUFBLG1EQUFnQixJQUE4QztNQUFBO01BQUE7YUFBQTt1QkFBQSxzQ0FBQTtVQUFBO1VBQUEsNkJBQVM7O0lBQTdCO0lBQTFCO0lBQWhCLFdBQTBDLFVBQTFCLFNBQWhCO0lBQThEOztJQUE5RDtJQUFBO0lBQUEsV0FBQSxtQkFBQTs7OztvQkFGSjtNQUFBLHdFQUEwQjthQUFBLDRCQUN4QjtNQUFBO01BQUEscUNBQUE7TUFBQTthQUFBO01BQWUsNkNBQ2I7VUFBQSxrRUFBQTtVQUFBO1VBQUEsZUFBb0c7TUFFdEYsMkNBQ2hCO1VBQUE7dUZBQUE7YUFBQTsrQkFBQSxtQ0FDd0I7VUFBQSxhQUNIOztJQUxoQjtJQUFILFdBQUcsU0FBSDtJQUlBO0lBREYsWUFDRSxTQURGOzs7SUFIc0c7SUFBQTs7OztvQkFyQjFHO01BQUE7MEJBQUEsVUFBQTtvQ0FBQTthQUFBO01BQThCLCtCQUU1QjtVQUFBLG9DQUFBO3dCQUFBLG1DQWVNO01BRU47YUFBQTtVQUFBLGlDQVFNOztJQXpCRDtJQUFMLFdBQUssU0FBTDtJQWlCSztJQUFMLFdBQUssU0FBTDs7SUFuQk87SUFBVCxXQUFTLFNBQVQ7Ozs7b0JDQUE7TUFBQTtvQ0FBQSxVQUFBO01BQUE7TUFBQTtJQUFBOztJQUFBO0lBQUEsV0FBQSxTQUFBOzs7OzsifQ==
//# sourceMappingURL=huewi-rules.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-scenes/huewi-scenes.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_scenes_component_css_shim_ngstyle_styles = [''];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZXMuY29tcG9uZW50LmNzcy5zaGltLm5nc3R5bGUudHMiLCJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZzovLy9Vc2Vycy9hcm5kL0RldmVsb3Blci9odWV3aTIvc3JjL2FwcC9odWV3aS1zY2VuZXMvaHVld2ktc2NlbmVzLmNvbXBvbmVudC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiICJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7OyJ9
//# sourceMappingURL=huewi-scenes.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-scenes/huewi-scene/huewi-scene.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_scene_component_css_shim_ngstyle_styles = [''];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZS9odWV3aS1zY2VuZS5jb21wb25lbnQuY3NzLnNoaW0ubmdzdHlsZS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZS9odWV3aS1zY2VuZS5jb21wb25lbnQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIiAiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7OzsifQ==
//# sourceMappingURL=huewi-scene.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-scenes/huewi-scene/huewi-scene.component.ts
/* harmony import */ var huewi_scene_component___WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");


var huewi_scene_component_HuewiSceneComponent = (function () {
    function HuewiSceneComponent(huepiService, router) {
        this.huepiService = huepiService;
        this.router = router;
    }
    HuewiSceneComponent.prototype.ngOnInit = function () {
    };
    HuewiSceneComponent.prototype.select = function (scene) {
        this.router.navigate(['/scenes', scene.__key], { replaceUrl: true });
    };
    HuewiSceneComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: huewi_scene_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return HuewiSceneComponent;
}());

//# sourceMappingURL=huewi-scene.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-scenes/huewi-scene/huewi-scene.component.ngfactory.ts
/* harmony import */ var huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__angular_router__ = __webpack_require__("BkNc");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */





var styles_HuewiSceneComponent = [huewi_scene_component_css_shim_ngstyle_styles];
var RenderType_HuewiSceneComponent = huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiSceneComponent, data: {} });
function View_HuewiSceneComponent_0(_l) {
    return huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 7, 'div', [['class',
                'flexcontainer']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.select(_co.scene) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), (_l()(), huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [['style', 'flex: 1 1 128px']], null, null, null, null, null)),
        (_l()(), huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    ', '\n  '])), (_l()(), huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [['style',
                'flex: 0 1 10px']], null, null, null, null, null)), (_l()(), huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n'])), (_l()(), huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.scene.name;
        _ck(_v, 3, 0, currVal_0);
    });
}
function View_HuewiSceneComponent_Host_0(_l) {
    return huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-scene', [], null, null, null, View_HuewiSceneComponent_0, RenderType_HuewiSceneComponent)), huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_scene_component_HuewiSceneComponent, [huepi_service_HuepiService, __WEBPACK_IMPORTED_MODULE_4__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiSceneComponentNgFactory = huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-scene', huewi_scene_component_HuewiSceneComponent, View_HuewiSceneComponent_Host_0, { scene: 'scene' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZS9odWV3aS1zY2VuZS5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktc2NlbmVzL2h1ZXdpLXNjZW5lL2h1ZXdpLXNjZW5lLmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZS9odWV3aS1zY2VuZS5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZS9odWV3aS1zY2VuZS5jb21wb25lbnQudHMuSHVld2lTY2VuZUNvbXBvbmVudF9Ib3N0Lmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiICIsIjxkaXYgY2xhc3M9XCJmbGV4Y29udGFpbmVyXCJcbiAgKGNsaWNrKT1cInNlbGVjdChzY2VuZSlcIj5cbiAgPGRpdiBzdHlsZT1cImZsZXg6IDEgMSAxMjhweFwiPlxuICAgIHt7c2NlbmUubmFtZX19XG4gIDwvZGl2PlxuICA8ZGl2IHN0eWxlPVwiZmxleDogMCAxIDEwcHhcIj5cbiAgPC9kaXY+XG48L2Rpdj5cbiIsIjxodWV3aS1zY2VuZT48L2h1ZXdpLXNjZW5lPiJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O29CQ0FBO01BQUE7SUFBQTtJQUFBO0lBQ0U7TUFBQTtNQUFBO0lBQUE7SUFERjtFQUFBLGdDQUMwQix5Q0FDeEI7YUFBQTtVQUFBO01BQTZCLGtEQUV2QjtVQUFBLFdBQ047VUFBQTtVQUFBLGdCQUE0Qix5Q0FDdEI7VUFBQSxTQUNGOztJQUx5QjtJQUFBOzs7O29CQ0YvQjtNQUFBO29DQUFBLFVBQUE7TUFBQTtJQUFBOzs7OyJ9
//# sourceMappingURL=huewi-scene.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-scenes/huewi-scene-details/huewi-scene-details.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_scene_details_component_css_shim_ngstyle_styles = ['md-icon[_ngcontent-%COMP%]{float:right}'];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZS1kZXRhaWxzL2h1ZXdpLXNjZW5lLWRldGFpbHMuY29tcG9uZW50LmNzcy5zaGltLm5nc3R5bGUudHMiLCJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZzovLy9Vc2Vycy9hcm5kL0RldmVsb3Blci9odWV3aTIvc3JjL2FwcC9odWV3aS1zY2VuZXMvaHVld2ktc2NlbmUtZGV0YWlscy9odWV3aS1zY2VuZS1kZXRhaWxzLmNvbXBvbmVudC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiICJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7OyJ9
//# sourceMappingURL=huewi-scene-details.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-scenes/huewi-scene-details/huewi-scene-details.component.ts


var huewi_scene_details_component_HuewiSceneDetailsComponent = (function () {
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
    HuewiSceneDetailsComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: ParametersService }]; };
    return HuewiSceneDetailsComponent;
}());

//# sourceMappingURL=huewi-scene-details.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-scenes/huewi-scene-details/huewi-scene-details.component.ngfactory.ts
/* harmony import */ var huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__angular_common__ = __webpack_require__("qbdv");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */











var styles_HuewiSceneDetailsComponent = [huewi_scene_details_component_css_shim_ngstyle_styles];
var RenderType_HuewiSceneDetailsComponent = huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiSceneDetailsComponent, data: {} });
function View_HuewiSceneDetailsComponent_1(_l) {
    return huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = ((_co.expand = true) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['expand_more']))], function (_ck, _v) {
        _ck(_v, 2, 0);
    }, null);
}
function View_HuewiSceneDetailsComponent_2(_l) {
    return huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 20, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 17, 'small', [], null, null, null, null, null)), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = ((_co.expand = false) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['expand_less'])),
        (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-divider', [['aria-orientation', 'horizontal'], ['class',
                'mat-divider'], ['role', 'separator']], null, null, null, null, null)), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_33" /* MdListDivider */], [], null, null),
        huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdDividerCssMatStyler */], [], null, null), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      Lights: ', ''])), (_l()(),
            huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      Lastupdated: ', ''])), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      owned by ', ''])),
        (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        _ck(_v, 6, 0);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.scene.lights;
        _ck(_v, 13, 0, currVal_0);
        var currVal_1 = _co.scene.lastupdated;
        _ck(_v, 15, 0, currVal_1);
        var currVal_2 = _co.scene.owner;
        _ck(_v, 17, 0, currVal_2);
    });
}
function View_HuewiSceneDetailsComponent_0(_l) {
    return huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-scene', [], null, null, null, View_HuewiSceneComponent_0, RenderType_HuewiSceneComponent)), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_scene_component_HuewiSceneComponent, [huepi_service_HuepiService, huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */]], { scene: [0, 'scene'] }, null), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n'])), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n\n'])), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 10, 'div', [], null, null, null, null, null)), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [], null, null, null, null, null)), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['scene ', ''])), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSceneDetailsComponent_1)),
        huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_common__["k" /* NgIf */], [huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSceneDetailsComponent_2)),
        huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_common__["k" /* NgIf */], [huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n'])), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.scene;
        _ck(_v, 1, 0, currVal_0);
        var currVal_2 = !_co.expand;
        _ck(_v, 10, 0, currVal_2);
        var currVal_3 = _co.expand;
        _ck(_v, 13, 0, currVal_3);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = _co.scene.__key;
        _ck(_v, 7, 0, currVal_1);
    });
}
function View_HuewiSceneDetailsComponent_Host_0(_l) {
    return huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-scene-details', [], null, null, null, View_HuewiSceneDetailsComponent_0, RenderType_HuewiSceneDetailsComponent)), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_scene_details_component_HuewiSceneDetailsComponent, [huepi_service_HuepiService, ParametersService], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiSceneDetailsComponentNgFactory = huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-scene-details', huewi_scene_details_component_HuewiSceneDetailsComponent, View_HuewiSceneDetailsComponent_Host_0, { scene: 'scene',
    expand: 'expand' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZS1kZXRhaWxzL2h1ZXdpLXNjZW5lLWRldGFpbHMuY29tcG9uZW50Lm5nZmFjdG9yeS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZS1kZXRhaWxzL2h1ZXdpLXNjZW5lLWRldGFpbHMuY29tcG9uZW50LnRzIiwibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktc2NlbmVzL2h1ZXdpLXNjZW5lLWRldGFpbHMvaHVld2ktc2NlbmUtZGV0YWlscy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZS1kZXRhaWxzL2h1ZXdpLXNjZW5lLWRldGFpbHMuY29tcG9uZW50LnRzLkh1ZXdpU2NlbmVEZXRhaWxzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPGh1ZXdpLXNjZW5lIFxuICBbc2NlbmVdPVwic2NlbmVcIj5cbjwvaHVld2ktc2NlbmU+XG5cbjxkaXY+XG4gIDxkaXY+c2NlbmUge3tzY2VuZS5fX2tleX19PC9kaXY+XG4gIDxtZC1pY29uICpuZ0lmPVwiIWV4cGFuZFwiIChjbGljayk9XCJleHBhbmQ9dHJ1ZVwiPmV4cGFuZF9tb3JlPC9tZC1pY29uPlxuICA8ZGl2ICpuZ0lmPVwiZXhwYW5kXCI+XG4gICAgPHNtYWxsPlxuICAgICAgPG1kLWljb24gKGNsaWNrKT1cImV4cGFuZD1mYWxzZVwiPmV4cGFuZF9sZXNzPC9tZC1pY29uPlxuICAgICAgPG1kLWRpdmlkZXI+PC9tZC1kaXZpZGVyPlxuICAgICAgTGlnaHRzOiB7e3NjZW5lLmxpZ2h0c319PGJyPlxuICAgICAgTGFzdHVwZGF0ZWQ6IHt7c2NlbmUubGFzdHVwZGF0ZWR9fTxicj5cbiAgICAgIG93bmVkIGJ5IHt7c2NlbmUub3duZXJ9fTxicj5cbiAgICA8L3NtYWxsPlxuICA8L2Rpdj5cbjwvZGl2PlxuIiwiPGh1ZXdpLXNjZW5lLWRldGFpbHM+PC9odWV3aS1zY2VuZS1kZXRhaWxzPiJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O29CQ01FO01BQUE7SUFBQTtJQUFBO0lBQXlCO01BQUE7TUFBQTtJQUFBO0lBQXpCO0VBQUEsaURBQUE7TUFBQTthQUFBO1VBQUEsZ0RBQStDOztRQUEvQzs7OztvQkFDQTtNQUFBLHdFQUFvQjthQUFBLDRCQUNsQjtNQUFBO01BQUEsZ0JBQU8sNkNBQ0w7TUFBQTtNQUFBO1FBQUE7UUFBQTtRQUFTO1VBQUE7VUFBQTtRQUFBO1FBQVQ7TUFBQSxpREFBQTtNQUFBO2FBQUE7VUFBQSxnREFBZ0M7TUFBcUIsNkNBQ3JEO1VBQUE7Y0FBQTtVQUFBLHFDQUFBO1VBQUE7YUFBQTthQUFBO1VBQUEsZUFBeUIsd0RBQ0Q7aUJBQUE7Y0FBQSwwREFBSTtVQUFBLCtCQUNNO1VBQUE7VUFBQSxnQkFBSTtNQUNkO1VBQUEsMERBQUk7VUFBQSxhQUN0QjtJQUxOOzs7SUFDeUI7SUFBQTtJQUNHO0lBQUE7SUFDVTtJQUFBOzs7O29CQVo1QztNQUFBO3VDQUFBLFVBQUE7TUFBQSwrREFDa0I7TUFBQSxTQUNKLHlDQUVkO01BQUE7TUFBQSw4QkFBSyx5Q0FDSDthQUFBO1VBQUEsNENBQUs7TUFBQSxnQkFBMkIseUNBQ2hDO01BQUE7YUFBQTtVQUFBLHdCQUFvRSx5Q0FDcEU7aUJBQUE7YUFBQTtVQUFBLHdCQVFNLHVDQUNGO1VBQUE7O0lBZko7SUFERixXQUNFLFNBREY7SUFNVztJQUFULFlBQVMsU0FBVDtJQUNLO0lBQUwsWUFBSyxTQUFMOzs7SUFGSztJQUFBOzs7O29CQ0xQO01BQUE7MkNBQUEsVUFBQTtNQUFBO0lBQUE7Ozs7OyJ9
//# sourceMappingURL=huewi-scene-details.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-scenes/huewi-scenes.mock.ts
var HUEWI_SCENES_MOCK = [];
//# sourceMappingURL=huewi-scenes.mock.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-scenes/huewi-scenes.component.ts
/* harmony import */ var huewi_scenes_component___WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_scenes_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable__ = __webpack_require__("bKpL");
/* harmony import */ var huewi_scenes_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable___default = __webpack_require__.n(huewi_scenes_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable__);
/* harmony import */ var huewi_scenes_component___WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of__ = __webpack_require__("/zHi");
/* harmony import */ var huewi_scenes_component___WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of___default = __webpack_require__.n(huewi_scenes_component___WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of__);







var huewi_scenes_component_HuewiScenesComponent = (function () {
    function HuewiScenesComponent(huepiService, parametersService, activatedRoute, router) {
        this.huepiService = huepiService;
        this.parametersService = parametersService;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.scenes = HUEWI_SCENES_MOCK;
        this.back = true;
        this.sceneObserver = huewi_scenes_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable__["Observable"].of(this.scenes);
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
    HuewiScenesComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: ParametersService }, { type: huewi_scenes_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["a" /* ActivatedRoute */] }, { type: huewi_scenes_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return HuewiScenesComponent;
}());

//# sourceMappingURL=huewi-scenes.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-scenes/huewi-scenes.component.ngfactory.ts
/* harmony import */ var huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__ = __webpack_require__("bm2B");
/* harmony import */ var huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_cdk_platform__ = __webpack_require__("JYHx");
/* harmony import */ var huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__ = __webpack_require__("qbdv");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */

















var styles_HuewiScenesComponent = [huewi_scenes_component_css_shim_ngstyle_styles];
var RenderType_HuewiScenesComponent = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiScenesComponent, data: { 'animation': [{ type: 7, name: 'RoutingAnimations',
                definitions: [{ type: 0, name: 'void', styles: { type: 6, styles: { top: -32, left: 0, opacity: 0 },
                            offset: null }, options: undefined }, { type: 0, name: '*', styles: { type: 6,
                            styles: { top: 0, left: 0, opacity: 1 }, offset: null }, options: undefined },
                    { type: 1, expr: ':enter', animation: [{ type: 4, styles: { type: 6, styles: { top: 0,
                                        left: 0, opacity: 1 }, offset: null }, timings: '0.2s ease-in-out' }],
                        options: null }, { type: 1, expr: ':leave', animation: [{ type: 4, styles: { type: 6,
                                    styles: { top: -32, left: 0, opacity: 0 }, offset: null }, timings: '0s ease-in-out' }],
                        options: null }], options: {} }] } });
function View_HuewiScenesComponent_2(_l) {
    return huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-scene', [['md-list-item', '']], null, null, null, View_HuewiSceneComponent_0, RenderType_HuewiSceneComponent)), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_scene_component_HuewiSceneComponent, [huepi_service_HuepiService, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], { scene: [0, 'scene'] }, null), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      ']))], function (_ck, _v) {
        var currVal_0 = _v.context.$implicit;
        _ck(_v, 1, 0, currVal_0);
    }, null);
}
function View_HuewiScenesComponent_1(_l) {
    return huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 42, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 27, 'md-card-title', [['class', 'mat-card-title']], null, null, null, null, null)), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["U" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      Scenes\n      '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 22, 'small', [], null, null, null, null, null)), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n        '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 19, 'md-input-container', [['class', 'mat-input-container mat-form-field']], [[2, 'mat-input-invalid',
                null], [2, 'mat-form-field-invalid', null], [2, 'mat-focused',
                null], [2, 'ng-untouched', null], [2, 'ng-touched', null],
            [2, 'ng-pristine', null], [2, 'ng-dirty', null], [2, 'ng-valid',
                null], [2, 'ng-invalid', null], [2, 'ng-pending', null]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._control.focus() !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["w" /* View_MdFormField_0 */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdFormField */])), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](7389184, null, 6, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_16" /* MdFormField */], [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */], [2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["u" /* MD_PLACEHOLDER_GLOBAL_OPTIONS */]]], null, null), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 1, { _control: 0 }), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 2, { _placeholderChild: 0 }), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 3, { _errorChildren: 1 }), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 4, { _hintChildren: 1 }), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 5, { _prefixChildren: 1 }), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 6, { _suffixChildren: 1 }), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](1, ['\n          '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 1, 8, 'input', [['class', 'mat-input-element'], ['mdInput', ''],
            ['placeholder', 'Filter']], [[8, 'id', 0], [8, 'placeholder', 0], [8, 'disabled',
                0], [8, 'required', 0], [1, 'aria-describedby', 0], [1, 'aria-invalid', 0], [2,
                'ng-untouched', null], [2, 'ng-touched', null], [2, 'ng-pristine',
                null], [2, 'ng-dirty', null], [2, 'ng-valid', null],
            [2, 'ng-invalid', null], [2, 'ng-pending', null]], [[null,
                'ngModelChange'], [null, 'input'], [null, 'blur'], [null,
                'compositionstart'], [null, 'compositionend'], [null,
                'focus']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('input' === en)) {
                var pd_0 = (huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 20)._handleInput($event.target.value) !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 20).onTouched() !== false);
                ad = (pd_1 && ad);
            }
            if (('compositionstart' === en)) {
                var pd_2 = (huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 20)._compositionStart() !== false);
                ad = (pd_2 && ad);
            }
            if (('compositionend' === en)) {
                var pd_3 = (huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 20)._compositionEnd($event.target.value) !== false);
                ad = (pd_3 && ad);
            }
            if (('blur' === en)) {
                var pd_4 = (huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24)._focusChanged(false) !== false);
                ad = (pd_4 && ad);
            }
            if (('focus' === en)) {
                var pd_5 = (huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24)._focusChanged(true) !== false);
                ad = (pd_5 && ad);
            }
            if (('input' === en)) {
                var pd_6 = (huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24)._onInput() !== false);
                ad = (pd_6 && ad);
            }
            if (('ngModelChange' === en)) {
                var pd_7 = ((_co.searchText = $event) !== false);
                ad = (pd_7 && ad);
            }
            return ad;
        }, null, null)), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["c" /* DefaultValueAccessor */], [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */],
            [2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["a" /* COMPOSITION_BUFFER_MODE */]]], null, null), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](1024, null, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["g" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["c" /* DefaultValueAccessor */]]), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["k" /* NgModel */], [[8,
                null], [8, null], [8, null], [2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["g" /* NG_VALUE_ACCESSOR */]]], { model: [0, 'model'] }, { update: 'ngModelChange' }), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](2048, null, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["h" /* NgControl */], null, [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["k" /* NgModel */]]), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](933888, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_28" /* MdInput */], [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_cdk_platform__["a" /* Platform */], [2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["h" /* NgControl */]], [2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["j" /* NgForm */]],
            [2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["d" /* FormGroupDirective */]], [2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["r" /* MD_ERROR_GLOBAL_OPTIONS */]]], { placeholder: [0,
                'placeholder'] }, null), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["i" /* NgControlStatus */], [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["h" /* NgControl */]], null, null), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](2048, [[1, 4]], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_17" /* MdFormFieldControl */], null, [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_28" /* MdInput */]]), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](1, ['\n        '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 10, 'md-list', [['class', 'mat-list'], ['role', 'list']], null, null, null, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["z" /* View_MdList_0 */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["i" /* RenderType_MdList */])), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdList */], [], null, null),
        huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_32" /* MdListCssMatStyler */], [], null, null), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 4, null, View_HuewiScenesComponent_2)), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["j" /* NgForOf */], [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, OrderByPipe, []), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, FilterPipe, []), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n    '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_23 = _co.searchText;
        _ck(_v, 22, 0, currVal_23);
        var currVal_24 = 'Filter';
        _ck(_v, 24, 0, currVal_24);
        var currVal_25 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵunv */](_v, 37, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 40).transform(huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵunv */](_v, 37, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 39).transform(_co.scenes, _ck(_v, 38, 0, '+name'))), _co.searchText, 'name'));
        _ck(_v, 37, 0, currVal_25);
    }, function (_ck, _v) {
        var currVal_0 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._control.errorState;
        var currVal_1 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._control.errorState;
        var currVal_2 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._control.focused;
        var currVal_3 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('untouched');
        var currVal_4 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('touched');
        var currVal_5 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('pristine');
        var currVal_6 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('dirty');
        var currVal_7 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('valid');
        var currVal_8 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('invalid');
        var currVal_9 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('pending');
        _ck(_v, 8, 0, currVal_0, currVal_1, currVal_2, currVal_3, currVal_4, currVal_5, currVal_6, currVal_7, currVal_8, currVal_9);
        var currVal_10 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).id;
        var currVal_11 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).placeholder;
        var currVal_12 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).disabled;
        var currVal_13 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).required;
        var currVal_14 = (huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24)._ariaDescribedby || null);
        var currVal_15 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).errorState;
        var currVal_16 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassUntouched;
        var currVal_17 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassTouched;
        var currVal_18 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassPristine;
        var currVal_19 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassDirty;
        var currVal_20 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassValid;
        var currVal_21 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassInvalid;
        var currVal_22 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassPending;
        _ck(_v, 18, 1, [currVal_10, currVal_11, currVal_12, currVal_13, currVal_14, currVal_15,
            currVal_16, currVal_17, currVal_18, currVal_19, currVal_20, currVal_21, currVal_22]);
    });
}
function View_HuewiScenesComponent_4(_l) {
    return huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'a', [], [[1, 'target', 0], [8, 'href', 4]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])),
        huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_23" /* MdIcon */], [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_26" /* MdIconRegistry */], [8, null]], null, null), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['navigate_before']))], function (_ck, _v) {
        var currVal_2 = true;
        var currVal_3 = _ck(_v, 2, 0, '/scenes');
        _ck(_v, 1, 0, currVal_2, currVal_3);
        _ck(_v, 5, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).target;
        var currVal_1 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).href;
        _ck(_v, 0, 0, currVal_0, currVal_1);
    });
}
function View_HuewiScenesComponent_3(_l) {
    return huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 13, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'md-card-title', [['class', 'mat-card-title']], null, null, null, null, null)), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["U" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiScenesComponent_4)), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["k" /* NgIf */], [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      ', ' - Details\n    '])),
        (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-scene-details', [], null, null, null, View_HuewiSceneDetailsComponent_0, RenderType_HuewiSceneDetailsComponent)),
        huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_scene_details_component_HuewiSceneDetailsComponent, [huepi_service_HuepiService,
            ParametersService], { scene: [0, 'scene'] }, null), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.back;
        _ck(_v, 7, 0, currVal_0);
        var currVal_2 = _co.selectedScene;
        _ck(_v, 11, 0, currVal_2);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = _co.selectedScene.name;
        _ck(_v, 8, 0, currVal_1);
    });
}
function View_HuewiScenesComponent_0(_l) {
    return huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 9, 'md-card', [['class',
                'mat-card']], null, null, null, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["u" /* View_MdCard_0 */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])),
        huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["Q" /* MdCard */], [], null, null), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiScenesComponent_1)),
        huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["k" /* NgIf */], [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n  '])), (_l()(),
            huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiScenesComponent_3)),
        huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["k" /* NgIf */], [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n'])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = !_co.selectedScene;
        _ck(_v, 5, 0, currVal_0);
        var currVal_1 = _co.selectedScene;
        _ck(_v, 8, 0, currVal_1);
    }, null);
}
function View_HuewiScenesComponent_Host_0(_l) {
    return huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-scenes', [], [[40, '@RoutingAnimations', 0]], null, null, View_HuewiScenesComponent_0, RenderType_HuewiScenesComponent)), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_scenes_component_HuewiScenesComponent, [huepi_service_HuepiService, ParametersService, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).RoutingAnimations;
        _ck(_v, 0, 0, currVal_0);
    });
}
var HuewiScenesComponentNgFactory = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-scenes', huewi_scenes_component_HuewiScenesComponent, View_HuewiScenesComponent_Host_0, { scenes: 'scenes', back: 'back' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZXMuY29tcG9uZW50Lm5nZmFjdG9yeS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZXMuY29tcG9uZW50LnRzIiwibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktc2NlbmVzL2h1ZXdpLXNjZW5lcy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZXMuY29tcG9uZW50LnRzLkh1ZXdpU2NlbmVzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPG1kLWNhcmQ+XG5cbiAgPGRpdiAqbmdJZj1cIiFzZWxlY3RlZFNjZW5lXCI+XG4gICAgPG1kLWNhcmQtdGl0bGU+XG4gICAgICBTY2VuZXNcbiAgICAgIDxzbWFsbD5cbiAgICAgICAgPG1kLWlucHV0LWNvbnRhaW5lcj5cbiAgICAgICAgICA8aW5wdXQgbWRJbnB1dCBwbGFjZWhvbGRlcj1cIkZpbHRlclwiIFsobmdNb2RlbCldPVwic2VhcmNoVGV4dFwiPlxuICAgICAgICA8L21kLWlucHV0LWNvbnRhaW5lcj5cbiAgICAgIDwvc21hbGw+XG4gICAgPC9tZC1jYXJkLXRpdGxlPlxuICAgIDxtZC1saXN0PlxuICAgICAgPGh1ZXdpLXNjZW5lIG1kLWxpc3QtaXRlbVxuICAgICAgICAqbmdGb3I9XCJsZXQgc2NlbmUgb2Ygc2NlbmVzIHwgb3JkZXJCeTpbJytuYW1lJ10gfCBmaWx0ZXI6c2VhcmNoVGV4dDonbmFtZSdcIlxuICAgICAgICBbc2NlbmVdPVwic2NlbmVcIj5cbiAgICAgIDwvaHVld2ktc2NlbmU+XG4gICAgPC9tZC1saXN0PlxuICA8L2Rpdj5cblxuICA8ZGl2ICpuZ0lmPVwic2VsZWN0ZWRTY2VuZVwiPlxuICAgIDxtZC1jYXJkLXRpdGxlPlxuICAgICAgPGEgKm5nSWY9XCJiYWNrXCIgW3JvdXRlckxpbmtdPVwiWycvc2NlbmVzJ11cIiBbcmVwbGFjZVVybF09XCJ0cnVlXCI+PG1kLWljb24+bmF2aWdhdGVfYmVmb3JlPC9tZC1pY29uPjwvYT5cbiAgICAgIHt7c2VsZWN0ZWRTY2VuZS5uYW1lfX0gLSBEZXRhaWxzXG4gICAgPC9tZC1jYXJkLXRpdGxlPlxuICAgIDxodWV3aS1zY2VuZS1kZXRhaWxzXG4gICAgICBbc2NlbmVdPVwic2VsZWN0ZWRTY2VuZVwiPlxuICAgIDwvaHVld2ktc2NlbmUtZGV0YWlscz5cbiAgPC9kaXY+XG5cbjwvbWQtY2FyZD5cbiIsIjxodWV3aS1zY2VuZXM+PC9odWV3aS1zY2VuZXM+Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkNZTTtNQUFBO3VDQUFBLFVBQUE7TUFBQSwrREFFa0I7TUFBQTtJQUFoQjtJQUZGLFdBRUUsU0FGRjs7OztvQkFWSjtNQUFBLHdFQUE0QjthQUFBLDRCQUMxQjtNQUFBO01BQUEsbURBQUE7TUFBQTthQUFBO01BQWUsMkRBRWI7VUFBQTtVQUFBLDRDQUFPO1VBQUEsaUJBQ0w7VUFBQTtjQUFBO2NBQUE7Y0FBQTtrQkFBQTtVQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO1VBQUEsMkRBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQTtVQUFBO1VBQUE7VUFBQSx1QkFBb0IscUNBQ2xCO1VBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQW9DO2NBQUE7Y0FBQTtZQUFBO1lBQXBDO1VBQUEsdUNBQUE7VUFBQTthQUFBO1VBQUEsb0VBQUE7VUFBQTtZQUFBO1VBQUEsb0NBQUE7VUFBQTtVQUFBLHFEQUFBO3VCQUFBLG1DQUFBO3FCQUFBO2NBQUE7Y0FBQSxzQ0FBQTtVQUFBLG1EQUFBO1VBQUEsNEJBQTZELG1DQUMxQztVQUFBLGVBQ2YsMkNBQ007VUFBQSxhQUNoQjtVQUFBOytDQUFBLFVBQUE7VUFBQTthQUFBO2FBQUE7VUFBQSxlQUFTLGlDQUNQO1VBQUEscUVBQUE7VUFBQTtVQUFBLDhDQUNFO1VBQUEsdURBRVk7VUFBQSxhQUNOOztJQVRnQztJQUFwQyxZQUFvQyxVQUFwQztJQUFlO0lBQWYsWUFBZSxVQUFmO0lBTUY7UUFBQTtRQUFBO0lBREYsWUFDRSxVQURGOztJQU5FO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUEsV0FBQTtRQUFBLDZCQUFBO0lBQ0U7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQSxhQUFBO1FBQUEsNEVBQUE7Ozs7b0JBY0o7TUFBQTtRQUFBO1FBQUE7VUFBQTtjQUFBO1VBQUE7UUFBQTtRQUFBO01BQUEsdUNBQUE7TUFBQTtVQUFBLG1EQUFnQixJQUErQztNQUFBO01BQUE7YUFBQTt1QkFBQSxzQ0FBQTtVQUFBO1VBQUEsNkJBQVM7O0lBQTdCO0lBQTNCO0lBQWhCLFdBQTJDLFVBQTNCLFNBQWhCO0lBQStEOztJQUEvRDtJQUFBO0lBQUEsV0FBQSxtQkFBQTs7OztvQkFGSjtNQUFBLHdFQUEyQjthQUFBLDRCQUN6QjtNQUFBO01BQUEscUNBQUE7TUFBQTthQUFBO01BQWUsNkNBQ2I7VUFBQSxtRUFBQTtVQUFBO1VBQUEsZUFBcUc7TUFFdkYsMkNBQ2hCO1VBQUE7eUZBQUE7YUFBQTsrQkFBQSxxQ0FDMEI7VUFBQSxhQUNKOztJQUxqQjtJQUFILFdBQUcsU0FBSDtJQUlBO0lBREYsWUFDRSxTQURGOzs7SUFIdUc7SUFBQTs7OztvQkFyQjNHO01BQUE7YUFBQTt1QkFBQSxzQ0FBQTtVQUFBLHVEQUFTO1VBQUEsYUFFUDthQUFBO1VBQUEsaUNBZU0sK0JBRU47aUJBQUE7YUFBQTtVQUFBLGlDQVFNLDZCQUVFO1VBQUE7O0lBM0JIO0lBQUwsV0FBSyxTQUFMO0lBaUJLO0lBQUwsV0FBSyxTQUFMOzs7O29CQ25CRjtNQUFBO3FDQUFBLFVBQUE7TUFBQTtNQUFBO0lBQUE7O0lBQUE7SUFBQSxXQUFBLFNBQUE7Ozs7OyJ9
//# sourceMappingURL=huewi-scenes.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-schedules/huewi-schedules.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_schedules_component_css_shim_ngstyle_styles = [''];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZXMuY29tcG9uZW50LmNzcy5zaGltLm5nc3R5bGUudHMiLCJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZzovLy9Vc2Vycy9hcm5kL0RldmVsb3Blci9odWV3aTIvc3JjL2FwcC9odWV3aS1zY2hlZHVsZXMvaHVld2ktc2NoZWR1bGVzLmNvbXBvbmVudC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiICJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7OyJ9
//# sourceMappingURL=huewi-schedules.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-schedules/huewi-schedule/huewi-schedule.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_schedule_component_css_shim_ngstyle_styles = [''];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZS9odWV3aS1zY2hlZHVsZS5jb21wb25lbnQuY3NzLnNoaW0ubmdzdHlsZS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZS9odWV3aS1zY2hlZHVsZS5jb21wb25lbnQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIiAiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7OzsifQ==
//# sourceMappingURL=huewi-schedule.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-schedules/huewi-schedule/huewi-schedule.component.ts
/* harmony import */ var huewi_schedule_component___WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");


var huewi_schedule_component_HuewiScheduleComponent = (function () {
    function HuewiScheduleComponent(huepiService, router) {
        this.huepiService = huepiService;
        this.router = router;
    }
    HuewiScheduleComponent.prototype.ngOnInit = function () {
    };
    HuewiScheduleComponent.prototype.select = function (schedule) {
        this.router.navigate(['/schedules', schedule.__key], { replaceUrl: true });
    };
    HuewiScheduleComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: huewi_schedule_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return HuewiScheduleComponent;
}());

//# sourceMappingURL=huewi-schedule.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-schedules/huewi-schedule/huewi-schedule.component.ngfactory.ts
/* harmony import */ var huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__ = __webpack_require__("BkNc");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */








var styles_HuewiScheduleComponent = [huewi_schedule_component_css_shim_ngstyle_styles];
var RenderType_HuewiScheduleComponent = huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiScheduleComponent, data: {} });
function View_HuewiScheduleComponent_1(_l) {
    return huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, null, null, huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2,
                huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['radio_button_checked']))], function (_ck, _v) {
        _ck(_v, 2, 0);
    }, null);
}
function View_HuewiScheduleComponent_2(_l) {
    return huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, null, null, huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2,
                huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['radio_button_unchecked']))], function (_ck, _v) {
        _ck(_v, 2, 0);
    }, null);
}
function View_HuewiScheduleComponent_0(_l) {
    return huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 13, 'div', [['class',
                'flexcontainer']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.select(_co.schedule) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), (_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [['style', 'flex: 1 1 128px']], null, null, null, null, null)),
        (_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    ', '\n  '])), (_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 7, 'div', [['style',
                'flex: 0 1 10px']], null, null, null, null, null)), (_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiScheduleComponent_1)),
        huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiScheduleComponent_2)),
        huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['      \n  '])), (_l()(),
            huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n'])), (_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = (_co.schedule.status === 'enabled');
        _ck(_v, 8, 0, currVal_1);
        var currVal_2 = (_co.schedule.status === 'disabled');
        _ck(_v, 11, 0, currVal_2);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.schedule.name;
        _ck(_v, 3, 0, currVal_0);
    });
}
function View_HuewiScheduleComponent_Host_0(_l) {
    return huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-schedule', [], null, null, null, View_HuewiScheduleComponent_0, RenderType_HuewiScheduleComponent)), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_schedule_component_HuewiScheduleComponent, [huepi_service_HuepiService, huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiScheduleComponentNgFactory = huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-schedule', huewi_schedule_component_HuewiScheduleComponent, View_HuewiScheduleComponent_Host_0, { schedule: 'schedule' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZS9odWV3aS1zY2hlZHVsZS5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktc2NoZWR1bGVzL2h1ZXdpLXNjaGVkdWxlL2h1ZXdpLXNjaGVkdWxlLmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZS9odWV3aS1zY2hlZHVsZS5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZS9odWV3aS1zY2hlZHVsZS5jb21wb25lbnQudHMuSHVld2lTY2hlZHVsZUNvbXBvbmVudF9Ib3N0Lmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiICIsIjxkaXYgY2xhc3M9XCJmbGV4Y29udGFpbmVyXCJcbiAgKGNsaWNrKT1cInNlbGVjdChzY2hlZHVsZSlcIj5cbiAgPGRpdiBzdHlsZT1cImZsZXg6IDEgMSAxMjhweFwiPlxuICAgIHt7c2NoZWR1bGUubmFtZX19XG4gIDwvZGl2PlxuICA8ZGl2IHN0eWxlPVwiZmxleDogMCAxIDEwcHhcIj5cbiAgICA8bWQtaWNvbiAqbmdJZj1cInNjaGVkdWxlLnN0YXR1cyA9PT0gJ2VuYWJsZWQnXCI+cmFkaW9fYnV0dG9uX2NoZWNrZWQ8L21kLWljb24+XG4gICAgPG1kLWljb24gKm5nSWY9XCJzY2hlZHVsZS5zdGF0dXMgPT09ICdkaXNhYmxlZCdcIj5yYWRpb19idXR0b25fdW5jaGVja2VkPC9tZC1pY29uPiAgICAgIFxuICA8L2Rpdj5cbjwvZGl2PlxuIiwiPGh1ZXdpLXNjaGVkdWxlPjwvaHVld2ktc2NoZWR1bGU+Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JDTUk7TUFBQTswQkFBQSxVQUFBO29DQUFBO2FBQUE7VUFBQSxnREFBK0M7O1FBQS9DOzs7O29CQUNBO01BQUE7MEJBQUEsVUFBQTtvQ0FBQTthQUFBO1VBQUEsZ0RBQWdEOztRQUFoRDs7OztvQkFQSjtNQUFBO0lBQUE7SUFBQTtJQUNFO01BQUE7TUFBQTtJQUFBO0lBREY7RUFBQSxnQ0FDNkIseUNBQzNCO2FBQUE7VUFBQTtNQUE2QixrREFFdkI7VUFBQSxXQUNOO1VBQUE7VUFBQSxnQkFBNEIsMkNBQzFCO1VBQUE7YUFBQTtVQUFBLHdCQUE2RSwyQ0FDN0U7aUJBQUE7YUFBQTtVQUFBLHdCQUFnRiwrQ0FDNUU7aUJBQUEsd0JBQ0Y7OztJQUhPO0lBQVQsV0FBUyxTQUFUO0lBQ1M7SUFBVCxZQUFTLFNBQVQ7OztJQUwyQjtJQUFBOzs7O29CQ0YvQjtNQUFBO3VDQUFBLFVBQUE7TUFBQTtJQUFBOzs7OzsifQ==
//# sourceMappingURL=huewi-schedule.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-schedules/huewi-schedule-details/huewi-schedule-details.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_schedule_details_component_css_shim_ngstyle_styles = ['md-icon[_ngcontent-%COMP%]{float:right}'];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZS1kZXRhaWxzL2h1ZXdpLXNjaGVkdWxlLWRldGFpbHMuY29tcG9uZW50LmNzcy5zaGltLm5nc3R5bGUudHMiLCJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZzovLy9Vc2Vycy9hcm5kL0RldmVsb3Blci9odWV3aTIvc3JjL2FwcC9odWV3aS1zY2hlZHVsZXMvaHVld2ktc2NoZWR1bGUtZGV0YWlscy9odWV3aS1zY2hlZHVsZS1kZXRhaWxzLmNvbXBvbmVudC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiICJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7OyJ9
//# sourceMappingURL=huewi-schedule-details.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-schedules/huewi-schedule-details/huewi-schedule-details.component.ts


var huewi_schedule_details_component_HuewiScheduleDetailsComponent = (function () {
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
    HuewiScheduleDetailsComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: ParametersService }]; };
    return HuewiScheduleDetailsComponent;
}());

//# sourceMappingURL=huewi-schedule-details.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-schedules/huewi-schedule-details/huewi-schedule-details.component.ngfactory.ts
/* harmony import */ var huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_router__ = __webpack_require__("BkNc");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */











var styles_HuewiScheduleDetailsComponent = [huewi_schedule_details_component_css_shim_ngstyle_styles];
var RenderType_HuewiScheduleDetailsComponent = huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiScheduleDetailsComponent, data: {} });
function View_HuewiScheduleDetailsComponent_1(_l) {
    return huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = ((_co.expand = true) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['expand_more']))], function (_ck, _v) {
        _ck(_v, 2, 0);
    }, null);
}
function View_HuewiScheduleDetailsComponent_2(_l) {
    return huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 17, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 14, 'small', [], null, null, null, null, null)), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = ((_co.expand = false) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['expand_less'])),
        (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-divider', [['aria-orientation', 'horizontal'], ['class',
                'mat-divider'], ['role', 'separator']], null, null, null, null, null)), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_33" /* MdListDivider */], [], null, null),
        huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdDividerCssMatStyler */], [], null, null), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      Localtime: ', ' Time: ',
            ' (Created: ', ')'])), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)),
        (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      ', ' ', ' ', '\n    '])), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_common__["e" /* JsonPipe */], []), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        _ck(_v, 6, 0);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.schedule.localtime;
        var currVal_1 = _co.schedule.time;
        var currVal_2 = _co.schedule.created;
        _ck(_v, 13, 0, currVal_0, currVal_1, currVal_2);
        var currVal_3 = _co.schedule.command.method;
        var currVal_4 = _co.schedule.command.address;
        var currVal_5 = huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵunv */](_v, 15, 2, huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 16).transform(_co.schedule.command.body));
        _ck(_v, 15, 0, currVal_3, currVal_4, currVal_5);
    });
}
function View_HuewiScheduleDetailsComponent_0(_l) {
    return huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-schedule', [], null, null, null, View_HuewiScheduleComponent_0, RenderType_HuewiScheduleComponent)), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_schedule_component_HuewiScheduleComponent, [huepi_service_HuepiService, huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_router__["k" /* Router */]], { schedule: [0, 'schedule'] }, null), (_l()(),
            huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n'])), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n\n'])), (_l()(),
            huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 10, 'div', [], null, null, null, null, null)), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['schedule ', ''])), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])),
        (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiScheduleDetailsComponent_1)),
        huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_common__["k" /* NgIf */], [huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiScheduleDetailsComponent_2)),
        huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_common__["k" /* NgIf */], [huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n'])), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.schedule;
        _ck(_v, 1, 0, currVal_0);
        var currVal_2 = !_co.expand;
        _ck(_v, 10, 0, currVal_2);
        var currVal_3 = _co.expand;
        _ck(_v, 13, 0, currVal_3);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = _co.schedule.__key;
        _ck(_v, 7, 0, currVal_1);
    });
}
function View_HuewiScheduleDetailsComponent_Host_0(_l) {
    return huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-schedule-details', [], null, null, null, View_HuewiScheduleDetailsComponent_0, RenderType_HuewiScheduleDetailsComponent)), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_schedule_details_component_HuewiScheduleDetailsComponent, [huepi_service_HuepiService, ParametersService], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiScheduleDetailsComponentNgFactory = huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-schedule-details', huewi_schedule_details_component_HuewiScheduleDetailsComponent, View_HuewiScheduleDetailsComponent_Host_0, { schedule: 'schedule',
    expand: 'expand' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZS1kZXRhaWxzL2h1ZXdpLXNjaGVkdWxlLWRldGFpbHMuY29tcG9uZW50Lm5nZmFjdG9yeS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZS1kZXRhaWxzL2h1ZXdpLXNjaGVkdWxlLWRldGFpbHMuY29tcG9uZW50LnRzIiwibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktc2NoZWR1bGVzL2h1ZXdpLXNjaGVkdWxlLWRldGFpbHMvaHVld2ktc2NoZWR1bGUtZGV0YWlscy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZS1kZXRhaWxzL2h1ZXdpLXNjaGVkdWxlLWRldGFpbHMuY29tcG9uZW50LnRzLkh1ZXdpU2NoZWR1bGVEZXRhaWxzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPGh1ZXdpLXNjaGVkdWxlIFxuICBbc2NoZWR1bGVdPVwic2NoZWR1bGVcIj5cbjwvaHVld2ktc2NoZWR1bGU+XG5cbjxkaXY+XG4gIDxkaXY+c2NoZWR1bGUge3tzY2hlZHVsZS5fX2tleX19PC9kaXY+XG4gIDxtZC1pY29uICpuZ0lmPVwiIWV4cGFuZFwiIChjbGljayk9XCJleHBhbmQ9dHJ1ZVwiPmV4cGFuZF9tb3JlPC9tZC1pY29uPlxuICA8ZGl2ICpuZ0lmPVwiZXhwYW5kXCI+XG4gICAgPHNtYWxsPlxuICAgICAgPG1kLWljb24gKGNsaWNrKT1cImV4cGFuZD1mYWxzZVwiPmV4cGFuZF9sZXNzPC9tZC1pY29uPlxuICAgICAgPG1kLWRpdmlkZXI+PC9tZC1kaXZpZGVyPlxuICAgICAgTG9jYWx0aW1lOiB7e3NjaGVkdWxlLmxvY2FsdGltZX19IFRpbWU6IHt7c2NoZWR1bGUudGltZX19IChDcmVhdGVkOiB7e3NjaGVkdWxlLmNyZWF0ZWR9fSk8YnI+XG4gICAgICB7e3NjaGVkdWxlLmNvbW1hbmQubWV0aG9kfX0ge3tzY2hlZHVsZS5jb21tYW5kLmFkZHJlc3N9fSB7e3NjaGVkdWxlLmNvbW1hbmQuYm9keSB8IGpzb259fVxuICAgIDwvc21hbGw+XG4gIDwvZGl2PlxuPC9kaXY+XG4iLCI8aHVld2ktc2NoZWR1bGUtZGV0YWlscz48L2h1ZXdpLXNjaGVkdWxlLWRldGFpbHM+Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JDTUU7TUFBQTtJQUFBO0lBQUE7SUFBeUI7TUFBQTtNQUFBO0lBQUE7SUFBekI7RUFBQSxpREFBQTtNQUFBO2FBQUE7VUFBQSxnREFBK0M7O1FBQS9DOzs7O29CQUNBO01BQUEsd0VBQW9CO2FBQUEsNEJBQ2xCO01BQUE7TUFBQSxnQkFBTyw2Q0FDTDtNQUFBO01BQUE7UUFBQTtRQUFBO1FBQVM7VUFBQTtVQUFBO1FBQUE7UUFBVDtNQUFBLGlEQUFBO01BQUE7YUFBQTtVQUFBLGdEQUFnQztNQUFxQiw2Q0FDckQ7VUFBQTtjQUFBO1VBQUEscUNBQUE7VUFBQTthQUFBO2FBQUE7VUFBQSxlQUF5QjtVQUFBLHFCQUNnRTtVQUFBO01BQUk7VUFBQSxlQUV2RjtJQUpOOzs7SUFDeUI7SUFBQTtJQUFBO0lBQUE7SUFDb0U7SUFBQTtJQUFBO0lBQUE7Ozs7b0JBWG5HO01BQUE7MENBQUEsVUFBQTtNQUFBLHFFQUN3QjthQUFBLHdCQUNQLHlDQUVqQjthQUFBO1VBQUEsNENBQUs7TUFBQSxXQUNIO01BQUEsd0VBQUs7YUFBQSxrQ0FBaUM7TUFDdEM7YUFBQTtVQUFBLHdCQUFvRSx5Q0FDcEU7aUJBQUE7YUFBQTtVQUFBLHdCQU9NLHVDQUNGO1VBQUE7O0lBZEo7SUFERixXQUNFLFNBREY7SUFNVztJQUFULFlBQVMsU0FBVDtJQUNLO0lBQUwsWUFBSyxTQUFMOzs7SUFGSztJQUFBOzs7O29CQ0xQO01BQUE7OENBQUEsVUFBQTtNQUFBO0lBQUE7Ozs7OyJ9
//# sourceMappingURL=huewi-schedule-details.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-schedules/huewi-schedules.mock.ts
var HUEWI_SCHEDULES_MOCK = [];
//# sourceMappingURL=huewi-schedules.mock.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-schedules/huewi-schedules.component.ts
/* harmony import */ var huewi_schedules_component___WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_schedules_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable__ = __webpack_require__("bKpL");
/* harmony import */ var huewi_schedules_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable___default = __webpack_require__.n(huewi_schedules_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable__);
/* harmony import */ var huewi_schedules_component___WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of__ = __webpack_require__("/zHi");
/* harmony import */ var huewi_schedules_component___WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of___default = __webpack_require__.n(huewi_schedules_component___WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of__);







var huewi_schedules_component_HuewiSchedulesComponent = (function () {
    function HuewiSchedulesComponent(huepiService, parametersService, activatedRoute, router) {
        this.huepiService = huepiService;
        this.parametersService = parametersService;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.schedules = HUEWI_SCHEDULES_MOCK;
        this.back = true;
        this.scheduleObserver = huewi_schedules_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable__["Observable"].of(this.schedules);
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
    HuewiSchedulesComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: ParametersService }, { type: huewi_schedules_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["a" /* ActivatedRoute */] }, { type: huewi_schedules_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return HuewiSchedulesComponent;
}());

//# sourceMappingURL=huewi-schedules.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-schedules/huewi-schedules.component.ngfactory.ts
/* harmony import */ var huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__ = __webpack_require__("bm2B");
/* harmony import */ var huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_cdk_platform__ = __webpack_require__("JYHx");
/* harmony import */ var huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__ = __webpack_require__("qbdv");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */

















var styles_HuewiSchedulesComponent = [huewi_schedules_component_css_shim_ngstyle_styles];
var RenderType_HuewiSchedulesComponent = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiSchedulesComponent, data: { 'animation': [{ type: 7, name: 'RoutingAnimations',
                definitions: [{ type: 0, name: 'void', styles: { type: 6, styles: { top: -32, left: 0, opacity: 0 },
                            offset: null }, options: undefined }, { type: 0, name: '*', styles: { type: 6,
                            styles: { top: 0, left: 0, opacity: 1 }, offset: null }, options: undefined },
                    { type: 1, expr: ':enter', animation: [{ type: 4, styles: { type: 6, styles: { top: 0,
                                        left: 0, opacity: 1 }, offset: null }, timings: '0.2s ease-in-out' }],
                        options: null }, { type: 1, expr: ':leave', animation: [{ type: 4, styles: { type: 6,
                                    styles: { top: -32, left: 0, opacity: 0 }, offset: null }, timings: '0s ease-in-out' }],
                        options: null }], options: {} }] } });
function View_HuewiSchedulesComponent_2(_l) {
    return huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-schedule', [['md-list-item', '']], null, null, null, View_HuewiScheduleComponent_0, RenderType_HuewiScheduleComponent)), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_schedule_component_HuewiScheduleComponent, [huepi_service_HuepiService, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], { schedule: [0, 'schedule'] }, null), (_l()(),
            huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      ']))], function (_ck, _v) {
        var currVal_0 = _v.context.$implicit;
        _ck(_v, 1, 0, currVal_0);
    }, null);
}
function View_HuewiSchedulesComponent_1(_l) {
    return huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 42, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 27, 'md-card-title', [['class', 'mat-card-title']], null, null, null, null, null)), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["U" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      Schedules\n      '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 22, 'small', [], null, null, null, null, null)), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n        '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 19, 'md-input-container', [['class', 'mat-input-container mat-form-field']], [[2, 'mat-input-invalid',
                null], [2, 'mat-form-field-invalid', null], [2, 'mat-focused',
                null], [2, 'ng-untouched', null], [2, 'ng-touched', null],
            [2, 'ng-pristine', null], [2, 'ng-dirty', null], [2, 'ng-valid',
                null], [2, 'ng-invalid', null], [2, 'ng-pending', null]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._control.focus() !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["w" /* View_MdFormField_0 */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdFormField */])), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](7389184, null, 6, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_16" /* MdFormField */], [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */], [2, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["u" /* MD_PLACEHOLDER_GLOBAL_OPTIONS */]]], null, null), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 1, { _control: 0 }), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 2, { _placeholderChild: 0 }), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 3, { _errorChildren: 1 }), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 4, { _hintChildren: 1 }), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 5, { _prefixChildren: 1 }), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 6, { _suffixChildren: 1 }), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](1, ['\n          '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 1, 8, 'input', [['class', 'mat-input-element'], ['mdInput', ''],
            ['placeholder', 'Filter']], [[8, 'id', 0], [8, 'placeholder', 0], [8, 'disabled',
                0], [8, 'required', 0], [1, 'aria-describedby', 0], [1, 'aria-invalid', 0], [2,
                'ng-untouched', null], [2, 'ng-touched', null], [2, 'ng-pristine',
                null], [2, 'ng-dirty', null], [2, 'ng-valid', null],
            [2, 'ng-invalid', null], [2, 'ng-pending', null]], [[null,
                'ngModelChange'], [null, 'input'], [null, 'blur'], [null,
                'compositionstart'], [null, 'compositionend'], [null,
                'focus']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('input' === en)) {
                var pd_0 = (huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 20)._handleInput($event.target.value) !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 20).onTouched() !== false);
                ad = (pd_1 && ad);
            }
            if (('compositionstart' === en)) {
                var pd_2 = (huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 20)._compositionStart() !== false);
                ad = (pd_2 && ad);
            }
            if (('compositionend' === en)) {
                var pd_3 = (huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 20)._compositionEnd($event.target.value) !== false);
                ad = (pd_3 && ad);
            }
            if (('blur' === en)) {
                var pd_4 = (huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24)._focusChanged(false) !== false);
                ad = (pd_4 && ad);
            }
            if (('focus' === en)) {
                var pd_5 = (huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24)._focusChanged(true) !== false);
                ad = (pd_5 && ad);
            }
            if (('input' === en)) {
                var pd_6 = (huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24)._onInput() !== false);
                ad = (pd_6 && ad);
            }
            if (('ngModelChange' === en)) {
                var pd_7 = ((_co.searchText = $event) !== false);
                ad = (pd_7 && ad);
            }
            return ad;
        }, null, null)), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["c" /* DefaultValueAccessor */], [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */],
            [2, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["a" /* COMPOSITION_BUFFER_MODE */]]], null, null), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](1024, null, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["g" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["c" /* DefaultValueAccessor */]]), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["k" /* NgModel */], [[8,
                null], [8, null], [8, null], [2, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["g" /* NG_VALUE_ACCESSOR */]]], { model: [0, 'model'] }, { update: 'ngModelChange' }), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](2048, null, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["h" /* NgControl */], null, [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["k" /* NgModel */]]), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](933888, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_28" /* MdInput */], [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_cdk_platform__["a" /* Platform */], [2, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["h" /* NgControl */]], [2, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["j" /* NgForm */]],
            [2, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["d" /* FormGroupDirective */]], [2, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["r" /* MD_ERROR_GLOBAL_OPTIONS */]]], { placeholder: [0,
                'placeholder'] }, null), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["i" /* NgControlStatus */], [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["h" /* NgControl */]], null, null), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](2048, [[1, 4]], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_17" /* MdFormFieldControl */], null, [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_28" /* MdInput */]]), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](1, ['\n        '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 10, 'md-list', [['class', 'mat-list'], ['role', 'list']], null, null, null, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["z" /* View_MdList_0 */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["i" /* RenderType_MdList */])), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdList */], [], null, null),
        huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_32" /* MdListCssMatStyler */], [], null, null), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 4, null, View_HuewiSchedulesComponent_2)), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["j" /* NgForOf */], [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, OrderByPipe, []), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, FilterPipe, []), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n    '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_23 = _co.searchText;
        _ck(_v, 22, 0, currVal_23);
        var currVal_24 = 'Filter';
        _ck(_v, 24, 0, currVal_24);
        var currVal_25 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵunv */](_v, 37, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 40).transform(huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵunv */](_v, 37, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 39).transform(_co.schedules, _ck(_v, 38, 0, '+name'))), _co.searchText, 'name'));
        _ck(_v, 37, 0, currVal_25);
    }, function (_ck, _v) {
        var currVal_0 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._control.errorState;
        var currVal_1 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._control.errorState;
        var currVal_2 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._control.focused;
        var currVal_3 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('untouched');
        var currVal_4 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('touched');
        var currVal_5 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('pristine');
        var currVal_6 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('dirty');
        var currVal_7 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('valid');
        var currVal_8 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('invalid');
        var currVal_9 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('pending');
        _ck(_v, 8, 0, currVal_0, currVal_1, currVal_2, currVal_3, currVal_4, currVal_5, currVal_6, currVal_7, currVal_8, currVal_9);
        var currVal_10 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).id;
        var currVal_11 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).placeholder;
        var currVal_12 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).disabled;
        var currVal_13 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).required;
        var currVal_14 = (huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24)._ariaDescribedby || null);
        var currVal_15 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).errorState;
        var currVal_16 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassUntouched;
        var currVal_17 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassTouched;
        var currVal_18 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassPristine;
        var currVal_19 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassDirty;
        var currVal_20 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassValid;
        var currVal_21 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassInvalid;
        var currVal_22 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassPending;
        _ck(_v, 18, 1, [currVal_10, currVal_11, currVal_12, currVal_13, currVal_14, currVal_15,
            currVal_16, currVal_17, currVal_18, currVal_19, currVal_20, currVal_21, currVal_22]);
    });
}
function View_HuewiSchedulesComponent_4(_l) {
    return huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'a', [], [[1, 'target', 0], [8, 'href', 4]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])),
        huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_23" /* MdIcon */], [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_26" /* MdIconRegistry */], [8, null]], null, null), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['navigate_before']))], function (_ck, _v) {
        var currVal_2 = true;
        var currVal_3 = _ck(_v, 2, 0, '/schedules');
        _ck(_v, 1, 0, currVal_2, currVal_3);
        _ck(_v, 5, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).target;
        var currVal_1 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).href;
        _ck(_v, 0, 0, currVal_0, currVal_1);
    });
}
function View_HuewiSchedulesComponent_3(_l) {
    return huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 13, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'md-card-title', [['class', 'mat-card-title']], null, null, null, null, null)), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["U" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSchedulesComponent_4)), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["k" /* NgIf */], [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      ', ' - Details\n    '])),
        (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-schedule-details', [], null, null, null, View_HuewiScheduleDetailsComponent_0, RenderType_HuewiScheduleDetailsComponent)),
        huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_schedule_details_component_HuewiScheduleDetailsComponent, [huepi_service_HuepiService,
            ParametersService], { schedule: [0, 'schedule'] }, null), (_l()(),
            huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.back;
        _ck(_v, 7, 0, currVal_0);
        var currVal_2 = _co.selectedSchedule;
        _ck(_v, 11, 0, currVal_2);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = _co.selectedSchedule.name;
        _ck(_v, 8, 0, currVal_1);
    });
}
function View_HuewiSchedulesComponent_0(_l) {
    return huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 9, 'md-card', [['class',
                'mat-card']], [[24, '@RoutingAnimations', 0]], null, null, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["u" /* View_MdCard_0 */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2,
                huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["Q" /* MdCard */], [], null, null),
        (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiSchedulesComponent_1)), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["k" /* NgIf */], [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(),
            huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiSchedulesComponent_3)), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["k" /* NgIf */], [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(),
            huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n'])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = !_co.selectedSchedule;
        _ck(_v, 5, 0, currVal_1);
        var currVal_2 = _co.selectedSchedule;
        _ck(_v, 8, 0, currVal_2);
    }, function (_ck, _v) {
        var currVal_0 = undefined;
        _ck(_v, 0, 0, currVal_0);
    });
}
function View_HuewiSchedulesComponent_Host_0(_l) {
    return huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-schedules', [], [[40, '@RoutingAnimations', 0]], null, null, View_HuewiSchedulesComponent_0, RenderType_HuewiSchedulesComponent)), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_schedules_component_HuewiSchedulesComponent, [huepi_service_HuepiService, ParametersService, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).RoutingAnimations;
        _ck(_v, 0, 0, currVal_0);
    });
}
var HuewiSchedulesComponentNgFactory = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-schedules', huewi_schedules_component_HuewiSchedulesComponent, View_HuewiSchedulesComponent_Host_0, { schedules: 'schedules',
    back: 'back' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZXMuY29tcG9uZW50Lm5nZmFjdG9yeS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZXMuY29tcG9uZW50LnRzIiwibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktc2NoZWR1bGVzL2h1ZXdpLXNjaGVkdWxlcy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZXMuY29tcG9uZW50LnRzLkh1ZXdpU2NoZWR1bGVzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPG1kLWNhcmQgW0BSb3V0aW5nQW5pbWF0aW9uc10+XG5cbiAgPGRpdiAqbmdJZj1cIiFzZWxlY3RlZFNjaGVkdWxlXCI+XG4gICAgPG1kLWNhcmQtdGl0bGU+XG4gICAgICBTY2hlZHVsZXNcbiAgICAgIDxzbWFsbD5cbiAgICAgICAgPG1kLWlucHV0LWNvbnRhaW5lcj5cbiAgICAgICAgICA8aW5wdXQgbWRJbnB1dCBwbGFjZWhvbGRlcj1cIkZpbHRlclwiIFsobmdNb2RlbCldPVwic2VhcmNoVGV4dFwiPlxuICAgICAgICA8L21kLWlucHV0LWNvbnRhaW5lcj5cbiAgICAgIDwvc21hbGw+XG4gICAgPC9tZC1jYXJkLXRpdGxlPlxuICAgIDxtZC1saXN0PlxuICAgICAgPGh1ZXdpLXNjaGVkdWxlIG1kLWxpc3QtaXRlbVxuICAgICAgICAqbmdGb3I9XCJsZXQgc2NoZWR1bGUgb2Ygc2NoZWR1bGVzIHwgb3JkZXJCeTpbJytuYW1lJ10gfCBmaWx0ZXI6c2VhcmNoVGV4dDonbmFtZSdcIlxuICAgICAgICBbc2NoZWR1bGVdPVwic2NoZWR1bGVcIj5cbiAgICAgIDwvaHVld2ktc2NoZWR1bGU+XG4gICAgPC9tZC1saXN0PlxuICA8L2Rpdj5cblxuICA8ZGl2ICpuZ0lmPVwic2VsZWN0ZWRTY2hlZHVsZVwiPlxuICAgIDxtZC1jYXJkLXRpdGxlPlxuICAgICAgPGEgKm5nSWY9XCJiYWNrXCIgW3JvdXRlckxpbmtdPVwiWycvc2NoZWR1bGVzJ11cIiBbcmVwbGFjZVVybF09XCJ0cnVlXCI+PG1kLWljb24+bmF2aWdhdGVfYmVmb3JlPC9tZC1pY29uPjwvYT5cbiAgICAgIHt7c2VsZWN0ZWRTY2hlZHVsZS5uYW1lfX0gLSBEZXRhaWxzXG4gICAgPC9tZC1jYXJkLXRpdGxlPlxuICAgIDxodWV3aS1zY2hlZHVsZS1kZXRhaWxzXG4gICAgICBbc2NoZWR1bGVdPVwic2VsZWN0ZWRTY2hlZHVsZVwiPlxuICAgIDwvaHVld2ktc2NoZWR1bGUtZGV0YWlscz5cbiAgPC9kaXY+XG5cbjwvbWQtY2FyZD5cbiIsIjxodWV3aS1zY2hlZHVsZXM+PC9odWV3aS1zY2hlZHVsZXM+Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkNZTTtNQUFBOzBDQUFBLFVBQUE7TUFBQSxxRUFFd0I7YUFBQTtJQUF0QjtJQUZGLFdBRUUsU0FGRjs7OztvQkFWSjtNQUFBLHdFQUErQjthQUFBLDRCQUM3QjtNQUFBO01BQUEsbURBQUE7TUFBQTthQUFBO01BQWUsOERBRWI7VUFBQTtVQUFBLDRDQUFPO1VBQUEsaUJBQ0w7VUFBQTtjQUFBO2NBQUE7Y0FBQTtrQkFBQTtVQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO1VBQUEsMkRBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQTtVQUFBO1VBQUE7VUFBQSx1QkFBb0IscUNBQ2xCO1VBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQW9DO2NBQUE7Y0FBQTtZQUFBO1lBQXBDO1VBQUEsdUNBQUE7VUFBQTthQUFBO1VBQUEsb0VBQUE7VUFBQTtZQUFBO1VBQUEsb0NBQUE7VUFBQTtVQUFBLHFEQUFBO3VCQUFBLG1DQUFBO3FCQUFBO2NBQUE7Y0FBQSxzQ0FBQTtVQUFBLG1EQUFBO1VBQUEsNEJBQTZELG1DQUMxQztVQUFBLGVBQ2YsMkNBQ007VUFBQSxhQUNoQjtVQUFBOytDQUFBLFVBQUE7VUFBQTthQUFBO2FBQUE7VUFBQSxlQUFTLGlDQUNQO1VBQUEsd0VBQUE7VUFBQTtVQUFBLDhDQUNFO1VBQUEsdURBRWU7VUFBQSxhQUNUOztJQVRnQztJQUFwQyxZQUFvQyxVQUFwQztJQUFlO0lBQWYsWUFBZSxVQUFmO0lBTUY7UUFBQTtRQUFBO0lBREYsWUFDRSxVQURGOztJQU5FO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUEsV0FBQTtRQUFBLDZCQUFBO0lBQ0U7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQSxhQUFBO1FBQUEsNEVBQUE7Ozs7b0JBY0o7TUFBQTtRQUFBO1FBQUE7VUFBQTtjQUFBO1VBQUE7UUFBQTtRQUFBO01BQUEsdUNBQUE7TUFBQTtVQUFBLG1EQUFnQixJQUFrRDtNQUFBO01BQUE7YUFBQTt1QkFBQSxzQ0FBQTtVQUFBO1VBQUEsNkJBQVM7O0lBQTdCO0lBQTlCO0lBQWhCLFdBQThDLFVBQTlCLFNBQWhCO0lBQWtFOztJQUFsRTtJQUFBO0lBQUEsV0FBQSxtQkFBQTs7OztvQkFGSjtNQUFBLHdFQUE4QjthQUFBLDRCQUM1QjtNQUFBO01BQUEscUNBQUE7TUFBQTthQUFBO01BQWUsNkNBQ2I7VUFBQSxzRUFBQTtVQUFBO1VBQUEsZUFBd0c7TUFFMUYsMkNBQ2hCO1VBQUE7K0ZBQUE7YUFBQTsrQkFBQSwyQ0FDZ0M7aUJBQUEsNEJBQ1A7OztRQUxwQjtRQUFILFdBQUcsU0FBSDtRQUlBO1FBREYsWUFDRSxTQURGOzs7UUFIMEc7UUFBQTs7OztvQkFyQjlHO01BQUE7MEJBQUEsVUFBQTtvQ0FBQTthQUFBO01BQThCLCtCQUU1QjtVQUFBLHdDQUFBO1VBQUEsc0VBZU07aUJBQUEsZ0JBRU47VUFBQSx3Q0FBQTtVQUFBLHNFQVFNO2lCQUFBLGNBRUU7O0lBM0JIO0lBQUwsV0FBSyxTQUFMO0lBaUJLO0lBQUwsV0FBSyxTQUFMOztJQW5CTztJQUFULFdBQVMsU0FBVDs7OztvQkNBQTtNQUFBO3dDQUFBLFVBQUE7TUFBQTtNQUFBO0lBQUE7O0lBQUE7SUFBQSxXQUFBLFNBQUE7Ozs7OyJ9
//# sourceMappingURL=huewi-schedules.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-sensors/huewi-sensors.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_sensors_component_css_shim_ngstyle_styles = [''];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29ycy5jb21wb25lbnQuY3NzLnNoaW0ubmdzdHlsZS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29ycy5jb21wb25lbnQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIiAiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7OzsifQ==
//# sourceMappingURL=huewi-sensors.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-sensors/huewi-sensor/huewi-sensor.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_sensor_component_css_shim_ngstyle_styles = [''];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29yL2h1ZXdpLXNlbnNvci5jb21wb25lbnQuY3NzLnNoaW0ubmdzdHlsZS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29yL2h1ZXdpLXNlbnNvci5jb21wb25lbnQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIiAiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7OzsifQ==
//# sourceMappingURL=huewi-sensor.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-sensors/huewi-sensor/huewi-sensor.component.ts
/* harmony import */ var huewi_sensor_component___WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");


var huewi_sensor_component_HuewiSensorComponent = (function () {
    function HuewiSensorComponent(huepiService, router) {
        this.huepiService = huepiService;
        this.router = router;
    }
    HuewiSensorComponent.prototype.ngOnInit = function () {
    };
    HuewiSensorComponent.prototype.select = function (sensor) {
        this.router.navigate(['/sensors', sensor.__key], { replaceUrl: true });
    };
    HuewiSensorComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: huewi_sensor_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return HuewiSensorComponent;
}());

//# sourceMappingURL=huewi-sensor.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-sensors/huewi-sensor/huewi-sensor.component.ngfactory.ts
/* harmony import */ var huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__ = __webpack_require__("BkNc");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */








var styles_HuewiSensorComponent = [huewi_sensor_component_css_shim_ngstyle_styles];
var RenderType_HuewiSensorComponent = huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiSensorComponent, data: {} });
function View_HuewiSensorComponent_1(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['', '']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.sensor.state.presence;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiSensorComponent_2(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['', '']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.sensor.state.lightlevel;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiSensorComponent_3(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['', '']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.sensor.state.temperature;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiSensorComponent_4(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['', '']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.sensor.state.buttonevent;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiSensorComponent_5(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['', '']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.sensor.state.buttonevent;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiSensorComponent_6(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['', '']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.sensor.state.status;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiSensorComponent_7(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['', '']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.sensor.state.presence;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiSensorComponent_8(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['', '']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.sensor.state.presence;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiSensorComponent_9(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['', '']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.sensor.state.daylight;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiSensorComponent_10(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, null, null, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2,
                huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['radio_button_checked']))], function (_ck, _v) {
        _ck(_v, 2, 0);
    }, null);
}
function View_HuewiSensorComponent_11(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, null, null, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2,
                huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['radio_button_unchecked']))], function (_ck, _v) {
        _ck(_v, 2, 0);
    }, null);
}
function View_HuewiSensorComponent_0(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 49, 'div', [['class',
                'flexcontainer']], null, null, null, null, null)),
        (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [['style', 'flex: 3 1 128px']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.select(_co.sensor) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    ',
            '\n  '])), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'div', [['style', 'flex: 2 1 128px']], null, null, null, null, null)), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'small', [], null, null, null, null, null)),
        (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['', ''])), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])),
        (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 28, 'div', [['style', 'flex: 1 1 32px']], null, null, null, null, null)), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])),
        (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorComponent_1)),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorComponent_2)),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorComponent_3)),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorComponent_4)),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorComponent_5)),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorComponent_6)),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorComponent_7)),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorComponent_8)),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorComponent_9)),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 7, 'div', [['style', 'flex: 0 1 10px']], null, null, null, null, null)), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])),
        (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorComponent_10)),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorComponent_11)),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['      \n  '])), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n'])), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_2 = (_co.sensor.type == 'ZLLPresence');
        _ck(_v, 14, 0, currVal_2);
        var currVal_3 = (_co.sensor.type == 'ZLLLightLevel');
        _ck(_v, 17, 0, currVal_3);
        var currVal_4 = (_co.sensor.type == 'ZLLTemperature');
        _ck(_v, 20, 0, currVal_4);
        var currVal_5 = (_co.sensor.type == 'ZLLSwitch');
        _ck(_v, 23, 0, currVal_5);
        var currVal_6 = (_co.sensor.type == 'ZGPSwitch');
        _ck(_v, 26, 0, currVal_6);
        var currVal_7 = (_co.sensor.type == 'CLIPGenericStatus');
        _ck(_v, 29, 0, currVal_7);
        var currVal_8 = (_co.sensor.type == 'CLIPPresence');
        _ck(_v, 32, 0, currVal_8);
        var currVal_9 = (_co.sensor.type == 'Geofence');
        _ck(_v, 35, 0, currVal_9);
        var currVal_10 = (_co.sensor.type == 'Daylight');
        _ck(_v, 38, 0, currVal_10);
        var currVal_11 = _co.sensor.config.on;
        _ck(_v, 44, 0, currVal_11);
        var currVal_12 = !_co.sensor.config.on;
        _ck(_v, 47, 0, currVal_12);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.sensor.name;
        _ck(_v, 3, 0, currVal_0);
        var currVal_1 = _co.sensor.type;
        _ck(_v, 8, 0, currVal_1);
    });
}
function View_HuewiSensorComponent_Host_0(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-sensor', [], null, null, null, View_HuewiSensorComponent_0, RenderType_HuewiSensorComponent)), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_sensor_component_HuewiSensorComponent, [huepi_service_HuepiService, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiSensorComponentNgFactory = huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-sensor', huewi_sensor_component_HuewiSensorComponent, View_HuewiSensorComponent_Host_0, { sensor: 'sensor' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29yL2h1ZXdpLXNlbnNvci5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktc2Vuc29ycy9odWV3aS1zZW5zb3IvaHVld2ktc2Vuc29yLmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29yL2h1ZXdpLXNlbnNvci5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29yL2h1ZXdpLXNlbnNvci5jb21wb25lbnQudHMuSHVld2lTZW5zb3JDb21wb25lbnRfSG9zdC5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIiAiLCI8ZGl2IGNsYXNzPVwiZmxleGNvbnRhaW5lclwiPlxuICA8ZGl2IHN0eWxlPVwiZmxleDogMyAxIDEyOHB4XCIgKGNsaWNrKT1cInNlbGVjdChzZW5zb3IpXCI+XG4gICAge3tzZW5zb3IubmFtZX19XG4gIDwvZGl2PlxuICA8ZGl2IHN0eWxlPVwiZmxleDogMiAxIDEyOHB4XCIgPlxuICAgIDxzbWFsbD57e3NlbnNvci50eXBlfX08L3NtYWxsPlxuICA8L2Rpdj5cbiAgPGRpdiBzdHlsZT1cImZsZXg6IDEgMSAzMnB4XCI+XG4gICAgPGRpdiAqbmdJZj1cInNlbnNvci50eXBlPT0nWkxMUHJlc2VuY2UnXCI+e3tzZW5zb3Iuc3RhdGUucHJlc2VuY2V9fTwvZGl2PlxuICAgIDxkaXYgKm5nSWY9XCJzZW5zb3IudHlwZT09J1pMTExpZ2h0TGV2ZWwnXCI+e3tzZW5zb3Iuc3RhdGUubGlnaHRsZXZlbH19PC9kaXY+XG4gICAgPGRpdiAqbmdJZj1cInNlbnNvci50eXBlPT0nWkxMVGVtcGVyYXR1cmUnXCI+e3tzZW5zb3Iuc3RhdGUudGVtcGVyYXR1cmV9fTwvZGl2PlxuICAgIDxkaXYgKm5nSWY9XCJzZW5zb3IudHlwZT09J1pMTFN3aXRjaCdcIj57e3NlbnNvci5zdGF0ZS5idXR0b25ldmVudH19PC9kaXY+XG4gICAgPGRpdiAqbmdJZj1cInNlbnNvci50eXBlPT0nWkdQU3dpdGNoJ1wiPnt7c2Vuc29yLnN0YXRlLmJ1dHRvbmV2ZW50fX08L2Rpdj5cbiAgICA8ZGl2ICpuZ0lmPVwic2Vuc29yLnR5cGU9PSdDTElQR2VuZXJpY1N0YXR1cydcIj57e3NlbnNvci5zdGF0ZS5zdGF0dXN9fTwvZGl2PlxuICAgIDxkaXYgKm5nSWY9XCJzZW5zb3IudHlwZT09J0NMSVBQcmVzZW5jZSdcIj57e3NlbnNvci5zdGF0ZS5wcmVzZW5jZX19PC9kaXY+XG4gICAgPGRpdiAqbmdJZj1cInNlbnNvci50eXBlPT0nR2VvZmVuY2UnXCI+e3tzZW5zb3Iuc3RhdGUucHJlc2VuY2V9fTwvZGl2PlxuICAgIDxkaXYgKm5nSWY9XCJzZW5zb3IudHlwZT09J0RheWxpZ2h0J1wiPnt7c2Vuc29yLnN0YXRlLmRheWxpZ2h0fX08L2Rpdj5cbiAgPC9kaXY+XG4gIDxkaXYgc3R5bGU9XCJmbGV4OiAwIDEgMTBweFwiPlxuICAgIDxtZC1pY29uICpuZ0lmPVwic2Vuc29yLmNvbmZpZy5vblwiPnJhZGlvX2J1dHRvbl9jaGVja2VkPC9tZC1pY29uPlxuICAgIDxtZC1pY29uICpuZ0lmPVwiIXNlbnNvci5jb25maWcub25cIj5yYWRpb19idXR0b25fdW5jaGVja2VkPC9tZC1pY29uPiAgICAgIFxuICA8L2Rpdj5cbjwvZGl2PlxuIiwiPGh1ZXdpLXNlbnNvcj48L2h1ZXdpLXNlbnNvcj4iXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkNRSTtNQUFBLHdFQUF3QzthQUFBOztJQUFBO0lBQUE7Ozs7b0JBQ3hDO01BQUEsd0VBQTBDO2FBQUE7O0lBQUE7SUFBQTs7OztvQkFDMUM7TUFBQSx3RUFBMkM7YUFBQTs7SUFBQTtJQUFBOzs7O29CQUMzQztNQUFBLHdFQUFzQzthQUFBOztJQUFBO0lBQUE7Ozs7b0JBQ3RDO01BQUEsd0VBQXNDO2FBQUE7O0lBQUE7SUFBQTs7OztvQkFDdEM7TUFBQSx3RUFBOEM7YUFBQTs7SUFBQTtJQUFBOzs7O29CQUM5QztNQUFBLHdFQUF5QzthQUFBOztJQUFBO0lBQUE7Ozs7b0JBQ3pDO01BQUEsd0VBQXFDO2FBQUE7O0lBQUE7SUFBQTs7OztvQkFDckM7TUFBQSx3RUFBcUM7YUFBQTs7SUFBQTtJQUFBOzs7O29CQUdyQztNQUFBOzBCQUFBLFVBQUE7b0NBQUE7YUFBQTtVQUFBLGdEQUFrQzs7UUFBbEM7Ozs7b0JBQ0E7TUFBQTswQkFBQSxVQUFBO29DQUFBO2FBQUE7VUFBQSxnREFBbUM7O1FBQW5DOzs7O29CQXBCSjtNQUFBO01BQTJCLHlDQUN6QjtVQUFBO1VBQUE7WUFBQTtZQUFBO1lBQTZCO2NBQUE7Y0FBQTtZQUFBO1lBQTdCO1VBQUEsZ0NBQXNEO1VBQUEsVUFFaEQseUNBQ047VUFBQTtVQUFBLDRDQUE4QjtVQUFBLGFBQzVCO1VBQUE7TUFBTyx3Q0FBdUI7TUFDMUIseUNBQ047VUFBQTtVQUFBLDhCQUE0QjtNQUMxQjthQUFBO1VBQUEsd0JBQXVFLDJDQUN2RTtpQkFBQTthQUFBO1VBQUEsd0JBQTJFLDJDQUMzRTtpQkFBQTthQUFBO1VBQUEsd0JBQTZFLDJDQUM3RTtpQkFBQTthQUFBO1VBQUEsd0JBQXdFLDJDQUN4RTtpQkFBQTthQUFBO1VBQUEsd0JBQXdFLDJDQUN4RTtpQkFBQTthQUFBO1VBQUEsd0JBQTJFLDJDQUMzRTtpQkFBQTthQUFBO1VBQUEsd0JBQXdFLDJDQUN4RTtpQkFBQTthQUFBO1VBQUEsd0JBQW9FLDJDQUNwRTtpQkFBQTthQUFBO1VBQUEsd0JBQW9FLHlDQUNoRTtpQkFBQSwwQkFDTjtVQUFBO1VBQUEsOEJBQTRCO01BQzFCO2FBQUE7VUFBQSx3QkFBZ0UsMkNBQ2hFO2lCQUFBO2FBQUE7VUFBQSx3QkFBbUUsK0NBQy9EO2lCQUFBLHdCQUNGOzs7SUFkRztJQUFMLFlBQUssU0FBTDtJQUNLO0lBQUwsWUFBSyxTQUFMO0lBQ0s7SUFBTCxZQUFLLFNBQUw7SUFDSztJQUFMLFlBQUssU0FBTDtJQUNLO0lBQUwsWUFBSyxTQUFMO0lBQ0s7SUFBTCxZQUFLLFNBQUw7SUFDSztJQUFMLFlBQUssU0FBTDtJQUNLO0lBQUwsWUFBSyxTQUFMO0lBQ0s7SUFBTCxZQUFLLFVBQUw7SUFHUztJQUFULFlBQVMsVUFBVDtJQUNTO0lBQVQsWUFBUyxVQUFUOzs7SUFuQm9EO0lBQUE7SUFJN0M7SUFBQTs7OztvQkNMWDtNQUFBO3FDQUFBLFVBQUE7TUFBQTtJQUFBOzs7OzsifQ==
//# sourceMappingURL=huewi-sensor.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-sensors/huewi-sensor-details/huewi-sensor-details.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_sensor_details_component_css_shim_ngstyle_styles = ['md-icon[_ngcontent-%COMP%]{float:right}'];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29yLWRldGFpbHMvaHVld2ktc2Vuc29yLWRldGFpbHMuY29tcG9uZW50LmNzcy5zaGltLm5nc3R5bGUudHMiLCJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZzovLy9Vc2Vycy9hcm5kL0RldmVsb3Blci9odWV3aTIvc3JjL2FwcC9odWV3aS1zZW5zb3JzL2h1ZXdpLXNlbnNvci1kZXRhaWxzL2h1ZXdpLXNlbnNvci1kZXRhaWxzLmNvbXBvbmVudC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiICJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7OyJ9
//# sourceMappingURL=huewi-sensor-details.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-sensors/huewi-sensor-details/huewi-sensor-details.component.ts


var huewi_sensor_details_component_HuewiSensorDetailsComponent = (function () {
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
    HuewiSensorDetailsComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: ParametersService }]; };
    return HuewiSensorDetailsComponent;
}());

//# sourceMappingURL=huewi-sensor-details.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-sensors/huewi-sensor-details/huewi-sensor-details.component.ngfactory.ts
/* harmony import */ var huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_router__ = __webpack_require__("BkNc");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */











var styles_HuewiSensorDetailsComponent = [huewi_sensor_details_component_css_shim_ngstyle_styles];
var RenderType_HuewiSensorDetailsComponent = huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiSensorDetailsComponent, data: {} });
function View_HuewiSensorDetailsComponent_1(_l) {
    return huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = ((_co.expand = true) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['expand_more']))], function (_ck, _v) {
        _ck(_v, 2, 0);
    }, null);
}
function View_HuewiSensorDetailsComponent_2(_l) {
    return huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 26, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 23, 'small', [], null, null, null, null, null)), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = ((_co.expand = false) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['expand_less'])),
        (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-divider', [['aria-orientation', 'horizontal'], ['class',
                'mat-divider'], ['role', 'separator']], null, null, null, null, null)), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_33" /* MdListDivider */], [], null, null),
        huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdDividerCssMatStyler */], [], null, null), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'b', [], null, null, null, null, null)), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['config: '])), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)),
        (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      ', '\n      '])), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_common__["e" /* JsonPipe */], []), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)),
        (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'b', [], null, null, null, null, null)), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['state: '])),
        (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      ', '\n    '])), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_common__["e" /* JsonPipe */], []), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        _ck(_v, 6, 0);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵunv */](_v, 17, 0, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 18).transform(_co.sensor.config));
        _ck(_v, 17, 0, currVal_0);
        var currVal_1 = huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵunv */](_v, 24, 0, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).transform(_co.sensor.state));
        _ck(_v, 24, 0, currVal_1);
    });
}
function View_HuewiSensorDetailsComponent_0(_l) {
    return huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-sensor', [], null, null, null, View_HuewiSensorComponent_0, RenderType_HuewiSensorComponent)), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_sensor_component_HuewiSensorComponent, [huepi_service_HuepiService, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_router__["k" /* Router */]], { sensor: [0, 'sensor'] }, null), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n'])), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n\n'])), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 12, 'div', [], null, null, null, null, null)), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [], null, null, null, null, null)), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['sensor ', ''])), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  ', ' - ', ''])), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])),
        (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorDetailsComponent_1)),
        huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_common__["k" /* NgIf */], [huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorDetailsComponent_2)),
        huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_common__["k" /* NgIf */], [huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n'])), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.sensor;
        _ck(_v, 1, 0, currVal_0);
        var currVal_4 = !_co.expand;
        _ck(_v, 12, 0, currVal_4);
        var currVal_5 = _co.expand;
        _ck(_v, 15, 0, currVal_5);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = _co.sensor.__key;
        _ck(_v, 7, 0, currVal_1);
        var currVal_2 = _co.sensor.type;
        var currVal_3 = _co.sensor.modelid;
        _ck(_v, 8, 0, currVal_2, currVal_3);
    });
}
function View_HuewiSensorDetailsComponent_Host_0(_l) {
    return huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-sensor-details', [], null, null, null, View_HuewiSensorDetailsComponent_0, RenderType_HuewiSensorDetailsComponent)), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_sensor_details_component_HuewiSensorDetailsComponent, [huepi_service_HuepiService, ParametersService], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiSensorDetailsComponentNgFactory = huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-sensor-details', huewi_sensor_details_component_HuewiSensorDetailsComponent, View_HuewiSensorDetailsComponent_Host_0, { sensor: 'sensor',
    back: 'back', expand: 'expand' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29yLWRldGFpbHMvaHVld2ktc2Vuc29yLWRldGFpbHMuY29tcG9uZW50Lm5nZmFjdG9yeS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29yLWRldGFpbHMvaHVld2ktc2Vuc29yLWRldGFpbHMuY29tcG9uZW50LnRzIiwibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktc2Vuc29ycy9odWV3aS1zZW5zb3ItZGV0YWlscy9odWV3aS1zZW5zb3ItZGV0YWlscy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29yLWRldGFpbHMvaHVld2ktc2Vuc29yLWRldGFpbHMuY29tcG9uZW50LnRzLkh1ZXdpU2Vuc29yRGV0YWlsc0NvbXBvbmVudF9Ib3N0Lmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiICIsIjxodWV3aS1zZW5zb3IgXG4gIFtzZW5zb3JdPVwic2Vuc29yXCI+XG48L2h1ZXdpLXNlbnNvcj5cblxuPGRpdj5cbiAgPGRpdj5zZW5zb3Ige3tzZW5zb3IuX19rZXl9fTwvZGl2PlxuICB7e3NlbnNvci50eXBlfX0gLSB7e3NlbnNvci5tb2RlbGlkfX08YnI+XG4gIDxtZC1pY29uICpuZ0lmPVwiIWV4cGFuZFwiIChjbGljayk9XCJleHBhbmQ9dHJ1ZVwiPmV4cGFuZF9tb3JlPC9tZC1pY29uPlxuICA8ZGl2ICpuZ0lmPVwiZXhwYW5kXCI+XG4gICAgPHNtYWxsPlxuICAgICAgPG1kLWljb24gKGNsaWNrKT1cImV4cGFuZD1mYWxzZVwiPmV4cGFuZF9sZXNzPC9tZC1pY29uPlxuICAgICAgPG1kLWRpdmlkZXI+PC9tZC1kaXZpZGVyPlxuICAgICAgPGI+Y29uZmlnOiA8L2I+PGJyPlxuICAgICAge3tzZW5zb3IuY29uZmlnIHwganNvbn19XG4gICAgICA8YnI+XG4gICAgICA8Yj5zdGF0ZTogPC9iPjxicj5cbiAgICAgIHt7c2Vuc29yLnN0YXRlIHwganNvbn19XG4gICAgPC9zbWFsbD5cbiAgPC9kaXY+XG48L2Rpdj5cbiIsIjxodWV3aS1zZW5zb3ItZGV0YWlscz48L2h1ZXdpLXNlbnNvci1kZXRhaWxzPiJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O29CQ09FO01BQUE7SUFBQTtJQUFBO0lBQXlCO01BQUE7TUFBQTtJQUFBO0lBQXpCO0VBQUEsaURBQUE7TUFBQTthQUFBO1VBQUEsZ0RBQStDOztRQUEvQzs7OztvQkFDQTtNQUFBLHdFQUFvQjthQUFBLDRCQUNsQjtNQUFBO01BQUEsZ0JBQU8sNkNBQ0w7TUFBQTtNQUFBO1FBQUE7UUFBQTtRQUFTO1VBQUE7VUFBQTtRQUFBO1FBQVQ7TUFBQSxpREFBQTtNQUFBO2FBQUE7VUFBQSxnREFBZ0M7TUFBcUIsNkNBQ3JEO1VBQUE7Y0FBQTtVQUFBLHFDQUFBO1VBQUE7YUFBQTthQUFBO1VBQUEsZUFBeUIsNkNBQ3pCO1VBQUE7VUFBQSw0Q0FBRztVQUFBLGVBQVk7VUFBQTtNQUFJO1VBQUEsZUFFbkI7VUFBQTtNQUFJLDZDQUNKO1VBQUE7VUFBQSw4QkFBRztNQUFXO1VBQUEsMERBQUk7VUFBQSw2REFFWjtVQUFBO0lBUE47OztJQUVtQjtJQUFBO0lBR0Q7SUFBQTs7OztvQkFmeEI7TUFBQTt3Q0FBQSxVQUFBO01BQUEsaUVBQ29CO01BQUEsU0FDTCx5Q0FFZjtNQUFBO01BQUEsOEJBQUsseUNBQ0g7YUFBQTtVQUFBLDRDQUFLO01BQUEsaUJBQTZCLGtEQUNFO01BQUE7TUFBQSw0Q0FBSTtNQUN4QzthQUFBO1VBQUEsd0JBQW9FLHlDQUNwRTtpQkFBQTthQUFBO1VBQUEsd0JBVU0sdUNBQ0Y7VUFBQTs7SUFsQko7SUFERixXQUNFLFNBREY7SUFPVztJQUFULFlBQVMsU0FBVDtJQUNLO0lBQUwsWUFBSyxTQUFMOzs7SUFISztJQUFBO0lBQTZCO0lBQUE7SUFBQTs7OztvQkNMcEM7TUFBQTs0Q0FBQSxVQUFBO01BQUE7SUFBQTs7Ozs7In0=
//# sourceMappingURL=huewi-sensor-details.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-sensors/huewi-sensors.mock.ts
var HUEWI_SENSORS_MOCK = [];
//# sourceMappingURL=huewi-sensors.mock.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-sensors/huewi-sensors.component.ts
/* harmony import */ var huewi_sensors_component___WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_sensors_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable__ = __webpack_require__("bKpL");
/* harmony import */ var huewi_sensors_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable___default = __webpack_require__.n(huewi_sensors_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable__);
/* harmony import */ var huewi_sensors_component___WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of__ = __webpack_require__("/zHi");
/* harmony import */ var huewi_sensors_component___WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of___default = __webpack_require__.n(huewi_sensors_component___WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of__);







var huewi_sensors_component_HuewiSensorsComponent = (function () {
    function HuewiSensorsComponent(huepiService, parametersService, activatedRoute, router) {
        this.huepiService = huepiService;
        this.parametersService = parametersService;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.sensors = HUEWI_SENSORS_MOCK;
        this.back = true;
        this.sensorObserver = huewi_sensors_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable__["Observable"].of(this.sensors);
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
    HuewiSensorsComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: ParametersService }, { type: huewi_sensors_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["a" /* ActivatedRoute */] }, { type: huewi_sensors_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return HuewiSensorsComponent;
}());

//# sourceMappingURL=huewi-sensors.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-sensors/huewi-sensors.component.ngfactory.ts
/* harmony import */ var huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__ = __webpack_require__("bm2B");
/* harmony import */ var huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_cdk_platform__ = __webpack_require__("JYHx");
/* harmony import */ var huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__ = __webpack_require__("qbdv");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */

















var styles_HuewiSensorsComponent = [huewi_sensors_component_css_shim_ngstyle_styles];
var RenderType_HuewiSensorsComponent = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiSensorsComponent, data: { 'animation': [{ type: 7, name: 'RoutingAnimations',
                definitions: [{ type: 0, name: 'void', styles: { type: 6, styles: { top: -32, left: 0, opacity: 0 },
                            offset: null }, options: undefined }, { type: 0, name: '*', styles: { type: 6,
                            styles: { top: 0, left: 0, opacity: 1 }, offset: null }, options: undefined },
                    { type: 1, expr: ':enter', animation: [{ type: 4, styles: { type: 6, styles: { top: 0,
                                        left: 0, opacity: 1 }, offset: null }, timings: '0.2s ease-in-out' }],
                        options: null }, { type: 1, expr: ':leave', animation: [{ type: 4, styles: { type: 6,
                                    styles: { top: -32, left: 0, opacity: 0 }, offset: null }, timings: '0s ease-in-out' }],
                        options: null }], options: {} }] } });
function View_HuewiSensorsComponent_2(_l) {
    return huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-sensor', [['md-list-item', '']], null, null, null, View_HuewiSensorComponent_0, RenderType_HuewiSensorComponent)), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_sensor_component_HuewiSensorComponent, [huepi_service_HuepiService, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], { sensor: [0, 'sensor'] }, null), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      ']))], function (_ck, _v) {
        var currVal_0 = _v.context.$implicit;
        _ck(_v, 1, 0, currVal_0);
    }, null);
}
function View_HuewiSensorsComponent_1(_l) {
    return huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 42, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 27, 'md-card-title', [['class', 'mat-card-title']], null, null, null, null, null)), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["U" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      Sensors\n      '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 22, 'small', [], null, null, null, null, null)), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n        '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 19, 'md-input-container', [['class', 'mat-input-container mat-form-field']], [[2, 'mat-input-invalid',
                null], [2, 'mat-form-field-invalid', null], [2, 'mat-focused',
                null], [2, 'ng-untouched', null], [2, 'ng-touched', null],
            [2, 'ng-pristine', null], [2, 'ng-dirty', null], [2, 'ng-valid',
                null], [2, 'ng-invalid', null], [2, 'ng-pending', null]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._control.focus() !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["w" /* View_MdFormField_0 */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdFormField */])), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](7389184, null, 6, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_16" /* MdFormField */], [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */], [2, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["u" /* MD_PLACEHOLDER_GLOBAL_OPTIONS */]]], null, null), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 1, { _control: 0 }), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 2, { _placeholderChild: 0 }), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 3, { _errorChildren: 1 }), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 4, { _hintChildren: 1 }), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 5, { _prefixChildren: 1 }), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 6, { _suffixChildren: 1 }), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](1, ['\n          '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 1, 8, 'input', [['class', 'mat-input-element'], ['mdInput', ''],
            ['placeholder', 'Filter']], [[8, 'id', 0], [8, 'placeholder', 0], [8, 'disabled',
                0], [8, 'required', 0], [1, 'aria-describedby', 0], [1, 'aria-invalid', 0], [2,
                'ng-untouched', null], [2, 'ng-touched', null], [2, 'ng-pristine',
                null], [2, 'ng-dirty', null], [2, 'ng-valid', null],
            [2, 'ng-invalid', null], [2, 'ng-pending', null]], [[null,
                'ngModelChange'], [null, 'input'], [null, 'blur'], [null,
                'compositionstart'], [null, 'compositionend'], [null,
                'focus']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('input' === en)) {
                var pd_0 = (huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 20)._handleInput($event.target.value) !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 20).onTouched() !== false);
                ad = (pd_1 && ad);
            }
            if (('compositionstart' === en)) {
                var pd_2 = (huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 20)._compositionStart() !== false);
                ad = (pd_2 && ad);
            }
            if (('compositionend' === en)) {
                var pd_3 = (huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 20)._compositionEnd($event.target.value) !== false);
                ad = (pd_3 && ad);
            }
            if (('blur' === en)) {
                var pd_4 = (huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24)._focusChanged(false) !== false);
                ad = (pd_4 && ad);
            }
            if (('focus' === en)) {
                var pd_5 = (huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24)._focusChanged(true) !== false);
                ad = (pd_5 && ad);
            }
            if (('input' === en)) {
                var pd_6 = (huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24)._onInput() !== false);
                ad = (pd_6 && ad);
            }
            if (('ngModelChange' === en)) {
                var pd_7 = ((_co.searchText = $event) !== false);
                ad = (pd_7 && ad);
            }
            return ad;
        }, null, null)), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["c" /* DefaultValueAccessor */], [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */],
            [2, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["a" /* COMPOSITION_BUFFER_MODE */]]], null, null), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](1024, null, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["g" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["c" /* DefaultValueAccessor */]]), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["k" /* NgModel */], [[8,
                null], [8, null], [8, null], [2, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["g" /* NG_VALUE_ACCESSOR */]]], { model: [0, 'model'] }, { update: 'ngModelChange' }), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](2048, null, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["h" /* NgControl */], null, [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["k" /* NgModel */]]), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](933888, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_28" /* MdInput */], [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_cdk_platform__["a" /* Platform */], [2, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["h" /* NgControl */]], [2, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["j" /* NgForm */]],
            [2, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["d" /* FormGroupDirective */]], [2, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["r" /* MD_ERROR_GLOBAL_OPTIONS */]]], { placeholder: [0,
                'placeholder'] }, null), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["i" /* NgControlStatus */], [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_forms__["h" /* NgControl */]], null, null), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](2048, [[1, 4]], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_17" /* MdFormFieldControl */], null, [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_28" /* MdInput */]]), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](1, ['\n        '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 10, 'md-list', [['class', 'mat-list'], ['role', 'list']], null, null, null, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["z" /* View_MdList_0 */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["i" /* RenderType_MdList */])), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdList */], [], null, null),
        huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_32" /* MdListCssMatStyler */], [], null, null), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 4, null, View_HuewiSensorsComponent_2)), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["j" /* NgForOf */], [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, OrderByPipe, []), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, FilterPipe, []), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n    '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_23 = _co.searchText;
        _ck(_v, 22, 0, currVal_23);
        var currVal_24 = 'Filter';
        _ck(_v, 24, 0, currVal_24);
        var currVal_25 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵunv */](_v, 37, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 40).transform(huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵunv */](_v, 37, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 39).transform(_co.sensors, _ck(_v, 38, 0, '+name'))), _co.searchText, 'name'));
        _ck(_v, 37, 0, currVal_25);
    }, function (_ck, _v) {
        var currVal_0 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._control.errorState;
        var currVal_1 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._control.errorState;
        var currVal_2 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._control.focused;
        var currVal_3 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('untouched');
        var currVal_4 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('touched');
        var currVal_5 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('pristine');
        var currVal_6 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('dirty');
        var currVal_7 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('valid');
        var currVal_8 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('invalid');
        var currVal_9 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._shouldForward('pending');
        _ck(_v, 8, 0, currVal_0, currVal_1, currVal_2, currVal_3, currVal_4, currVal_5, currVal_6, currVal_7, currVal_8, currVal_9);
        var currVal_10 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).id;
        var currVal_11 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).placeholder;
        var currVal_12 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).disabled;
        var currVal_13 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).required;
        var currVal_14 = (huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24)._ariaDescribedby || null);
        var currVal_15 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).errorState;
        var currVal_16 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassUntouched;
        var currVal_17 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassTouched;
        var currVal_18 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassPristine;
        var currVal_19 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassDirty;
        var currVal_20 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassValid;
        var currVal_21 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassInvalid;
        var currVal_22 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).ngClassPending;
        _ck(_v, 18, 1, [currVal_10, currVal_11, currVal_12, currVal_13, currVal_14, currVal_15,
            currVal_16, currVal_17, currVal_18, currVal_19, currVal_20, currVal_21, currVal_22]);
    });
}
function View_HuewiSensorsComponent_4(_l) {
    return huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'a', [], [[1, 'target', 0], [8, 'href', 4]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])),
        huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_23" /* MdIcon */], [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_26" /* MdIconRegistry */], [8, null]], null, null), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['navigate_before']))], function (_ck, _v) {
        var currVal_2 = true;
        var currVal_3 = _ck(_v, 2, 0, '/sensors');
        _ck(_v, 1, 0, currVal_2, currVal_3);
        _ck(_v, 5, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).target;
        var currVal_1 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).href;
        _ck(_v, 0, 0, currVal_0, currVal_1);
    });
}
function View_HuewiSensorsComponent_3(_l) {
    return huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 13, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'md-card-title', [['class', 'mat-card-title']], null, null, null, null, null)), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["U" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorsComponent_4)), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["k" /* NgIf */], [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      ', ' - Details\n    '])),
        (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-sensor-details', [], null, null, null, View_HuewiSensorDetailsComponent_0, RenderType_HuewiSensorDetailsComponent)),
        huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_sensor_details_component_HuewiSensorDetailsComponent, [huepi_service_HuepiService,
            ParametersService], { sensor: [0, 'sensor'] }, null), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.back;
        _ck(_v, 7, 0, currVal_0);
        var currVal_2 = _co.selectedSensor;
        _ck(_v, 11, 0, currVal_2);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = _co.selectedSensor.name;
        _ck(_v, 8, 0, currVal_1);
    });
}
function View_HuewiSensorsComponent_0(_l) {
    return huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 9, 'md-card', [['class',
                'mat-card']], [[24, '@RoutingAnimations', 0]], null, null, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["u" /* View_MdCard_0 */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_49" /* MdPrefixRejector */], [[2,
                huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["Q" /* MdCard */], [], null, null),
        (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiSensorsComponent_1)), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["k" /* NgIf */], [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */],
            huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n  '])),
        (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiSensorsComponent_3)),
        huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_10__angular_common__["k" /* NgIf */], [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n \n'])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = !_co.selectedSensor;
        _ck(_v, 5, 0, currVal_1);
        var currVal_2 = _co.selectedSensor;
        _ck(_v, 8, 0, currVal_2);
    }, function (_ck, _v) {
        var currVal_0 = undefined;
        _ck(_v, 0, 0, currVal_0);
    });
}
function View_HuewiSensorsComponent_Host_0(_l) {
    return huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-sensors', [], [[40, '@RoutingAnimations', 0]], null, null, View_HuewiSensorsComponent_0, RenderType_HuewiSensorsComponent)), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_sensors_component_HuewiSensorsComponent, [huepi_service_HuepiService, ParametersService, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).RoutingAnimations;
        _ck(_v, 0, 0, currVal_0);
    });
}
var HuewiSensorsComponentNgFactory = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-sensors', huewi_sensors_component_HuewiSensorsComponent, View_HuewiSensorsComponent_Host_0, { sensors: 'sensors',
    back: 'back' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29ycy5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktc2Vuc29ycy9odWV3aS1zZW5zb3JzLmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29ycy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29ycy5jb21wb25lbnQudHMuSHVld2lTZW5zb3JzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPG1kLWNhcmQgW0BSb3V0aW5nQW5pbWF0aW9uc10+XG5cbiAgPGRpdiAqbmdJZj1cIiFzZWxlY3RlZFNlbnNvclwiPlxuICAgIDxtZC1jYXJkLXRpdGxlPlxuICAgICAgU2Vuc29yc1xuICAgICAgPHNtYWxsPlxuICAgICAgICA8bWQtaW5wdXQtY29udGFpbmVyPlxuICAgICAgICAgIDxpbnB1dCBtZElucHV0IHBsYWNlaG9sZGVyPVwiRmlsdGVyXCIgWyhuZ01vZGVsKV09XCJzZWFyY2hUZXh0XCI+XG4gICAgICAgIDwvbWQtaW5wdXQtY29udGFpbmVyPlxuICAgICAgPC9zbWFsbD5cbiAgICA8L21kLWNhcmQtdGl0bGU+XG4gICAgPG1kLWxpc3Q+XG4gICAgICA8aHVld2ktc2Vuc29yIG1kLWxpc3QtaXRlbVxuICAgICAgICAqbmdGb3I9XCJsZXQgc2Vuc29yIG9mIHNlbnNvcnMgfCBvcmRlckJ5OlsnK25hbWUnXSB8IGZpbHRlcjpzZWFyY2hUZXh0OiduYW1lJ1wiXG4gICAgICAgIFtzZW5zb3JdPVwic2Vuc29yXCI+XG4gICAgICA8L2h1ZXdpLXNlbnNvcj5cbiAgICA8L21kLWxpc3Q+XG4gIDwvZGl2PlxuXG4gIDxkaXYgKm5nSWY9XCJzZWxlY3RlZFNlbnNvclwiPlxuICAgIDxtZC1jYXJkLXRpdGxlPlxuICAgICAgPGEgKm5nSWY9XCJiYWNrXCIgW3JvdXRlckxpbmtdPVwiWycvc2Vuc29ycyddXCIgW3JlcGxhY2VVcmxdPVwidHJ1ZVwiPjxtZC1pY29uPm5hdmlnYXRlX2JlZm9yZTwvbWQtaWNvbj48L2E+XG4gICAgICB7e3NlbGVjdGVkU2Vuc29yLm5hbWV9fSAtIERldGFpbHNcbiAgICA8L21kLWNhcmQtdGl0bGU+XG4gICAgPGh1ZXdpLXNlbnNvci1kZXRhaWxzXG4gICAgICBbc2Vuc29yXT1cInNlbGVjdGVkU2Vuc29yXCI+XG4gICAgPC9odWV3aS1zZW5zb3ItZGV0YWlscz5cbiAgPC9kaXY+XG4gXG48L21kLWNhcmQ+XG4iLCI8aHVld2ktc2Vuc29ycz48L2h1ZXdpLXNlbnNvcnM+Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkNZTTtNQUFBO3dDQUFBLFVBQUE7TUFBQSxpRUFFb0I7TUFBQTtJQUFsQjtJQUZGLFdBRUUsU0FGRjs7OztvQkFWSjtNQUFBLHdFQUE2QjthQUFBLDRCQUMzQjtNQUFBO01BQUEsbURBQUE7TUFBQTthQUFBO01BQWUsNERBRWI7VUFBQTtVQUFBLDRDQUFPO1VBQUEsaUJBQ0w7VUFBQTtjQUFBO2NBQUE7Y0FBQTtrQkFBQTtVQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO1VBQUEsMkRBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQTtVQUFBO1VBQUE7VUFBQSx1QkFBb0IscUNBQ2xCO1VBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQW9DO2NBQUE7Y0FBQTtZQUFBO1lBQXBDO1VBQUEsdUNBQUE7VUFBQTthQUFBO1VBQUEsb0VBQUE7VUFBQTtZQUFBO1VBQUEsb0NBQUE7VUFBQTtVQUFBLHFEQUFBO3VCQUFBLG1DQUFBO3FCQUFBO2NBQUE7Y0FBQSxzQ0FBQTtVQUFBLG1EQUFBO1VBQUEsNEJBQTZELG1DQUMxQztVQUFBLGVBQ2YsMkNBQ007VUFBQSxhQUNoQjtVQUFBOytDQUFBLFVBQUE7VUFBQTthQUFBO2FBQUE7VUFBQSxlQUFTLGlDQUNQO1VBQUEsc0VBQUE7VUFBQTtVQUFBLDhDQUNFO1VBQUEsdURBRWE7VUFBQSxhQUNQOztJQVRnQztJQUFwQyxZQUFvQyxVQUFwQztJQUFlO0lBQWYsWUFBZSxVQUFmO0lBTUY7UUFBQTtRQUFBO0lBREYsWUFDRSxVQURGOztJQU5FO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUEsV0FBQTtRQUFBLDZCQUFBO0lBQ0U7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQSxhQUFBO1FBQUEsNEVBQUE7Ozs7b0JBY0o7TUFBQTtRQUFBO1FBQUE7VUFBQTtjQUFBO1VBQUE7UUFBQTtRQUFBO01BQUEsdUNBQUE7TUFBQTtVQUFBLG1EQUFnQixJQUFnRDtNQUFBO01BQUE7YUFBQTt1QkFBQSxzQ0FBQTtVQUFBO1VBQUEsNkJBQVM7O0lBQTdCO0lBQTVCO0lBQWhCLFdBQTRDLFVBQTVCLFNBQWhCO0lBQWdFOztJQUFoRTtJQUFBO0lBQUEsV0FBQSxtQkFBQTs7OztvQkFGSjtNQUFBLHdFQUE0QjthQUFBLDRCQUMxQjtNQUFBO01BQUEscUNBQUE7TUFBQTthQUFBO01BQWUsNkNBQ2I7VUFBQSxvRUFBQTtVQUFBO1VBQUEsZUFBc0c7TUFFeEYsMkNBQ2hCO1VBQUE7MkZBQUE7YUFBQTsrQkFBQSx1Q0FDNEI7VUFBQSxhQUNMOztJQUxsQjtJQUFILFdBQUcsU0FBSDtJQUlBO0lBREYsWUFDRSxTQURGOzs7SUFId0c7SUFBQTs7OztvQkFyQjVHO01BQUE7MEJBQUEsVUFBQTtvQ0FBQTthQUFBO01BQThCLCtCQUU1QjtVQUFBLHNDQUFBO3dCQUFBLG1DQWVNO01BRU47YUFBQTtVQUFBLGlDQVFNLDhCQUVFO1VBQUE7O0lBM0JIO0lBQUwsV0FBSyxTQUFMO0lBaUJLO0lBQUwsV0FBSyxTQUFMOztJQW5CTztJQUFULFdBQVMsU0FBVDs7OztvQkNBQTtNQUFBO3NDQUFBLFVBQUE7TUFBQTtNQUFBO0lBQUE7O0lBQUE7SUFBQSxXQUFBLFNBQUE7Ozs7OyJ9
//# sourceMappingURL=huewi-sensors.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-bridges/huewi-bridges.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_bridges_component_css_shim_ngstyle_styles = ['input[_ngcontent-%COMP%]{text-align:center;font-size:14px}'];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlcy5jb21wb25lbnQuY3NzLnNoaW0ubmdzdHlsZS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlcy5jb21wb25lbnQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIiAiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7OzsifQ==
//# sourceMappingURL=huewi-bridges.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-bridges/huewi-bridge/huewi-bridge.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_bridge_component_css_shim_ngstyle_styles = [''];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlL2h1ZXdpLWJyaWRnZS5jb21wb25lbnQuY3NzLnNoaW0ubmdzdHlsZS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlL2h1ZXdpLWJyaWRnZS5jb21wb25lbnQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIiAiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7OzsifQ==
//# sourceMappingURL=huewi-bridge.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-bridges/huewi-bridge/huewi-bridge.component.ts
/* harmony import */ var huewi_bridge_component___WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");


var huewi_bridge_component_HuewiBridgeComponent = (function () {
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
    HuewiBridgeComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: huewi_bridge_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return HuewiBridgeComponent;
}());

//# sourceMappingURL=huewi-bridge.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-bridges/huewi-bridge/huewi-bridge.component.ngfactory.ts
/* harmony import */ var huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__ = __webpack_require__("BkNc");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */








var styles_HuewiBridgeComponent = [huewi_bridge_component_css_shim_ngstyle_styles];
var RenderType_HuewiBridgeComponent = huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiBridgeComponent, data: {} });
function View_HuewiBridgeComponent_1(_l) {
    return huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, null, null, huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2,
                huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['link']))], function (_ck, _v) {
        _ck(_v, 2, 0);
    }, null);
}
function View_HuewiBridgeComponent_2(_l) {
    return huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [['style',
                'flex: 1 1 128px']], null, null, null, null, null)), (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    Name: ', '\n  ']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.bridge.name;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiBridgeComponent_0(_l) {
    return huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 13, 'div', [['class',
                'flexcontainer']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.select(_co.bridge) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'div', [['style', 'flex: 1 1 128px']], null, null, null, null, null)),
        (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    ', '\n    '])), (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiBridgeComponent_1)),
        huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiBridgeComponent_2)), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [['style', 'flex: 1 1 128px']], null, null, null, null, null)), (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    ', '\n  '])), (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n'])), (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = (_co.bridge.id.toLowerCase() === _co.config.bridgeid.toLowerCase());
        _ck(_v, 5, 0, currVal_1);
        var currVal_2 = _co.bridge.name;
        _ck(_v, 9, 0, currVal_2);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.bridge.id.toLowerCase();
        _ck(_v, 3, 0, currVal_0);
        var currVal_3 = _co.bridge.internalipaddress;
        _ck(_v, 12, 0, currVal_3);
    });
}
function View_HuewiBridgeComponent_Host_0(_l) {
    return huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-bridge', [], null, null, null, View_HuewiBridgeComponent_0, RenderType_HuewiBridgeComponent)), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_bridge_component_HuewiBridgeComponent, [huepi_service_HuepiService, huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiBridgeComponentNgFactory = huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-bridge', huewi_bridge_component_HuewiBridgeComponent, View_HuewiBridgeComponent_Host_0, { bridge: 'bridge' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlL2h1ZXdpLWJyaWRnZS5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktYnJpZGdlcy9odWV3aS1icmlkZ2UvaHVld2ktYnJpZGdlLmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlL2h1ZXdpLWJyaWRnZS5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlL2h1ZXdpLWJyaWRnZS5jb21wb25lbnQudHMuSHVld2lCcmlkZ2VDb21wb25lbnRfSG9zdC5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIiAiLCI8ZGl2IGNsYXNzPVwiZmxleGNvbnRhaW5lclwiIChjbGljayk9XCJzZWxlY3QoYnJpZGdlKVwiPlxuICA8ZGl2IHN0eWxlPVwiZmxleDogMSAxIDEyOHB4XCI+XG4gICAge3ticmlkZ2UuaWQudG9Mb3dlckNhc2UoKX19XG4gICAgPG1kLWljb24gKm5nSWY9XCJicmlkZ2UuaWQudG9Mb3dlckNhc2UoKSA9PT0gY29uZmlnLmJyaWRnZWlkLnRvTG93ZXJDYXNlKClcIj5saW5rPC9tZC1pY29uPlxuICA8L2Rpdj5cbiAgPGRpdiBzdHlsZT1cImZsZXg6IDEgMSAxMjhweFwiICpuZ0lmPVwiYnJpZGdlLm5hbWVcIj5cbiAgICBOYW1lOiB7e2JyaWRnZS5uYW1lfX1cbiAgPC9kaXY+XG4gIDxkaXYgc3R5bGU9XCJmbGV4OiAxIDEgMTI4cHhcIj5cbiAgICB7e2JyaWRnZS5pbnRlcm5hbGlwYWRkcmVzc319XG4gIDwvZGl2PlxuPC9kaXY+XG4iLCI8aHVld2ktYnJpZGdlPjwvaHVld2ktYnJpZGdlPiJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O29CQ0dJO01BQUE7MEJBQUEsVUFBQTtvQ0FBQTthQUFBO1VBQUEsZ0RBQTJFOztRQUEzRTs7OztvQkFFRjtNQUFBO01BQUEsZ0JBQWlEOzs7UUFBQTtRQUFBOzs7O29CQUxuRDtNQUFBO0lBQUE7SUFBQTtJQUEyQjtNQUFBO01BQUE7SUFBQTtJQUEzQjtFQUFBLGdDQUFvRCx5Q0FDbEQ7YUFBQTtVQUFBO01BQTZCLG9EQUUzQjtVQUFBO2FBQUE7VUFBQSx3QkFBeUYseUNBQ3JGO2lCQUFBLDBCQUNOO1VBQUEsbUVBQUE7VUFBQTtVQUFBLGVBRU0seUNBQ047VUFBQTtVQUFBLDBEQUE2QjtVQUFBLG9CQUV2Qix1Q0FDRjtVQUFBOztJQVJPO0lBQVQsV0FBUyxTQUFUO0lBRTJCO0lBQTdCLFdBQTZCLFNBQTdCOzs7SUFKNkI7SUFBQTtJQU9BO0lBQUE7Ozs7b0JDUi9CO01BQUE7cUNBQUEsVUFBQTtNQUFBO0lBQUE7Ozs7OyJ9
//# sourceMappingURL=huewi-bridge.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-bridges/huewi-bridge-details/huewi-bridge-details.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_bridge_details_component_css_shim_ngstyle_styles = [''];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlLWRldGFpbHMvaHVld2ktYnJpZGdlLWRldGFpbHMuY29tcG9uZW50LmNzcy5zaGltLm5nc3R5bGUudHMiLCJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZzovLy9Vc2Vycy9hcm5kL0RldmVsb3Blci9odWV3aTIvc3JjL2FwcC9odWV3aS1icmlkZ2VzL2h1ZXdpLWJyaWRnZS1kZXRhaWxzL2h1ZXdpLWJyaWRnZS1kZXRhaWxzLmNvbXBvbmVudC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiICJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7OyJ9
//# sourceMappingURL=huewi-bridge-details.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-bridges/huewi-bridge-details/huewi-bridge-details.component.ts
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_rxjs_Observable__ = __webpack_require__("bKpL");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_rxjs_Observable___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_rxjs_Observable__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_rxjs_add_observable_of__ = __webpack_require__("/zHi");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_rxjs_add_observable_of___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_rxjs_add_observable_of__);



var huewi_bridge_details_component_HuewiBridgeDetailsComponent = (function () {
    function HuewiBridgeDetailsComponent(huepiService) {
        this.huepiService = huepiService;
        this.bridge = { name: 'None' };
        this.whitelistObserver = __WEBPACK_IMPORTED_MODULE_1_rxjs_Observable__["Observable"].of(this.whitelist);
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
    HuewiBridgeDetailsComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }]; };
    return HuewiBridgeDetailsComponent;
}());

//# sourceMappingURL=huewi-bridge-details.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-bridges/huewi-bridge-details/huewi-bridge-details.component.ngfactory.ts
/* harmony import */ var huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_cdk_platform__ = __webpack_require__("JYHx");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */









var styles_HuewiBridgeDetailsComponent = [huewi_bridge_details_component_css_shim_ngstyle_styles];
var RenderType_HuewiBridgeDetailsComponent = huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiBridgeDetailsComponent, data: {} });
function View_HuewiBridgeDetailsComponent_2(_l) {
    return huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, null, null, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2,
                huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['link']))], function (_ck, _v) {
        _ck(_v, 2, 0);
    }, null);
}
function View_HuewiBridgeDetailsComponent_3(_l) {
    return huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, null, null, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2,
                huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['link']))], function (_ck, _v) {
        _ck(_v, 2, 0);
    }, null);
}
function View_HuewiBridgeDetailsComponent_1(_l) {
    return huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 26, 'div', [['class',
                'flexcontainer']], null, null, null, null, null)),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 14, 'div', [['style', 'flex: 1 1 256px']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.link(_v.context.$implicit.__key) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      ',
            '\n      '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 8, 'small', [], null, null, null, null, null)),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n        ', '\n        '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 5, 'small', [], null, null, null, null, null)), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n          '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n          '])), (_l()(),
            huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'small', [], null, null, null, null, null)), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n            ', '\n          '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n        '])),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['    \n      '])),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiBridgeDetailsComponent_2)),
        huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_common__["k" /* NgIf */], [huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, [' \n    '])), (_l()(),
            huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 7, 'button', [['class', 'mat-raised-button'], ['md-raised-button', ''], ['style',
                'flex: 0 1 128px']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.delete(_v.context.$implicit.__key) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["H" /* MdButton */], [huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_cdk_platform__["a" /* Platform */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["f" /* FocusOriginMonitor */]], { disabled: [0,
                'disabled'] }, null), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      '])),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiBridgeDetailsComponent_3)),
        huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_common__["k" /* NgIf */], [huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      Delete\n    '])), (_l()(),
            huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_3 = _co.isCurrent(_v.context.$implicit.__key);
        _ck(_v, 15, 0, currVal_3);
        var currVal_5 = _co.isCurrent(_v.context.$implicit.__key);
        _ck(_v, 20, 0, currVal_5);
        var currVal_6 = _co.isCurrent(_v.context.$implicit.__key);
        _ck(_v, 24, 0, currVal_6);
    }, function (_ck, _v) {
        var currVal_0 = _v.context.$implicit.name;
        _ck(_v, 3, 0, currVal_0);
        var currVal_1 = _v.context.$implicit['last use date'];
        _ck(_v, 5, 0, currVal_1);
        var currVal_2 = _v.context.$implicit.__key;
        _ck(_v, 10, 0, currVal_2);
        var currVal_4 = (huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 20).disabled || null);
        _ck(_v, 18, 0, currVal_4);
    });
}
function View_HuewiBridgeDetailsComponent_0(_l) {
    return huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 35, 'md-card', [['class',
                'mat-card']], null, null, null, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["u" /* View_MdCard_0 */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])),
        huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["Q" /* MdCard */], [], null, null), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n  '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 3, 'md-card-subtitle', [['class',
                'mat-card-subtitle']], null, null, null, null, null)), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["T" /* MdCardSubtitle */], [], null, null), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['Details'])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n  '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 25, 'div', [['class', 'flexcontainer wrap justify-center']], null, null, null, null, null)), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [['style',
                'flex: 0 1 256px']], null, null, null, null, null)), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      Id: ', '\n    '])),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [['style', 'flex: 0 1 256px']], null, null, null, null, null)), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      Name: ',
            '\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [['style', 'flex: 0 1 256px']], null, null, null, null, null)), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      Model: ', '\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [['style', 'flex: 0 1 256px']], null, null, null, null, null)),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      Timezone: ', '\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [['style',
                'flex: 0 1 256px']], null, null, null, null, null)), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      Mac: ', '\n    '])),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [['style', 'flex: 0 1 256px']], null, null, null, null, null)), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      Software: ',
            '\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [['style', 'flex: 0 1 256px']], null, null, null, null, null)), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      API: ', '\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [['style', 'flex: 0 1 256px']], null, null, null, null, null)),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      Datastore: ', '\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n'])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n\n'])),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n\n'])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 13, 'md-card', [['class',
                'mat-card']], null, null, null, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["u" /* View_MdCard_0 */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["Q" /* MdCard */], [], null, null),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n  '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 3, 'md-card-subtitle', [['class', 'mat-card-subtitle']], null, null, null, null, null)), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["T" /* MdCardSubtitle */], [], null, null), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['Whitelist authorisations'])),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n  '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 3, null, View_HuewiBridgeDetailsComponent_1)), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_common__["j" /* NgForOf */], [huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, OrderByPipe, []), (_l()(),
            huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n'])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_8 = huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵunv */](_v, 49, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 51).transform(_co.whitelist, _ck(_v, 50, 0, '-last use date')));
        _ck(_v, 49, 0, currVal_8);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.config.bridgeid.toLowerCase();
        _ck(_v, 12, 0, currVal_0);
        var currVal_1 = _co.config.name;
        _ck(_v, 15, 0, currVal_1);
        var currVal_2 = _co.config.modelid;
        _ck(_v, 18, 0, currVal_2);
        var currVal_3 = _co.config.timezone;
        _ck(_v, 21, 0, currVal_3);
        var currVal_4 = _co.config.mac;
        _ck(_v, 24, 0, currVal_4);
        var currVal_5 = _co.config.swversion;
        _ck(_v, 27, 0, currVal_5);
        var currVal_6 = _co.config.apiversion;
        _ck(_v, 30, 0, currVal_6);
        var currVal_7 = _co.config.datastoreversion;
        _ck(_v, 33, 0, currVal_7);
    });
}
function View_HuewiBridgeDetailsComponent_Host_0(_l) {
    return huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-bridge-details', [], null, null, null, View_HuewiBridgeDetailsComponent_0, RenderType_HuewiBridgeDetailsComponent)), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_bridge_details_component_HuewiBridgeDetailsComponent, [huepi_service_HuepiService], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiBridgeDetailsComponentNgFactory = huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-bridge-details', huewi_bridge_details_component_HuewiBridgeDetailsComponent, View_HuewiBridgeDetailsComponent_Host_0, { bridge: 'bridge' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlLWRldGFpbHMvaHVld2ktYnJpZGdlLWRldGFpbHMuY29tcG9uZW50Lm5nZmFjdG9yeS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlLWRldGFpbHMvaHVld2ktYnJpZGdlLWRldGFpbHMuY29tcG9uZW50LnRzIiwibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktYnJpZGdlcy9odWV3aS1icmlkZ2UtZGV0YWlscy9odWV3aS1icmlkZ2UtZGV0YWlscy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlLWRldGFpbHMvaHVld2ktYnJpZGdlLWRldGFpbHMuY29tcG9uZW50LnRzLkh1ZXdpQnJpZGdlRGV0YWlsc0NvbXBvbmVudF9Ib3N0Lmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiICIsIjxtZC1jYXJkPlxuICA8bWQtY2FyZC1zdWJ0aXRsZT5EZXRhaWxzPC9tZC1jYXJkLXN1YnRpdGxlPlxuICA8ZGl2IGNsYXNzPVwiZmxleGNvbnRhaW5lciB3cmFwIGp1c3RpZnktY2VudGVyXCI+XG4gICAgPGRpdiBzdHlsZT1cImZsZXg6IDAgMSAyNTZweFwiPlxuICAgICAgSWQ6IHt7Y29uZmlnLmJyaWRnZWlkLnRvTG93ZXJDYXNlKCl9fVxuICAgIDwvZGl2PlxuICAgIDxkaXYgc3R5bGU9XCJmbGV4OiAwIDEgMjU2cHhcIj5cbiAgICAgIE5hbWU6IHt7Y29uZmlnLm5hbWV9fVxuICAgIDwvZGl2PlxuICAgIDxkaXYgc3R5bGU9XCJmbGV4OiAwIDEgMjU2cHhcIj5cbiAgICAgIE1vZGVsOiB7e2NvbmZpZy5tb2RlbGlkfX1cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IHN0eWxlPVwiZmxleDogMCAxIDI1NnB4XCI+XG4gICAgICBUaW1lem9uZToge3tjb25maWcudGltZXpvbmV9fVxuICAgIDwvZGl2PlxuICAgIDxkaXYgc3R5bGU9XCJmbGV4OiAwIDEgMjU2cHhcIj5cbiAgICAgIE1hYzoge3tjb25maWcubWFjfX1cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IHN0eWxlPVwiZmxleDogMCAxIDI1NnB4XCI+XG4gICAgICBTb2Z0d2FyZToge3tjb25maWcuc3d2ZXJzaW9ufX1cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IHN0eWxlPVwiZmxleDogMCAxIDI1NnB4XCI+XG4gICAgICBBUEk6IHt7Y29uZmlnLmFwaXZlcnNpb259fVxuICAgIDwvZGl2PlxuICAgIDxkaXYgc3R5bGU9XCJmbGV4OiAwIDEgMjU2cHhcIj5cbiAgICAgIERhdGFzdG9yZToge3tjb25maWcuZGF0YXN0b3JldmVyc2lvbn19XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuPC9tZC1jYXJkPlxuXG48YnI+XG5cbjxtZC1jYXJkPlxuICA8bWQtY2FyZC1zdWJ0aXRsZT5XaGl0ZWxpc3QgYXV0aG9yaXNhdGlvbnM8L21kLWNhcmQtc3VidGl0bGU+XG4gIDxkaXYgY2xhc3M9XCJmbGV4Y29udGFpbmVyXCIgKm5nRm9yPVwibGV0IGxpc3RlZCBvZiB3aGl0ZWxpc3QgfCBvcmRlckJ5OlsnLWxhc3QgdXNlIGRhdGUnXVwiPlxuICAgIDxkaXYgc3R5bGU9XCJmbGV4OiAxIDEgMjU2cHhcIiAoY2xpY2spPVwibGluayhsaXN0ZWQuX19rZXkpXCI+XG4gICAgICB7e2xpc3RlZC5uYW1lfX1cbiAgICAgIDxzbWFsbD5cbiAgICAgICAge3tsaXN0ZWRbXCJsYXN0IHVzZSBkYXRlXCJdfX1cbiAgICAgICAgPHNtYWxsPlxuICAgICAgICAgIDwhLS0ge3tsaXN0ZWRbXCJjcmVhdGUgZGF0ZVwiXX19IC0tPlxuICAgICAgICAgIDxzbWFsbD5cbiAgICAgICAgICAgIHt7bGlzdGVkLl9fa2V5fX1cbiAgICAgICAgICA8L3NtYWxsPlxuICAgICAgICA8L3NtYWxsPlxuICAgICAgPC9zbWFsbD4gICAgXG4gICAgICA8bWQtaWNvbiAqbmdJZj1cImlzQ3VycmVudChsaXN0ZWQuX19rZXkpXCI+bGluazwvbWQtaWNvbj4gXG4gICAgPC9kaXY+XG4gICAgPGJ1dHRvbiBtZC1yYWlzZWQtYnV0dG9uIHN0eWxlPVwiZmxleDogMCAxIDEyOHB4XCIgW2Rpc2FibGVkXT1cImlzQ3VycmVudChsaXN0ZWQuX19rZXkpXCIgKGNsaWNrKT1cImRlbGV0ZShsaXN0ZWQuX19rZXkpXCI+XG4gICAgICA8bWQtaWNvbiAqbmdJZj1cImlzQ3VycmVudChsaXN0ZWQuX19rZXkpXCI+bGluazwvbWQtaWNvbj5cbiAgICAgIERlbGV0ZVxuICAgIDwvYnV0dG9uPlxuICA8L2Rpdj5cbjwvbWQtY2FyZD5cbiIsIjxodWV3aS1icmlkZ2UtZGV0YWlscz48L2h1ZXdpLWJyaWRnZS1kZXRhaWxzPiJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkM4Q007TUFBQTswQkFBQSxVQUFBO29DQUFBO2FBQUE7VUFBQSxnREFBeUM7O1FBQXpDOzs7O29CQUdBO01BQUE7MEJBQUEsVUFBQTtvQ0FBQTthQUFBO1VBQUEsZ0RBQXlDOztRQUF6Qzs7OztvQkFmSjtNQUFBO01BQXlGLDJDQUN2RjtVQUFBO1VBQUE7WUFBQTtZQUFBO1lBQTZCO2NBQUE7Y0FBQTtZQUFBO1lBQTdCO1VBQUEsZ0NBQTBEO1VBQUEsY0FFeEQ7VUFBQTtNQUFPLDREQUVMO1VBQUE7VUFBQSw0Q0FBTztVQUFBLG1CQUM2QixpREFDbEM7aUJBQUE7Y0FBQSwwREFBTztVQUFBLG9DQUVDO01BQ0YsNkNBQ0Y7TUFDUjthQUFBO1VBQUEsd0JBQXVELDRDQUNuRDtpQkFBQSw0QkFDTjtVQUFBO2NBQUE7dUJBQUE7WUFBQTtZQUFBO1lBQXNGO2NBQUE7Y0FBQTtZQUFBO1lBQXRGO1VBQUEscURBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7Y0FBQSxtQ0FBQTtVQUFBLDJDQUFxSDtNQUNuSDthQUFBO1VBQUEsd0JBQXVELDZDQUVoRDtpQkFBQTs7SUFMRTtJQUFULFlBQVMsU0FBVDtJQUUrQztJQUFqRCxZQUFpRCxTQUFqRDtJQUNXO0lBQVQsWUFBUyxTQUFUOztJQWR3RDtJQUFBO0lBRWpEO0lBQUE7SUFJSTtJQUFBO0lBT2I7SUFBQSxZQUFBLFNBQUE7Ozs7b0JBaERKO01BQUE7YUFBQTt1QkFBQSxzQ0FBQTtVQUFBLHVEQUFTO1VBQUEsV0FDUDtVQUFBO1VBQUEsdUJBQUE7dUJBQUEsc0NBQUE7VUFBQSwrREFBa0I7VUFBQSxjQUEwQiw2QkFDNUM7VUFBQTtVQUFBLDBEQUErQztVQUFBLGFBQzdDO1VBQUE7VUFBQSxnQkFBNkI7TUFFdkIsMkNBQ047VUFBQTtVQUFBLDhCQUE2QjtVQUFBLFlBRXZCLDJDQUNOO1VBQUE7VUFBQSwwREFBNkI7VUFBQSwrQkFFdkI7TUFDTjtVQUFBO01BQTZCLGdFQUV2QjtVQUFBLGFBQ047VUFBQTtVQUFBLGdCQUE2QjtNQUV2QiwyQ0FDTjtVQUFBO1VBQUEsOEJBQTZCO1VBQUEsWUFFdkIsMkNBQ047VUFBQTtVQUFBLDBEQUE2QjtVQUFBLDZCQUV2QjtNQUNOO1VBQUE7TUFBNkIsaUVBRXZCO1VBQUEsV0FDRiwyQkFDRTtNQUVWO1VBQUEsMERBQUk7VUFBQSxXQUVKO1VBQUE7OEJBQUEsVUFBQTtVQUFBO2FBQUE7TUFBUyw2QkFDUDtVQUFBO1VBQUEscUNBQUE7VUFBQTthQUFBO1VBQUEsZUFBa0I7TUFBMkMsNkJBQzdEO1VBQUEsNENBQUE7VUFBQTtVQUFBLHNCQUEyQiw0Q0FrQnJCO2lCQUFBLFlBQ0U7O0lBbkJtQjtRQUFBO0lBQTNCLFlBQTJCLFNBQTNCOzs7SUEvQitCO0lBQUE7SUFHQTtJQUFBO0lBR0E7SUFBQTtJQUdBO0lBQUE7SUFHQTtJQUFBO0lBR0E7SUFBQTtJQUdBO0lBQUE7SUFHQTtJQUFBOzs7O29CQ3hCakM7TUFBQTs0Q0FBQSxVQUFBO01BQUE7SUFBQTs7Ozs7In0=
//# sourceMappingURL=huewi-bridge-details.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-bridges/huewi-bridges.mock.ts
var HUEWI_BRIDGES_MOCK = [];
//# sourceMappingURL=huewi-bridges.mock.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-bridges/huewi-bridges.component.ts
/* harmony import */ var huewi_bridges_component___WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_bridges_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable__ = __webpack_require__("bKpL");
/* harmony import */ var huewi_bridges_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable___default = __webpack_require__.n(huewi_bridges_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable__);
/* harmony import */ var huewi_bridges_component___WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of__ = __webpack_require__("/zHi");
/* harmony import */ var huewi_bridges_component___WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of___default = __webpack_require__.n(huewi_bridges_component___WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of__);







var huewi_bridges_component_HuewiBridgesComponent = (function () {
    function HuewiBridgesComponent(huepiService, parametersService, activatedRoute, router) {
        this.huepiService = huepiService;
        this.parametersService = parametersService;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.bridges = HUEWI_BRIDGES_MOCK;
        this.back = true;
        this.manualIP = '192.168.0.2';
        this.bridgeObserver = huewi_bridges_component___WEBPACK_IMPORTED_MODULE_4_rxjs_Observable__["Observable"].of(this.bridges);
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
        if (id.indexOf(':') > 0) {
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
    HuewiBridgesComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: ParametersService }, { type: huewi_bridges_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["a" /* ActivatedRoute */] }, { type: huewi_bridges_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return HuewiBridgesComponent;
}());

//# sourceMappingURL=huewi-bridges.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-bridges/huewi-bridges.component.ngfactory.ts
/* harmony import */ var huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__angular_cdk_platform__ = __webpack_require__("JYHx");
/* harmony import */ var huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__angular_forms__ = __webpack_require__("bm2B");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */















var styles_HuewiBridgesComponent = [huewi_bridges_component_css_shim_ngstyle_styles];
var RenderType_HuewiBridgesComponent = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiBridgesComponent, data: { 'animation': [{ type: 7, name: 'RoutingAnimations',
                definitions: [{ type: 0, name: 'void', styles: { type: 6, styles: { top: -32, left: 0, opacity: 0 },
                            offset: null }, options: undefined }, { type: 0, name: '*', styles: { type: 6,
                            styles: { top: 0, left: 0, opacity: 1 }, offset: null }, options: undefined },
                    { type: 1, expr: ':enter', animation: [{ type: 4, styles: { type: 6, styles: { top: 0,
                                        left: 0, opacity: 1 }, offset: null }, timings: '0.2s ease-in-out' }],
                        options: null }, { type: 1, expr: ':leave', animation: [{ type: 4, styles: { type: 6,
                                    styles: { top: -32, left: 0, opacity: 0 }, offset: null }, timings: '0s ease-in-out' }],
                        options: null }], options: {} }] } });
function View_HuewiBridgesComponent_2(_l) {
    return huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class',
                'mat-raised-button'], ['md-raised-button', ''], ['style', 'flex: 0 1 128px']], [[8,
                'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.scan() !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["H" /* MdButton */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_4__angular_cdk_platform__["a" /* Platform */],
            huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["f" /* FocusOriginMonitor */]], null, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['Scan']))], null, function (_ck, _v) {
        var currVal_0 = (huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2).disabled || null);
        _ck(_v, 0, 0, currVal_0);
    });
}
function View_HuewiBridgesComponent_3(_l) {
    return huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class',
                'mat-raised-button'], ['color', 'accent'], ['md-raised-button', ''], ['style', 'flex: 0 1 128px']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.cancelScan() !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["H" /* MdButton */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */],
            __WEBPACK_IMPORTED_MODULE_4__angular_cdk_platform__["a" /* Platform */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["f" /* FocusOriginMonitor */]], { color: [0, 'color'] }, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['Cancel Scan']))], function (_ck, _v) {
        var currVal_1 = 'accent';
        _ck(_v, 2, 0, currVal_1);
    }, function (_ck, _v) {
        var currVal_0 = (huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2).disabled || null);
        _ck(_v, 0, 0, currVal_0);
    });
}
function View_HuewiBridgesComponent_4(_l) {
    return huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-bridge', [['md-list-item', '']], null, null, null, View_HuewiBridgeComponent_0, RenderType_HuewiBridgeComponent)), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_bridge_component_HuewiBridgeComponent, [huepi_service_HuepiService, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_router__["k" /* Router */]], { bridge: [0, 'bridge'] }, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      ']))], function (_ck, _v) {
        var currVal_0 = _v.context.$implicit;
        _ck(_v, 1, 0, currVal_0);
    }, null);
}
function View_HuewiBridgesComponent_1(_l) {
    return huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 57, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-card-title', [['class', 'mat-card-title']], null, null, null, null, null)), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["U" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['Bridges'])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 38, 'div', [['class', 'flexcontainer wrap justify-center']], null, null, null, null, null)),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'mat-raised-button'], ['md-raised-button',
                ''], ['style', 'flex: 0 1 128px']], [[8, 'disabled', 0]], [[null,
                'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.discover() !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["H" /* MdButton */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_4__angular_cdk_platform__["a" /* Platform */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["f" /* FocusOriginMonitor */]], null, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['Discover'])),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiBridgesComponent_2)), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_9__angular_common__["k" /* NgIf */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiBridgesComponent_3)),
        huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_9__angular_common__["k" /* NgIf */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(),
            huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'mat-raised-button'],
                ['md-raised-button', ''], ['style', 'flex: 0 1 128px']], [[8, 'disabled',
                    0]], null, null, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])),
        huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["H" /* MdButton */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_4__angular_cdk_platform__["a" /* Platform */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["f" /* FocusOriginMonitor */]], { disabled: [0, 'disabled'] }, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['Manual IP:'])),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 5, 'input', [['style', 'flex: 0 1 128px']], [[2, 'ng-untouched',
                null], [2, 'ng-touched', null], [2, 'ng-pristine', null],
            [2, 'ng-dirty', null], [2, 'ng-valid', null], [2, 'ng-invalid',
                null], [2, 'ng-pending', null]], [[null, 'ngModelChange'],
            [null, 'keydown.enter'], [null, 'input'], [null,
                'blur'], [null, 'compositionstart'], [null, 'compositionend']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('input' === en)) {
                var pd_0 = (huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 28)._handleInput($event.target.value) !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 28).onTouched() !== false);
                ad = (pd_1 && ad);
            }
            if (('compositionstart' === en)) {
                var pd_2 = (huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 28)._compositionStart() !== false);
                ad = (pd_2 && ad);
            }
            if (('compositionend' === en)) {
                var pd_3 = (huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 28)._compositionEnd($event.target.value) !== false);
                ad = (pd_3 && ad);
            }
            if (('ngModelChange' === en)) {
                var pd_4 = ((_co.manualIP = $event) !== false);
                ad = (pd_4 && ad);
            }
            if (('keydown.enter' === en)) {
                var pd_5 = (_co.connect() !== false);
                ad = (pd_5 && ad);
            }
            return ad;
        }, null, null)), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_10__angular_forms__["c" /* DefaultValueAccessor */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, __WEBPACK_IMPORTED_MODULE_10__angular_forms__["a" /* COMPOSITION_BUFFER_MODE */]]], null, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](1024, null, __WEBPACK_IMPORTED_MODULE_10__angular_forms__["g" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [__WEBPACK_IMPORTED_MODULE_10__angular_forms__["c" /* DefaultValueAccessor */]]), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, __WEBPACK_IMPORTED_MODULE_10__angular_forms__["k" /* NgModel */], [[8,
                null], [8, null], [8, null], [2, __WEBPACK_IMPORTED_MODULE_10__angular_forms__["g" /* NG_VALUE_ACCESSOR */]]], { model: [0, 'model'] }, { update: 'ngModelChange' }), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵprd */](2048, null, __WEBPACK_IMPORTED_MODULE_10__angular_forms__["h" /* NgControl */], null, [__WEBPACK_IMPORTED_MODULE_10__angular_forms__["k" /* NgModel */]]), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_10__angular_forms__["i" /* NgControlStatus */], [__WEBPACK_IMPORTED_MODULE_10__angular_forms__["h" /* NgControl */]], null, null), (_l()(),
            huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'mat-raised-button'], ['md-raised-button', ''], ['style',
                'flex: 0 1 128px']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.connect() !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["H" /* MdButton */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_4__angular_cdk_platform__["a" /* Platform */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["f" /* FocusOriginMonitor */]], null, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['Connect'])),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'mat-raised-button'], ['md-raised-button',
                ''], ['style', 'flex: 0 1 128px']], [[8, 'disabled', 0]], [[null,
                'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.reload() !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["H" /* MdButton */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_4__angular_cdk_platform__["a" /* Platform */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["f" /* FocusOriginMonitor */]], null, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_59" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['Reload'])),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 7, 'md-list', [['class',
                'mat-list'], ['role', 'list']], null, null, null, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["z" /* View_MdList_0 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["i" /* RenderType_MdList */])), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdList */], [], null, null),
        huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_32" /* MdListCssMatStyler */], [], null, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiBridgesComponent_4)), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, __WEBPACK_IMPORTED_MODULE_9__angular_common__["j" /* NgForOf */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n    '])), (_l()(),
            huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = !_co.isScanning();
        _ck(_v, 16, 0, currVal_1);
        var currVal_2 = _co.isScanning();
        _ck(_v, 19, 0, currVal_2);
        var currVal_4 = true;
        _ck(_v, 23, 0, currVal_4);
        var currVal_12 = _co.manualIP;
        _ck(_v, 30, 0, currVal_12);
        var currVal_15 = _co.bridges;
        _ck(_v, 55, 0, currVal_15);
    }, function (_ck, _v) {
        var currVal_0 = (huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).disabled || null);
        _ck(_v, 9, 0, currVal_0);
        var currVal_3 = (huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 23).disabled || null);
        _ck(_v, 21, 0, currVal_3);
        var currVal_5 = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 32).ngClassUntouched;
        var currVal_6 = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 32).ngClassTouched;
        var currVal_7 = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 32).ngClassPristine;
        var currVal_8 = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 32).ngClassDirty;
        var currVal_9 = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 32).ngClassValid;
        var currVal_10 = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 32).ngClassInvalid;
        var currVal_11 = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 32).ngClassPending;
        _ck(_v, 27, 0, currVal_5, currVal_6, currVal_7, currVal_8, currVal_9, currVal_10, currVal_11);
        var currVal_13 = (huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 36).disabled || null);
        _ck(_v, 34, 0, currVal_13);
        var currVal_14 = (huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 42).disabled || null);
        _ck(_v, 40, 0, currVal_14);
    });
}
function View_HuewiBridgesComponent_6(_l) {
    return huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'a', [], [[1, 'target', 0], [8, 'href', 4]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_router__["m" /* RouterLinkWithHref */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_router__["k" /* Router */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_router__["a" /* ActivatedRoute */], __WEBPACK_IMPORTED_MODULE_9__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])),
        huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */], [8, null]], null, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['navigate_before']))], function (_ck, _v) {
        var currVal_2 = true;
        var currVal_3 = _ck(_v, 2, 0, '/bridges');
        _ck(_v, 1, 0, currVal_2, currVal_3);
        _ck(_v, 5, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).target;
        var currVal_1 = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).href;
        _ck(_v, 0, 0, currVal_0, currVal_1);
    });
}
function View_HuewiBridgesComponent_5(_l) {
    return huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 13, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'md-card-title', [['class', 'mat-card-title']], null, null, null, null, null)), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["U" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiBridgesComponent_6)), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_9__angular_common__["k" /* NgIf */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n      Bridge Details\n    '])),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['    \n    '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-bridge-details', [], null, null, null, View_HuewiBridgeDetailsComponent_0, RenderType_HuewiBridgeDetailsComponent)),
        huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_bridge_details_component_HuewiBridgeDetailsComponent, [huepi_service_HuepiService], { bridge: [0, 'bridge'] }, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.back;
        _ck(_v, 7, 0, currVal_0);
        var currVal_1 = _co.selectedBridge;
        _ck(_v, 11, 0, currVal_1);
    }, null);
}
function View_HuewiBridgesComponent_0(_l) {
    return huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 9, 'md-card', [['class',
                'mat-card']], [[24, '@RoutingAnimations', 0]], null, null, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["u" /* View_MdCard_0 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2,
                huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["Q" /* MdCard */], [], null, null),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiBridgesComponent_1)), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_9__angular_common__["k" /* NgIf */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */],
            huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n  '])),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiBridgesComponent_5)),
        huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_9__angular_common__["k" /* NgIf */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n'])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = !_co.selectedBridge;
        _ck(_v, 5, 0, currVal_1);
        var currVal_2 = _co.selectedBridge;
        _ck(_v, 8, 0, currVal_2);
    }, function (_ck, _v) {
        var currVal_0 = undefined;
        _ck(_v, 0, 0, currVal_0);
    });
}
function View_HuewiBridgesComponent_Host_0(_l) {
    return huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-bridges', [], [[40, '@RoutingAnimations', 0]], null, null, View_HuewiBridgesComponent_0, RenderType_HuewiBridgesComponent)), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_bridges_component_HuewiBridgesComponent, [huepi_service_HuepiService, ParametersService, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_router__["a" /* ActivatedRoute */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).RoutingAnimations;
        _ck(_v, 0, 0, currVal_0);
    });
}
var HuewiBridgesComponentNgFactory = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-bridges', huewi_bridges_component_HuewiBridgesComponent, View_HuewiBridgesComponent_Host_0, { bridges: 'bridges',
    back: 'back', manualIP: 'manualIP' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlcy5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktYnJpZGdlcy9odWV3aS1icmlkZ2VzLmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlcy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlcy5jb21wb25lbnQudHMuSHVld2lCcmlkZ2VzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPG1kLWNhcmQgW0BSb3V0aW5nQW5pbWF0aW9uc10+XG5cbiAgPGRpdiAqbmdJZj1cIiFzZWxlY3RlZEJyaWRnZVwiPlxuICA8bWQtY2FyZC10aXRsZT5CcmlkZ2VzPC9tZC1jYXJkLXRpdGxlPlxuICAgIDxkaXYgY2xhc3M9XCJmbGV4Y29udGFpbmVyIHdyYXAganVzdGlmeS1jZW50ZXJcIj5cbiAgICAgIDxidXR0b24gbWQtcmFpc2VkLWJ1dHRvbiBzdHlsZT1cImZsZXg6IDAgMSAxMjhweFwiIChjbGljayk9XCJkaXNjb3ZlcigpXCI+RGlzY292ZXI8L2J1dHRvbj5cbiAgICAgIDxidXR0b24gbWQtcmFpc2VkLWJ1dHRvbiBzdHlsZT1cImZsZXg6IDAgMSAxMjhweFwiIChjbGljayk9XCJzY2FuKClcIiAqbmdJZj1cIiFpc1NjYW5uaW5nKClcIj5TY2FuPC9idXR0b24+XG4gICAgICA8YnV0dG9uIG1kLXJhaXNlZC1idXR0b24gc3R5bGU9XCJmbGV4OiAwIDEgMTI4cHhcIiAoY2xpY2spPVwiY2FuY2VsU2NhbigpXCIgY29sb3I9XCJhY2NlbnRcIiAqbmdJZj1cImlzU2Nhbm5pbmcoKVwiPkNhbmNlbCBTY2FuPC9idXR0b24+XG4gICAgICA8YnV0dG9uIG1kLXJhaXNlZC1idXR0b24gc3R5bGU9XCJmbGV4OiAwIDEgMTI4cHhcIiBbZGlzYWJsZWRdPVwidHJ1ZVwiPk1hbnVhbCBJUDo8L2J1dHRvbj5cbiAgICAgIDxpbnB1dCBzdHlsZT1cImZsZXg6IDAgMSAxMjhweFwiIFsobmdNb2RlbCldPVwibWFudWFsSVBcIiAoa2V5ZG93bi5lbnRlcik9XCJjb25uZWN0KClcIj5cbiAgICAgIDxidXR0b24gbWQtcmFpc2VkLWJ1dHRvbiBzdHlsZT1cImZsZXg6IDAgMSAxMjhweFwiIChjbGljayk9XCJjb25uZWN0KClcIj5Db25uZWN0PC9idXR0b24+XG4gICAgICA8YnV0dG9uIG1kLXJhaXNlZC1idXR0b24gc3R5bGU9XCJmbGV4OiAwIDEgMTI4cHhcIiAoY2xpY2spPVwicmVsb2FkKClcIj5SZWxvYWQ8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgICA8YnI+XG4gICAgPG1kLWxpc3Q+XG4gICAgICA8aHVld2ktYnJpZGdlIG1kLWxpc3QtaXRlbSAqbmdGb3I9XCJsZXQgYnJpZGdlIG9mIGJyaWRnZXNcIiBbYnJpZGdlXT1cImJyaWRnZVwiPlxuICAgICAgPC9odWV3aS1icmlkZ2U+XG4gICAgPC9tZC1saXN0PlxuICA8L2Rpdj5cblxuICA8ZGl2ICpuZ0lmPVwic2VsZWN0ZWRCcmlkZ2VcIj5cbiAgICA8bWQtY2FyZC10aXRsZT5cbiAgICAgIDxhICpuZ0lmPVwiYmFja1wiIFtyb3V0ZXJMaW5rXT1cIlsnL2JyaWRnZXMnXVwiIFtyZXBsYWNlVXJsXT1cInRydWVcIj48bWQtaWNvbj5uYXZpZ2F0ZV9iZWZvcmU8L21kLWljb24+PC9hPlxuICAgICAgQnJpZGdlIERldGFpbHNcbiAgICA8L21kLWNhcmQtdGl0bGU+ICAgIFxuICAgIDxodWV3aS1icmlkZ2UtZGV0YWlscyBbYnJpZGdlXT1cInNlbGVjdGVkQnJpZGdlXCI+XG4gICAgPC9odWV3aS1icmlkZ2UtZGV0YWlscz5cbiAgPC9kaXY+XG5cbjwvbWQtY2FyZD5cbiIsIjxodWV3aS1icmlkZ2VzPjwvaHVld2ktYnJpZGdlcz4iXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkNNTTtNQUFBO01BQUE7SUFBQTtJQUFBO0lBQWlEO01BQUE7TUFBQTtJQUFBO0lBQWpEO0VBQUEscURBQUE7TUFBQTthQUFBOytCQUFBLHNDQUFBO1VBQUE7TUFBd0Y7SUFBeEY7SUFBQSxXQUFBLFNBQUE7Ozs7b0JBQ0E7TUFBQTtNQUFBO1FBQUE7UUFBQTtRQUFpRDtVQUFBO1VBQUE7UUFBQTtRQUFqRDtNQUFBLHFEQUFBOzBCQUFBO01BQUEsc0JBQUE7dUNBQUEsNENBQUE7TUFBQTtNQUE0RztJQUFwQztJQUF4RSxXQUF3RSxTQUF4RTs7SUFBQTtJQUFBLFdBQUEsU0FBQTs7OztvQkFRQTtNQUFBO3dDQUFBLFVBQUE7TUFBQSxpRUFBNEU7TUFBQTtJQUFsQjtJQUExRCxXQUEwRCxTQUExRDs7OztvQkFiSjtNQUFBLHdFQUE2QjthQUFBLDBCQUM3QjtNQUFBO01BQUEscUNBQUE7TUFBQTthQUFBO01BQWUsNENBQXVCO01BQ3BDO1VBQUE7TUFBK0MsNkNBQzdDO1VBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtZQUFpRDtjQUFBO2NBQUE7WUFBQTtZQUFqRDtVQUFBLHFEQUFBO1VBQUE7VUFBQSxvQ0FBQTtVQUFBO1VBQUEsc0JBQUE7VUFBQSwyQ0FBc0U7TUFBaUIsNkNBQ3ZGO1VBQUEsb0VBQUE7VUFBQTtVQUFBLGVBQXFHLDZDQUNyRztVQUFBO2FBQUE7VUFBQSx3QkFBZ0ksNkNBQ2hJO2lCQUFBO2NBQUE7Y0FBQTthQUFBO3VCQUFBLHNDQUFBO1VBQUE7VUFBQSxnREFBQTtVQUFBLDJDQUFtRTtNQUFtQiw2Q0FDdEY7VUFBQTtjQUFBO2NBQUE7a0JBQUE7Y0FBQTtrQkFBQTtVQUFBO1lBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQStCO2NBQUE7Y0FBQTtZQUFBO1lBQXVCO2NBQUE7Y0FBQTtZQUFBO1lBQXREO1VBQUEsdUNBQUE7VUFBQTtVQUFBLHNCQUFBO1FBQUE7TUFBQSxxQ0FBQTtVQUFBO1VBQUEscURBQUE7d0JBQUEsb0NBQUE7OEJBQUEsNkNBQWtGO2lCQUFBLDhCQUNsRjtVQUFBO2NBQUE7dUJBQUE7WUFBQTtZQUFBO1lBQWlEO2NBQUE7Y0FBQTtZQUFBO1lBQWpEO1VBQUEscURBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQSxzQkFBQTtVQUFBLDJDQUFxRTtNQUFnQiw2Q0FDckY7VUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO1lBQWlEO2NBQUE7Y0FBQTtZQUFBO1lBQWpEO1VBQUEscURBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQSxzQkFBQTtVQUFBLDJDQUFvRTtNQUFlLDJDQUMvRTtNQUNOO1VBQUEsMERBQUk7VUFBQSxhQUNKO1VBQUE7OEJBQUEsVUFBQTtVQUFBO2FBQUE7YUFBQTtVQUFBLGVBQVMsaUNBQ1A7VUFBQSxzRUFBQTtVQUFBO1VBQUEsdUNBQ2UsK0JBQ1A7aUJBQUE7O0lBWDBEO0lBQWxFLFlBQWtFLFNBQWxFO0lBQ3VGO0lBQXZGLFlBQXVGLFNBQXZGO0lBQ2lEO0lBQWpELFlBQWlELFNBQWpEO0lBQytCO0lBQS9CLFlBQStCLFVBQS9CO0lBTTJCO0lBQTNCLFlBQTJCLFVBQTNCOztJQVZBO0lBQUEsV0FBQSxTQUFBO0lBR0E7SUFBQSxZQUFBLFNBQUE7SUFDQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBLFlBQUEsdUVBQUE7SUFDQTtJQUFBLFlBQUEsVUFBQTtJQUNBO0lBQUEsWUFBQSxVQUFBOzs7O29CQVdBO01BQUE7UUFBQTtRQUFBO1VBQUE7Y0FBQTtVQUFBO1FBQUE7UUFBQTtNQUFBLHVDQUFBO01BQUE7VUFBQSxtREFBZ0IsSUFBZ0Q7TUFBQTtNQUFBO2FBQUE7dUJBQUEsc0NBQUE7VUFBQTtVQUFBLDZCQUFTOztJQUE3QjtJQUE1QjtJQUFoQixXQUE0QyxVQUE1QixTQUFoQjtJQUFnRTs7SUFBaEU7SUFBQTtJQUFBLFdBQUEsbUJBQUE7Ozs7b0JBRko7TUFBQSx3RUFBNEI7YUFBQSw0QkFDMUI7TUFBQTtNQUFBLHFDQUFBO01BQUE7YUFBQTtNQUFlLDZDQUNiO1VBQUEsb0VBQUE7VUFBQTtVQUFBLGVBQXNHO01BRXhGLCtDQUNoQjtVQUFBO1VBQUE7YUFBQTtVQUFBLHFDQUFnRDtNQUN6Qjs7SUFKbEI7SUFBSCxXQUFHLFNBQUg7SUFHb0I7SUFBdEIsWUFBc0IsU0FBdEI7Ozs7b0JBekJKO01BQUE7MEJBQUEsVUFBQTtvQ0FBQTthQUFBO01BQThCLCtCQUU1QjtVQUFBLHNDQUFBO3dCQUFBLG1DQWdCTTtNQUVOO2FBQUE7VUFBQSx3QkFPTSw2QkFFRTtVQUFBOztJQTNCSDtJQUFMLFdBQUssU0FBTDtJQWtCSztJQUFMLFdBQUssU0FBTDs7SUFwQk87SUFBVCxXQUFTLFNBQVQ7Ozs7b0JDQUE7TUFBQTtzQ0FBQSxVQUFBO01BQUE7TUFBQTtJQUFBOztJQUFBO0lBQUEsV0FBQSxTQUFBOzs7OzsifQ==
//# sourceMappingURL=huewi-bridges.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-home/huewi-home.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_home_component_css_shim_ngstyle_styles = ['@media screen and (orientation:landscape){div.sized[_ngcontent-%COMP%]{float:left;width:50%}}@media screen and (orientation:portrait){div.sized[_ngcontent-%COMP%]{float:left;width:100%}}embed[_ngcontent-%COMP%]{width:100%;min-height:100vh}'];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWhvbWUvaHVld2ktaG9tZS5jb21wb25lbnQuY3NzLnNoaW0ubmdzdHlsZS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWhvbWUvaHVld2ktaG9tZS5jb21wb25lbnQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIiAiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7OzsifQ==
//# sourceMappingURL=huewi-home.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/pipes/safe.pipe.ts
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser__ = __webpack_require__("fc+i");

var SafePipe = (function () {
    function SafePipe(sanitizer) {
        this.sanitizer = sanitizer;
    }
    SafePipe.prototype.transform = function (url) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    };
    SafePipe.ctorParameters = function () { return [{ type: __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser__["c" /* DomSanitizer */] }]; };
    return SafePipe;
}());

//# sourceMappingURL=safe.pipe.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-home/huewi-home.component.ts
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__("BkNc");


var huewi_home_component_HuewiHomeComponent = (function () {
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
    HuewiHomeComponent.ctorParameters = function () { return [{ type: __WEBPACK_IMPORTED_MODULE_1__angular_router__["a" /* ActivatedRoute */] }, { type: ParametersService }]; };
    return HuewiHomeComponent;
}());

//# sourceMappingURL=huewi-home.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-home/huewi-home.component.ngfactory.ts
/* harmony import */ var huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__angular_platform_browser__ = __webpack_require__("fc+i");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */













var styles_HuewiHomeComponent = [huewi_home_component_css_shim_ngstyle_styles];
var RenderType_HuewiHomeComponent = huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiHomeComponent, data: {} });
function View_HuewiHomeComponent_1(_l) {
    return huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 15, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 5, 'div', [['class', 'sized']], null, null, null, null, null)), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n        '])), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-groups', [], [[40, '@RoutingAnimations',
                0]], null, null, View_HuewiGroupsComponent_0, RenderType_HuewiGroupsComponent)),
        huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_groups_component_HuewiGroupsComponent, [huepi_service_HuepiService, ParametersService,
            __WEBPACK_IMPORTED_MODULE_6__angular_router__["a" /* ActivatedRoute */], __WEBPACK_IMPORTED_MODULE_6__angular_router__["k" /* Router */]], null, null), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n        '])), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 5, 'div', [['class',
                'sized']], null, null, null, null, null)),
        (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n        '])), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-lights', [], [[40, '@RoutingAnimations', 0]], null, null, View_HuewiLightsComponent_0, RenderType_HuewiLightsComponent)),
        huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_lights_component_HuewiLightsComponent, [huepi_service_HuepiService, ParametersService,
            __WEBPACK_IMPORTED_MODULE_6__angular_router__["a" /* ActivatedRoute */], __WEBPACK_IMPORTED_MODULE_6__angular_router__["k" /* Router */]], null, null), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n        '])), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        _ck(_v, 5, 0);
        _ck(_v, 12, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 5).RoutingAnimations;
        _ck(_v, 4, 0, currVal_0);
        var currVal_1 = huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).RoutingAnimations;
        _ck(_v, 11, 0, currVal_1);
    });
}
function View_HuewiHomeComponent_3(_l) {
    return huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'div', [], [[2, 'sized', null]], null, null, null, null)),
        (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n        '])), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'embed', [], [[8, 'src', 5]], null, null, null, null)), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵppd */](1), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    ']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = (_co.customElements.length >= 2);
        _ck(_v, 0, 0, currVal_0);
        var currVal_1 = huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵunv */](_v, 2, 0, _ck(_v, 3, 0, huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v.parent.parent, 0), _v.context.$implicit));
        _ck(_v, 2, 0, currVal_1);
    });
}
function View_HuewiHomeComponent_2(_l) {
    return huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    '])), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiHomeComponent_3)), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["j" /* NgForOf */], [huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */], huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.customElements;
        _ck(_v, 3, 0, currVal_0);
    }, null);
}
function View_HuewiHomeComponent_0(_l) {
    return huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, SafePipe, [__WEBPACK_IMPORTED_MODULE_11__angular_platform_browser__["c" /* DomSanitizer */]]), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiHomeComponent_1)), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["k" /* NgIf */], [huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n\n'])), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiHomeComponent_2)), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["k" /* NgIf */], [huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = (_co.customElements.length === 0);
        _ck(_v, 2, 0, currVal_0);
        var currVal_1 = (_co.customElements.length >= 1);
        _ck(_v, 5, 0, currVal_1);
    }, null);
}
function View_HuewiHomeComponent_Host_0(_l) {
    return huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-home', [], null, null, null, View_HuewiHomeComponent_0, RenderType_HuewiHomeComponent)),
        huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_home_component_HuewiHomeComponent, [__WEBPACK_IMPORTED_MODULE_6__angular_router__["a" /* ActivatedRoute */], ParametersService], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiHomeComponentNgFactory = huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-home', huewi_home_component_HuewiHomeComponent, View_HuewiHomeComponent_Host_0, {}, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWhvbWUvaHVld2ktaG9tZS5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktaG9tZS9odWV3aS1ob21lLmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWhvbWUvaHVld2ktaG9tZS5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWhvbWUvaHVld2ktaG9tZS5jb21wb25lbnQudHMuSHVld2lIb21lQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPGRpdiAqbmdJZj1cImN1c3RvbUVsZW1lbnRzLmxlbmd0aCA9PT0gMFwiPlxuICAgIDxkaXYgY2xhc3M9XCJzaXplZFwiPlxuICAgICAgICA8aHVld2ktZ3JvdXBzPlxuICAgICAgICA8L2h1ZXdpLWdyb3Vwcz5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwic2l6ZWRcIj5cbiAgICAgICAgPGh1ZXdpLWxpZ2h0cz5cbiAgICAgICAgPC9odWV3aS1saWdodHM+XG4gICAgPC9kaXY+XG48L2Rpdj5cblxuPGRpdiAqbmdJZj1cImN1c3RvbUVsZW1lbnRzLmxlbmd0aCA+PSAxXCI+XG4gICAgPGRpdiBbY2xhc3Muc2l6ZWRdPVwiY3VzdG9tRWxlbWVudHMubGVuZ3RoID49IDJcIiAqbmdGb3I9XCJsZXQgZWxlbWVudCBvZiBjdXN0b21FbGVtZW50c1wiPlxuICAgICAgICA8ZW1iZWQgW3NyY109XCJlbGVtZW50IHwgc2FmZVwiPlxuICAgIDwvZGl2PlxuPC9kaXY+XG4iLCI8aHVld2ktaG9tZT48L2h1ZXdpLWhvbWU+Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkNBQTtNQUFBLHdFQUF5QzthQUFBLDRCQUNyQztNQUFBO01BQUEsZ0JBQW1CLCtDQUNmO01BQUE7VUFBQTthQUFBO3FDQUFBLCtCQUFjO1VBQUEsaUJBQ0MsMkNBQ2I7VUFBQSxhQUNOO1VBQUE7TUFBbUIsK0NBQ2Y7VUFBQTtVQUFBO2FBQUE7cUNBQUEsK0JBQWM7VUFBQSxpQkFDQywyQ0FDYjtVQUFBO0lBTkY7SUFJQTs7SUFKQTtJQUFBLFdBQUEsU0FBQTtJQUlBO0lBQUEsWUFBQSxTQUFBOzs7O29CQU1KO01BQUE7TUFBdUYsK0NBQ25GO1VBQUE7VUFBQSxxQ0FBTyxJQUF1Qjs7O1FBRDdCO1FBQUwsV0FBSyxTQUFMO1FBQ1c7WUFBQTtRQUFQLFdBQU8sU0FBUDs7OztvQkFGUjtNQUFBLHdFQUF3QzthQUFBLDRCQUNwQztNQUFBLG1EQUFBO01BQUE7TUFBQSxlQUVNOztJQUYwQztJQUFoRCxXQUFnRCxTQUFoRDs7OzsrREFaSjtNQUFBLCtFQUFBO01BQUE7TUFBQSxlQVNNLHlDQUVOO01BQUEsK0VBQUE7TUFBQTtNQUFBLGVBSU07O0lBZkQ7SUFBTCxXQUFLLFNBQUw7SUFXSztJQUFMLFdBQUssU0FBTDs7OztvQkNYQTtNQUFBO2FBQUE7VUFBQTtJQUFBOzs7OyJ9
//# sourceMappingURL=huewi-home.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-about/huewi-about.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_about_component_css_shim_ngstyle_styles = [''];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWFib3V0L2h1ZXdpLWFib3V0LmNvbXBvbmVudC5jc3Muc2hpbS5uZ3N0eWxlLnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktYWJvdXQvaHVld2ktYWJvdXQuY29tcG9uZW50LmNzcyJdLCJzb3VyY2VzQ29udGVudCI6WyIgIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7In0=
//# sourceMappingURL=huewi-about.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-about/huewi-about.component.ts
var HuewiAboutComponent = (function () {
    function HuewiAboutComponent() {
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
    HuewiAboutComponent.ctorParameters = function () { return []; };
    return HuewiAboutComponent;
}());

//# sourceMappingURL=huewi-about.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-about/huewi-about.component.ngfactory.ts
/* harmony import */ var huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_common__ = __webpack_require__("qbdv");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */







var styles_HuewiAboutComponent = [huewi_about_component_css_shim_ngstyle_styles];
var RenderType_HuewiAboutComponent = huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiAboutComponent, data: { 'animation': [{ type: 7, name: 'RoutingAnimations',
                definitions: [{ type: 0, name: 'void', styles: { type: 6, styles: { top: -32, left: 0, opacity: 0 },
                            offset: null }, options: undefined }, { type: 0, name: '*', styles: { type: 6,
                            styles: { top: 0, left: 0, opacity: 1 }, offset: null }, options: undefined },
                    { type: 1, expr: ':enter', animation: [{ type: 4, styles: { type: 6, styles: { top: 0,
                                        left: 0, opacity: 1 }, offset: null }, timings: '0.2s ease-in-out' }],
                        options: null }, { type: 1, expr: ':leave', animation: [{ type: 4, styles: { type: 6,
                                    styles: { top: -32, left: 0, opacity: 0 }, offset: null }, timings: '0s ease-in-out' }],
                        options: null }], options: {} }] } });
function View_HuewiAboutComponent_1(_l) {
    return huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'md-card', [['class',
                'mat-card']], null, null, null, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["u" /* View_MdCard_0 */], huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])),
        huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["Q" /* MdCard */], [], null, null), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n    '])), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 1, 'i', [], null, null, null, null, null)), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n    Using HammerJS for touch-events and -sequences like you just discovered.\n    '])),
        (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n  ']))], null, null);
}
function View_HuewiAboutComponent_0(_l) {
    return huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 40, 'md-card', [['class',
                'mat-card']], [[24, '@RoutingAnimations', 0]], [[null, 'swipeleft'], [null,
                'swiperight'], [null, 'tap'], [null, 'press']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('swipeleft' === en)) {
                var pd_0 = (_co.onTouch($event.type) !== false);
                ad = (pd_0 && ad);
            }
            if (('swiperight' === en)) {
                var pd_1 = (_co.onTouch($event.type) !== false);
                ad = (pd_1 && ad);
            }
            if (('tap' === en)) {
                var pd_2 = (_co.onTouch($event.type) !== false);
                ad = (pd_2 && ad);
            }
            if (('press' === en)) {
                var pd_3 = (_co.onTouch($event.type) !== false);
                ad = (pd_3 && ad);
            }
            return ad;
        }, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["u" /* View_MdCard_0 */], huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["Q" /* MdCard */], [], null, null),
        (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 3, 'md-card-title', [['class', 'mat-card-title']], null, null, null, null, null)), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["U" /* MdCardTitle */], [], null, null), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['About'])), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 3, 'md-card-subtitle', [['class', 'mat-card-subtitle']], null, null, null, null, null)), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["T" /* MdCardSubtitle */], [], null, null), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['hue Web Interface...'])), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 3, 'md-card', [['class', 'mat-card']], null, null, null, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["u" /* View_MdCard_0 */], huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["Q" /* MdCard */], [], null, null), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n    Made with Angular 2+, Angular Material, Flexbox, HammerJS, huepi and a little focus with some patience.\n  '])),
        (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n  '])), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 6, 'md-card', [['class',
                'mat-card']], null, null, null, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["u" /* View_MdCard_0 */], huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["Q" /* MdCard */], [], null, null),
        (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n    Designed as a sample application for '])), (_l()(),
            huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 1, 'a', [['url', 'https://github.com/ArndBrugman/huepi']], null, null, null, null, null)),
        (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['huepi'])), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['.\n  '])), (_l()(),
            huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n  '])), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 9, 'md-card', [['class',
                'mat-card']], null, null, null, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["u" /* View_MdCard_0 */], huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["Q" /* MdCard */], [], null, null),
        (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n    This application can also  hide toolbar and navbar to run as a widget with parameter &widget=true.\n    It is even possible to use a custom homescreen with embedded widgets by using parameters like \n    groups=0 for a detail view on all lights group and/or sensors=1 for the daylight sensor,\n    give it a '])),
        (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 4, 'a', [], [[1, 'target', 0], [8, 'href',
                4]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 32).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_common__["h" /* LocationStrategy */]], { queryParams: [0, 'queryParams'],
            routerLink: [1, 'routerLink'] }, null), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_38" /* ɵpod */]({ sensors: 0, groups: 1 }),
        huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['try'])), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['.\n  '])),
        (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n  '])), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiAboutComponent_1)), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_common__["k" /* NgIf */], [huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */],
            huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n'])),
        (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_3 = _ck(_v, 33, 0, '1', '0');
        var currVal_4 = _ck(_v, 34, 0, '/home');
        _ck(_v, 32, 0, currVal_3, currVal_4);
        var currVal_5 = _co.touchDiscovered;
        _ck(_v, 39, 0, currVal_5);
    }, function (_ck, _v) {
        var currVal_0 = undefined;
        _ck(_v, 0, 0, currVal_0);
        var currVal_1 = huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 32).target;
        var currVal_2 = huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 32).href;
        _ck(_v, 31, 0, currVal_1, currVal_2);
    });
}
function View_HuewiAboutComponent_Host_0(_l) {
    return huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-about', [], [[40, '@RoutingAnimations', 0]], null, null, View_HuewiAboutComponent_0, RenderType_HuewiAboutComponent)), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, HuewiAboutComponent, [], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).RoutingAnimations;
        _ck(_v, 0, 0, currVal_0);
    });
}
var HuewiAboutComponentNgFactory = huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-about', HuewiAboutComponent, View_HuewiAboutComponent_Host_0, { touchSequence: 'touchSequence' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWFib3V0L2h1ZXdpLWFib3V0LmNvbXBvbmVudC5uZ2ZhY3RvcnkudHMiLCJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZzovLy9Vc2Vycy9hcm5kL0RldmVsb3Blci9odWV3aTIvc3JjL2FwcC9odWV3aS1hYm91dC9odWV3aS1hYm91dC5jb21wb25lbnQudHMiLCJuZzovLy9Vc2Vycy9hcm5kL0RldmVsb3Blci9odWV3aTIvc3JjL2FwcC9odWV3aS1hYm91dC9odWV3aS1hYm91dC5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWFib3V0L2h1ZXdpLWFib3V0LmNvbXBvbmVudC50cy5IdWV3aUFib3V0Q29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPG1kLWNhcmQgW0BSb3V0aW5nQW5pbWF0aW9uc11cbihzd2lwZWxlZnQpPVwib25Ub3VjaCgkZXZlbnQudHlwZSlcIlxuKHN3aXBlcmlnaHQpPVwib25Ub3VjaCgkZXZlbnQudHlwZSlcIlxuKHRhcCk9XCJvblRvdWNoKCRldmVudC50eXBlKVwiXG4ocHJlc3MpPVwib25Ub3VjaCgkZXZlbnQudHlwZSlcIj5cblxuICA8bWQtY2FyZC10aXRsZT5BYm91dDwvbWQtY2FyZC10aXRsZT5cblxuICA8bWQtY2FyZC1zdWJ0aXRsZT5odWUgV2ViIEludGVyZmFjZS4uLjwvbWQtY2FyZC1zdWJ0aXRsZT5cblxuICA8bWQtY2FyZD5cbiAgICBNYWRlIHdpdGggQW5ndWxhciAyKywgQW5ndWxhciBNYXRlcmlhbCwgRmxleGJveCwgSGFtbWVySlMsIGh1ZXBpIGFuZCBhIGxpdHRsZSBmb2N1cyB3aXRoIHNvbWUgcGF0aWVuY2UuXG4gIDwvbWQtY2FyZD5cbiAgPG1kLWNhcmQ+XG4gICAgRGVzaWduZWQgYXMgYSBzYW1wbGUgYXBwbGljYXRpb24gZm9yIDxhIHVybD0naHR0cHM6Ly9naXRodWIuY29tL0FybmRCcnVnbWFuL2h1ZXBpJz5odWVwaTwvYT4uXG4gIDwvbWQtY2FyZD5cbiAgPG1kLWNhcmQ+XG4gICAgVGhpcyBhcHBsaWNhdGlvbiBjYW4gYWxzbyAgaGlkZSB0b29sYmFyIGFuZCBuYXZiYXIgdG8gcnVuIGFzIGEgd2lkZ2V0IHdpdGggcGFyYW1ldGVyICZ3aWRnZXQ9dHJ1ZS5cbiAgICBJdCBpcyBldmVuIHBvc3NpYmxlIHRvIHVzZSBhIGN1c3RvbSBob21lc2NyZWVuIHdpdGggZW1iZWRkZWQgd2lkZ2V0cyBieSB1c2luZyBwYXJhbWV0ZXJzIGxpa2UgXG4gICAgZ3JvdXBzPTAgZm9yIGEgZGV0YWlsIHZpZXcgb24gYWxsIGxpZ2h0cyBncm91cCBhbmQvb3Igc2Vuc29ycz0xIGZvciB0aGUgZGF5bGlnaHQgc2Vuc29yLFxuICAgIGdpdmUgaXQgYSA8YSBbcm91dGVyTGlua109XCJbJy9ob21lJ11cIiBbcXVlcnlQYXJhbXNdPVwie3NlbnNvcnM6ICcxJywgZ3JvdXBzOiAnMCd9XCI+dHJ5PC9hPi5cbiAgPC9tZC1jYXJkPlxuICA8bWQtY2FyZCAqbmdJZj1cInRvdWNoRGlzY292ZXJlZFwiPlxuICAgIDxpPlxuICAgIFVzaW5nIEhhbW1lckpTIGZvciB0b3VjaC1ldmVudHMgYW5kIC1zZXF1ZW5jZXMgbGlrZSB5b3UganVzdCBkaXNjb3ZlcmVkLlxuICAgIDwvaT5cbiAgPC9tZC1jYXJkPlxuXG48L21kLWNhcmQ+XG4iLCI8aHVld2ktYWJvdXQ+PC9odWV3aS1hYm91dD4iXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JDc0JFO01BQUE7YUFBQTt1QkFBQSxzQ0FBQTtVQUFBLHVEQUFpQztVQUFBLGFBQy9CO1VBQUEsMERBQUc7VUFBQTtNQUVDOzs7b0JBekJSO01BQUE7TUFBQTtJQUFBO0lBQUE7SUFDQTtNQUFBO01BQUE7SUFBQTtJQUNBO01BQUE7TUFBQTtJQUFBO0lBQ0E7TUFBQTtNQUFBO0lBQUE7SUFDQTtNQUFBO01BQUE7SUFBQTtJQUpBO0VBQUEsaURBQUE7TUFBQTthQUFBO01BSStCLCtCQUU3QjtVQUFBO1VBQUEsdUJBQUE7dUJBQUEsc0NBQUE7VUFBQSw0REFBZTtVQUFBLFlBQXFCLCtCQUVwQztVQUFBO1VBQUEsbURBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUEsMkNBQWtCO1VBQUEsMkJBQXVDLCtCQUV6RDtVQUFBO1VBQUEsNkRBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUEsNkJBQVM7TUFFQyw2QkFDVjtVQUFBOzhCQUFBLFVBQUE7VUFBQTthQUFBO01BQVMsb0VBQzhCO2lCQUFBO2NBQUE7TUFBOEMsMENBQVMsOEJBQ3BGO2lCQUFBLGNBQ1Y7VUFBQTs4QkFBQSxVQUFBO1VBQUE7YUFBQTtNQUFTO01BSUc7VUFBQTtRQUFBO1FBQUE7VUFBQTtjQUFBO1VBQUE7UUFBQTtRQUFBO01BQUEsdUNBQUE7VUFBQTtjQUFBLG1EQUE0QjthQUF6QixJQUFxRSx3Q0FBTztNQUNqRiw2QkFDVjtVQUFBLG9DQUFBO3dCQUFBLG1DQUlVO01BRUY7O0lBUmdDO0lBQXpCO0lBQUgsWUFBNEIsVUFBekIsU0FBSDtJQUVIO0lBQVQsWUFBUyxTQUFUOztJQXRCTztJQUFULFdBQVMsU0FBVDtJQW9CYztJQUFBO0lBQUEsWUFBQSxtQkFBQTs7OztvQkNwQmQ7TUFBQTtvQ0FBQSxVQUFBO01BQUE7SUFBQTs7SUFBQTtJQUFBLFdBQUEsU0FBQTs7Ozs7In0=
//# sourceMappingURL=huewi-about.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/app.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var app_component_css_shim_ngstyle_styles = ['.mat-sidenav[_ngcontent-%COMP%]{min-width:30%;max-width:70%}md-icon[_ngcontent-%COMP%]{padding-right:32px}'];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2FwcC5jb21wb25lbnQuY3NzLnNoaW0ubmdzdHlsZS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2FwcC5jb21wb25lbnQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIiAiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7OzsifQ==
//# sourceMappingURL=app.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-connectionstatus/huewi-connectionstatus.component.css.shim.ngstyle.ts
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */ var huewi_connectionstatus_component_css_shim_ngstyle_styles = ['.status[_ngcontent-%COMP%]{text-align:center;position:fixed;width:100%;left:-8px;bottom:-8px;z-index:999}'];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWNvbm5lY3Rpb25zdGF0dXMvaHVld2ktY29ubmVjdGlvbnN0YXR1cy5jb21wb25lbnQuY3NzLnNoaW0ubmdzdHlsZS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWNvbm5lY3Rpb25zdGF0dXMvaHVld2ktY29ubmVjdGlvbnN0YXR1cy5jb21wb25lbnQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIiAiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7OzsifQ==
//# sourceMappingURL=huewi-connectionstatus.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-connectionstatus/huewi-connectionstatus.component.ts

var huewi_connectionstatus_component_HuewiConnectionstatusComponent = (function () {
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
    HuewiConnectionstatusComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }]; };
    return HuewiConnectionstatusComponent;
}());

//# sourceMappingURL=huewi-connectionstatus.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-connectionstatus/huewi-connectionstatus.component.ngfactory.ts
/* harmony import */ var huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_common__ = __webpack_require__("qbdv");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */







var styles_HuewiConnectionstatusComponent = [huewi_connectionstatus_component_css_shim_ngstyle_styles];
var RenderType_HuewiConnectionstatusComponent = huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiConnectionstatusComponent, data: { 'animation': [{ type: 7, name: 'StatusAnimations',
                definitions: [{ type: 0, name: 'void', styles: { type: 6, styles: { opacity: 0, transform: 'translate3d(0, 32px, 0)' },
                            offset: null }, options: undefined }, { type: 0, name: '*', styles: { type: 6,
                            styles: { opacity: 1, transform: 'translate3d(0, 0, 0)' }, offset: null },
                        options: undefined }, { type: 1, expr: ':enter', animation: [{ type: 4, styles: null,
                                timings: '0.5s ease-in-out' }], options: null }, { type: 1, expr: ':leave',
                        animation: [{ type: 4, styles: null, timings: '1.0s ease-in-out' }], options: null }],
                options: {} }] } });
function View_HuewiConnectionstatusComponent_2(_l) {
    return huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 8, 'md-toolbar', [['class',
                'mat-toolbar'], ['role', 'toolbar']], [[24, '@StatusAnimations', 0]], null, null, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["G" /* View_MdToolbar_0 */], huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["q" /* RenderType_MdToolbar */])), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_92" /* MdToolbar */], [huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], { color: [0, 'color'] }, null), (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n    '])), (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 3, 'small', [], null, null, null, null, null)), (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'small', [], null, null, null, null, null)), (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['', ''])), (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = _co.accent;
        _ck(_v, 2, 0, currVal_1);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = undefined;
        _ck(_v, 0, 0, currVal_0);
        var currVal_2 = _co.getMessage();
        _ck(_v, 7, 0, currVal_2);
    });
}
function View_HuewiConnectionstatusComponent_1(_l) {
    return huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 18, 'md-card', [['class',
                'status mat-card']], [[24, '@StatusAnimations', 0]], null, null, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["u" /* View_MdCard_0 */], huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["Q" /* MdCard */], [], null, null),
        (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 2, 'md-progress-bar', [['aria-valuemax', '100'], ['aria-valuemin', '0'], ['class', 'mat-progress-bar'],
            ['mode', 'indeterminate'], ['role', 'progressbar']], [[1, 'aria-valuenow',
                0], [1, 'mode', 0], [2, 'mat-primary', null], [2, 'mat-accent', null],
            [2, 'mat-warn', null]], null, null, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["A" /* View_MdProgressBar_0 */], huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["k" /* RenderType_MdProgressBar */])), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_50" /* MdProgressBar */], [], { mode: [0, 'mode'] }, null), (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n  '])), (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 6, 'md-toolbar', [['class', 'mat-toolbar'], ['role', 'toolbar']], null, null, null, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["G" /* View_MdToolbar_0 */], huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["q" /* RenderType_MdToolbar */])),
        huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_92" /* MdToolbar */], [huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], { color: [0, 'color'] }, null),
        (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n    '])), (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 1, 'div', [], null, null, null, null, null)),
        (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['', ''])), (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n  '])), (_l()(),
            huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n  '])), (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiConnectionstatusComponent_2)), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_common__["k" /* NgIf */], [huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(),
            huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_6 = 'indeterminate';
        _ck(_v, 6, 0, currVal_6);
        var currVal_7 = _co.warn;
        _ck(_v, 10, 0, currVal_7);
        var currVal_9 = (_co.getMessage() !== '');
        _ck(_v, 17, 0, currVal_9);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = undefined;
        _ck(_v, 0, 0, currVal_0);
        var currVal_1 = huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 6).value;
        var currVal_2 = huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 6).mode;
        var currVal_3 = (huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 6).color == 'primary');
        var currVal_4 = (huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 6).color == 'accent');
        var currVal_5 = (huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 6).color == 'warn');
        _ck(_v, 4, 0, currVal_1, currVal_2, currVal_3, currVal_4, currVal_5);
        var currVal_8 = _co.getStatus();
        _ck(_v, 13, 0, currVal_8);
    });
}
function View_HuewiConnectionstatusComponent_0(_l) {
    return huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiConnectionstatusComponent_1)), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_common__["k" /* NgIf */], [huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(),
            huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = (_co.getStatus() !== 'Connected');
        _ck(_v, 1, 0, currVal_0);
    }, null);
}
function View_HuewiConnectionstatusComponent_Host_0(_l) {
    return huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-connectionstatus', [], [[40, '@StatusAnimations', 0]], null, null, View_HuewiConnectionstatusComponent_0, RenderType_HuewiConnectionstatusComponent)), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_connectionstatus_component_HuewiConnectionstatusComponent, [huepi_service_HuepiService], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).StatusAnimations;
        _ck(_v, 0, 0, currVal_0);
    });
}
var HuewiConnectionstatusComponentNgFactory = huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-connectionstatus', huewi_connectionstatus_component_HuewiConnectionstatusComponent, View_HuewiConnectionstatusComponent_Host_0, {}, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWNvbm5lY3Rpb25zdGF0dXMvaHVld2ktY29ubmVjdGlvbnN0YXR1cy5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktY29ubmVjdGlvbnN0YXR1cy9odWV3aS1jb25uZWN0aW9uc3RhdHVzLmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWNvbm5lY3Rpb25zdGF0dXMvaHVld2ktY29ubmVjdGlvbnN0YXR1cy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWNvbm5lY3Rpb25zdGF0dXMvaHVld2ktY29ubmVjdGlvbnN0YXR1cy5jb21wb25lbnQudHMuSHVld2lDb25uZWN0aW9uc3RhdHVzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPG1kLWNhcmQgY2xhc3M9XCJzdGF0dXNcIiAqbmdJZj1cImdldFN0YXR1cygpICE9PSAnQ29ubmVjdGVkJ1wiIFtAU3RhdHVzQW5pbWF0aW9uc10+XG5cbiAgPG1kLXByb2dyZXNzLWJhciBtb2RlPVwiaW5kZXRlcm1pbmF0ZVwiPjwvbWQtcHJvZ3Jlc3MtYmFyPlxuICA8bWQtdG9vbGJhciBbY29sb3JdPVwid2FyblwiID5cbiAgICA8ZGl2Pnt7Z2V0U3RhdHVzKCl9fTwvZGl2PlxuICA8L21kLXRvb2xiYXI+XG4gIDxtZC10b29sYmFyIFtjb2xvcl09XCJhY2NlbnRcIiAqbmdJZj1cImdldE1lc3NhZ2UoKSAhPT0gJydcIiBbQFN0YXR1c0FuaW1hdGlvbnNdPlxuICAgIDxzbWFsbD48c21hbGw+PGRpdj57e2dldE1lc3NhZ2UoKX19PC9kaXY+PC9zbWFsbD48L3NtYWxsPlxuICA8L21kLXRvb2xiYXI+XG5cbjwvbWQtY2FyZD5cbiIsIjxodWV3aS1jb25uZWN0aW9uc3RhdHVzPjwvaHVld2ktY29ubmVjdGlvbnN0YXR1cz4iXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkNNRTtNQUFBO01BQUEsbUVBQUE7TUFBQTtNQUFBLHNCQUFBO01BQUEsbUNBQTZFLCtCQUMzRTtNQUFBO01BQUEsOEJBQU87TUFBQTtNQUFBLGdCQUFPO01BQUEsd0VBQUs7YUFBQSx5QkFBc0M7O0lBRC9DO0lBQVosV0FBWSxTQUFaOzs7SUFBeUQ7SUFBekQsV0FBeUQsU0FBekQ7SUFDcUI7SUFBQTs7OztvQkFQdkI7TUFBQTsyQ0FBQSxVQUFBO01BQUE7YUFBQTtNQUFnRiwrQkFFOUU7VUFBQTtjQUFBO2NBQUE7Y0FBQTtxQ0FBQSxVQUFBO1VBQUE7YUFBQTtVQUFBLGVBQXdELDZCQUN4RDtVQUFBO1VBQUE7YUFBQTt1QkFBQSxzQ0FBQTtVQUFBO01BQTRCLCtCQUMxQjtVQUFBO01BQUssd0NBQXFCLDZCQUNmO2lCQUFBLGNBQ2I7VUFBQSwrQ0FBQTtVQUFBLHNFQUVhO2lCQUFBOztJQU5JO0lBQWpCLFdBQWlCLFNBQWpCO0lBQ1k7SUFBWixZQUFZLFNBQVo7SUFHNkI7SUFBN0IsWUFBNkIsU0FBN0I7OztJQU4wRDtJQUE1RCxXQUE0RCxTQUE1RDtJQUVFO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQSxXQUFBLGlEQUFBO0lBRU87SUFBQTs7OztvQkFKVDtNQUFBLCtDQUFBO01BQUEsc0VBVVU7YUFBQTs7SUFWYztJQUF4QixXQUF3QixTQUF4Qjs7OztvQkNBQTtNQUFBOytDQUFBLFVBQUE7TUFBQTtJQUFBOztJQUFBO0lBQUEsV0FBQSxTQUFBOzs7OzsifQ==
//# sourceMappingURL=huewi-connectionstatus.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/app.component.ngfactory.ts
/* harmony import */ var app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var app_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_cdk_platform__ = __webpack_require__("JYHx");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__angular_cdk_bidi__ = __webpack_require__("UPmf");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__angular_cdk_scrolling__ = __webpack_require__("vVgA");
/* harmony import */ var app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var app_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__angular_cdk_a11y__ = __webpack_require__("dGUy");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__angular_platform_browser__ = __webpack_require__("fc+i");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */















var styles_AppComponent = [app_component_css_shim_ngstyle_styles];
var RenderType_AppComponent = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0, styles: styles_AppComponent,
    data: {} });
function View_AppComponent_1(_l) {
    return app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 17, 'md-toolbar', [['class', 'mat-toolbar'], ['color', 'primary'], ['role', 'toolbar']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["G" /* View_MdToolbar_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["q" /* RenderType_MdToolbar */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_92" /* MdToolbar */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], { color: [0, 'color'] }, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      '])),
        (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 9, 'button', [['class', 'mat-icon-button'], ['md-icon-button',
                '']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v.parent, 15).toggle() !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdButton_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["H" /* MdButton */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_cdk_platform__["a" /* Platform */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["f" /* FocusOriginMonitor */]], null, null),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_24" /* MdIconButtonCssMatStyler */], [], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n        '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */], [8, null]], null, null),
        (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['menu'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 1, 'div', [], null, null, null, null, null)), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['', ''])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n    ']))], function (_ck, _v) {
        var currVal_0 = 'primary';
        _ck(_v, 2, 0, currVal_0);
        _ck(_v, 11, 0);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 6).disabled || null);
        _ck(_v, 4, 0, currVal_1);
        var currVal_2 = _co.title;
        _ck(_v, 16, 0, currVal_2);
    });
}
function View_AppComponent_2(_l) {
    return app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 48, 'nav', [['class',
                'mat-tab-nav-bar'], ['md-tab-nav-bar', '']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["F" /* View_MdTabNav_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["p" /* RenderType_MdTabNav */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](3325952, [['navbar', 4]], 1, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_88" /* MdTabNav */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, __WEBPACK_IMPORTED_MODULE_5__angular_cdk_bidi__["c" /* Directionality */]], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["J" /* NgZone */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 2, { _tabLinks: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n    '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 7, 'a', [['class', 'mat-tab-link'],
            ['md-tab-link', ''], ['routerLinkActive', 'active-link']], [[1, 'aria-disabled', 0],
            [1, 'tabindex', 0], [2, 'mat-tab-disabled', null], [1, 'target', 0], [8, 'href',
                4]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 6).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](147456, [[2, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_87" /* MdTabLink */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_88" /* MdTabNav */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["J" /* NgZone */], __WEBPACK_IMPORTED_MODULE_6__angular_cdk_scrolling__["g" /* ViewportRuler */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_cdk_platform__["a" /* Platform */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["v" /* MD_RIPPLE_GLOBAL_OPTIONS */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[4, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 3, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 4, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['Home'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n    '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 7, 'a', [['class', 'mat-tab-link'], ['md-tab-link', ''], ['routerLinkActive', 'active-link']], [[1, 'aria-disabled', 0], [1, 'tabindex', 0], [2, 'mat-tab-disabled', null],
            [1, 'target', 0], [8, 'href', 4]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](147456, [[2, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_87" /* MdTabLink */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_88" /* MdTabNav */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["J" /* NgZone */], __WEBPACK_IMPORTED_MODULE_6__angular_cdk_scrolling__["g" /* ViewportRuler */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_cdk_platform__["a" /* Platform */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["v" /* MD_RIPPLE_GLOBAL_OPTIONS */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[6, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 5, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 6, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['Groups'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n    '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 7, 'a', [['class', 'mat-tab-link'], ['md-tab-link', ''], ['routerLinkActive', 'active-link']], [[1, 'aria-disabled', 0], [1, 'tabindex', 0], [2, 'mat-tab-disabled', null],
            [1, 'target', 0], [8, 'href', 4]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](147456, [[2, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_87" /* MdTabLink */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_88" /* MdTabNav */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["J" /* NgZone */], __WEBPACK_IMPORTED_MODULE_6__angular_cdk_scrolling__["g" /* ViewportRuler */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_cdk_platform__["a" /* Platform */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["v" /* MD_RIPPLE_GLOBAL_OPTIONS */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[8, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 7, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 8, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['Lights'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n    '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 7, 'a', [['class', 'mat-tab-link'], ['md-tab-link', ''], ['routerLinkActive', 'active-link']], [[1, 'aria-disabled', 0], [1, 'tabindex', 0], [2, 'mat-tab-disabled', null],
            [1, 'target', 0], [8, 'href', 4]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 33).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](147456, [[2, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_87" /* MdTabLink */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_88" /* MdTabNav */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["J" /* NgZone */], __WEBPACK_IMPORTED_MODULE_6__angular_cdk_scrolling__["g" /* ViewportRuler */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_cdk_platform__["a" /* Platform */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["v" /* MD_RIPPLE_GLOBAL_OPTIONS */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[10, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 9, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 10, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['Bridges'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n    '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 7, 'a', [['class', 'mat-tab-link'], ['md-tab-link', ''], ['routerLinkActive', 'active-link']], [[1, 'aria-disabled', 0], [1, 'tabindex', 0], [2, 'mat-tab-disabled', null],
            [1, 'target', 0], [8, 'href', 4]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 42).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](147456, [[2, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_87" /* MdTabLink */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_88" /* MdTabNav */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["J" /* NgZone */], __WEBPACK_IMPORTED_MODULE_6__angular_cdk_scrolling__["g" /* ViewportRuler */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_cdk_platform__["a" /* Platform */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["v" /* MD_RIPPLE_GLOBAL_OPTIONS */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[12, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 11, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 12, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['About'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n  ']))], function (_ck, _v) {
        var currVal_5 = true;
        var currVal_6 = _ck(_v, 7, 0, '/home');
        _ck(_v, 6, 0, currVal_5, currVal_6);
        var currVal_7 = 'active-link';
        _ck(_v, 8, 0, currVal_7);
        var currVal_13 = true;
        var currVal_14 = _ck(_v, 16, 0, '/groups');
        _ck(_v, 15, 0, currVal_13, currVal_14);
        var currVal_15 = 'active-link';
        _ck(_v, 17, 0, currVal_15);
        var currVal_21 = true;
        var currVal_22 = _ck(_v, 25, 0, '/lights');
        _ck(_v, 24, 0, currVal_21, currVal_22);
        var currVal_23 = 'active-link';
        _ck(_v, 26, 0, currVal_23);
        var currVal_29 = true;
        var currVal_30 = _ck(_v, 34, 0, '/bridges');
        _ck(_v, 33, 0, currVal_29, currVal_30);
        var currVal_31 = 'active-link';
        _ck(_v, 35, 0, currVal_31);
        var currVal_37 = true;
        var currVal_38 = _ck(_v, 43, 0, '/about');
        _ck(_v, 42, 0, currVal_37, currVal_38);
        var currVal_39 = 'active-link';
        _ck(_v, 44, 0, currVal_39);
    }, function (_ck, _v) {
        var currVal_0 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 5).disabled.toString();
        var currVal_1 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 5).tabIndex;
        var currVal_2 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 5).disabled;
        var currVal_3 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 6).target;
        var currVal_4 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 6).href;
        _ck(_v, 4, 0, currVal_0, currVal_1, currVal_2, currVal_3, currVal_4);
        var currVal_8 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 14).disabled.toString();
        var currVal_9 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 14).tabIndex;
        var currVal_10 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 14).disabled;
        var currVal_11 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).target;
        var currVal_12 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).href;
        _ck(_v, 13, 0, currVal_8, currVal_9, currVal_10, currVal_11, currVal_12);
        var currVal_16 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 23).disabled.toString();
        var currVal_17 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 23).tabIndex;
        var currVal_18 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 23).disabled;
        var currVal_19 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).target;
        var currVal_20 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).href;
        _ck(_v, 22, 0, currVal_16, currVal_17, currVal_18, currVal_19, currVal_20);
        var currVal_24 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 32).disabled.toString();
        var currVal_25 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 32).tabIndex;
        var currVal_26 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 32).disabled;
        var currVal_27 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 33).target;
        var currVal_28 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 33).href;
        _ck(_v, 31, 0, currVal_24, currVal_25, currVal_26, currVal_27, currVal_28);
        var currVal_32 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 41).disabled.toString();
        var currVal_33 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 41).tabIndex;
        var currVal_34 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 41).disabled;
        var currVal_35 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 42).target;
        var currVal_36 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 42).href;
        _ck(_v, 40, 0, currVal_32, currVal_33, currVal_34, currVal_35, currVal_36);
    });
}
function View_AppComponent_0(_l) {
    return app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 192, 'div', [], [[8, 'className', 0]], null, null, null, null)),
        (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n\n'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 185, 'md-sidenav-container', [['class', 'mat-drawer-container mat-sidenav-container'],
            ['fullscreen', '']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["B" /* View_MdSidenavContainer_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["m" /* RenderType_MdSidenavContainer */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1097728, null, 1, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_67" /* MdSidenavContainer */], [[2, __WEBPACK_IMPORTED_MODULE_5__angular_cdk_bidi__["c" /* Directionality */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["J" /* NgZone */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 1, { _drawers: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](1, ['\n\n  '])),
        (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 1, 1, null, View_AppComponent_1)),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_common__["k" /* NgIf */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](1, ['\n\n  '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 1, 1, null, View_AppComponent_2)), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_common__["k" /* NgIf */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null),
        (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](1, ['\n\n  '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 169, 'md-sidenav', [['class', 'mat-drawer mat-sidenav'], ['tabIndex', '-1']], [[40, '@transform',
                0], [1, 'align', 0], [2, 'mat-drawer-end', null], [2, 'mat-drawer-over',
                null], [2, 'mat-drawer-push', null], [2, 'mat-drawer-side',
                null]], [['component', '@transform.start'], ['component', '@transform.done'],
            [null, 'keydown']], function (_v, en, $event) {
            var ad = true;
            if (('component:@transform.start' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15)._onAnimationStart() !== false);
                ad = (pd_0 && ad);
            }
            if (('component:@transform.done' === en)) {
                var pd_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15)._onAnimationEnd($event) !== false);
                ad = (pd_1 && ad);
            }
            if (('keydown' === en)) {
                var pd_2 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).handleKeydown($event) !== false);
                ad = (pd_2 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["C" /* View_MdSidenav_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["l" /* RenderType_MdSidenav */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1228800, [[1, 4], ['sidenav', 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_66" /* MdSidenav */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_9__angular_cdk_a11y__["e" /* FocusTrapFactory */], [2, __WEBPACK_IMPORTED_MODULE_10__angular_platform_browser__["b" /* DOCUMENT */]]], null, null),
        (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n    '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 164, 'md-nav-list', [['class', 'mat-nav-list'], ['role', 'list']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["z" /* View_MdList_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["i" /* RenderType_MdList */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdList */], [], null, null),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_42" /* MdNavListCssMatStyler */], [], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 13, 'a', [['class', 'mat-list-item'], ['md-list-item', ''], ['role', 'listitem'],
            ['routerLinkActive', 'active-link']], [[1, 'target', 0], [8, 'href', 4]], [[null,
                'click'], [null, 'focus'], [null, 'blur']], function (_v, en, $event) {
            var ad = true;
            if (('focus' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 23)._handleFocus() !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 23)._handleBlur() !== false);
                ad = (pd_1 && ad);
            }
            if (('click' === en)) {
                var pd_2 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 26).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_2 && ad);
            }
            if (('click' === en)) {
                var pd_3 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).toggle() !== false);
                ad = (pd_3 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["y" /* View_MdListItem_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["j" /* RenderType_MdListItem */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1097728, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_34" /* MdListItem */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdList */]], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_42" /* MdNavListCssMatStyler */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 13, { _lines: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 14, { _hasAvatar: 0 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[16, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'], routerLink: [1,
                'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 15, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 16, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 2, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */], [8, null]], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['home'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](2, ['Home'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 13, 'a', [['class', 'mat-list-item'], ['md-list-item', ''], ['role', 'listitem'],
            ['routerLinkActive', 'active-link']], [[1, 'target', 0], [8, 'href', 4]], [[null,
                'click'], [null, 'focus'], [null, 'blur']], function (_v, en, $event) {
            var ad = true;
            if (('focus' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 38)._handleFocus() !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 38)._handleBlur() !== false);
                ad = (pd_1 && ad);
            }
            if (('click' === en)) {
                var pd_2 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 41).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_2 && ad);
            }
            if (('click' === en)) {
                var pd_3 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).toggle() !== false);
                ad = (pd_3 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["y" /* View_MdListItem_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["j" /* RenderType_MdListItem */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1097728, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_34" /* MdListItem */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdList */]], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_42" /* MdNavListCssMatStyler */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 17, { _lines: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 18, { _hasAvatar: 0 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[20, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'], routerLink: [1,
                'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 19, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 20, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 2, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */], [8, null]], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['group_work'])), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](2, ['Groups'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 13, 'a', [['class', 'mat-list-item'], ['md-list-item', ''], ['role',
                'listitem'], ['routerLinkActive', 'active-link']], [[1, 'target', 0], [8, 'href',
                4]], [[null, 'click'], [null, 'focus'], [null,
                'blur']], function (_v, en, $event) {
            var ad = true;
            if (('focus' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 53)._handleFocus() !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 53)._handleBlur() !== false);
                ad = (pd_1 && ad);
            }
            if (('click' === en)) {
                var pd_2 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 56).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_2 && ad);
            }
            if (('click' === en)) {
                var pd_3 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).toggle() !== false);
                ad = (pd_3 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["y" /* View_MdListItem_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["j" /* RenderType_MdListItem */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1097728, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_34" /* MdListItem */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdList */]], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_42" /* MdNavListCssMatStyler */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 21, { _lines: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 22, { _hasAvatar: 0 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[24, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'], routerLink: [1,
                'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 23, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 24, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 2, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */], [8, null]], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['lightbulb_outline'])), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](2, ['Lights'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 3, 'md-divider', [['aria-orientation', 'horizontal'], ['class',
                'mat-divider'], ['role', 'separator']], null, null, null, null, null)), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_33" /* MdListDivider */], [], null, null),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdDividerCssMatStyler */], [], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 13, 'a', [['class', 'mat-list-item'], ['md-list-item', ''], ['role', 'listitem'],
            ['routerLinkActive', 'active-link']], [[1, 'target', 0], [8, 'href', 4]], [[null,
                'click'], [null, 'focus'], [null, 'blur']], function (_v, en, $event) {
            var ad = true;
            if (('focus' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 73)._handleFocus() !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 73)._handleBlur() !== false);
                ad = (pd_1 && ad);
            }
            if (('click' === en)) {
                var pd_2 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 76).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_2 && ad);
            }
            if (('click' === en)) {
                var pd_3 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).toggle() !== false);
                ad = (pd_3 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["y" /* View_MdListItem_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["j" /* RenderType_MdListItem */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1097728, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_34" /* MdListItem */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdList */]], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_42" /* MdNavListCssMatStyler */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 25, { _lines: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 26, { _hasAvatar: 0 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[28, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'], routerLink: [1,
                'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 27, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 28, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 2, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */], [8, null]], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['assignment'])), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](2, ['Rules'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 13, 'a', [['class', 'mat-list-item'], ['md-list-item', ''], ['role',
                'listitem'], ['routerLinkActive', 'active-link']], [[1, 'target', 0], [8, 'href',
                4]], [[null, 'click'], [null, 'focus'], [null,
                'blur']], function (_v, en, $event) {
            var ad = true;
            if (('focus' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 88)._handleFocus() !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 88)._handleBlur() !== false);
                ad = (pd_1 && ad);
            }
            if (('click' === en)) {
                var pd_2 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 91).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_2 && ad);
            }
            if (('click' === en)) {
                var pd_3 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).toggle() !== false);
                ad = (pd_3 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["y" /* View_MdListItem_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["j" /* RenderType_MdListItem */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1097728, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_34" /* MdListItem */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdList */]], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_42" /* MdNavListCssMatStyler */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 29, { _lines: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 30, { _hasAvatar: 0 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[32, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'], routerLink: [1,
                'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 31, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 32, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 2, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */], [8, null]], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['assignment_ind'])), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](2, ['Scenes'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 13, 'a', [['class', 'mat-list-item'], ['md-list-item', ''], ['role',
                'listitem'], ['routerLinkActive', 'active-link']], [[1, 'target', 0], [8, 'href',
                4]], [[null, 'click'], [null, 'focus'], [null,
                'blur']], function (_v, en, $event) {
            var ad = true;
            if (('focus' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 103)._handleFocus() !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 103)._handleBlur() !== false);
                ad = (pd_1 && ad);
            }
            if (('click' === en)) {
                var pd_2 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 106).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_2 && ad);
            }
            if (('click' === en)) {
                var pd_3 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).toggle() !== false);
                ad = (pd_3 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["y" /* View_MdListItem_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["j" /* RenderType_MdListItem */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1097728, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_34" /* MdListItem */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdList */]], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_42" /* MdNavListCssMatStyler */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 33, { _lines: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 34, { _hasAvatar: 0 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[36, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'], routerLink: [1,
                'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 35, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 36, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 2, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */], [8, null]], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['alarm'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](2, ['Schedules'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 13, 'a', [['class', 'mat-list-item'], ['md-list-item', ''], ['role', 'listitem'],
            ['routerLinkActive', 'active-link']], [[1, 'target', 0], [8, 'href', 4]], [[null,
                'click'], [null, 'focus'], [null, 'blur']], function (_v, en, $event) {
            var ad = true;
            if (('focus' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 118)._handleFocus() !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 118)._handleBlur() !== false);
                ad = (pd_1 && ad);
            }
            if (('click' === en)) {
                var pd_2 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 121).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_2 && ad);
            }
            if (('click' === en)) {
                var pd_3 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).toggle() !== false);
                ad = (pd_3 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["y" /* View_MdListItem_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["j" /* RenderType_MdListItem */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1097728, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_34" /* MdListItem */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdList */]], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_42" /* MdNavListCssMatStyler */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 37, { _lines: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 38, { _hasAvatar: 0 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[40, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'], routerLink: [1,
                'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 39, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 40, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 2, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */], [8, null]], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['all_out'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](2, ['Sensors'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 3, 'md-divider', [['aria-orientation', 'horizontal'], ['class', 'mat-divider'],
            ['role', 'separator']], null, null, null, null, null)), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_33" /* MdListDivider */], [], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdDividerCssMatStyler */], [], null, null),
        (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 13, 'a', [['class',
                'mat-list-item'], ['md-list-item', ''], ['role', 'listitem'], ['routerLinkActive',
                'active-link']], [[1, 'target', 0], [8, 'href', 4]], [[null, 'click'], [null,
                'focus'], [null, 'blur']], function (_v, en, $event) {
            var ad = true;
            if (('focus' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 138)._handleFocus() !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 138)._handleBlur() !== false);
                ad = (pd_1 && ad);
            }
            if (('click' === en)) {
                var pd_2 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 141).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_2 && ad);
            }
            if (('click' === en)) {
                var pd_3 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).toggle() !== false);
                ad = (pd_3 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["y" /* View_MdListItem_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["j" /* RenderType_MdListItem */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1097728, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_34" /* MdListItem */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdList */]], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_42" /* MdNavListCssMatStyler */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 41, { _lines: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 42, { _hasAvatar: 0 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[44, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'], routerLink: [1,
                'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 43, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 44, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 2, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */], [8, null]], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['device_hub'])), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](2, ['Bridges'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 13, 'a', [['class', 'mat-list-item'], ['md-list-item', ''], ['role',
                'listitem'], ['routerLinkActive', 'active-link']], [[1, 'target', 0], [8, 'href',
                4]], [[null, 'click'], [null, 'focus'], [null,
                'blur']], function (_v, en, $event) {
            var ad = true;
            if (('focus' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 153)._handleFocus() !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 153)._handleBlur() !== false);
                ad = (pd_1 && ad);
            }
            if (('click' === en)) {
                var pd_2 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 156).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_2 && ad);
            }
            if (('click' === en)) {
                var pd_3 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).toggle() !== false);
                ad = (pd_3 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["y" /* View_MdListItem_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["j" /* RenderType_MdListItem */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1097728, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_34" /* MdListItem */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdList */]], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_42" /* MdNavListCssMatStyler */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 45, { _lines: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 46, { _hasAvatar: 0 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[48, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'], routerLink: [1,
                'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 47, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 48, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 2, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */], [8, null]], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['info'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](2, ['About'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 3, 'md-divider', [['aria-orientation', 'horizontal'], ['class', 'mat-divider'],
            ['role', 'separator']], null, null, null, null, null)), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_33" /* MdListDivider */], [], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdDividerCssMatStyler */], [], null, null),
        (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 8, 'a', [['class',
                'mat-list-item'], ['md-list-item', ''], ['role', 'listitem']], null, [[null, 'click'], [null, 'focus'], [null, 'blur']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('focus' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 173)._handleFocus() !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 173)._handleBlur() !== false);
                ad = (pd_1 && ad);
            }
            if (('click' === en)) {
                var pd_2 = (_co.toggleTheme() !== false);
                ad = (pd_2 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["y" /* View_MdListItem_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["j" /* RenderType_MdListItem */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1097728, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_34" /* MdListItem */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdList */]], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_42" /* MdNavListCssMatStyler */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](603979776, 49, { _lines: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_41" /* ɵqud */](335544320, 50, { _hasAvatar: 0 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 2, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdIcon_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdIcon */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_49" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["i" /* MATERIAL_COMPATIBILITY_MODE */]], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_23" /* MdIcon */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_26" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['invert_colors'])),
        (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](2, ['Theme'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n    '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](0, ['\n  '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](1, ['\n\n  '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](16777216, null, 1, 2, 'router-outlet', [], null, null, null, null, null)), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](212992, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["o" /* RouterOutlet */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["b" /* ChildrenOutletContexts */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["m" /* ComponentFactoryResolver */],
            [8, null], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], null, null),
        (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n  '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](1, ['\n\n'])), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n\n'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-connectionstatus', [], [[40, '@StatusAnimations', 0]], null, null, View_HuewiConnectionstatusComponent_0, RenderType_HuewiConnectionstatusComponent)),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_connectionstatus_component_HuewiConnectionstatusComponent, [huepi_service_HuepiService], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n'])), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, ['\n\n'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵted */](null, [' ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = !_co.parameters.widget;
        _ck(_v, 8, 0, currVal_1);
        var currVal_2 = !_co.parameters.widget;
        _ck(_v, 11, 0, currVal_2);
        var currVal_11 = true;
        var currVal_12 = _ck(_v, 27, 0, '/home');
        _ck(_v, 26, 0, currVal_11, currVal_12);
        var currVal_13 = 'active-link';
        _ck(_v, 28, 0, currVal_13);
        _ck(_v, 33, 0);
        var currVal_16 = true;
        var currVal_17 = _ck(_v, 42, 0, '/groups');
        _ck(_v, 41, 0, currVal_16, currVal_17);
        var currVal_18 = 'active-link';
        _ck(_v, 43, 0, currVal_18);
        _ck(_v, 48, 0);
        var currVal_21 = true;
        var currVal_22 = _ck(_v, 57, 0, '/lights');
        _ck(_v, 56, 0, currVal_21, currVal_22);
        var currVal_23 = 'active-link';
        _ck(_v, 58, 0, currVal_23);
        _ck(_v, 63, 0);
        var currVal_26 = true;
        var currVal_27 = _ck(_v, 77, 0, '/rules');
        _ck(_v, 76, 0, currVal_26, currVal_27);
        var currVal_28 = 'active-link';
        _ck(_v, 78, 0, currVal_28);
        _ck(_v, 83, 0);
        var currVal_31 = true;
        var currVal_32 = _ck(_v, 92, 0, '/scenes');
        _ck(_v, 91, 0, currVal_31, currVal_32);
        var currVal_33 = 'active-link';
        _ck(_v, 93, 0, currVal_33);
        _ck(_v, 98, 0);
        var currVal_36 = true;
        var currVal_37 = _ck(_v, 107, 0, '/schedules');
        _ck(_v, 106, 0, currVal_36, currVal_37);
        var currVal_38 = 'active-link';
        _ck(_v, 108, 0, currVal_38);
        _ck(_v, 113, 0);
        var currVal_41 = true;
        var currVal_42 = _ck(_v, 122, 0, '/sensors');
        _ck(_v, 121, 0, currVal_41, currVal_42);
        var currVal_43 = 'active-link';
        _ck(_v, 123, 0, currVal_43);
        _ck(_v, 128, 0);
        var currVal_46 = true;
        var currVal_47 = _ck(_v, 142, 0, '/bridges');
        _ck(_v, 141, 0, currVal_46, currVal_47);
        var currVal_48 = 'active-link';
        _ck(_v, 143, 0, currVal_48);
        _ck(_v, 148, 0);
        var currVal_51 = true;
        var currVal_52 = _ck(_v, 157, 0, '/about');
        _ck(_v, 156, 0, currVal_51, currVal_52);
        var currVal_53 = 'active-link';
        _ck(_v, 158, 0, currVal_53);
        _ck(_v, 163, 0);
        _ck(_v, 178, 0);
        _ck(_v, 185, 0);
        _ck(_v, 190, 0);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_24" /* ɵinlineInterpolate */](1, '', _co.theme, '');
        _ck(_v, 0, 0, currVal_0);
        var currVal_3 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15)._animationState;
        var currVal_4 = null;
        var currVal_5 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).position === 'end');
        var currVal_6 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).mode === 'over');
        var currVal_7 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).mode === 'push');
        var currVal_8 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).mode === 'side');
        _ck(_v, 13, 0, currVal_3, currVal_4, currVal_5, currVal_6, currVal_7, currVal_8);
        var currVal_9 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 26).target;
        var currVal_10 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 26).href;
        _ck(_v, 22, 0, currVal_9, currVal_10);
        var currVal_14 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 41).target;
        var currVal_15 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 41).href;
        _ck(_v, 37, 0, currVal_14, currVal_15);
        var currVal_19 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 56).target;
        var currVal_20 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 56).href;
        _ck(_v, 52, 0, currVal_19, currVal_20);
        var currVal_24 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 76).target;
        var currVal_25 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 76).href;
        _ck(_v, 72, 0, currVal_24, currVal_25);
        var currVal_29 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 91).target;
        var currVal_30 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 91).href;
        _ck(_v, 87, 0, currVal_29, currVal_30);
        var currVal_34 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 106).target;
        var currVal_35 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 106).href;
        _ck(_v, 102, 0, currVal_34, currVal_35);
        var currVal_39 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 121).target;
        var currVal_40 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 121).href;
        _ck(_v, 117, 0, currVal_39, currVal_40);
        var currVal_44 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 141).target;
        var currVal_45 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 141).href;
        _ck(_v, 137, 0, currVal_44, currVal_45);
        var currVal_49 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 156).target;
        var currVal_50 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 156).href;
        _ck(_v, 152, 0, currVal_49, currVal_50);
        var currVal_54 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 190).StatusAnimations;
        _ck(_v, 189, 0, currVal_54);
    });
}
function View_AppComponent_Host_0(_l) {
    return app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_45" /* ɵvid */](0, [(_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-app-root', [], null, null, null, View_AppComponent_0, RenderType_AppComponent)), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, app_component_AppComponent, [huepi_service_HuepiService,
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var AppComponentNgFactory = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-app-root', app_component_AppComponent, View_AppComponent_Host_0, {}, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2FwcC5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvYXBwLmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2FwcC5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2FwcC5jb21wb25lbnQudHMuQXBwQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPGRpdiBjbGFzcz17e3RoZW1lfX0+XG5cbjxtZC1zaWRlbmF2LWNvbnRhaW5lciBmdWxsc2NyZWVuPlxuXG4gIDxtZC10b29sYmFyIGNvbG9yPVwicHJpbWFyeVwiICpuZ0lmPVwiIXBhcmFtZXRlcnMud2lkZ2V0XCI+XG4gICAgICA8YnV0dG9uIG1kLWljb24tYnV0dG9uIChjbGljayk9XCJzaWRlbmF2LnRvZ2dsZSgpXCI+XG4gICAgICAgIDxtZC1pY29uPm1lbnU8L21kLWljb24+XG4gICAgICA8L2J1dHRvbj5cbiAgICAgIDxkaXY+e3t0aXRsZX19PC9kaXY+XG4gICAgPC9tZC10b29sYmFyPlxuXG4gIDxuYXYgbWQtdGFiLW5hdi1iYXIgI25hdmJhciAqbmdJZj1cIiFwYXJhbWV0ZXJzLndpZGdldFwiPlxuICAgIDxhIG1kLXRhYi1saW5rIFtyb3V0ZXJMaW5rXT1cIlsnL2hvbWUnXVwiIFtyZXBsYWNlVXJsXT1cInRydWVcIiByb3V0ZXJMaW5rQWN0aXZlPVwiYWN0aXZlLWxpbmtcIj5Ib21lPC9hPlxuICAgIDxhIG1kLXRhYi1saW5rIFtyb3V0ZXJMaW5rXT1cIlsnL2dyb3VwcyddXCIgW3JlcGxhY2VVcmxdPVwidHJ1ZVwiIHJvdXRlckxpbmtBY3RpdmU9XCJhY3RpdmUtbGlua1wiPkdyb3VwczwvYT5cbiAgICA8YSBtZC10YWItbGluayBbcm91dGVyTGlua109XCJbJy9saWdodHMnXVwiIFtyZXBsYWNlVXJsXT1cInRydWVcIiByb3V0ZXJMaW5rQWN0aXZlPVwiYWN0aXZlLWxpbmtcIj5MaWdodHM8L2E+XG4gICAgPGEgbWQtdGFiLWxpbmsgW3JvdXRlckxpbmtdPVwiWycvYnJpZGdlcyddXCIgW3JlcGxhY2VVcmxdPVwidHJ1ZVwiIHJvdXRlckxpbmtBY3RpdmU9XCJhY3RpdmUtbGlua1wiPkJyaWRnZXM8L2E+XG4gICAgPGEgbWQtdGFiLWxpbmsgW3JvdXRlckxpbmtdPVwiWycvYWJvdXQnXVwiIFtyZXBsYWNlVXJsXT1cInRydWVcIiByb3V0ZXJMaW5rQWN0aXZlPVwiYWN0aXZlLWxpbmtcIj5BYm91dDwvYT5cbiAgPC9uYXY+XG5cbiAgPG1kLXNpZGVuYXYgI3NpZGVuYXY+XG4gICAgPG1kLW5hdi1saXN0PlxuICAgICAgPGEgbWQtbGlzdC1pdGVtIFtyb3V0ZXJMaW5rXT1cIlsnL2hvbWUnXVwiIFtyZXBsYWNlVXJsXT1cInRydWVcIiByb3V0ZXJMaW5rQWN0aXZlPVwiYWN0aXZlLWxpbmtcIiAoY2xpY2spPVwic2lkZW5hdi50b2dnbGUoKVwiPjxtZC1pY29uPmhvbWU8L21kLWljb24+SG9tZTwvYT5cbiAgICAgIDxhIG1kLWxpc3QtaXRlbSBbcm91dGVyTGlua109XCJbJy9ncm91cHMnXVwiIFtyZXBsYWNlVXJsXT1cInRydWVcIiByb3V0ZXJMaW5rQWN0aXZlPVwiYWN0aXZlLWxpbmtcIiAoY2xpY2spPVwic2lkZW5hdi50b2dnbGUoKVwiPjxtZC1pY29uPmdyb3VwX3dvcms8L21kLWljb24+R3JvdXBzPC9hPlxuICAgICAgPGEgbWQtbGlzdC1pdGVtIFtyb3V0ZXJMaW5rXT1cIlsnL2xpZ2h0cyddXCIgW3JlcGxhY2VVcmxdPVwidHJ1ZVwiIHJvdXRlckxpbmtBY3RpdmU9XCJhY3RpdmUtbGlua1wiIChjbGljayk9XCJzaWRlbmF2LnRvZ2dsZSgpXCI+PG1kLWljb24+bGlnaHRidWxiX291dGxpbmU8L21kLWljb24+TGlnaHRzPC9hPlxuICAgICAgPG1kLWRpdmlkZXI+PC9tZC1kaXZpZGVyPlxuICAgICAgPGEgbWQtbGlzdC1pdGVtIFtyb3V0ZXJMaW5rXT1cIlsnL3J1bGVzJ11cIiBbcmVwbGFjZVVybF09XCJ0cnVlXCIgcm91dGVyTGlua0FjdGl2ZT1cImFjdGl2ZS1saW5rXCIgKGNsaWNrKT1cInNpZGVuYXYudG9nZ2xlKClcIj48bWQtaWNvbj5hc3NpZ25tZW50PC9tZC1pY29uPlJ1bGVzPC9hPlxuICAgICAgPGEgbWQtbGlzdC1pdGVtIFtyb3V0ZXJMaW5rXT1cIlsnL3NjZW5lcyddXCIgW3JlcGxhY2VVcmxdPVwidHJ1ZVwiIHJvdXRlckxpbmtBY3RpdmU9XCJhY3RpdmUtbGlua1wiIChjbGljayk9XCJzaWRlbmF2LnRvZ2dsZSgpXCI+PG1kLWljb24+YXNzaWdubWVudF9pbmQ8L21kLWljb24+U2NlbmVzPC9hPlxuICAgICAgPGEgbWQtbGlzdC1pdGVtIFtyb3V0ZXJMaW5rXT1cIlsnL3NjaGVkdWxlcyddXCIgW3JlcGxhY2VVcmxdPVwidHJ1ZVwiIHJvdXRlckxpbmtBY3RpdmU9XCJhY3RpdmUtbGlua1wiIChjbGljayk9XCJzaWRlbmF2LnRvZ2dsZSgpXCI+PG1kLWljb24+YWxhcm08L21kLWljb24+U2NoZWR1bGVzPC9hPlxuICAgICAgPGEgbWQtbGlzdC1pdGVtIFtyb3V0ZXJMaW5rXT1cIlsnL3NlbnNvcnMnXVwiIFtyZXBsYWNlVXJsXT1cInRydWVcIiByb3V0ZXJMaW5rQWN0aXZlPVwiYWN0aXZlLWxpbmtcIiAoY2xpY2spPVwic2lkZW5hdi50b2dnbGUoKVwiPjxtZC1pY29uPmFsbF9vdXQ8L21kLWljb24+U2Vuc29yczwvYT5cbiAgICAgIDxtZC1kaXZpZGVyPjwvbWQtZGl2aWRlcj5cbiAgICAgIDxhIG1kLWxpc3QtaXRlbSBbcm91dGVyTGlua109XCJbJy9icmlkZ2VzJ11cIiBbcmVwbGFjZVVybF09XCJ0cnVlXCIgcm91dGVyTGlua0FjdGl2ZT1cImFjdGl2ZS1saW5rXCIgKGNsaWNrKT1cInNpZGVuYXYudG9nZ2xlKClcIj48bWQtaWNvbj5kZXZpY2VfaHViPC9tZC1pY29uPkJyaWRnZXM8L2E+XG4gICAgICA8YSBtZC1saXN0LWl0ZW0gW3JvdXRlckxpbmtdPVwiWycvYWJvdXQnXVwiIFtyZXBsYWNlVXJsXT1cInRydWVcIiByb3V0ZXJMaW5rQWN0aXZlPVwiYWN0aXZlLWxpbmtcIiAoY2xpY2spPVwic2lkZW5hdi50b2dnbGUoKVwiPjxtZC1pY29uPmluZm88L21kLWljb24+QWJvdXQ8L2E+XG4gICAgICA8bWQtZGl2aWRlcj48L21kLWRpdmlkZXI+XG4gICAgICA8YSBtZC1saXN0LWl0ZW0gKGNsaWNrKT1cInRvZ2dsZVRoZW1lKClcIj48bWQtaWNvbj5pbnZlcnRfY29sb3JzPC9tZC1pY29uPlRoZW1lPC9hPlxuICAgIDwvbWQtbmF2LWxpc3Q+XG4gIDwvbWQtc2lkZW5hdj5cblxuICA8cm91dGVyLW91dGxldD5cbiAgPC9yb3V0ZXItb3V0bGV0PlxuXG48L21kLXNpZGVuYXYtY29udGFpbmVyPlxuXG48aHVld2ktY29ubmVjdGlvbnN0YXR1cz5cbjwvaHVld2ktY29ubmVjdGlvbnN0YXR1cz5cblxuPC9kaXY+IDwhLS1kaXYgY2xhc3M9e3t0aGVtZX19LS0+IiwiPGh1ZXdpLWFwcC1yb290PjwvaHVld2ktYXBwLXJvb3Q+Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O29CQ0lFO01BQUE7TUFBQSxpRkFBQTtNQUFBO01BQUEsb0NBQUE7bUJBQUEscUNBQXVEO01BQ25EO1VBQUE7UUFBQTtRQUF1QjtVQUFBO1VBQUE7UUFBQTtRQUF2QjtNQUFBLHFEQUFBOzhCQUFBO1VBQUEsc0JBQUE7eURBQUE7YUFBQTtVQUFBLGVBQWtELG1DQUNoRDtVQUFBO1VBQUEsNkRBQUE7VUFBQTtVQUFBLG9DQUFBOzBDQUFBO01BQVMsNkJBQWMsaUNBQ2hCO1VBQUEsZUFDVDtVQUFBLDBEQUFLO1VBQUEsVUFBZTtJQUpaO0lBQVosV0FBWSxTQUFaO0lBRU07OztJQURGO0lBQUEsV0FBQSxTQUFBO0lBR0s7SUFBQTs7OztvQkFHVDtNQUFBOytDQUFBLFVBQUE7a0JBQUE7TUFBQSxnRUFBdUQ7TUFBQSxhQUNyRDtNQUFBO01BQUE7VUFBQTtJQUFBO0lBQUE7TUFBQTtVQUFBO01BQUE7SUFBQTtJQUFBO0VBQUEsdUNBQUE7MkRBQUE7TUFBQSxvQ0FBQTtNQUFBO1VBQUEsbURBQWUsV0FBZjtNQUFBO01BQUE7TUFBQSxtREFBMkY7TUFBQSxXQUFRLCtCQUNuRztNQUFBO01BQUE7VUFBQTtRQUFBO1FBQUE7VUFBQTtjQUFBO1VBQUE7UUFBQTtRQUFBO01BQUEsdUNBQUE7MkRBQUE7TUFBQSxvQ0FBQTtNQUFBO1VBQUEsbURBQWUsV0FBZjtNQUFBO01BQUE7TUFBQSxtREFBNkY7TUFBQSxhQUFVLCtCQUN2RztNQUFBO01BQUE7VUFBQTtRQUFBO1FBQUE7VUFBQTtjQUFBO1VBQUE7UUFBQTtRQUFBO01BQUEsdUNBQUE7MkRBQUE7TUFBQSxvQ0FBQTtNQUFBO1VBQUEsbURBQWUsV0FBZjtNQUFBO01BQUE7TUFBQSxtREFBNkY7TUFBQSxhQUFVLCtCQUN2RztNQUFBO01BQUE7VUFBQTtRQUFBO1FBQUE7VUFBQTtjQUFBO1VBQUE7UUFBQTtRQUFBO01BQUEsdUNBQUE7MkRBQUE7TUFBQSxvQ0FBQTtNQUFBO1VBQUEsbURBQWUsV0FBZjtNQUFBO01BQUE7TUFBQSxvREFBOEY7TUFBQSxjQUFXLCtCQUN6RztNQUFBO01BQUE7VUFBQTtRQUFBO1FBQUE7VUFBQTtjQUFBO1VBQUE7UUFBQTtRQUFBO01BQUEsdUNBQUE7MkRBQUE7TUFBQSxvQ0FBQTtNQUFBO1VBQUEsbURBQWUsV0FBZjtNQUFBO01BQUE7TUFBQSxvREFBNEY7TUFBQSxZQUFTO0lBSjdEO0lBQXpCO0lBQWYsV0FBd0MsVUFBekIsU0FBZjtJQUE0RDtJQUE1RCxXQUE0RCxTQUE1RDtJQUMwQztJQUEzQjtJQUFmLFlBQTBDLFdBQTNCLFVBQWY7SUFBOEQ7SUFBOUQsWUFBOEQsVUFBOUQ7SUFDMEM7SUFBM0I7SUFBZixZQUEwQyxXQUEzQixVQUFmO0lBQThEO0lBQTlELFlBQThELFVBQTlEO0lBQzJDO0lBQTVCO0lBQWYsWUFBMkMsV0FBNUIsVUFBZjtJQUErRDtJQUEvRCxZQUErRCxVQUEvRDtJQUN5QztJQUExQjtJQUFmLFlBQXlDLFdBQTFCLFVBQWY7SUFBNkQ7SUFBN0QsWUFBNkQsVUFBN0Q7O0lBSkE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBLFdBQUEsOEJBQUEsbUJBQUE7SUFDQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUEsWUFBQSwrQkFBQSxxQkFBQTtJQUNBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQSxZQUFBLGlDQUFBLHFCQUFBO0lBQ0E7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBLFlBQUEsaUNBQUEscUJBQUE7SUFDQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUEsWUFBQSxpQ0FBQSxxQkFBQTs7OztvQkFoQko7TUFBQTtNQUFxQix5Q0FFckI7VUFBQTtjQUFBOzBDQUFBLFVBQUE7VUFBQTthQUFBO21FQUFBO1VBQUEsaURBQWlDO01BRS9CO2FBQUE7VUFBQSx3QkFLZSwrQkFFZjtVQUFBLDZEQUFBO1VBQUE7TUFNTSwrQkFFTjtVQUFBO2NBQUE7Y0FBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO1VBQUEsdURBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7TUFBcUIsK0JBQ25CO1VBQUE7K0NBQUEsVUFBQTtVQUFBO2FBQUE7YUFBQTtVQUFBLGVBQWEsaUNBQ1g7VUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2tCQUFBO2NBQUE7WUFBQTtZQUE0RjtjQUFBO2NBQUE7WUFBQTtZQUE1RjtVQUFBLHlEQUFBO1VBQUE7VUFBQTtVQUFBLDBCQUFBOytDQUFBO1VBQUEscUNBQWdCLFdBQWhCOzhCQUFBO1VBQUE7VUFBQSx1REFBdUg7VUFBQTtVQUFBLDJFQUFBO1VBQUE7MkJBQUEsc0NBQUE7VUFBQTtVQUFBLDZCQUFTLDZCQUFjO1VBQUEsV0FBUSxpQ0FDdEo7VUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2tCQUFBO2NBQUE7WUFBQTtZQUE4RjtjQUFBO2NBQUE7WUFBQTtZQUE5RjtVQUFBLHlEQUFBO1VBQUE7VUFBQTtVQUFBLDBCQUFBOytDQUFBO1VBQUEscUNBQWdCLFdBQWhCOzhCQUFBO1VBQUE7VUFBQSx1REFBeUg7VUFBQTtVQUFBLDJFQUFBO1VBQUE7MkJBQUEsc0NBQUE7VUFBQTtVQUFBLDZCQUFTLG1DQUFvQjtpQkFBQSxnQkFBVSxpQ0FDaEs7VUFBQTtjQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7a0JBQUE7Y0FBQTtZQUFBO1lBQThGO2NBQUE7Y0FBQTtZQUFBO1lBQTlGO1VBQUEseURBQUE7VUFBQTtVQUFBO1VBQUEsMEJBQUE7K0NBQUE7VUFBQSxxQ0FBZ0IsV0FBaEI7OEJBQUE7VUFBQTtVQUFBLHVEQUF5SDtVQUFBO1VBQUEsMkVBQUE7VUFBQTsyQkFBQSxzQ0FBQTtVQUFBO1VBQUEsNkJBQVMsMENBQTJCO2lCQUFBLGdCQUFVLGlDQUN2SztVQUFBO2NBQUE7VUFBQSxxQ0FBQTtVQUFBO2FBQUE7YUFBQTtVQUFBLGVBQXlCLGlDQUN6QjtVQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7a0JBQUE7Y0FBQTtZQUFBO1lBQTZGO2NBQUE7Y0FBQTtZQUFBO1lBQTdGO1VBQUEseURBQUE7VUFBQTtVQUFBO1VBQUEsMEJBQUE7K0NBQUE7VUFBQSxxQ0FBZ0IsV0FBaEI7OEJBQUE7VUFBQTtVQUFBLHVEQUF3SDtVQUFBO1VBQUEsMkVBQUE7VUFBQTsyQkFBQSxzQ0FBQTtVQUFBO1VBQUEsNkJBQVMsbUNBQW9CO2lCQUFBLGVBQVMsaUNBQzlKO1VBQUE7Y0FBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2tCQUFBO2NBQUE7WUFBQTtZQUE4RjtjQUFBO2NBQUE7WUFBQTtZQUE5RjtVQUFBLHlEQUFBO1VBQUE7VUFBQTtVQUFBLDBCQUFBOytDQUFBO1VBQUEscUNBQWdCLFdBQWhCOzhCQUFBO1VBQUE7VUFBQSx1REFBeUg7VUFBQTtVQUFBLDJFQUFBO1VBQUE7MkJBQUEsc0NBQUE7VUFBQTtVQUFBLDZCQUFTLHVDQUF3QjtpQkFBQSxnQkFBVSxpQ0FDcEs7VUFBQTtjQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7a0JBQUE7Y0FBQTtZQUFBO1lBQWlHO2NBQUE7Y0FBQTtZQUFBO1lBQWpHO1VBQUEseURBQUE7VUFBQTtVQUFBO1VBQUEsMEJBQUE7K0NBQUE7VUFBQSxxQ0FBZ0IsV0FBaEI7OEJBQUE7VUFBQTtVQUFBLHVEQUE0SDtVQUFBO1VBQUEsMkVBQUE7VUFBQTsyQkFBQSxzQ0FBQTtVQUFBO1VBQUEsNkJBQVMsOEJBQWU7VUFBQSxnQkFBYSxpQ0FDaks7VUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2tCQUFBO2NBQUE7WUFBQTtZQUErRjtjQUFBO2NBQUE7WUFBQTtZQUEvRjtVQUFBLHlEQUFBO1VBQUE7VUFBQTtVQUFBLDBCQUFBOytDQUFBO1VBQUEscUNBQWdCLFdBQWhCOzhCQUFBO1VBQUE7VUFBQSx1REFBMEg7VUFBQTtVQUFBLDJFQUFBO1VBQUE7MkJBQUEsc0NBQUE7VUFBQTtVQUFBLDZCQUFTLGdDQUFpQjtVQUFBLGNBQVcsaUNBQy9KO1VBQUE7Y0FBQTtVQUFBLHVCQUFBO3VCQUFBLHNDQUFBO1VBQUEscUVBQUE7VUFBQTtNQUF5QixpQ0FDekI7VUFBQTtVQUFBO1VBQUE7UUFBQTtRQUFBO1VBQUE7VUFBQTtRQUFBO1FBQUE7VUFBQTtVQUFBO1FBQUE7UUFBQTtVQUFBO2NBQUE7VUFBQTtRQUFBO1FBQStGO1VBQUE7VUFBQTtRQUFBO1FBQS9GO01BQUEseURBQUE7VUFBQTtVQUFBO1VBQUEsMEJBQUE7K0NBQUE7VUFBQSxxQ0FBZ0IsV0FBaEI7OEJBQUE7VUFBQTtVQUFBLHVEQUEwSDtVQUFBO1VBQUEsMkVBQUE7VUFBQTsyQkFBQSxzQ0FBQTtVQUFBO1VBQUEsNkJBQVMsbUNBQW9CO2lCQUFBLGlCQUFXLGlDQUNsSztVQUFBO2NBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtrQkFBQTtjQUFBO1lBQUE7WUFBNkY7Y0FBQTtjQUFBO1lBQUE7WUFBN0Y7VUFBQSx5REFBQTtVQUFBO1VBQUE7VUFBQSwwQkFBQTsrQ0FBQTtVQUFBLHFDQUFnQixXQUFoQjs4QkFBQTtVQUFBO1VBQUEsdURBQXdIO1VBQUE7VUFBQSwyRUFBQTtVQUFBOzJCQUFBLHNDQUFBO1VBQUE7VUFBQSw2QkFBUyw2QkFBYztVQUFBLFlBQVMsaUNBQ3hKO1VBQUE7Y0FBQTtVQUFBLHVCQUFBO3VCQUFBLHNDQUFBO1VBQUEscUVBQUE7VUFBQTtNQUF5QixpQ0FDekI7VUFBQTtVQUFBO1VBQUE7WUFBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFnQjtjQUFBO2NBQUE7WUFBQTtZQUFoQjtVQUFBLHlEQUFBO1VBQUE7VUFBQTtVQUFBLG1CQUF3QztVQUFBOzhCQUFBLFVBQUE7VUFBQTthQUFBO1VBQUEsZ0RBQVM7TUFBdUIsOEJBQVMsK0JBQ3JFO1VBQUEsV0FDSCwrQkFFYjtVQUFBO1VBQUEscUNBQUE7VUFBQTtjQUFBO01BQWUseUNBQ0MsNkJBRUs7aUJBQUEsMEJBRXZCO1VBQUE7VUFBQTthQUFBO1VBQUEsNkJBQXdCLHVDQUNDO2lCQUFBLDBCQUVuQjs7O1FBekN3QjtRQUE1QixXQUE0QixTQUE1QjtRQU80QjtRQUE1QixZQUE0QixTQUE1QjtRQVU2QztRQUF6QjtRQUFoQixZQUF5QyxXQUF6QixVQUFoQjtRQUE2RDtRQUE3RCxZQUE2RCxVQUE3RDtRQUF1SDtRQUM1RTtRQUEzQjtRQUFoQixZQUEyQyxXQUEzQixVQUFoQjtRQUErRDtRQUEvRCxZQUErRCxVQUEvRDtRQUF5SDtRQUM5RTtRQUEzQjtRQUFoQixZQUEyQyxXQUEzQixVQUFoQjtRQUErRDtRQUEvRCxZQUErRCxVQUEvRDtRQUF5SDtRQUUvRTtRQUExQjtRQUFoQixZQUEwQyxXQUExQixVQUFoQjtRQUE4RDtRQUE5RCxZQUE4RCxVQUE5RDtRQUF3SDtRQUM3RTtRQUEzQjtRQUFoQixZQUEyQyxXQUEzQixVQUFoQjtRQUErRDtRQUEvRCxZQUErRCxVQUEvRDtRQUF5SDtRQUMzRTtRQUE5QjtRQUFoQixhQUE4QyxXQUE5QixVQUFoQjtRQUFrRTtRQUFsRSxhQUFrRSxVQUFsRTtRQUE0SDtRQUNoRjtRQUE1QjtRQUFoQixhQUE0QyxXQUE1QixVQUFoQjtRQUFnRTtRQUFoRSxhQUFnRSxVQUFoRTtRQUEwSDtRQUU5RTtRQUE1QjtRQUFoQixhQUE0QyxXQUE1QixVQUFoQjtRQUFnRTtRQUFoRSxhQUFnRSxVQUFoRTtRQUEwSDtRQUNoRjtRQUExQjtRQUFoQixhQUEwQyxXQUExQixVQUFoQjtRQUE4RDtRQUE5RCxhQUE4RCxVQUE5RDtRQUF3SDtRQUVoRjtRQUk1QztRQUtGOzs7UUExQ0s7UUFBTCxXQUFLLFNBQUw7UUFtQkU7UUFBQTtRQUFBO1FBQUE7UUFBQTtRQUFBO1FBQUEsWUFBQSwyREFBQTtRQUVJO1FBQUE7UUFBQSxZQUFBLG9CQUFBO1FBQ0E7UUFBQTtRQUFBLFlBQUEscUJBQUE7UUFDQTtRQUFBO1FBQUEsWUFBQSxxQkFBQTtRQUVBO1FBQUE7UUFBQSxZQUFBLHFCQUFBO1FBQ0E7UUFBQTtRQUFBLFlBQUEscUJBQUE7UUFDQTtRQUFBO1FBQUEsYUFBQSxxQkFBQTtRQUNBO1FBQUE7UUFBQSxhQUFBLHFCQUFBO1FBRUE7UUFBQTtRQUFBLGFBQUEscUJBQUE7UUFDQTtRQUFBO1FBQUEsYUFBQSxxQkFBQTtRQVdOO1FBQUEsYUFBQSxVQUFBOzs7O29CQzFDQTtNQUFBOzZCQUFBLFVBQUE7aUNBQUE7SUFBQTs7OzsifQ==
//# sourceMappingURL=app.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/pipes/pipes.module.ts
var PipesModule = (function () {
    function PipesModule() {
    }
    return PipesModule;
}());

//# sourceMappingURL=pipes.module.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-groups/huewi-groups-routing.module.ts

var huewiGroupsRoutes = [
    { path: 'groups', component: huewi_groups_component_HuewiGroupsComponent },
    { path: 'groups/:id', component: huewi_groups_component_HuewiGroupsComponent }
];
var HuewiGroupsRoutingModule = (function () {
    function HuewiGroupsRoutingModule() {
    }
    return HuewiGroupsRoutingModule;
}());

//# sourceMappingURL=huewi-groups-routing.module.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-groups/huewi-groups.module.ts
var HuewiGroupsModule = (function () {
    function HuewiGroupsModule() {
    }
    return HuewiGroupsModule;
}());

//# sourceMappingURL=huewi-groups.module.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-lights/huewi-lights-routing.module.ts

var huewiLightsRoutes = [
    { path: 'lights', component: huewi_lights_component_HuewiLightsComponent },
    { path: 'lights/:id', component: huewi_lights_component_HuewiLightsComponent }
];
var HuewiLightsRoutingModule = (function () {
    function HuewiLightsRoutingModule() {
    }
    return HuewiLightsRoutingModule;
}());

//# sourceMappingURL=huewi-lights-routing.module.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-lights/huewi-lights.module.ts
var HuewiLightsModule = (function () {
    function HuewiLightsModule() {
    }
    return HuewiLightsModule;
}());

//# sourceMappingURL=huewi-lights.module.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-rules/huewi-rules-routing.module.ts

var huewiRulesRoutes = [
    { path: 'rules', component: huewi_rules_component_HuewiRulesComponent },
    { path: 'rules/:id', component: huewi_rules_component_HuewiRulesComponent }
];
var HuewiRulesRoutingModule = (function () {
    function HuewiRulesRoutingModule() {
    }
    return HuewiRulesRoutingModule;
}());

//# sourceMappingURL=huewi-rules-routing.module.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-rules/huewi-rules.module.ts
var HuewiRulesModule = (function () {
    function HuewiRulesModule() {
    }
    return HuewiRulesModule;
}());

//# sourceMappingURL=huewi-rules.module.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-scenes/huewi-scenes-routing.module.ts

var huewiScenesRoutes = [
    { path: 'scenes', component: huewi_scenes_component_HuewiScenesComponent },
    { path: 'scenes/:id', component: huewi_scenes_component_HuewiScenesComponent }
];
var HuewiScenesRoutingModule = (function () {
    function HuewiScenesRoutingModule() {
    }
    return HuewiScenesRoutingModule;
}());

//# sourceMappingURL=huewi-scenes-routing.module.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-scenes/huewi-scenes.module.ts
var HuewiScenesModule = (function () {
    function HuewiScenesModule() {
    }
    return HuewiScenesModule;
}());

//# sourceMappingURL=huewi-scenes.module.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-schedules/huewi-schedules-routing.module.ts

var huewiSchedulesRoutes = [
    { path: 'schedules', component: huewi_schedules_component_HuewiSchedulesComponent },
    { path: 'schedules/:id', component: huewi_schedules_component_HuewiSchedulesComponent }
];
var HuewiSchedulesRoutingModule = (function () {
    function HuewiSchedulesRoutingModule() {
    }
    return HuewiSchedulesRoutingModule;
}());

//# sourceMappingURL=huewi-schedules-routing.module.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-schedules/huewi-schedules.module.ts
var HuewiSchedulesModule = (function () {
    function HuewiSchedulesModule() {
    }
    return HuewiSchedulesModule;
}());

//# sourceMappingURL=huewi-schedules.module.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-sensors/huewi-sensors-routing.module.ts

var huewiSensorsRoutes = [
    { path: 'sensors', component: huewi_sensors_component_HuewiSensorsComponent },
    { path: 'sensors/:id', component: huewi_sensors_component_HuewiSensorsComponent }
];
var HuewiSensorsRoutingModule = (function () {
    function HuewiSensorsRoutingModule() {
    }
    return HuewiSensorsRoutingModule;
}());

//# sourceMappingURL=huewi-sensors-routing.module.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-sensors/huewi-sensors.module.ts
var HuewiSensorsModule = (function () {
    function HuewiSensorsModule() {
    }
    return HuewiSensorsModule;
}());

//# sourceMappingURL=huewi-sensors.module.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-bridges/huewi-bridges-routing.module.ts

var huewiBridgesRoutes = [
    { path: 'bridges', component: huewi_bridges_component_HuewiBridgesComponent },
    { path: 'bridges/:id', component: huewi_bridges_component_HuewiBridgesComponent }
];
var HuewiBridgesRoutingModule = (function () {
    function HuewiBridgesRoutingModule() {
    }
    return HuewiBridgesRoutingModule;
}());

//# sourceMappingURL=huewi-bridges-routing.module.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-bridges/huewi-bridges.module.ts
var HuewiBridgesModule = (function () {
    function HuewiBridgesModule() {
    }
    return HuewiBridgesModule;
}());

//# sourceMappingURL=huewi-bridges.module.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/app-routing.module.ts


var appRoutes = [
    { path: 'home', component: huewi_home_component_HuewiHomeComponent },
    { path: 'about', component: HuewiAboutComponent },
    //  { path: '', component: HuewiHomeComponent },
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: '**', redirectTo: '/home' }
];
var AppRoutingModule = (function () {
    function AppRoutingModule() {
    }
    return AppRoutingModule;
}());

//# sourceMappingURL=app-routing.module.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/app.module.ngfactory.ts
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_14__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__ = __webpack_require__("fc+i");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_16__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_17__angular_animations_browser__ = __webpack_require__("f9zQ");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_18__angular_platform_browser_animations__ = __webpack_require__("fL27");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_19__angular_animations__ = __webpack_require__("EyWH");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_20__angular_cdk_bidi__ = __webpack_require__("UPmf");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_21__angular_cdk_platform__ = __webpack_require__("JYHx");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_22__angular_cdk_scrolling__ = __webpack_require__("vVgA");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__ = __webpack_require__("z1Gz");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_24__angular_cdk_observers__ = __webpack_require__("f3MN");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_25__angular_cdk_a11y__ = __webpack_require__("dGUy");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_26__angular_http__ = __webpack_require__("CPp0");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_27__angular_forms__ = __webpack_require__("bm2B");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_28__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_31__angular_cdk_portal__ = __webpack_require__("mSH7");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_32__angular_cdk_table__ = __webpack_require__("d8q7");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */


























































var AppModuleNgFactory = __WEBPACK_IMPORTED_MODULE_0__angular_core__["_17" /* ɵcmf */](AppModule, [app_component_AppComponent], function (_l) {
    return __WEBPACK_IMPORTED_MODULE_0__angular_core__["_32" /* ɵmod */]([__WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* ComponentFactoryResolver */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["_13" /* ɵCodegenComponentFactoryResolver */], [[8, [__WEBPACK_IMPORTED_MODULE_3__gendir_node_modules_angular_material_typings_index_ngfactory__["b" /* MdDialogContainerNgFactory */], __WEBPACK_IMPORTED_MODULE_3__gendir_node_modules_angular_material_typings_index_ngfactory__["a" /* MdDatepickerContentNgFactory */], __WEBPACK_IMPORTED_MODULE_3__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* TooltipComponentNgFactory */],
                    __WEBPACK_IMPORTED_MODULE_3__gendir_node_modules_angular_material_typings_index_ngfactory__["c" /* MdSnackBarContainerNgFactory */], __WEBPACK_IMPORTED_MODULE_3__gendir_node_modules_angular_material_typings_index_ngfactory__["r" /* SimpleSnackBarNgFactory */], HuewiGroupsComponentNgFactory,
                    HuewiLightsComponentNgFactory, HuewiRulesComponentNgFactory, HuewiScenesComponentNgFactory,
                    HuewiSchedulesComponentNgFactory, HuewiSensorsComponentNgFactory,
                    HuewiBridgesComponentNgFactory, HuewiHomeComponentNgFactory, HuewiAboutComponentNgFactory,
                    AppComponentNgFactory]], [3, __WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* ComponentFactoryResolver */]], __WEBPACK_IMPORTED_MODULE_0__angular_core__["H" /* NgModuleRef */]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_0__angular_core__["D" /* LOCALE_ID */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["_31" /* ɵm */], [[3, __WEBPACK_IMPORTED_MODULE_0__angular_core__["D" /* LOCALE_ID */]]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_14__angular_common__["m" /* NgLocalization */], __WEBPACK_IMPORTED_MODULE_14__angular_common__["l" /* NgLocaleLocalization */], [__WEBPACK_IMPORTED_MODULE_0__angular_core__["D" /* LOCALE_ID */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_0__angular_core__["c" /* APP_ID */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["_22" /* ɵf */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_0__angular_core__["B" /* IterableDiffers */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["_28" /* ɵk */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_0__angular_core__["C" /* KeyValueDiffers */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["_29" /* ɵl */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["c" /* DomSanitizer */], __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["t" /* ɵe */], [__WEBPACK_IMPORTED_MODULE_14__angular_common__["c" /* DOCUMENT */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](6144, __WEBPACK_IMPORTED_MODULE_0__angular_core__["T" /* Sanitizer */], null, [__WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["c" /* DomSanitizer */]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["f" /* HAMMER_GESTURE_CONFIG */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["g" /* GestureConfig */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["d" /* EVENT_MANAGER_PLUGINS */], function (p0_0, p1_0, p2_0, p2_1) {
            return [new __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["l" /* ɵDomEventsPlugin */](p0_0), new __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["p" /* ɵKeyEventsPlugin */](p1_0),
                new __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["o" /* ɵHammerGesturesPlugin */](p2_0, p2_1)];
        }, [__WEBPACK_IMPORTED_MODULE_14__angular_common__["c" /* DOCUMENT */], __WEBPACK_IMPORTED_MODULE_14__angular_common__["c" /* DOCUMENT */], __WEBPACK_IMPORTED_MODULE_14__angular_common__["c" /* DOCUMENT */], __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["f" /* HAMMER_GESTURE_CONFIG */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["e" /* EventManager */], __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["e" /* EventManager */], [__WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["d" /* EVENT_MANAGER_PLUGINS */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["J" /* NgZone */]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](135680, __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["n" /* ɵDomSharedStylesHost */], __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["n" /* ɵDomSharedStylesHost */], [__WEBPACK_IMPORTED_MODULE_14__angular_common__["c" /* DOCUMENT */]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["m" /* ɵDomRendererFactory2 */], __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["m" /* ɵDomRendererFactory2 */], [__WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["e" /* EventManager */],
            __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["n" /* ɵDomSharedStylesHost */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_17__angular_animations_browser__["a" /* AnimationDriver */], __WEBPACK_IMPORTED_MODULE_18__angular_platform_browser_animations__["d" /* ɵc */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_17__angular_animations_browser__["c" /* ɵAnimationStyleNormalizer */], __WEBPACK_IMPORTED_MODULE_18__angular_platform_browser_animations__["e" /* ɵd */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_17__angular_animations_browser__["b" /* ɵAnimationEngine */], __WEBPACK_IMPORTED_MODULE_18__angular_platform_browser_animations__["c" /* ɵb */], [__WEBPACK_IMPORTED_MODULE_17__angular_animations_browser__["a" /* AnimationDriver */], __WEBPACK_IMPORTED_MODULE_17__angular_animations_browser__["c" /* ɵAnimationStyleNormalizer */]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_0__angular_core__["R" /* RendererFactory2 */], __WEBPACK_IMPORTED_MODULE_18__angular_platform_browser_animations__["f" /* ɵe */], [__WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["m" /* ɵDomRendererFactory2 */], __WEBPACK_IMPORTED_MODULE_17__angular_animations_browser__["b" /* ɵAnimationEngine */],
            __WEBPACK_IMPORTED_MODULE_0__angular_core__["J" /* NgZone */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](6144, __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["q" /* ɵSharedStylesHost */], null, [__WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["n" /* ɵDomSharedStylesHost */]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_0__angular_core__["_0" /* Testability */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["_0" /* Testability */], [__WEBPACK_IMPORTED_MODULE_0__angular_core__["J" /* NgZone */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["h" /* Meta */], __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["h" /* Meta */], [__WEBPACK_IMPORTED_MODULE_14__angular_common__["c" /* DOCUMENT */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["j" /* Title */], __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["j" /* Title */], [__WEBPACK_IMPORTED_MODULE_14__angular_common__["c" /* DOCUMENT */]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_19__angular_animations__["b" /* AnimationBuilder */], __WEBPACK_IMPORTED_MODULE_18__angular_platform_browser_animations__["b" /* ɵBrowserAnimationBuilder */], [__WEBPACK_IMPORTED_MODULE_0__angular_core__["R" /* RendererFactory2 */],
            __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["b" /* DOCUMENT */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](6144, __WEBPACK_IMPORTED_MODULE_20__angular_cdk_bidi__["b" /* DIR_DOCUMENT */], null, [__WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["b" /* DOCUMENT */]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_20__angular_cdk_bidi__["c" /* Directionality */], __WEBPACK_IMPORTED_MODULE_20__angular_cdk_bidi__["c" /* Directionality */], [[2, __WEBPACK_IMPORTED_MODULE_20__angular_cdk_bidi__["b" /* DIR_DOCUMENT */]]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_21__angular_cdk_platform__["a" /* Platform */], __WEBPACK_IMPORTED_MODULE_21__angular_cdk_platform__["a" /* Platform */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_22__angular_cdk_scrolling__["c" /* ScrollDispatcher */], __WEBPACK_IMPORTED_MODULE_22__angular_cdk_scrolling__["a" /* SCROLL_DISPATCHER_PROVIDER_FACTORY */], [[3, __WEBPACK_IMPORTED_MODULE_22__angular_cdk_scrolling__["c" /* ScrollDispatcher */]], __WEBPACK_IMPORTED_MODULE_0__angular_core__["J" /* NgZone */],
            __WEBPACK_IMPORTED_MODULE_21__angular_cdk_platform__["a" /* Platform */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_22__angular_cdk_scrolling__["g" /* ViewportRuler */], __WEBPACK_IMPORTED_MODULE_22__angular_cdk_scrolling__["f" /* VIEWPORT_RULER_PROVIDER_FACTORY */], [[3, __WEBPACK_IMPORTED_MODULE_22__angular_cdk_scrolling__["g" /* ViewportRuler */]], __WEBPACK_IMPORTED_MODULE_22__angular_cdk_scrolling__["c" /* ScrollDispatcher */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["g" /* ScrollStrategyOptions */], __WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["g" /* ScrollStrategyOptions */], [__WEBPACK_IMPORTED_MODULE_22__angular_cdk_scrolling__["c" /* ScrollDispatcher */], __WEBPACK_IMPORTED_MODULE_22__angular_cdk_scrolling__["g" /* ViewportRuler */]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["c" /* OverlayContainer */], __WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["j" /* ɵa */], [[3, __WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["c" /* OverlayContainer */]]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["m" /* ɵf */], __WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["m" /* ɵf */], [__WEBPACK_IMPORTED_MODULE_22__angular_cdk_scrolling__["g" /* ViewportRuler */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["b" /* Overlay */], __WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["b" /* Overlay */], [__WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["g" /* ScrollStrategyOptions */], __WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["c" /* OverlayContainer */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* ComponentFactoryResolver */],
            __WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["m" /* ɵf */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["g" /* ApplicationRef */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["z" /* Injector */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["J" /* NgZone */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["k" /* ɵc */], __WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["l" /* ɵd */], [__WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["b" /* Overlay */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_16__angular_material__["k" /* MD_AUTOCOMPLETE_SCROLL_STRATEGY */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["l" /* MD_AUTOCOMPLETE_SCROLL_STRATEGY_PROVIDER_FACTORY */], [__WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["b" /* Overlay */]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_16__angular_material__["f" /* FocusOriginMonitor */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["e" /* FOCUS_ORIGIN_MONITOR_PROVIDER_FACTORY */], [[3, __WEBPACK_IMPORTED_MODULE_16__angular_material__["f" /* FocusOriginMonitor */]], __WEBPACK_IMPORTED_MODULE_0__angular_core__["J" /* NgZone */], __WEBPACK_IMPORTED_MODULE_21__angular_cdk_platform__["a" /* Platform */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_104" /* UniqueSelectionDispatcher */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_105" /* ɵb */], [[3, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_104" /* UniqueSelectionDispatcher */]]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_24__angular_cdk_observers__["a" /* MdMutationObserverFactory */], __WEBPACK_IMPORTED_MODULE_24__angular_cdk_observers__["a" /* MdMutationObserverFactory */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_25__angular_cdk_a11y__["f" /* InteractivityChecker */], __WEBPACK_IMPORTED_MODULE_25__angular_cdk_a11y__["f" /* InteractivityChecker */], [__WEBPACK_IMPORTED_MODULE_21__angular_cdk_platform__["a" /* Platform */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_25__angular_cdk_a11y__["e" /* FocusTrapFactory */], __WEBPACK_IMPORTED_MODULE_25__angular_cdk_a11y__["e" /* FocusTrapFactory */], [__WEBPACK_IMPORTED_MODULE_25__angular_cdk_a11y__["f" /* InteractivityChecker */], __WEBPACK_IMPORTED_MODULE_21__angular_cdk_platform__["a" /* Platform */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["J" /* NgZone */]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_25__angular_cdk_a11y__["j" /* LiveAnnouncer */], __WEBPACK_IMPORTED_MODULE_25__angular_cdk_a11y__["i" /* LIVE_ANNOUNCER_PROVIDER_FACTORY */], [[3, __WEBPACK_IMPORTED_MODULE_25__angular_cdk_a11y__["j" /* LiveAnnouncer */]],
            [2, __WEBPACK_IMPORTED_MODULE_25__angular_cdk_a11y__["g" /* LIVE_ANNOUNCER_ELEMENT_TOKEN */]], __WEBPACK_IMPORTED_MODULE_21__angular_cdk_platform__["a" /* Platform */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_16__angular_material__["p" /* MD_DIALOG_SCROLL_STRATEGY */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["q" /* MD_DIALOG_SCROLL_STRATEGY_PROVIDER_FACTORY */], [__WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["b" /* Overlay */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_7" /* MdDialog */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_7" /* MdDialog */], [__WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["b" /* Overlay */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["z" /* Injector */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["p" /* MD_DIALOG_SCROLL_STRATEGY */],
            [2, __WEBPACK_IMPORTED_MODULE_14__angular_common__["g" /* Location */]], [3, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_7" /* MdDialog */]]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_26" /* MdIconRegistry */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["h" /* ICON_REGISTRY_PROVIDER_FACTORY */], [[3, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_26" /* MdIconRegistry */]], [2, __WEBPACK_IMPORTED_MODULE_26__angular_http__["a" /* Http */]],
            __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["c" /* DomSanitizer */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_4" /* MdDatepickerIntl */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_4" /* MdDatepickerIntl */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_16__angular_material__["m" /* MD_DATEPICKER_SCROLL_STRATEGY */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["n" /* MD_DATEPICKER_SCROLL_STRATEGY_PROVIDER_FACTORY */], [__WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["b" /* Overlay */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_107" /* ɵl */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_108" /* ɵm */], [__WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["b" /* Overlay */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_16__angular_material__["w" /* MD_SELECT_SCROLL_STRATEGY */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["x" /* MD_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY */], [__WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["b" /* Overlay */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_16__angular_material__["z" /* MD_TOOLTIP_SCROLL_STRATEGY */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["A" /* MD_TOOLTIP_SCROLL_STRATEGY_PROVIDER_FACTORY */], [__WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["b" /* Overlay */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_47" /* MdPaginatorIntl */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_47" /* MdPaginatorIntl */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_73" /* MdSnackBar */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_73" /* MdSnackBar */], [__WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["b" /* Overlay */],
            __WEBPACK_IMPORTED_MODULE_25__angular_cdk_a11y__["j" /* LiveAnnouncer */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["z" /* Injector */], [3, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_73" /* MdSnackBar */]]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_79" /* MdSortHeaderIntl */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_79" /* MdSortHeaderIntl */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_27__angular_forms__["n" /* ɵi */], __WEBPACK_IMPORTED_MODULE_27__angular_forms__["n" /* ɵi */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_28__angular_router__["a" /* ActivatedRoute */], __WEBPACK_IMPORTED_MODULE_28__angular_router__["x" /* ɵf */], [__WEBPACK_IMPORTED_MODULE_28__angular_router__["k" /* Router */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_28__angular_router__["d" /* NoPreloading */], __WEBPACK_IMPORTED_MODULE_28__angular_router__["d" /* NoPreloading */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](6144, __WEBPACK_IMPORTED_MODULE_28__angular_router__["f" /* PreloadingStrategy */], null, [__WEBPACK_IMPORTED_MODULE_28__angular_router__["d" /* NoPreloading */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](135680, __WEBPACK_IMPORTED_MODULE_28__angular_router__["p" /* RouterPreloader */], __WEBPACK_IMPORTED_MODULE_28__angular_router__["p" /* RouterPreloader */], [__WEBPACK_IMPORTED_MODULE_28__angular_router__["k" /* Router */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["G" /* NgModuleFactoryLoader */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["k" /* Compiler */],
            __WEBPACK_IMPORTED_MODULE_0__angular_core__["z" /* Injector */], __WEBPACK_IMPORTED_MODULE_28__angular_router__["f" /* PreloadingStrategy */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_28__angular_router__["e" /* PreloadAllModules */], __WEBPACK_IMPORTED_MODULE_28__angular_router__["e" /* PreloadAllModules */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_28__angular_router__["h" /* ROUTER_INITIALIZER */], __WEBPACK_IMPORTED_MODULE_28__angular_router__["A" /* ɵi */], [__WEBPACK_IMPORTED_MODULE_28__angular_router__["y" /* ɵg */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_0__angular_core__["b" /* APP_BOOTSTRAP_LISTENER */], function (p0_0) {
            return [p0_0];
        }, [__WEBPACK_IMPORTED_MODULE_28__angular_router__["h" /* ROUTER_INITIALIZER */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](135680, huepi_service_HuepiService, huepi_service_HuepiService, [__WEBPACK_IMPORTED_MODULE_28__angular_router__["k" /* Router */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](135680, ParametersService, ParametersService, [__WEBPACK_IMPORTED_MODULE_28__angular_router__["a" /* ActivatedRoute */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_14__angular_common__["b" /* CommonModule */], __WEBPACK_IMPORTED_MODULE_14__angular_common__["b" /* CommonModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](1024, __WEBPACK_IMPORTED_MODULE_0__angular_core__["r" /* ErrorHandler */], __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["r" /* ɵa */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](1024, __WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgProbeToken */], function () {
            return [__WEBPACK_IMPORTED_MODULE_28__angular_router__["t" /* ɵb */]()];
        }, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_28__angular_router__["y" /* ɵg */], __WEBPACK_IMPORTED_MODULE_28__angular_router__["y" /* ɵg */], [__WEBPACK_IMPORTED_MODULE_0__angular_core__["z" /* Injector */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](1024, __WEBPACK_IMPORTED_MODULE_0__angular_core__["d" /* APP_INITIALIZER */], function (p0_0, p0_1, p1_0) {
            return [__WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["s" /* ɵc */](p0_0, p0_1), __WEBPACK_IMPORTED_MODULE_28__angular_router__["z" /* ɵh */](p1_0)];
        }, [[2, __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["i" /* NgProbeToken */]], [2, __WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgProbeToken */]], __WEBPACK_IMPORTED_MODULE_28__angular_router__["y" /* ɵg */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_0__angular_core__["e" /* ApplicationInitStatus */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["e" /* ApplicationInitStatus */], [[2, __WEBPACK_IMPORTED_MODULE_0__angular_core__["d" /* APP_INITIALIZER */]]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](131584, __WEBPACK_IMPORTED_MODULE_0__angular_core__["_20" /* ɵe */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["_20" /* ɵe */], [__WEBPACK_IMPORTED_MODULE_0__angular_core__["J" /* NgZone */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["_14" /* ɵConsole */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["z" /* Injector */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["r" /* ErrorHandler */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* ComponentFactoryResolver */],
            __WEBPACK_IMPORTED_MODULE_0__angular_core__["e" /* ApplicationInitStatus */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](2048, __WEBPACK_IMPORTED_MODULE_0__angular_core__["g" /* ApplicationRef */], null, [__WEBPACK_IMPORTED_MODULE_0__angular_core__["_20" /* ɵe */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_0__angular_core__["f" /* ApplicationModule */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["f" /* ApplicationModule */], [__WEBPACK_IMPORTED_MODULE_0__angular_core__["g" /* ApplicationRef */]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["a" /* BrowserModule */], __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["a" /* BrowserModule */], [[3, __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["a" /* BrowserModule */]]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_18__angular_platform_browser_animations__["a" /* BrowserAnimationsModule */], __WEBPACK_IMPORTED_MODULE_18__angular_platform_browser_animations__["a" /* BrowserAnimationsModule */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["c" /* CompatibilityModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["c" /* CompatibilityModule */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_20__angular_cdk_bidi__["a" /* BidiModule */], __WEBPACK_IMPORTED_MODULE_20__angular_cdk_bidi__["a" /* BidiModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](256, __WEBPACK_IMPORTED_MODULE_16__angular_material__["j" /* MATERIAL_SANITY_CHECKS */], true, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_0" /* MdCommonModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_0" /* MdCommonModule */], [[2, __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["b" /* DOCUMENT */]], [2, __WEBPACK_IMPORTED_MODULE_16__angular_material__["j" /* MATERIAL_SANITY_CHECKS */]]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_21__angular_cdk_platform__["b" /* PlatformModule */], __WEBPACK_IMPORTED_MODULE_21__angular_cdk_platform__["b" /* PlatformModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_22__angular_cdk_scrolling__["b" /* ScrollDispatchModule */], __WEBPACK_IMPORTED_MODULE_22__angular_cdk_scrolling__["b" /* ScrollDispatchModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_61" /* MdRippleModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_61" /* MdRippleModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_55" /* MdPseudoCheckboxModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_55" /* MdPseudoCheckboxModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_45" /* MdOptionModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_45" /* MdOptionModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_31__angular_cdk_portal__["e" /* PortalModule */], __WEBPACK_IMPORTED_MODULE_31__angular_cdk_portal__["e" /* PortalModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["d" /* OverlayModule */], __WEBPACK_IMPORTED_MODULE_23__angular_cdk_overlay__["d" /* OverlayModule */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["G" /* MdAutocompleteModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["G" /* MdAutocompleteModule */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_102" /* StyleModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_102" /* StyleModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["J" /* MdButtonModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["J" /* MdButtonModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["N" /* MdButtonToggleModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["N" /* MdButtonToggleModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["S" /* MdCardModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["S" /* MdCardModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["Z" /* MdChipsModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["Z" /* MdChipsModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_24__angular_cdk_observers__["c" /* ObserversModule */], __WEBPACK_IMPORTED_MODULE_24__angular_cdk_observers__["c" /* ObserversModule */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["X" /* MdCheckboxModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["X" /* MdCheckboxModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_25__angular_cdk_a11y__["a" /* A11yModule */], __WEBPACK_IMPORTED_MODULE_25__angular_cdk_a11y__["a" /* A11yModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_9" /* MdDialogModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_9" /* MdDialogModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_25" /* MdIconModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_25" /* MdIconModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_5" /* MdDatepickerModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_5" /* MdDatepickerModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_32__angular_cdk_table__["n" /* CdkTableModule */], __WEBPACK_IMPORTED_MODULE_32__angular_cdk_table__["n" /* CdkTableModule */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_90" /* MdTableModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_90" /* MdTableModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_13" /* MdExpansionModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_13" /* MdExpansionModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_18" /* MdFormFieldModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_18" /* MdFormFieldModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_30" /* MdLineModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_30" /* MdLineModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_20" /* MdGridListModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_20" /* MdGridListModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_29" /* MdInputModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_29" /* MdInputModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_35" /* MdListModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_35" /* MdListModule */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_39" /* MdMenuModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_39" /* MdMenuModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_64" /* MdSelectModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_64" /* MdSelectModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_96" /* MdTooltipModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_96" /* MdTooltipModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_48" /* MdPaginatorModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_48" /* MdPaginatorModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_51" /* MdProgressBarModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_51" /* MdProgressBarModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_53" /* MdProgressSpinnerModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_53" /* MdProgressSpinnerModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_58" /* MdRadioModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_58" /* MdRadioModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_68" /* MdSidenavModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_68" /* MdSidenavModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_72" /* MdSliderModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_72" /* MdSliderModule */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_70" /* MdSlideToggleModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_70" /* MdSlideToggleModule */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_75" /* MdSnackBarModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_75" /* MdSnackBarModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_80" /* MdSortModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_80" /* MdSortModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_91" /* MdTabsModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_91" /* MdTabsModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_93" /* MdToolbarModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_93" /* MdToolbarModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["C" /* MaterialModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["C" /* MaterialModule */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_27__angular_forms__["m" /* ɵba */], __WEBPACK_IMPORTED_MODULE_27__angular_forms__["m" /* ɵba */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_27__angular_forms__["e" /* FormsModule */], __WEBPACK_IMPORTED_MODULE_27__angular_forms__["e" /* FormsModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, PipesModule, PipesModule, []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](1024, __WEBPACK_IMPORTED_MODULE_28__angular_router__["s" /* ɵa */], __WEBPACK_IMPORTED_MODULE_28__angular_router__["v" /* ɵd */], [[3, __WEBPACK_IMPORTED_MODULE_28__angular_router__["k" /* Router */]]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_28__angular_router__["r" /* UrlSerializer */], __WEBPACK_IMPORTED_MODULE_28__angular_router__["c" /* DefaultUrlSerializer */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_28__angular_router__["b" /* ChildrenOutletContexts */], __WEBPACK_IMPORTED_MODULE_28__angular_router__["b" /* ChildrenOutletContexts */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](256, __WEBPACK_IMPORTED_MODULE_28__angular_router__["g" /* ROUTER_CONFIGURATION */], { useHash: true }, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](1024, __WEBPACK_IMPORTED_MODULE_14__angular_common__["h" /* LocationStrategy */], __WEBPACK_IMPORTED_MODULE_28__angular_router__["u" /* ɵc */], [__WEBPACK_IMPORTED_MODULE_14__angular_common__["s" /* PlatformLocation */], [2, __WEBPACK_IMPORTED_MODULE_14__angular_common__["a" /* APP_BASE_HREF */]], __WEBPACK_IMPORTED_MODULE_28__angular_router__["g" /* ROUTER_CONFIGURATION */]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_14__angular_common__["g" /* Location */], __WEBPACK_IMPORTED_MODULE_14__angular_common__["g" /* Location */], [__WEBPACK_IMPORTED_MODULE_14__angular_common__["h" /* LocationStrategy */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_0__angular_core__["k" /* Compiler */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["k" /* Compiler */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_0__angular_core__["G" /* NgModuleFactoryLoader */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["X" /* SystemJsNgModuleLoader */], [__WEBPACK_IMPORTED_MODULE_0__angular_core__["k" /* Compiler */], [2, __WEBPACK_IMPORTED_MODULE_0__angular_core__["Y" /* SystemJsNgModuleLoaderConfig */]]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](1024, __WEBPACK_IMPORTED_MODULE_28__angular_router__["i" /* ROUTES */], function () {
            return [[{ path: 'groups', component: huewi_groups_component_HuewiGroupsComponent }, { path: 'groups/:id',
                        component: huewi_groups_component_HuewiGroupsComponent }], [{ path: 'lights', component: huewi_lights_component_HuewiLightsComponent },
                    { path: 'lights/:id', component: huewi_lights_component_HuewiLightsComponent }], [{ path: 'rules',
                        component: huewi_rules_component_HuewiRulesComponent }, { path: 'rules/:id', component: huewi_rules_component_HuewiRulesComponent }],
                [{ path: 'scenes', component: huewi_scenes_component_HuewiScenesComponent }, { path: 'scenes/:id',
                        component: huewi_scenes_component_HuewiScenesComponent }], [{ path: 'schedules', component: huewi_schedules_component_HuewiSchedulesComponent },
                    { path: 'schedules/:id', component: huewi_schedules_component_HuewiSchedulesComponent }],
                [{ path: 'sensors', component: huewi_sensors_component_HuewiSensorsComponent }, { path: 'sensors/:id',
                        component: huewi_sensors_component_HuewiSensorsComponent }], [{ path: 'bridges', component: huewi_bridges_component_HuewiBridgesComponent },
                    { path: 'bridges/:id', component: huewi_bridges_component_HuewiBridgesComponent }], [{ path: 'home',
                        component: huewi_home_component_HuewiHomeComponent }, { path: 'about', component: HuewiAboutComponent },
                    { path: '', redirectTo: '/home', pathMatch: 'full' }, { path: '**', redirectTo: '/home' }]];
        }, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](1024, __WEBPACK_IMPORTED_MODULE_28__angular_router__["k" /* Router */], __WEBPACK_IMPORTED_MODULE_28__angular_router__["w" /* ɵe */], [__WEBPACK_IMPORTED_MODULE_0__angular_core__["g" /* ApplicationRef */], __WEBPACK_IMPORTED_MODULE_28__angular_router__["r" /* UrlSerializer */],
            __WEBPACK_IMPORTED_MODULE_28__angular_router__["b" /* ChildrenOutletContexts */], __WEBPACK_IMPORTED_MODULE_14__angular_common__["g" /* Location */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["z" /* Injector */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["G" /* NgModuleFactoryLoader */],
            __WEBPACK_IMPORTED_MODULE_0__angular_core__["k" /* Compiler */], __WEBPACK_IMPORTED_MODULE_28__angular_router__["i" /* ROUTES */], __WEBPACK_IMPORTED_MODULE_28__angular_router__["g" /* ROUTER_CONFIGURATION */], [2, __WEBPACK_IMPORTED_MODULE_28__angular_router__["q" /* UrlHandlingStrategy */]],
            [2, __WEBPACK_IMPORTED_MODULE_28__angular_router__["j" /* RouteReuseStrategy */]]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_28__angular_router__["n" /* RouterModule */], __WEBPACK_IMPORTED_MODULE_28__angular_router__["n" /* RouterModule */], [[2, __WEBPACK_IMPORTED_MODULE_28__angular_router__["s" /* ɵa */]], [2, __WEBPACK_IMPORTED_MODULE_28__angular_router__["k" /* Router */]]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiGroupsRoutingModule, HuewiGroupsRoutingModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiGroupsModule, HuewiGroupsModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiLightsRoutingModule, HuewiLightsRoutingModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiLightsModule, HuewiLightsModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiRulesRoutingModule, HuewiRulesRoutingModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiRulesModule, HuewiRulesModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiScenesRoutingModule, HuewiScenesRoutingModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiScenesModule, HuewiScenesModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiSchedulesRoutingModule, HuewiSchedulesRoutingModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiSchedulesModule, HuewiSchedulesModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiSensorsRoutingModule, HuewiSensorsRoutingModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiSensorsModule, HuewiSensorsModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiBridgesRoutingModule, HuewiBridgesRoutingModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiBridgesModule, HuewiBridgesModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, AppRoutingModule, AppRoutingModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, AppModule, AppModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](256, __WEBPACK_IMPORTED_MODULE_16__angular_material__["s" /* MD_MENU_DEFAULT_OPTIONS */], { overlapTrigger: true,
            xPosition: 'after', yPosition: 'below' }, [])]);
});
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2FwcC5tb2R1bGUubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvYXBwLm1vZHVsZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIgIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7In0=
//# sourceMappingURL=app.module.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/main.ts
/* harmony import */ var main___WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__angular_platform_browser__ = __webpack_require__("fc+i");




if (environment.production) {
    Object(main___WEBPACK_IMPORTED_MODULE_0__angular_core__["_7" /* enableProdMode */])();
}
Object(__WEBPACK_IMPORTED_MODULE_3__angular_platform_browser__["k" /* platformBrowser */])().bootstrapModuleFactory(AppModuleNgFactory);
//# sourceMappingURL=main.js.map

/***/ }),

/***/ "gFIY":
/***/ (function(module, exports) {

function webpackEmptyAsyncContext(req) {
	return new Promise(function(resolve, reject) { reject(new Error("Cannot find module '" + req + "'.")); });
}
webpackEmptyAsyncContext.keys = function() { return []; };
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
module.exports = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = "gFIY";

/***/ })

},[0]);