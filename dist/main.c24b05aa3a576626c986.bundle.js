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
  constructor() { }
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
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of__ = __webpack_require__("/zHi");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5_rxjs_add_observable_of__);






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
        if (this.MyHue.Groups[0])
            this.MyHue.Groups[0].name = 'All available Lights';
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


var app_component_AppComponent = (function () {
    function AppComponent(huepiService, router) {
        this.huepiService = huepiService;
        this.router = router;
        this.title = 'hue Web Interface';
        this.theme = 'defaults-to-light';
    }
    AppComponent.prototype.toggleTheme = function () {
        this.theme === 'dark-theme' ? this.theme = '' : this.theme = 'dark-theme';
    };
    AppComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: app_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
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
    HuewiGroupComponent.prototype.ngOnDestroy = function () {
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
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_forms__ = __webpack_require__("bm2B");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__angular_cdk__ = __webpack_require__("p4Sk");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__angular_router__ = __webpack_require__("BkNc");
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
    return __WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 5, 'input', [['class',
                'col-5 col-sm-3 col-xl-2']], [[2, 'ng-untouched', null], [2, 'ng-touched',
                null], [2, 'ng-pristine', null], [2, 'ng-dirty', null],
            [2, 'ng-valid', null], [2, 'ng-invalid', null], [2, 'ng-pending',
                null]], [[null, 'ngModelChange'], [null, 'keyup'],
            [null, 'input'], [null, 'blur'], [null, 'compositionstart'],
            [null, 'compositionend']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('input' === en)) {
                var pd_0 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1)._handleInput($event.target.value) !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).onTouched() !== false);
                ad = (pd_1 && ad);
            }
            if (('compositionstart' === en)) {
                var pd_2 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1)._compositionStart() !== false);
                ad = (pd_2 && ad);
            }
            if (('compositionend' === en)) {
                var pd_3 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1)._compositionEnd($event.target.value) !== false);
                ad = (pd_3 && ad);
            }
            if (('ngModelChange' === en)) {
                var pd_4 = ((_co.group.name = $event) !== false);
                ad = (pd_4 && ad);
            }
            if (('keyup' === en)) {
                var pd_5 = (_co.rename(_co.group, $event.target.value) !== false);
                ad = (pd_5 && ad);
            }
            return ad;
        }, null, null)), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_2__angular_forms__["b" /* DefaultValueAccessor */], [__WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], __WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, __WEBPACK_IMPORTED_MODULE_2__angular_forms__["a" /* COMPOSITION_BUFFER_MODE */]]], null, null),
        __WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](1024, null, __WEBPACK_IMPORTED_MODULE_2__angular_forms__["f" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [__WEBPACK_IMPORTED_MODULE_2__angular_forms__["b" /* DefaultValueAccessor */]]), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, __WEBPACK_IMPORTED_MODULE_2__angular_forms__["j" /* NgModel */], [[8, null],
            [8, null], [8, null], [2, __WEBPACK_IMPORTED_MODULE_2__angular_forms__["f" /* NG_VALUE_ACCESSOR */]]], { model: [0,
                'model'] }, { update: 'ngModelChange' }), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](2048, null, __WEBPACK_IMPORTED_MODULE_2__angular_forms__["g" /* NgControl */], null, [__WEBPACK_IMPORTED_MODULE_2__angular_forms__["j" /* NgModel */]]), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_2__angular_forms__["h" /* NgControlStatus */], [__WEBPACK_IMPORTED_MODULE_2__angular_forms__["g" /* NgControl */]], null, null)], function (_ck, _v) {
        var _co = _v.component;
        var currVal_7 = _co.group.name;
        _ck(_v, 3, 0, currVal_7);
    }, function (_ck, _v) {
        var currVal_0 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 5).ngClassUntouched;
        var currVal_1 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 5).ngClassTouched;
        var currVal_2 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 5).ngClassPristine;
        var currVal_3 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 5).ngClassDirty;
        var currVal_4 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 5).ngClassValid;
        var currVal_5 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 5).ngClassInvalid;
        var currVal_6 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 5).ngClassPending;
        _ck(_v, 0, 0, currVal_0, currVal_1, currVal_2, currVal_3, currVal_4, currVal_5, currVal_6);
    });
}
function View_HuewiGroupComponent_2(_l) {
    return __WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [['class',
                'col-5 col-sm-3 col-xl-2']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.select(_co.group) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      ', '\n  ']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.group.name;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiGroupComponent_0(_l) {
    return __WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 24, 'span', [['class',
                'row']], null, null, null, null, null)),
        (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiGroupComponent_1)), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_3__angular_common__["k" /* NgIf */], [__WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], __WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiGroupComponent_2)),
        __WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_3__angular_common__["k" /* NgIf */], [__WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], __WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(),
            __WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 7, 'span', [['class', 'col-5 col-sm-7 col-xl-8']], null, null, null, null, null)),
        (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'md-slider', [['class', 'col-12 mat-slider'], ['role', 'slider'], ['tabindex',
                '0']], [[1, 'aria-disabled', 0], [1, 'aria-valuemax', 0], [1, 'aria-valuemin',
                0], [1, 'aria-valuenow', 0], [1, 'aria-orientation', 0], [2, 'mat-primary', null],
            [2, 'mat-accent', null], [2, 'mat-warn', null], [2, 'mat-slider-disabled',
                null], [2, 'mat-slider-has-ticks', null], [2, 'mat-slider-horizontal',
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
                var pd_0 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._onFocus() !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._onBlur() !== false);
                ad = (pd_1 && ad);
            }
            if (('click' === en)) {
                var pd_2 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._onClick($event) !== false);
                ad = (pd_2 && ad);
            }
            if (('keydown' === en)) {
                var pd_3 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._onKeydown($event) !== false);
                ad = (pd_3 && ad);
            }
            if (('keyup' === en)) {
                var pd_4 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._onKeyup() !== false);
                ad = (pd_4 && ad);
            }
            if (('mouseenter' === en)) {
                var pd_5 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._onMouseenter() !== false);
                ad = (pd_5 && ad);
            }
            if (('slide' === en)) {
                var pd_6 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._onSlide($event) !== false);
                ad = (pd_6 && ad);
            }
            if (('slideend' === en)) {
                var pd_7 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._onSlideEnd() !== false);
                ad = (pd_7 && ad);
            }
            if (('slidestart' === en)) {
                var pd_8 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._onSlideStart($event) !== false);
                ad = (pd_8 && ad);
            }
            if (('change' === en)) {
                var pd_9 = (_co.brightness(_co.group, $event.value) !== false);
                ad = (pd_9 && ad);
            }
            return ad;
        }, __WEBPACK_IMPORTED_MODULE_5__gendir_node_modules_angular_material_typings_index_ngfactory__["C" /* View_MdSlider_0 */], __WEBPACK_IMPORTED_MODULE_5__gendir_node_modules_angular_material_typings_index_ngfactory__["n" /* RenderType_MdSlider */])), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](5120, null, __WEBPACK_IMPORTED_MODULE_2__angular_forms__["f" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [__WEBPACK_IMPORTED_MODULE_6__angular_material__["_52" /* MdSlider */]]), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            __WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_6__angular_material__["_52" /* MdSlider */], [__WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], __WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_6__angular_material__["g" /* FocusOriginMonitor */], [2, __WEBPACK_IMPORTED_MODULE_7__angular_cdk__["q" /* Directionality */]]], { disabled: [0, 'disabled'], max: [1, 'max'], min: [2, 'min'], step: [3, 'step'], value: [4,
                'value'] }, { change: 'change' }), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])),
        (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])),
        (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'span', [['class', 'col-2']], null, null, null, null, null)), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-slide-toggle', [['class', 'mat-slide-toggle']], [[2, 'mat-checked', null], [2, 'mat-disabled',
                null], [2, 'mat-slide-toggle-label-before', null]], [[null,
                'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.toggle(_co.group) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, __WEBPACK_IMPORTED_MODULE_5__gendir_node_modules_angular_material_typings_index_ngfactory__["B" /* View_MdSlideToggle_0 */], __WEBPACK_IMPORTED_MODULE_5__gendir_node_modules_angular_material_typings_index_ngfactory__["m" /* RenderType_MdSlideToggle */])), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](5120, null, __WEBPACK_IMPORTED_MODULE_2__angular_forms__["f" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [__WEBPACK_IMPORTED_MODULE_6__angular_material__["_50" /* MdSlideToggle */]]), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1228800, null, 0, __WEBPACK_IMPORTED_MODULE_6__angular_material__["_50" /* MdSlideToggle */], [__WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */],
            __WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], __WEBPACK_IMPORTED_MODULE_7__angular_cdk__["L" /* Platform */], __WEBPACK_IMPORTED_MODULE_6__angular_material__["g" /* FocusOriginMonitor */], __WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { checked: [0,
                'checked'] }, null), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n    '])), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n'])), (_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.editable;
        _ck(_v, 3, 0, currVal_0);
        var currVal_1 = !_co.editable;
        _ck(_v, 6, 0, currVal_1);
        var currVal_19 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_24" /* ɵinlineInterpolate */](1, '', !_co.group.action.on, '');
        var currVal_20 = 255;
        var currVal_21 = 0;
        var currVal_22 = 1;
        var currVal_23 = _co.group.action.bri;
        _ck(_v, 13, 0, currVal_19, currVal_20, currVal_21, currVal_22, currVal_23);
        var currVal_27 = _co.group.action.on;
        _ck(_v, 21, 0, currVal_27);
    }, function (_ck, _v) {
        var currVal_2 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).disabled;
        var currVal_3 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).max;
        var currVal_4 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).min;
        var currVal_5 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).value;
        var currVal_6 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).vertical ? 'vertical' : 'horizontal');
        var currVal_7 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).color == 'primary');
        var currVal_8 = ((__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).color != 'primary') && (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).color != 'warn'));
        var currVal_9 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).color == 'warn');
        var currVal_10 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).disabled;
        var currVal_11 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).tickInterval;
        var currVal_12 = !__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).vertical;
        var currVal_13 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._invertAxis;
        var currVal_14 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._isSliding;
        var currVal_15 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).thumbLabel;
        var currVal_16 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).vertical;
        var currVal_17 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._isMinValue;
        var currVal_18 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).disabled || ((__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._isMinValue && __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._thumbGap) && __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._invertAxis));
        _ck(_v, 10, 1, [currVal_2, currVal_3, currVal_4, currVal_5, currVal_6, currVal_7, currVal_8,
            currVal_9, currVal_10, currVal_11, currVal_12, currVal_13, currVal_14, currVal_15,
            currVal_16, currVal_17, currVal_18]);
        var currVal_24 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 21).checked;
        var currVal_25 = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 21).disabled;
        var currVal_26 = (__WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 21).labelPosition == 'before');
        _ck(_v, 19, 0, currVal_24, currVal_25, currVal_26);
    });
}
function View_HuewiGroupComponent_Host_0(_l) {
    return __WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-group', [], null, null, null, View_HuewiGroupComponent_0, RenderType_HuewiGroupComponent)), __WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_group_component_HuewiGroupComponent, [huepi_service_HuepiService, __WEBPACK_IMPORTED_MODULE_9__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiGroupComponentNgFactory = __WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-group', huewi_group_component_HuewiGroupComponent, View_HuewiGroupComponent_Host_0, { group: 'group', editable: 'editable' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWdyb3Vwcy9odWV3aS1ncm91cC9odWV3aS1ncm91cC5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktZ3JvdXBzL2h1ZXdpLWdyb3VwL2h1ZXdpLWdyb3VwLmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWdyb3Vwcy9odWV3aS1ncm91cC9odWV3aS1ncm91cC5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWdyb3Vwcy9odWV3aS1ncm91cC9odWV3aS1ncm91cC5jb21wb25lbnQudHMuSHVld2lHcm91cENvbXBvbmVudF9Ib3N0Lmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiICIsIjxzcGFuIGNsYXNzPVwicm93XCI+XG4gIDxpbnB1dCAqbmdJZj1cImVkaXRhYmxlXCIgY2xhc3M9XCJjb2wtNSBjb2wtc20tMyBjb2wteGwtMlwiXG4gICAgWyhuZ01vZGVsKV09XCJncm91cC5uYW1lXCIgKGtleXVwKT1cInJlbmFtZShncm91cCwgJGV2ZW50LnRhcmdldC52YWx1ZSlcIj5cbiAgPHNwYW4gKm5nSWY9XCIhZWRpdGFibGVcIiBjbGFzcz1cImNvbC01IGNvbC1zbS0zIGNvbC14bC0yXCJcbiAgICAoY2xpY2spPVwic2VsZWN0KGdyb3VwKVwiPlxuICAgICAge3tncm91cC5uYW1lfX1cbiAgPC9zcGFuPlxuICA8c3BhbiBjbGFzcz1cImNvbC01IGNvbC1zbS03IGNvbC14bC04XCI+XG4gICAgPG1kLXNsaWRlciBjbGFzcz1cImNvbC0xMlwiXG4gICAgICAoY2hhbmdlKT1cImJyaWdodG5lc3MoZ3JvdXAsICRldmVudC52YWx1ZSlcIlxuICAgICAgZGlzYWJsZWQ9XCJ7eyFncm91cC5hY3Rpb24ub259fVwiXG4gICAgICBbbWluXT1cIjBcIiBbbWF4XT1cIjI1NVwiIFtzdGVwXT1cIjFcIiBbdmFsdWVdPVwiZ3JvdXAuYWN0aW9uLmJyaVwiPlxuICAgIDwvbWQtc2xpZGVyPlxuICA8L3NwYW4+XG4gIDxzcGFuIGNsYXNzPVwiY29sLTJcIj5cbiAgICA8bWQtc2xpZGUtdG9nZ2xlXG4gICAgICBbY2hlY2tlZF09XCJncm91cC5hY3Rpb24ub25cIlxuICAgICAgKGNsaWNrKT1cInRvZ2dsZShncm91cClcIj5cbiAgICA8L21kLXNsaWRlLXRvZ2dsZT5cbiAgPC9zcGFuPlxuPC9zcGFuPlxuIiwiPGh1ZXdpLWdyb3VwPjwvaHVld2ktZ3JvdXA+Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkNDRTtNQUFBO01BQUE7TUFBQTtVQUFBO01BQUE7TUFBQTtJQUFBO0lBQUE7SUFBQTtNQUFBO01BQUE7SUFBQTtJQUFBO01BQUE7TUFBQTtJQUFBO0lBQUE7TUFBQTtNQUFBO0lBQUE7SUFBQTtNQUFBO01BQUE7SUFBQTtJQUNFO01BQUE7TUFBQTtJQUFBO0lBQXlCO01BQUE7TUFBQTtJQUFBO0lBRDNCO0VBQUEsdUNBQUE7TUFBQTthQUFBO1FBQUE7TUFBQSxvQ0FBQTtVQUFBO1VBQUEsMkNBQUE7VUFBQSxtQ0FBQTtVQUFBOztJQUNFO0lBREYsV0FDRSxTQURGOztJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUEsV0FBQSxxRUFBQTs7OztvQkFFQTtNQUFBO0lBQUE7SUFBQTtJQUNFO01BQUE7TUFBQTtJQUFBO0lBREY7RUFBQSxnQ0FDMEI7OztRQUFBO1FBQUE7Ozs7b0JBSjVCO01BQUE7TUFBa0IseUNBQ2hCO1VBQUEsa0VBQUE7VUFBQTtVQUFBLGVBQ3dFLHlDQUN4RTtVQUFBO2FBQUE7VUFBQSx3QkFHTyx5Q0FDUDtpQkFBQTtjQUFBO01BQXNDLDJDQUNwQztVQUFBO2NBQUE7Y0FBQTtjQUFBO2tCQUFBO2tCQUFBO2tCQUFBO2NBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtVQUFBO1lBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUNFO2NBQUE7Y0FBQTtZQUFBO1lBREY7VUFBQTsrQkFBQTtZQUFBO1VBQUEsd0JBQUE7dUJBQUEsc0NBQUE7VUFBQTtVQUFBO2NBQUEsNkJBRzhEO01BQ2xELHlDQUNQO01BQ1A7VUFBQSwwREFBb0I7VUFBQSxhQUNsQjtVQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7WUFFRTtjQUFBO2NBQUE7WUFBQTtZQUZGO1VBQUE7K0JBQUE7WUFBQTtVQUFBLDZCQUFBOzZFQUFBO1VBQUEsMkJBRTBCLCtCQUNSO1VBQUEsV0FDYix1Q0FDRjtVQUFBOztJQW5CRTtJQUFQLFdBQU8sU0FBUDtJQUVNO0lBQU4sV0FBTSxTQUFOO0lBT0k7SUFDVTtJQUFWO0lBQXNCO0lBQVc7SUFIbkMsWUFFRSxXQUNVLFdBQVYsV0FBc0IsV0FBVyxVQUhuQztJQVFFO0lBREYsWUFDRSxVQURGOztJQVBBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7UUFBQTtJQUFBLGFBQUE7UUFBQTtRQUFBLGdDQUFBO0lBT0E7SUFBQTtJQUFBO0lBQUEsWUFBQSxnQ0FBQTs7OztvQkNmSjtNQUFBO29DQUFBLFVBQUE7TUFBQTtJQUFBOzs7OzsifQ==
//# sourceMappingURL=huewi-group.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/pipes/orderby.module.ts
var OrderByPipe = (function () {
    function OrderByPipe() {
        this.value = [];
    }
    OrderByPipe._orderByComparator = function (a, b) {
        if (a === null || typeof a === 'undefined')
            a = 0;
        if (b === null || typeof b === 'undefined')
            b = 0;
        if ((isNaN(parseFloat(a)) || !isFinite(a)) || (isNaN(parseFloat(b)) || !isFinite(b))) {
            //Isn't a number so lowercase the string to properly compare
            if (a.toLowerCase() < b.toLowerCase())
                return -1;
            if (a.toLowerCase() > b.toLowerCase())
                return 1;
        }
        else {
            //Parse strings as numbers to compare properly
            if (parseFloat(a) < parseFloat(b))
                return -1;
            if (parseFloat(a) > parseFloat(b))
                return 1;
        }
        return 0; //equal each other
    };
    OrderByPipe.prototype.transform = function (input, config) {
        if (config === void 0) { config = '+'; }
        //invalid input given
        if (!input)
            return input;
        //make a copy of the input's reference
        this.value = input.slice();
        var value = this.value;
        if (!Array.isArray(value))
            return value;
        if (!Array.isArray(config) || (Array.isArray(config) && config.length == 1)) {
            var propertyToCheck = !Array.isArray(config) ? config : config[0];
            var desc_1 = propertyToCheck.substr(0, 1) == '-';
            //Basic array
            if (!propertyToCheck || propertyToCheck == '-' || propertyToCheck == '+') {
                return !desc_1 ? value.sort() : value.sort().reverse();
            }
            else {
                var property_1 = propertyToCheck.substr(0, 1) == '+' || propertyToCheck.substr(0, 1) == '-'
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
            //Loop over property of the array in order and sort
            return value.sort(function (a, b) {
                for (var i = 0; i < config.length; i++) {
                    var desc = config[i].substr(0, 1) == '-';
                    var property = config[i].substr(0, 1) == '+' || config[i].substr(0, 1) == '-'
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
                    //Don't return 0 yet in case of needing to sort by next property
                    if (comparison != 0)
                        return comparison;
                }
                return 0; //equal each other
            });
        }
    };
    return OrderByPipe;
}());

var OrderByModule = (function () {
    function OrderByModule() {
    }
    return OrderByModule;
}());

//# sourceMappingURL=orderby.module.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/pipes/filter.module.ts
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

var FilterModule = (function () {
    function FilterModule() {
    }
    return FilterModule;
}());

//# sourceMappingURL=filter.module.js.map
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
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__angular_forms__ = __webpack_require__("bm2B");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__angular_cdk__ = __webpack_require__("p4Sk");
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
    return huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'md-checkbox', [['class', 'col-6 col-md-3 col-lg-2 mat-checkbox']], [[2, 'mat-checkbox-indeterminate',
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
        }, __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["u" /* View_MdCheckbox_0 */], __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["f" /* RenderType_MdCheckbox */])), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](5120, null, __WEBPACK_IMPORTED_MODULE_3__angular_forms__["f" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [__WEBPACK_IMPORTED_MODULE_4__angular_material__["L" /* MdCheckbox */]]), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_31" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_4__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](4374528, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["L" /* MdCheckbox */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */], __WEBPACK_IMPORTED_MODULE_4__angular_material__["g" /* FocusOriginMonitor */]], { checked: [0, 'checked'] }, null), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n    ', '\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_4 = _co.hasLight(_v.context.$implicit.__key);
        _ck(_v, 3, 0, currVal_4);
    }, function (_ck, _v) {
        var currVal_0 = huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 3).indeterminate;
        var currVal_1 = huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 3).checked;
        var currVal_2 = huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 3).disabled;
        var currVal_3 = (huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 3).labelPosition == 'before');
        _ck(_v, 0, 0, currVal_0, currVal_1, currVal_2, currVal_3);
        var currVal_5 = _v.context.$implicit.name;
        _ck(_v, 4, 0, currVal_5);
    });
}
function View_HuewiGroupDetailsComponent_1(_l) {
    return huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 5, 'div', [['class',
                'row']], null, null, null, null, null)),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 2, null, View_HuewiGroupDetailsComponent_2)), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, __WEBPACK_IMPORTED_MODULE_5__angular_common__["j" /* NgForOf */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, OrderByPipe, []),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵunv */](_v, 3, 0, huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 4).transform(_co.lights, '+name'));
        _ck(_v, 3, 0, currVal_0);
    }, null);
}
function View_HuewiGroupDetailsComponent_3(_l) {
    return huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 14, 'div', [['class',
                'right']], null, null, null, null, null)),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 9, 'small', [], null, null, null, null, null)), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, null, null, __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_31" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_4__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_7" /* MdIcon */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_4__angular_material__["_10" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['info_outline'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'i', [], null, null, null, null, null)), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['Lights can be part of multple LightGroups but only one Room.'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        _ck(_v, 8, 0);
    }, null);
}
function View_HuewiGroupDetailsComponent_0(_l) {
    return huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-group', [], null, null, null, View_HuewiGroupComponent_0, RenderType_HuewiGroupComponent)), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_group_component_HuewiGroupComponent, [huepi_service_HuepiService, __WEBPACK_IMPORTED_MODULE_10__angular_router__["k" /* Router */]], { group: [0, 'group'], editable: [1, 'editable'] }, null),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n'])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n\n'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n\n'])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 49, 'div', [['class',
                'row']], null, null, null, null, null)),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'col-6 col-md-3 mat-raised-button'], ['md-raised-button',
                '']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.relax(_co.group) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_31" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_4__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["w" /* MdButton */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_12__angular_cdk__["L" /* Platform */], __WEBPACK_IMPORTED_MODULE_4__angular_material__["g" /* FocusOriginMonitor */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_40" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['Relax'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'col-6 col-md-3 mat-raised-button'], ['md-raised-button',
                '']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.reading(_co.group) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_31" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_4__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["w" /* MdButton */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_12__angular_cdk__["L" /* Platform */], __WEBPACK_IMPORTED_MODULE_4__angular_material__["g" /* FocusOriginMonitor */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_40" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['Reading'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'col-6 col-md-3 mat-raised-button'], ['md-raised-button',
                '']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.concentrate(_co.group) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_31" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_4__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["w" /* MdButton */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_12__angular_cdk__["L" /* Platform */], __WEBPACK_IMPORTED_MODULE_4__angular_material__["g" /* FocusOriginMonitor */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_40" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['Concentrate'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'col-6 col-md-3 mat-raised-button'], ['md-raised-button',
                '']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.energize(_co.group) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_31" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_4__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["w" /* MdButton */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_12__angular_cdk__["L" /* Platform */], __WEBPACK_IMPORTED_MODULE_4__angular_material__["g" /* FocusOriginMonitor */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_40" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['Energize'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'col-6 col-md-3 mat-raised-button'], ['md-raised-button',
                '']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.bright(_co.group) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_31" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_4__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["w" /* MdButton */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_12__angular_cdk__["L" /* Platform */], __WEBPACK_IMPORTED_MODULE_4__angular_material__["g" /* FocusOriginMonitor */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_40" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['Bright'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'col-6 col-md-3 mat-raised-button'], ['md-raised-button',
                '']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.dimmed(_co.group) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_31" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_4__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["w" /* MdButton */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_12__angular_cdk__["L" /* Platform */], __WEBPACK_IMPORTED_MODULE_4__angular_material__["g" /* FocusOriginMonitor */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_40" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['Dimmed'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'col-6 col-md-3 mat-raised-button'], ['md-raised-button',
                '']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.nightLight(_co.group) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_31" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_4__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["w" /* MdButton */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_12__angular_cdk__["L" /* Platform */], __WEBPACK_IMPORTED_MODULE_4__angular_material__["g" /* FocusOriginMonitor */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_40" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['Nightlight'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'col-6 col-md-3 mat-raised-button'], ['md-raised-button',
                '']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.goldenHour(_co.group) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], __WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_31" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_4__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["w" /* MdButton */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_12__angular_cdk__["L" /* Platform */], __WEBPACK_IMPORTED_MODULE_4__angular_material__["g" /* FocusOriginMonitor */]], null, null), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_material__["_40" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['Golden hour'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n'])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n\n'])),
        (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n\n'])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiGroupDetailsComponent_1)), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(),
            huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n\n'])), (_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiGroupDetailsComponent_3)), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null)], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.group;
        var currVal_1 = (_co.group.__key !== '0');
        _ck(_v, 1, 0, currVal_0, currVal_1);
        var currVal_10 = (_co.group.__key !== '0');
        _ck(_v, 60, 0, currVal_10);
        var currVal_11 = (_co.group.__key !== '0');
        _ck(_v, 63, 0, currVal_11);
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
    return huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-group-details', [], null, null, null, View_HuewiGroupDetailsComponent_0, RenderType_HuewiGroupDetailsComponent)), huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_group_details_component_HuewiGroupDetailsComponent, [huepi_service_HuepiService], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiGroupDetailsComponentNgFactory = huewi_group_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-group-details', huewi_group_details_component_HuewiGroupDetailsComponent, View_HuewiGroupDetailsComponent_Host_0, { group: 'group' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWdyb3Vwcy9odWV3aS1ncm91cC1kZXRhaWxzL2h1ZXdpLWdyb3VwLWRldGFpbHMuY29tcG9uZW50Lm5nZmFjdG9yeS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWdyb3Vwcy9odWV3aS1ncm91cC1kZXRhaWxzL2h1ZXdpLWdyb3VwLWRldGFpbHMuY29tcG9uZW50LnRzIiwibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktZ3JvdXBzL2h1ZXdpLWdyb3VwLWRldGFpbHMvaHVld2ktZ3JvdXAtZGV0YWlscy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWdyb3Vwcy9odWV3aS1ncm91cC1kZXRhaWxzL2h1ZXdpLWdyb3VwLWRldGFpbHMuY29tcG9uZW50LnRzLkh1ZXdpR3JvdXBEZXRhaWxzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPGh1ZXdpLWdyb3VwIFtncm91cF09XCJncm91cFwiIFtlZGl0YWJsZV09XCJncm91cC5fX2tleSAhPT0gJzAnXCI+XG48L2h1ZXdpLWdyb3VwPlxuXG48YnI+XG5cbjxkaXYgY2xhc3M9XCJyb3dcIj5cbiAgPGJ1dHRvbiBtZC1yYWlzZWQtYnV0dG9uIGNsYXNzPVwiY29sLTYgY29sLW1kLTNcIiAoY2xpY2spPVwicmVsYXgoZ3JvdXApXCI+UmVsYXg8L2J1dHRvbj5cbiAgPGJ1dHRvbiBtZC1yYWlzZWQtYnV0dG9uIGNsYXNzPVwiY29sLTYgY29sLW1kLTNcIiAoY2xpY2spPVwicmVhZGluZyhncm91cClcIj5SZWFkaW5nPC9idXR0b24+XG4gIDxidXR0b24gbWQtcmFpc2VkLWJ1dHRvbiBjbGFzcz1cImNvbC02IGNvbC1tZC0zXCIgKGNsaWNrKT1cImNvbmNlbnRyYXRlKGdyb3VwKVwiPkNvbmNlbnRyYXRlPC9idXR0b24+XG4gIDxidXR0b24gbWQtcmFpc2VkLWJ1dHRvbiBjbGFzcz1cImNvbC02IGNvbC1tZC0zXCIgKGNsaWNrKT1cImVuZXJnaXplKGdyb3VwKVwiPkVuZXJnaXplPC9idXR0b24+XG4gIDxidXR0b24gbWQtcmFpc2VkLWJ1dHRvbiBjbGFzcz1cImNvbC02IGNvbC1tZC0zXCIgKGNsaWNrKT1cImJyaWdodChncm91cClcIj5CcmlnaHQ8L2J1dHRvbj5cbiAgPGJ1dHRvbiBtZC1yYWlzZWQtYnV0dG9uIGNsYXNzPVwiY29sLTYgY29sLW1kLTNcIiAoY2xpY2spPVwiZGltbWVkKGdyb3VwKVwiPkRpbW1lZDwvYnV0dG9uPlxuICA8YnV0dG9uIG1kLXJhaXNlZC1idXR0b24gY2xhc3M9XCJjb2wtNiBjb2wtbWQtM1wiIChjbGljayk9XCJuaWdodExpZ2h0KGdyb3VwKVwiPk5pZ2h0bGlnaHQ8L2J1dHRvbj5cbiAgPGJ1dHRvbiBtZC1yYWlzZWQtYnV0dG9uIGNsYXNzPVwiY29sLTYgY29sLW1kLTNcIiAoY2xpY2spPVwiZ29sZGVuSG91cihncm91cClcIj5Hb2xkZW4gaG91cjwvYnV0dG9uPlxuPC9kaXY+XG5cbjxicj5cblxuPGRpdiBjbGFzcz1cInJvd1wiICpuZ0lmPVwiZ3JvdXAuX19rZXkgIT09ICcwJ1wiPlxuICA8bWQtY2hlY2tib3ggKm5nRm9yPVwibGV0IGxpZ2h0IG9mIGxpZ2h0cyB8IG9yZGVyQnkgOiAnK25hbWUnXCIgY2xhc3M9XCJjb2wtNiBjb2wtbWQtMyBjb2wtbGctMlwiIFxuICBbY2hlY2tlZF09XCJoYXNMaWdodChsaWdodC5fX2tleSlcIiAoY2xpY2spPVwidG9nZ2xlTGlnaHQobGlnaHQuX19rZXkpXCI+XG4gICAge3tsaWdodC5uYW1lfX1cbiAgPC9tZC1jaGVja2JveD5cbjwvZGl2PlxuXG48ZGl2IGNsYXNzPVwicmlnaHRcIiAqbmdJZj1cImdyb3VwLl9fa2V5ICE9PSAnMCdcIj5cbiAgPGJyPlxuICA8c21hbGw+XG4gIDxtZC1pY29uPmluZm9fb3V0bGluZTwvbWQtaWNvbj5cbiAgPGk+TGlnaHRzIGNhbiBiZSBwYXJ0IG9mIG11bHRwbGUgTGlnaHRHcm91cHMgYnV0IG9ubHkgb25lIFJvb20uPC9pPlxuICA8L3NtYWxsPlxuPC9kaXY+IiwiPGh1ZXdpLWdyb3VwLWRldGFpbHM+PC9odWV3aS1ncm91cC1kZXRhaWxzPiJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JDbUJFO01BQUE7VUFBQTtVQUFBO1VBQUE7UUFBQTtRQUFBO1FBQ2tDO1VBQUE7VUFBQTtRQUFBO1FBRGxDO01BQUE7MkJBQUE7UUFBQTtNQUFBLDBCQUFBO21CQUFBLHNDQUFBO29CQUFBO01BQUEsdUNBQ3FFOzs7UUFBckU7UUFEQSxXQUNBLFNBREE7O1FBQUE7UUFBQTtRQUFBO1FBQUE7UUFBQSxXQUFBLHVDQUFBO1FBQ3FFO1FBQUE7Ozs7b0JBRnZFO01BQUE7TUFBNkMseUNBQzNDO1VBQUEseUVBQUE7VUFBQTtVQUFBLDhDQUFhO01BR0M7O0lBSEQ7SUFBYixXQUFhLFNBQWI7Ozs7b0JBTUY7TUFBQTtNQUErQyx5Q0FDN0M7VUFBQTtVQUFBLGdCQUFJLHlDQUNKO1VBQUE7VUFBQSw0Q0FBTztVQUFBLFdBQ1A7VUFBQTs4QkFBQSxVQUFBO1VBQUE7YUFBQTtVQUFBLGdEQUFTO01BQXNCLHlDQUMvQjtVQUFBO1VBQUEsZ0JBQUc7TUFBZ0UseUNBQzNEOztRQUZSOzs7O29CQTVCRjtNQUFBO3VDQUFBLFVBQUE7TUFBQTtNQUE4RCx1Q0FDaEQ7TUFFZDtVQUFBLDBEQUFJO1VBQUEsV0FFSjtVQUFBO01BQWlCLHlDQUNmO1VBQUE7Y0FBQTtZQUFBO1lBQUE7WUFBZ0Q7Y0FBQTtjQUFBO1lBQUE7WUFBaEQ7VUFBQSxxREFBQTtVQUFBO1VBQUEsb0NBQUE7VUFBQTtVQUFBLHNCQUFBO1VBQUEsMkNBQXVFO01BQWMseUNBQ3JGO1VBQUE7Y0FBQTtZQUFBO1lBQUE7WUFBZ0Q7Y0FBQTtjQUFBO1lBQUE7WUFBaEQ7VUFBQSxxREFBQTtVQUFBO1VBQUEsb0NBQUE7VUFBQTtVQUFBLHNCQUFBO1VBQUEsMkNBQXlFO01BQWdCLHlDQUN6RjtVQUFBO2NBQUE7WUFBQTtZQUFBO1lBQWdEO2NBQUE7Y0FBQTtZQUFBO1lBQWhEO1VBQUEscURBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQSxzQkFBQTtVQUFBLDJDQUE2RTtNQUFvQix5Q0FDakc7VUFBQTtjQUFBO1lBQUE7WUFBQTtZQUFnRDtjQUFBO2NBQUE7WUFBQTtZQUFoRDtVQUFBLHFEQUFBO1VBQUE7VUFBQSxvQ0FBQTtVQUFBO1VBQUEsc0JBQUE7VUFBQSwyQ0FBMEU7TUFBaUIseUNBQzNGO1VBQUE7Y0FBQTtZQUFBO1lBQUE7WUFBZ0Q7Y0FBQTtjQUFBO1lBQUE7WUFBaEQ7VUFBQSxxREFBQTtVQUFBO1VBQUEsb0NBQUE7VUFBQTtVQUFBLHNCQUFBO1VBQUEsMkNBQXdFO01BQWUseUNBQ3ZGO1VBQUE7Y0FBQTtZQUFBO1lBQUE7WUFBZ0Q7Y0FBQTtjQUFBO1lBQUE7WUFBaEQ7VUFBQSxxREFBQTtVQUFBO1VBQUEsb0NBQUE7VUFBQTtVQUFBLHNCQUFBO1VBQUEsMkNBQXdFO01BQWUseUNBQ3ZGO1VBQUE7Y0FBQTtZQUFBO1lBQUE7WUFBZ0Q7Y0FBQTtjQUFBO1lBQUE7WUFBaEQ7VUFBQSxxREFBQTtVQUFBO1VBQUEsb0NBQUE7VUFBQTtVQUFBLHNCQUFBO1VBQUEsMkNBQTRFO01BQW1CLHlDQUMvRjtVQUFBO2NBQUE7WUFBQTtZQUFBO1lBQWdEO2NBQUE7Y0FBQTtZQUFBO1lBQWhEO1VBQUEscURBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQSxzQkFBQTtVQUFBLDJDQUE0RTtNQUFvQix1Q0FDNUY7TUFFTjtVQUFBLDBEQUFJO1VBQUEsV0FFSjtVQUFBLDJDQUFBO1VBQUEsc0VBS007aUJBQUEsMEJBRU47VUFBQSx5RUFBQTtVQUFBO1VBQUE7O0lBekJhO0lBQWdCO0lBQTdCLFdBQWEsVUFBZ0IsU0FBN0I7SUFrQmlCO0lBQWpCLFlBQWlCLFVBQWpCO0lBT21CO0lBQW5CLFlBQW1CLFVBQW5COztJQW5CRTtJQUFBLFdBQUEsU0FBQTtJQUNBO0lBQUEsWUFBQSxTQUFBO0lBQ0E7SUFBQSxZQUFBLFNBQUE7SUFDQTtJQUFBLFlBQUEsU0FBQTtJQUNBO0lBQUEsWUFBQSxTQUFBO0lBQ0E7SUFBQSxZQUFBLFNBQUE7SUFDQTtJQUFBLFlBQUEsU0FBQTtJQUNBO0lBQUEsWUFBQSxTQUFBOzs7O29CQ2JGO01BQUE7MkNBQUEsVUFBQTtNQUFBO0lBQUE7Ozs7OyJ9
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
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-groups/huewi-groups.component.ts
/* harmony import */ var huewi_groups_component___WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_rxjs_Observable__ = __webpack_require__("bKpL");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_rxjs_Observable___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_rxjs_Observable__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_rxjs_add_observable_of__ = __webpack_require__("/zHi");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_rxjs_add_observable_of___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_rxjs_add_observable_of__);






var huewi_groups_component_HuewiGroupsComponent = (function () {
    function HuewiGroupsComponent(huepiService, activatedRoute, router) {
        this.huepiService = huepiService;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.groupsType = 'Rooms';
        this.groups = HUEWI_GROUPS_MOCK;
        this.groupObserver = __WEBPACK_IMPORTED_MODULE_3_rxjs_Observable__["Observable"].of(this.groups);
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
    HuewiGroupsComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: huewi_groups_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["a" /* ActivatedRoute */] }, { type: huewi_groups_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return HuewiGroupsComponent;
}());

//# sourceMappingURL=huewi-groups.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-groups/huewi-groups.component.ngfactory.ts
/* harmony import */ var huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__angular_forms__ = __webpack_require__("bm2B");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__angular_cdk__ = __webpack_require__("p4Sk");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
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
    return huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-group', [], null, null, null, View_HuewiGroupComponent_0, RenderType_HuewiGroupComponent)), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_group_component_HuewiGroupComponent, [huepi_service_HuepiService, __WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], { group: [0, 'group'] }, null), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    ']))], function (_ck, _v) {
        var currVal_0 = _v.context.$implicit;
        _ck(_v, 1, 0, currVal_0);
    }, null);
}
function View_HuewiGroupsComponent_1(_l) {
    return huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 24, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 14, 'md-card-title', [['class', 'mat-card-title ']], null, null, null, null, null)), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["J" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.changeGroupsType() !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['', ''])),
        (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'input', [['class', 'mat-input-element'], ['mdInput', ''], ['placeholder',
                'Filter']], [[8, 'id', 0], [8, 'placeholder', 0], [8, 'disabled', 0], [8, 'required',
                0], [1, 'aria-describedby', 0], [1, 'aria-invalid', 0], [2, 'ng-untouched', null],
            [2, 'ng-touched', null], [2, 'ng-pristine', null], [2, 'ng-dirty',
                null], [2, 'ng-valid', null], [2, 'ng-invalid', null],
            [2, 'ng-pending', null]], [[null, 'ngModelChange'], [null,
                'input'], [null, 'blur'], [null, 'compositionstart'], [null,
                'compositionend'], [null, 'focus']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('input' === en)) {
                var pd_0 = (huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._handleInput($event.target.value) !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10).onTouched() !== false);
                ad = (pd_1 && ad);
            }
            if (('compositionstart' === en)) {
                var pd_2 = (huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._compositionStart() !== false);
                ad = (pd_2 && ad);
            }
            if (('compositionend' === en)) {
                var pd_3 = (huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10)._compositionEnd($event.target.value) !== false);
                ad = (pd_3 && ad);
            }
            if (('blur' === en)) {
                var pd_4 = (huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 14)._onBlur() !== false);
                ad = (pd_4 && ad);
            }
            if (('focus' === en)) {
                var pd_5 = (huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 14)._onFocus() !== false);
                ad = (pd_5 && ad);
            }
            if (('input' === en)) {
                var pd_6 = (huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 14)._onInput() !== false);
                ad = (pd_6 && ad);
            }
            if (('ngModelChange' === en)) {
                var pd_7 = ((_co.searchText = $event) !== false);
                ad = (pd_7 && ad);
            }
            return ad;
        }, null, null)), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_7__angular_forms__["b" /* DefaultValueAccessor */], [huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, __WEBPACK_IMPORTED_MODULE_7__angular_forms__["a" /* COMPOSITION_BUFFER_MODE */]]], null, null), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](1024, null, __WEBPACK_IMPORTED_MODULE_7__angular_forms__["f" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [__WEBPACK_IMPORTED_MODULE_7__angular_forms__["b" /* DefaultValueAccessor */]]), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, __WEBPACK_IMPORTED_MODULE_7__angular_forms__["j" /* NgModel */], [[8, null],
            [8, null], [8, null], [2, __WEBPACK_IMPORTED_MODULE_7__angular_forms__["f" /* NG_VALUE_ACCESSOR */]]], { model: [0,
                'model'] }, { update: 'ngModelChange' }), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](2048, null, __WEBPACK_IMPORTED_MODULE_7__angular_forms__["g" /* NgControl */], null, [__WEBPACK_IMPORTED_MODULE_7__angular_forms__["j" /* NgModel */]]), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_13" /* MdInputDirective */], [huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], __WEBPACK_IMPORTED_MODULE_8__angular_cdk__["L" /* Platform */], [2, __WEBPACK_IMPORTED_MODULE_7__angular_forms__["g" /* NgControl */]], [2, __WEBPACK_IMPORTED_MODULE_7__angular_forms__["i" /* NgForm */]], [2,
                __WEBPACK_IMPORTED_MODULE_7__angular_forms__["c" /* FormGroupDirective */]], [2, huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["m" /* MD_ERROR_GLOBAL_OPTIONS */]]], { placeholder: [0,
                'placeholder'] }, null), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_7__angular_forms__["h" /* NgControlStatus */], [__WEBPACK_IMPORTED_MODULE_7__angular_forms__["g" /* NgControl */]], null, null), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 5, null, View_HuewiGroupsComponent_2)),
        huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, __WEBPACK_IMPORTED_MODULE_9__angular_common__["j" /* NgForOf */], [huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */],
            huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_38" /* ɵppd */](2), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](2),
        huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, OrderByPipe, []), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, FilterPipe, []),
        (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_14 = _co.searchText;
        _ck(_v, 12, 0, currVal_14);
        var currVal_15 = 'Filter';
        _ck(_v, 14, 0, currVal_15);
        var currVal_16 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵunv */](_v, 19, 0, huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 23).transform(huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵunv */](_v, 19, 0, huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 22).transform(huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵunv */](_v, 19, 0, _ck(_v, 20, 0, huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v.parent, 0), _co.groups, _co.groupsType)), _ck(_v, 21, 0, '+type', '+name'))), _co.searchText, 'name'));
        _ck(_v, 19, 0, currVal_16);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.groupsType;
        _ck(_v, 7, 0, currVal_0);
        var currVal_1 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 14).id;
        var currVal_2 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 14).placeholder;
        var currVal_3 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 14).disabled;
        var currVal_4 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 14).required;
        var currVal_5 = (huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 14).ariaDescribedby || null);
        var currVal_6 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 14)._isErrorState();
        var currVal_7 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).ngClassUntouched;
        var currVal_8 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).ngClassTouched;
        var currVal_9 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).ngClassPristine;
        var currVal_10 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).ngClassDirty;
        var currVal_11 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).ngClassValid;
        var currVal_12 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).ngClassInvalid;
        var currVal_13 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 15).ngClassPending;
        _ck(_v, 9, 1, [currVal_1, currVal_2, currVal_3, currVal_4, currVal_5, currVal_6, currVal_7,
            currVal_8, currVal_9, currVal_10, currVal_11, currVal_12, currVal_13]);
    });
}
function View_HuewiGroupsComponent_3(_l) {
    return huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 18, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 11, 'md-card-title', [['class', 'mat-card-title ']], null, null, null, null, null)), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["J" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'a', [], [[1, 'target', 0], [8, 'href', 4]], [[null,
                'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, __WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [__WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], __WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], __WEBPACK_IMPORTED_MODULE_9__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, __WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], __WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])),
        huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_7" /* MdIcon */], [huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_10" /* MdIconRegistry */], [8, null]], null, null), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['navigate_before'])), (_l()(),
            huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      ', ' Details\n    '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-group-details', [], null, null, null, View_HuewiGroupDetailsComponent_0, RenderType_HuewiGroupDetailsComponent)), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_group_details_component_HuewiGroupDetailsComponent, [huepi_service_HuepiService], { group: [0, 'group'] }, null),
        (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_2 = true;
        var currVal_3 = _ck(_v, 8, 0, '/groups');
        _ck(_v, 7, 0, currVal_2, currVal_3);
        _ck(_v, 11, 0);
        var currVal_5 = _co.selectedGroup;
        _ck(_v, 16, 0, currVal_5);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).target;
        var currVal_1 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).href;
        _ck(_v, 6, 0, currVal_0, currVal_1);
        var currVal_4 = _co.selectedGroup.type;
        _ck(_v, 13, 0, currVal_4);
    });
}
function View_HuewiGroupsComponent_0(_l) {
    return huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, HuewiGroupsFilter, []), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 9, 'md-card', [['class', 'mat-card']], [[24, '@RoutingAnimations',
                0]], null, null, __WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdCard_0 */], __WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])),
        huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["F" /* MdCard */], [], null, null), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiGroupsComponent_1)),
        huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_9__angular_common__["k" /* NgIf */], [huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, [' \n\n  '])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiGroupsComponent_3)), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_9__angular_common__["k" /* NgIf */], [huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n'])), (_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n']))], function (_ck, _v) {
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
    return huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-groups', [], [[40, '@RoutingAnimations', 0]], null, null, View_HuewiGroupsComponent_0, RenderType_HuewiGroupsComponent)), huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_groups_component_HuewiGroupsComponent, [huepi_service_HuepiService, __WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], __WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).RoutingAnimations;
        _ck(_v, 0, 0, currVal_0);
    });
}
var HuewiGroupsComponentNgFactory = huewi_groups_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-groups', huewi_groups_component_HuewiGroupsComponent, View_HuewiGroupsComponent_Host_0, { groups: 'groups' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWdyb3Vwcy9odWV3aS1ncm91cHMuY29tcG9uZW50Lm5nZmFjdG9yeS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWdyb3Vwcy9odWV3aS1ncm91cHMuY29tcG9uZW50LnRzIiwibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktZ3JvdXBzL2h1ZXdpLWdyb3Vwcy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWdyb3Vwcy9odWV3aS1ncm91cHMuY29tcG9uZW50LnRzLkh1ZXdpR3JvdXBzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPG1kLWNhcmQgW0BSb3V0aW5nQW5pbWF0aW9uc10+XG5cbiAgPGRpdiAqbmdJZj1cIiFzZWxlY3RlZEdyb3VwXCI+XG4gICAgPG1kLWNhcmQtdGl0bGU+XG4gICAgICA8c3BhbiAoY2xpY2spPVwiY2hhbmdlR3JvdXBzVHlwZSgpXCI+e3tncm91cHNUeXBlfX08L3NwYW4+XG4gICAgICA8aW5wdXQgbWRJbnB1dCBwbGFjZWhvbGRlcj1cIkZpbHRlclwiIFsobmdNb2RlbCldPVwic2VhcmNoVGV4dFwiPlxuICAgIDwvbWQtY2FyZC10aXRsZT5cbiAgICA8aHVld2ktZ3JvdXAgXG4gICAgICAqbmdGb3I9XCJsZXQgZ3JvdXAgb2YgZ3JvdXBzIHwgSHVld2lHcm91cHNGaWx0ZXI6Z3JvdXBzVHlwZSB8IG9yZGVyQnk6WycrdHlwZScsJytuYW1lJ10gfCBmaWx0ZXI6c2VhcmNoVGV4dDonbmFtZSdcIlxuICAgICAgW2dyb3VwXT1cImdyb3VwXCI+XG4gICAgPC9odWV3aS1ncm91cD5cbiAgPC9kaXY+IFxuXG4gIDxkaXYgKm5nSWY9XCJzZWxlY3RlZEdyb3VwXCI+XG4gICAgPG1kLWNhcmQtdGl0bGU+XG4gICAgICA8YSBbcm91dGVyTGlua109XCJbJy9ncm91cHMnXVwiIFtyZXBsYWNlVXJsXT1cInRydWVcIj48bWQtaWNvbj5uYXZpZ2F0ZV9iZWZvcmU8L21kLWljb24+PC9hPlxuICAgICAge3tzZWxlY3RlZEdyb3VwLnR5cGV9fSBEZXRhaWxzXG4gICAgPC9tZC1jYXJkLXRpdGxlPlxuICAgIDxodWV3aS1ncm91cC1kZXRhaWxzXG4gICAgICBbZ3JvdXBdPVwic2VsZWN0ZWRHcm91cFwiPlxuICAgIDwvaHVld2ktZ3JvdXAtZGV0YWlscz5cbiAgPC9kaXY+XG5cbjwvbWQtY2FyZD5cbiIsIjxodWV3aS1ncm91cHM+PC9odWV3aS1ncm91cHM+Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkNPSTtNQUFBO3VDQUFBLFVBQUE7TUFBQSwrREFFa0I7TUFBQTtJQUFoQjtJQUZGLFdBRUUsU0FGRjs7OztvQkFMRjtNQUFBLHdFQUE0QjthQUFBLDRCQUMxQjtNQUFBO01BQUEsbURBQUE7TUFBQTthQUFBO01BQWUsNkNBQ2I7VUFBQTtVQUFBO1lBQUE7WUFBQTtZQUFNO2NBQUE7Y0FBQTtZQUFBO1lBQU47VUFBQSxnQ0FBbUM7TUFBcUIsNkNBQ3hEO1VBQUE7Y0FBQTtjQUFBO2NBQUE7a0JBQUE7Y0FBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBb0M7Y0FBQTtjQUFBO1lBQUE7WUFBcEM7VUFBQSx1Q0FBQTtVQUFBO1VBQUEsc0JBQUE7UUFBQTtNQUFBLG9DQUFBO1VBQUE7VUFBQSwyQ0FBQTtVQUFBLG1DQUFBO1VBQUE7bUNBQUE7Y0FBQSxzQ0FBQTtVQUFBLDRDQUE2RDtVQUFBLGFBQy9DLDJDQUNoQjtVQUFBO2FBQUE7NEJBQUEsZ0RBQ0U7YUFBQTtNQUVZOztJQUx3QjtJQUFwQyxZQUFvQyxVQUFwQztJQUFlO0lBQWYsWUFBZSxVQUFmO0lBR0E7UUFBQTtZQUFBO1FBQUE7SUFERixZQUNFLFVBREY7OztJQUhxQztJQUFBO0lBQ25DO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUEsWUFBQSw0REFBQTtRQUFBLCtEQUFBOzs7O29CQVFKO01BQUEsd0VBQTJCO2FBQUEsNEJBQ3pCO01BQUE7TUFBQSxtREFBQTtNQUFBO2FBQUE7TUFBZSw2Q0FDYjtVQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7a0JBQUE7Y0FBQTtZQUFBO1lBQUE7VUFBQSx1Q0FBQTtVQUFBO2NBQUEsbURBQUcsSUFBK0M7VUFBQTtVQUFBO2FBQUE7dUJBQUEsc0NBQUE7VUFBQTtVQUFBLDZCQUFTLHdDQUE2QjtpQkFBQSwrQ0FFMUU7VUFBQSxhQUNoQjtVQUFBO21EQUFBLFVBQUE7VUFBQTtNQUMwQiwyQ0FDSjs7O1FBTFU7UUFBM0I7UUFBSCxXQUE4QixVQUEzQixTQUFIO1FBQWtEO1FBSWxEO1FBREYsWUFDRSxTQURGOzs7UUFIRTtRQUFBO1FBQUEsV0FBQSxtQkFBQTtRQUF3RjtRQUFBOzs7O21FQWY5RjtNQUFBO1VBQUE7YUFBQTt1QkFBQSxzQ0FBQTtVQUFBLHVEQUE4QjtVQUFBLGFBRTVCO2FBQUE7VUFBQSx3QkFTTSxnQ0FFTjtVQUFBLHFFQUFBO1VBQUE7VUFBQSxlQVFNLDZCQUVFO1VBQUE7O0lBckJIO0lBQUwsV0FBSyxTQUFMO0lBV0s7SUFBTCxXQUFLLFNBQUw7O0lBYk87SUFBVCxXQUFTLFNBQVQ7Ozs7b0JDQUE7TUFBQTtxQ0FBQSxVQUFBO01BQUE7O1FBQUE7O1FBQUE7UUFBQSxXQUFBLFNBQUE7Ozs7OyJ9
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
/* harmony import */ var huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__angular_forms__ = __webpack_require__("bm2B");
/* harmony import */ var huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_cdk__ = __webpack_require__("p4Sk");
/* harmony import */ var huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_router__ = __webpack_require__("BkNc");
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
    return huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 5, 'input', [['class',
                'col-5 col-sm-3 col-xl-2']], [[2, 'ng-untouched', null], [2, 'ng-touched',
                null], [2, 'ng-pristine', null], [2, 'ng-dirty', null],
            [2, 'ng-valid', null], [2, 'ng-invalid', null], [2, 'ng-pending',
                null]], [[null, 'ngModelChange'], [null, 'keyup'],
            [null, 'input'], [null, 'blur'], [null, 'compositionstart'],
            [null, 'compositionend']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('input' === en)) {
                var pd_0 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1)._handleInput($event.target.value) !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).onTouched() !== false);
                ad = (pd_1 && ad);
            }
            if (('compositionstart' === en)) {
                var pd_2 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1)._compositionStart() !== false);
                ad = (pd_2 && ad);
            }
            if (('compositionend' === en)) {
                var pd_3 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1)._compositionEnd($event.target.value) !== false);
                ad = (pd_3 && ad);
            }
            if (('ngModelChange' === en)) {
                var pd_4 = ((_co.light.name = $event) !== false);
                ad = (pd_4 && ad);
            }
            if (('keyup' === en)) {
                var pd_5 = (_co.rename(_co.light, $event.target.value) !== false);
                ad = (pd_5 && ad);
            }
            return ad;
        }, null, null)), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__angular_forms__["b" /* DefaultValueAccessor */], [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__angular_forms__["a" /* COMPOSITION_BUFFER_MODE */]]], null, null),
        huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](1024, null, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__angular_forms__["f" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__angular_forms__["b" /* DefaultValueAccessor */]]), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__angular_forms__["j" /* NgModel */], [[8, null],
            [8, null], [8, null], [2, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__angular_forms__["f" /* NG_VALUE_ACCESSOR */]]], { model: [0,
                'model'] }, { update: 'ngModelChange' }), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](2048, null, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__angular_forms__["g" /* NgControl */], null, [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__angular_forms__["j" /* NgModel */]]), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__angular_forms__["h" /* NgControlStatus */], [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__angular_forms__["g" /* NgControl */]], null, null)], function (_ck, _v) {
        var _co = _v.component;
        var currVal_7 = _co.light.name;
        _ck(_v, 3, 0, currVal_7);
    }, function (_ck, _v) {
        var currVal_0 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 5).ngClassUntouched;
        var currVal_1 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 5).ngClassTouched;
        var currVal_2 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 5).ngClassPristine;
        var currVal_3 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 5).ngClassDirty;
        var currVal_4 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 5).ngClassValid;
        var currVal_5 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 5).ngClassInvalid;
        var currVal_6 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 5).ngClassPending;
        _ck(_v, 0, 0, currVal_0, currVal_1, currVal_2, currVal_3, currVal_4, currVal_5, currVal_6);
    });
}
function View_HuewiLightComponent_2(_l) {
    return huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [['class',
                'col-5 col-sm-3 col-xl-2']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.select(_co.light) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    ', '\n  ']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.light.name;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiLightComponent_0(_l) {
    return huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 24, 'span', [['class',
                'row']], null, null, null, null, null)),
        (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiLightComponent_1)), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_common__["k" /* NgIf */], [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiLightComponent_2)),
        huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_common__["k" /* NgIf */], [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 7, 'span', [['class', 'col-5 col-sm-7 col-xl-8']], null, null, null, null, null)),
        (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'md-slider', [['class', 'col-12 mat-slider'], ['role', 'slider'], ['tabindex',
                '0']], [[1, 'aria-disabled', 0], [1, 'aria-valuemax', 0], [1, 'aria-valuemin',
                0], [1, 'aria-valuenow', 0], [1, 'aria-orientation', 0], [2, 'mat-primary', null],
            [2, 'mat-accent', null], [2, 'mat-warn', null], [2, 'mat-slider-disabled',
                null], [2, 'mat-slider-has-ticks', null], [2, 'mat-slider-horizontal',
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
                var pd_0 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._onFocus() !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._onBlur() !== false);
                ad = (pd_1 && ad);
            }
            if (('click' === en)) {
                var pd_2 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._onClick($event) !== false);
                ad = (pd_2 && ad);
            }
            if (('keydown' === en)) {
                var pd_3 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._onKeydown($event) !== false);
                ad = (pd_3 && ad);
            }
            if (('keyup' === en)) {
                var pd_4 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._onKeyup() !== false);
                ad = (pd_4 && ad);
            }
            if (('mouseenter' === en)) {
                var pd_5 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._onMouseenter() !== false);
                ad = (pd_5 && ad);
            }
            if (('slide' === en)) {
                var pd_6 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._onSlide($event) !== false);
                ad = (pd_6 && ad);
            }
            if (('slideend' === en)) {
                var pd_7 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._onSlideEnd() !== false);
                ad = (pd_7 && ad);
            }
            if (('slidestart' === en)) {
                var pd_8 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._onSlideStart($event) !== false);
                ad = (pd_8 && ad);
            }
            if (('change' === en)) {
                var pd_9 = (_co.brightness(_co.light, $event.value) !== false);
                ad = (pd_9 && ad);
            }
            return ad;
        }, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__gendir_node_modules_angular_material_typings_index_ngfactory__["C" /* View_MdSlider_0 */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__gendir_node_modules_angular_material_typings_index_ngfactory__["n" /* RenderType_MdSlider */])), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](5120, null, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__angular_forms__["f" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_52" /* MdSlider */]]), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_52" /* MdSlider */], [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["g" /* FocusOriginMonitor */], [2, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_cdk__["q" /* Directionality */]]], { disabled: [0, 'disabled'], max: [1, 'max'], min: [2, 'min'], step: [3, 'step'], value: [4,
                'value'] }, { change: 'change' }), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])),
        (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])),
        (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'span', [['class', 'col-2']], null, null, null, null, null)), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-slide-toggle', [['class', 'mat-slide-toggle']], [[2, 'mat-checked', null], [2, 'mat-disabled',
                null], [2, 'mat-slide-toggle-label-before', null]], [[null,
                'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.toggle(_co.light) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__gendir_node_modules_angular_material_typings_index_ngfactory__["B" /* View_MdSlideToggle_0 */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__gendir_node_modules_angular_material_typings_index_ngfactory__["m" /* RenderType_MdSlideToggle */])), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](5120, null, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__angular_forms__["f" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_50" /* MdSlideToggle */]]), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1228800, null, 0, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_50" /* MdSlideToggle */], [huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */],
            huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_cdk__["L" /* Platform */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["g" /* FocusOriginMonitor */], huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { disabled: [0,
                'disabled'], checked: [1, 'checked'] }, null), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n    '])),
        (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n'])),
        (_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.editable;
        _ck(_v, 3, 0, currVal_0);
        var currVal_1 = !_co.editable;
        _ck(_v, 6, 0, currVal_1);
        var currVal_19 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_24" /* ɵinlineInterpolate */](1, '', !_co.light.state.on, '');
        var currVal_20 = 255;
        var currVal_21 = 0;
        var currVal_22 = 1;
        var currVal_23 = _co.light.state.bri;
        _ck(_v, 13, 0, currVal_19, currVal_20, currVal_21, currVal_22, currVal_23);
        var currVal_27 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_24" /* ɵinlineInterpolate */](1, '', !_co.light.state.reachable, '');
        var currVal_28 = _co.light.state.on;
        _ck(_v, 21, 0, currVal_27, currVal_28);
    }, function (_ck, _v) {
        var currVal_2 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).disabled;
        var currVal_3 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).max;
        var currVal_4 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).min;
        var currVal_5 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).value;
        var currVal_6 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).vertical ? 'vertical' : 'horizontal');
        var currVal_7 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).color == 'primary');
        var currVal_8 = ((huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).color != 'primary') && (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).color != 'warn'));
        var currVal_9 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).color == 'warn');
        var currVal_10 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).disabled;
        var currVal_11 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).tickInterval;
        var currVal_12 = !huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).vertical;
        var currVal_13 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._invertAxis;
        var currVal_14 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._isSliding;
        var currVal_15 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).thumbLabel;
        var currVal_16 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).vertical;
        var currVal_17 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._isMinValue;
        var currVal_18 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).disabled || ((huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._isMinValue && huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._thumbGap) && huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13)._invertAxis));
        _ck(_v, 10, 1, [currVal_2, currVal_3, currVal_4, currVal_5, currVal_6, currVal_7, currVal_8,
            currVal_9, currVal_10, currVal_11, currVal_12, currVal_13, currVal_14, currVal_15,
            currVal_16, currVal_17, currVal_18]);
        var currVal_24 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 21).checked;
        var currVal_25 = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 21).disabled;
        var currVal_26 = (huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 21).labelPosition == 'before');
        _ck(_v, 19, 0, currVal_24, currVal_25, currVal_26);
    });
}
function View_HuewiLightComponent_Host_0(_l) {
    return huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-light', [], null, null, null, View_HuewiLightComponent_0, RenderType_HuewiLightComponent)), huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_light_component_HuewiLightComponent, [huepi_service_HuepiService, huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiLightComponentNgFactory = huewi_light_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-light', huewi_light_component_HuewiLightComponent, View_HuewiLightComponent_Host_0, { light: 'light', editable: 'editable' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWxpZ2h0cy9odWV3aS1saWdodC9odWV3aS1saWdodC5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktbGlnaHRzL2h1ZXdpLWxpZ2h0L2h1ZXdpLWxpZ2h0LmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWxpZ2h0cy9odWV3aS1saWdodC9odWV3aS1saWdodC5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWxpZ2h0cy9odWV3aS1saWdodC9odWV3aS1saWdodC5jb21wb25lbnQudHMuSHVld2lMaWdodENvbXBvbmVudF9Ib3N0Lmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiICIsIjxzcGFuIGNsYXNzPVwicm93XCI+XG4gIDxpbnB1dCAqbmdJZj1cImVkaXRhYmxlXCIgY2xhc3M9XCJjb2wtNSBjb2wtc20tMyBjb2wteGwtMlwiXG4gICAgWyhuZ01vZGVsKV09XCJsaWdodC5uYW1lXCIgKGtleXVwKT1cInJlbmFtZShsaWdodCwgJGV2ZW50LnRhcmdldC52YWx1ZSlcIj5cbiAgPHNwYW4gKm5nSWY9XCIhZWRpdGFibGVcIiBjbGFzcz1cImNvbC01IGNvbC1zbS0zIGNvbC14bC0yXCJcbiAgICAoY2xpY2spPVwic2VsZWN0KGxpZ2h0KVwiPlxuICAgIHt7bGlnaHQubmFtZX19XG4gIDwvc3Bhbj5cbiAgPHNwYW4gY2xhc3M9XCJjb2wtNSBjb2wtc20tNyBjb2wteGwtOFwiPlxuICAgIDxtZC1zbGlkZXIgY2xhc3M9XCJjb2wtMTJcIlxuICAgICAgKGNoYW5nZSk9XCJicmlnaHRuZXNzKGxpZ2h0LCAkZXZlbnQudmFsdWUpXCJcbiAgICAgIGRpc2FibGVkPVwie3shbGlnaHQuc3RhdGUub259fVwiXG4gICAgICBbbWluXT1cIjBcIiBbbWF4XT1cIjI1NVwiIFtzdGVwXT1cIjFcIiBbdmFsdWVdPVwibGlnaHQuc3RhdGUuYnJpXCI+XG4gICAgPC9tZC1zbGlkZXI+XG4gIDwvc3Bhbj5cbiAgPHNwYW4gY2xhc3M9XCJjb2wtMlwiPlxuICAgIDxtZC1zbGlkZS10b2dnbGVcbiAgICAgIGRpc2FibGVkPVwie3shbGlnaHQuc3RhdGUucmVhY2hhYmxlfX1cIlxuICAgICAgW2NoZWNrZWRdPVwibGlnaHQuc3RhdGUub25cIlxuICAgICAgKGNsaWNrKT1cInRvZ2dsZShsaWdodClcIj5cbiAgICA8L21kLXNsaWRlLXRvZ2dsZT5cbiAgPC9zcGFuPlxuPC9zcGFuPlxuIiwiPGh1ZXdpLWxpZ2h0PjwvaHVld2ktbGlnaHQ+Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkNDRTtNQUFBO01BQUE7TUFBQTtVQUFBO01BQUE7TUFBQTtJQUFBO0lBQUE7SUFBQTtNQUFBO01BQUE7SUFBQTtJQUFBO01BQUE7TUFBQTtJQUFBO0lBQUE7TUFBQTtNQUFBO0lBQUE7SUFBQTtNQUFBO01BQUE7SUFBQTtJQUNFO01BQUE7TUFBQTtJQUFBO0lBQXlCO01BQUE7TUFBQTtJQUFBO0lBRDNCO0VBQUEsdUNBQUE7TUFBQTthQUFBO1FBQUE7TUFBQSxvQ0FBQTtVQUFBO1VBQUEsMkNBQUE7VUFBQSxtQ0FBQTtVQUFBOztJQUNFO0lBREYsV0FDRSxTQURGOztJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUEsV0FBQSxxRUFBQTs7OztvQkFFQTtNQUFBO0lBQUE7SUFBQTtJQUNFO01BQUE7TUFBQTtJQUFBO0lBREY7RUFBQSxnQ0FDMEI7OztRQUFBO1FBQUE7Ozs7b0JBSjVCO01BQUE7TUFBa0IseUNBQ2hCO1VBQUEsa0VBQUE7VUFBQTtVQUFBLGVBQ3dFLHlDQUN4RTtVQUFBO2FBQUE7VUFBQSx3QkFHTyx5Q0FDUDtpQkFBQTtjQUFBO01BQXNDLDJDQUNwQztVQUFBO2NBQUE7Y0FBQTtjQUFBO2tCQUFBO2tCQUFBO2tCQUFBO2NBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtVQUFBO1lBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUNFO2NBQUE7Y0FBQTtZQUFBO1lBREY7VUFBQTsrQkFBQTtZQUFBO1VBQUEsd0JBQUE7dUJBQUEsc0NBQUE7VUFBQTtVQUFBO2NBQUEsNkJBRzZEO01BQ2pELHlDQUNQO01BQ1A7VUFBQSwwREFBb0I7VUFBQSxhQUNsQjtVQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7WUFHRTtjQUFBO2NBQUE7WUFBQTtZQUhGO1VBQUE7K0JBQUE7WUFBQTtVQUFBLDZCQUFBOzZFQUFBO1VBQUEsa0RBRzBCO01BQ1IseUNBQ2I7TUFDRjs7SUFwQkU7SUFBUCxXQUFPLFNBQVA7SUFFTTtJQUFOLFdBQU0sU0FBTjtJQU9JO0lBQ1U7SUFBVjtJQUFzQjtJQUFXO0lBSG5DLFlBRUUsV0FDVSxXQUFWLFdBQXNCLFdBQVcsVUFIbkM7SUFRRTtJQUNBO0lBRkYsWUFDRSxXQUNBLFVBRkY7O0lBUEE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtRQUFBO0lBQUEsYUFBQTtRQUFBO1FBQUEsZ0NBQUE7SUFPQTtJQUFBO0lBQUE7SUFBQSxZQUFBLGdDQUFBOzs7O29CQ2ZKO01BQUE7b0NBQUEsVUFBQTtNQUFBO0lBQUE7Ozs7OyJ9
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
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__angular_cdk__ = __webpack_require__("p4Sk");
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
    return huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-light', [], null, null, null, View_HuewiLightComponent_0, RenderType_HuewiLightComponent)), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_light_component_HuewiLightComponent, [huepi_service_HuepiService, huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], { light: [0, 'light'], editable: [1, 'editable'] }, null),
        (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n'])), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n\n'])),
        (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n\n'])), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 49, 'div', [['class',
                'row']], null, null, null, null, null)),
        (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'col-6 col-md-3 mat-raised-button'], ['md-raised-button',
                '']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.relax(_co.light) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_31" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_8__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["w" /* MdButton */], [huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_9__angular_cdk__["L" /* Platform */], __WEBPACK_IMPORTED_MODULE_8__angular_material__["g" /* FocusOriginMonitor */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_40" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['Relax'])),
        (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'col-6 col-md-3 mat-raised-button'], ['md-raised-button',
                '']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.reading(_co.light) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_31" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_8__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["w" /* MdButton */], [huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_9__angular_cdk__["L" /* Platform */], __WEBPACK_IMPORTED_MODULE_8__angular_material__["g" /* FocusOriginMonitor */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_40" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['Reading'])),
        (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'col-6 col-md-3 mat-raised-button'], ['md-raised-button',
                '']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.concentrate(_co.light) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_31" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_8__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["w" /* MdButton */], [huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_9__angular_cdk__["L" /* Platform */], __WEBPACK_IMPORTED_MODULE_8__angular_material__["g" /* FocusOriginMonitor */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_40" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['Concentrate'])),
        (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'col-6 col-md-3 mat-raised-button'], ['md-raised-button',
                '']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.energize(_co.light) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_31" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_8__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["w" /* MdButton */], [huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_9__angular_cdk__["L" /* Platform */], __WEBPACK_IMPORTED_MODULE_8__angular_material__["g" /* FocusOriginMonitor */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_40" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['Energize'])),
        (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'col-6 col-md-3 mat-raised-button'], ['md-raised-button',
                '']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.bright(_co.light) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_31" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_8__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["w" /* MdButton */], [huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_9__angular_cdk__["L" /* Platform */], __WEBPACK_IMPORTED_MODULE_8__angular_material__["g" /* FocusOriginMonitor */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_40" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['Bright'])),
        (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'col-6 col-md-3 mat-raised-button'], ['md-raised-button',
                '']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.dimmed(_co.light) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_31" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_8__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["w" /* MdButton */], [huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_9__angular_cdk__["L" /* Platform */], __WEBPACK_IMPORTED_MODULE_8__angular_material__["g" /* FocusOriginMonitor */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_40" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['Dimmed'])),
        (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'col-6 col-md-3 mat-raised-button'], ['md-raised-button',
                '']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.nightLight(_co.light) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_31" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_8__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["w" /* MdButton */], [huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_9__angular_cdk__["L" /* Platform */], __WEBPACK_IMPORTED_MODULE_8__angular_material__["g" /* FocusOriginMonitor */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_40" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['Nightlight'])),
        (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'col-6 col-md-3 mat-raised-button'], ['md-raised-button',
                '']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.goldenHour(_co.light) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], __WEBPACK_IMPORTED_MODULE_7__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_31" /* MdPrefixRejector */], [[2, __WEBPACK_IMPORTED_MODULE_8__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["w" /* MdButton */], [huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_9__angular_cdk__["L" /* Platform */], __WEBPACK_IMPORTED_MODULE_8__angular_material__["g" /* FocusOriginMonitor */]], null, null), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_8__angular_material__["_40" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['Golden hour'])),
        (_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n']))], function (_ck, _v) {
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
    return huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-light-details', [], null, null, null, View_HuewiLightDetailsComponent_0, RenderType_HuewiLightDetailsComponent)), huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_light_details_component_HuewiLightDetailsComponent, [huepi_service_HuepiService], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiLightDetailsComponentNgFactory = huewi_light_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-light-details', huewi_light_details_component_HuewiLightDetailsComponent, View_HuewiLightDetailsComponent_Host_0, { light: 'light' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWxpZ2h0cy9odWV3aS1saWdodC1kZXRhaWxzL2h1ZXdpLWxpZ2h0LWRldGFpbHMuY29tcG9uZW50Lm5nZmFjdG9yeS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWxpZ2h0cy9odWV3aS1saWdodC1kZXRhaWxzL2h1ZXdpLWxpZ2h0LWRldGFpbHMuY29tcG9uZW50LnRzIiwibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktbGlnaHRzL2h1ZXdpLWxpZ2h0LWRldGFpbHMvaHVld2ktbGlnaHQtZGV0YWlscy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWxpZ2h0cy9odWV3aS1saWdodC1kZXRhaWxzL2h1ZXdpLWxpZ2h0LWRldGFpbHMuY29tcG9uZW50LnRzLkh1ZXdpTGlnaHREZXRhaWxzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPGh1ZXdpLWxpZ2h0IFtsaWdodF09XCJsaWdodFwiIFtlZGl0YWJsZV09XCJ0cnVlXCI+XG48L2h1ZXdpLWxpZ2h0PlxuXG48YnI+XG5cbjxkaXYgY2xhc3M9XCJyb3dcIj5cbiAgPGJ1dHRvbiBtZC1yYWlzZWQtYnV0dG9uIGNsYXNzPVwiY29sLTYgY29sLW1kLTNcIiAoY2xpY2spPVwicmVsYXgobGlnaHQpXCI+UmVsYXg8L2J1dHRvbj5cbiAgPGJ1dHRvbiBtZC1yYWlzZWQtYnV0dG9uIGNsYXNzPVwiY29sLTYgY29sLW1kLTNcIiAoY2xpY2spPVwicmVhZGluZyhsaWdodClcIj5SZWFkaW5nPC9idXR0b24+XG4gIDxidXR0b24gbWQtcmFpc2VkLWJ1dHRvbiBjbGFzcz1cImNvbC02IGNvbC1tZC0zXCIgKGNsaWNrKT1cImNvbmNlbnRyYXRlKGxpZ2h0KVwiPkNvbmNlbnRyYXRlPC9idXR0b24+XG4gIDxidXR0b24gbWQtcmFpc2VkLWJ1dHRvbiBjbGFzcz1cImNvbC02IGNvbC1tZC0zXCIgKGNsaWNrKT1cImVuZXJnaXplKGxpZ2h0KVwiPkVuZXJnaXplPC9idXR0b24+XG4gIDxidXR0b24gbWQtcmFpc2VkLWJ1dHRvbiBjbGFzcz1cImNvbC02IGNvbC1tZC0zXCIgKGNsaWNrKT1cImJyaWdodChsaWdodClcIj5CcmlnaHQ8L2J1dHRvbj5cbiAgPGJ1dHRvbiBtZC1yYWlzZWQtYnV0dG9uIGNsYXNzPVwiY29sLTYgY29sLW1kLTNcIiAoY2xpY2spPVwiZGltbWVkKGxpZ2h0KVwiPkRpbW1lZDwvYnV0dG9uPlxuICA8YnV0dG9uIG1kLXJhaXNlZC1idXR0b24gY2xhc3M9XCJjb2wtNiBjb2wtbWQtM1wiIChjbGljayk9XCJuaWdodExpZ2h0KGxpZ2h0KVwiPk5pZ2h0bGlnaHQ8L2J1dHRvbj5cbiAgPGJ1dHRvbiBtZC1yYWlzZWQtYnV0dG9uIGNsYXNzPVwiY29sLTYgY29sLW1kLTNcIiAoY2xpY2spPVwiZ29sZGVuSG91cihsaWdodClcIj5Hb2xkZW4gaG91cjwvYnV0dG9uPlxuPC9kaXY+IiwiPGh1ZXdpLWxpZ2h0LWRldGFpbHM+PC9odWV3aS1saWdodC1kZXRhaWxzPiJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JDQUE7TUFBQTt1Q0FBQSxVQUFBO01BQUE7TUFBK0MsdUNBQ2pDO01BRWQ7VUFBQSwwREFBSTtVQUFBLFdBRUo7VUFBQTtNQUFpQix5Q0FDZjtVQUFBO2NBQUE7WUFBQTtZQUFBO1lBQWdEO2NBQUE7Y0FBQTtZQUFBO1lBQWhEO1VBQUEscURBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQSxzQkFBQTtVQUFBLDJDQUF1RTtNQUFjLHlDQUNyRjtVQUFBO2NBQUE7WUFBQTtZQUFBO1lBQWdEO2NBQUE7Y0FBQTtZQUFBO1lBQWhEO1VBQUEscURBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQSxzQkFBQTtVQUFBLDJDQUF5RTtNQUFnQix5Q0FDekY7VUFBQTtjQUFBO1lBQUE7WUFBQTtZQUFnRDtjQUFBO2NBQUE7WUFBQTtZQUFoRDtVQUFBLHFEQUFBO1VBQUE7VUFBQSxvQ0FBQTtVQUFBO1VBQUEsc0JBQUE7VUFBQSwyQ0FBNkU7TUFBb0IseUNBQ2pHO1VBQUE7Y0FBQTtZQUFBO1lBQUE7WUFBZ0Q7Y0FBQTtjQUFBO1lBQUE7WUFBaEQ7VUFBQSxxREFBQTtVQUFBO1VBQUEsb0NBQUE7VUFBQTtVQUFBLHNCQUFBO1VBQUEsMkNBQTBFO01BQWlCLHlDQUMzRjtVQUFBO2NBQUE7WUFBQTtZQUFBO1lBQWdEO2NBQUE7Y0FBQTtZQUFBO1lBQWhEO1VBQUEscURBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQSxzQkFBQTtVQUFBLDJDQUF3RTtNQUFlLHlDQUN2RjtVQUFBO2NBQUE7WUFBQTtZQUFBO1lBQWdEO2NBQUE7Y0FBQTtZQUFBO1lBQWhEO1VBQUEscURBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQSxzQkFBQTtVQUFBLDJDQUF3RTtNQUFlLHlDQUN2RjtVQUFBO2NBQUE7WUFBQTtZQUFBO1lBQWdEO2NBQUE7Y0FBQTtZQUFBO1lBQWhEO1VBQUEscURBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQSxzQkFBQTtVQUFBLDJDQUE0RTtNQUFtQix5Q0FDL0Y7VUFBQTtjQUFBO1lBQUE7WUFBQTtZQUFnRDtjQUFBO2NBQUE7WUFBQTtZQUFoRDtVQUFBLHFEQUFBO1VBQUE7VUFBQSxvQ0FBQTtVQUFBO1VBQUEsc0JBQUE7VUFBQSwyQ0FBNEU7TUFBb0I7O0lBYnJGO0lBQWdCO0lBQTdCLFdBQWEsVUFBZ0IsU0FBN0I7O0lBTUU7SUFBQSxXQUFBLFNBQUE7SUFDQTtJQUFBLFlBQUEsU0FBQTtJQUNBO0lBQUEsWUFBQSxTQUFBO0lBQ0E7SUFBQSxZQUFBLFNBQUE7SUFDQTtJQUFBLFlBQUEsU0FBQTtJQUNBO0lBQUEsWUFBQSxTQUFBO0lBQ0E7SUFBQSxZQUFBLFNBQUE7SUFDQTtJQUFBLFlBQUEsU0FBQTs7OztvQkNiRjtNQUFBOzJDQUFBLFVBQUE7TUFBQTtJQUFBOzs7OzsifQ==
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
/* harmony import */ var huewi_lights_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable__ = __webpack_require__("bKpL");
/* harmony import */ var huewi_lights_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable___default = __webpack_require__.n(huewi_lights_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable__);
/* harmony import */ var huewi_lights_component___WEBPACK_IMPORTED_MODULE_4_rxjs_add_observable_of__ = __webpack_require__("/zHi");
/* harmony import */ var huewi_lights_component___WEBPACK_IMPORTED_MODULE_4_rxjs_add_observable_of___default = __webpack_require__.n(huewi_lights_component___WEBPACK_IMPORTED_MODULE_4_rxjs_add_observable_of__);






var huewi_lights_component_HuewiLightsComponent = (function () {
    function HuewiLightsComponent(huepiService, activatedRoute, router) {
        this.huepiService = huepiService;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.lights = HUEWI_LIGHTS_MOCK;
        this.lightObserver = huewi_lights_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable__["Observable"].of(this.lights);
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
    HuewiLightsComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: huewi_lights_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["a" /* ActivatedRoute */] }, { type: huewi_lights_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return HuewiLightsComponent;
}());

//# sourceMappingURL=huewi-lights.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-lights/huewi-lights.component.ngfactory.ts
/* harmony import */ var huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__ = __webpack_require__("bm2B");
/* harmony import */ var huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_cdk__ = __webpack_require__("p4Sk");
/* harmony import */ var huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
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
    return huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-light', [], null, null, null, View_HuewiLightComponent_0, RenderType_HuewiLightComponent)), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_light_component_HuewiLightComponent, [huepi_service_HuepiService, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], { light: [0, 'light'] }, null), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    ']))], function (_ck, _v) {
        var currVal_0 = _v.context.$implicit;
        _ck(_v, 1, 0, currVal_0);
    }, null);
}
function View_HuewiLightsComponent_1(_l) {
    return huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 20, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 11, 'md-card-title', [['class', 'mat-card-title ']], null, null, null, null, null)), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["J" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      Lights\n      '])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'input', [['class', 'mat-input-element'], ['mdInput',
                ''], ['placeholder', 'Filter']], [[8, 'id', 0], [8, 'placeholder', 0], [8, 'disabled',
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
                var pd_0 = (huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7)._handleInput($event.target.value) !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).onTouched() !== false);
                ad = (pd_1 && ad);
            }
            if (('compositionstart' === en)) {
                var pd_2 = (huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7)._compositionStart() !== false);
                ad = (pd_2 && ad);
            }
            if (('compositionend' === en)) {
                var pd_3 = (huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7)._compositionEnd($event.target.value) !== false);
                ad = (pd_3 && ad);
            }
            if (('blur' === en)) {
                var pd_4 = (huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onBlur() !== false);
                ad = (pd_4 && ad);
            }
            if (('focus' === en)) {
                var pd_5 = (huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onFocus() !== false);
                ad = (pd_5 && ad);
            }
            if (('input' === en)) {
                var pd_6 = (huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onInput() !== false);
                ad = (pd_6 && ad);
            }
            if (('ngModelChange' === en)) {
                var pd_7 = ((_co.searchText = $event) !== false);
                ad = (pd_7 && ad);
            }
            return ad;
        }, null, null)), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["b" /* DefaultValueAccessor */], [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["a" /* COMPOSITION_BUFFER_MODE */]]], null, null), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](1024, null, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["f" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["b" /* DefaultValueAccessor */]]), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["j" /* NgModel */], [[8, null],
            [8, null], [8, null], [2, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["f" /* NG_VALUE_ACCESSOR */]]], { model: [0,
                'model'] }, { update: 'ngModelChange' }), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](2048, null, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["g" /* NgControl */], null, [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["j" /* NgModel */]]), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_13" /* MdInputDirective */], [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_cdk__["L" /* Platform */], [2, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["g" /* NgControl */]], [2, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["i" /* NgForm */]], [2,
                huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["c" /* FormGroupDirective */]], [2, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["m" /* MD_ERROR_GLOBAL_OPTIONS */]]], { placeholder: [0,
                'placeholder'] }, null), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["h" /* NgControlStatus */], [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["g" /* NgControl */]], null, null), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 4, null, View_HuewiLightsComponent_2)),
        huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["j" /* NgForOf */], [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */],
            huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, OrderByPipe, []), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, FilterPipe, []), (_l()(),
            huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_13 = _co.searchText;
        _ck(_v, 9, 0, currVal_13);
        var currVal_14 = 'Filter';
        _ck(_v, 11, 0, currVal_14);
        var currVal_15 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵunv */](_v, 16, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 19).transform(huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵunv */](_v, 16, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 18).transform(_co.lights, _ck(_v, 17, 0, '+name'))), _co.searchText, 'name'));
        _ck(_v, 16, 0, currVal_15);
    }, function (_ck, _v) {
        var currVal_0 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).id;
        var currVal_1 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).placeholder;
        var currVal_2 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).disabled;
        var currVal_3 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).required;
        var currVal_4 = (huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).ariaDescribedby || null);
        var currVal_5 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._isErrorState();
        var currVal_6 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassUntouched;
        var currVal_7 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassTouched;
        var currVal_8 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassPristine;
        var currVal_9 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassDirty;
        var currVal_10 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassValid;
        var currVal_11 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassInvalid;
        var currVal_12 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassPending;
        _ck(_v, 6, 1, [currVal_0, currVal_1, currVal_2, currVal_3, currVal_4, currVal_5, currVal_6,
            currVal_7, currVal_8, currVal_9, currVal_10, currVal_11, currVal_12]);
    });
}
function View_HuewiLightsComponent_3(_l) {
    return huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 18, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 11, 'md-card-title', [['class', 'mat-card-title ']], null, null, null, null, null)), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["J" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      '])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'a', [], [[1, 'target', 0], [8, 'href', 4]], [[null,
                'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])),
        huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_7" /* MdIcon */], [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_10" /* MdIconRegistry */], [8, null]], null, null), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['navigate_before'])), (_l()(),
            huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      Light Details\n    '])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-light-details', [], null, null, null, View_HuewiLightDetailsComponent_0, RenderType_HuewiLightDetailsComponent)), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_light_details_component_HuewiLightDetailsComponent, [huepi_service_HuepiService], { light: [0, 'light'] }, null),
        (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_2 = true;
        var currVal_3 = _ck(_v, 8, 0, '/lights');
        _ck(_v, 7, 0, currVal_2, currVal_3);
        _ck(_v, 11, 0);
        var currVal_4 = _co.selectedLight;
        _ck(_v, 16, 0, currVal_4);
    }, function (_ck, _v) {
        var currVal_0 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).target;
        var currVal_1 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).href;
        _ck(_v, 6, 0, currVal_0, currVal_1);
    });
}
function View_HuewiLightsComponent_0(_l) {
    return huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 9, 'md-card', [['class',
                'mat-card']], [[24, '@RoutingAnimations', 0]], null, null, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdCard_0 */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2,
                huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["F" /* MdCard */], [], null, null),
        (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiLightsComponent_1)), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["k" /* NgIf */], [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */],
            huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n  '])),
        (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiLightsComponent_3)),
        huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["k" /* NgIf */], [huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n'])), (_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n']))], function (_ck, _v) {
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
    return huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-lights', [], [[40, '@RoutingAnimations', 0]], null, null, View_HuewiLightsComponent_0, RenderType_HuewiLightsComponent)), huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_lights_component_HuewiLightsComponent, [huepi_service_HuepiService, huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).RoutingAnimations;
        _ck(_v, 0, 0, currVal_0);
    });
}
var HuewiLightsComponentNgFactory = huewi_lights_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-lights', huewi_lights_component_HuewiLightsComponent, View_HuewiLightsComponent_Host_0, { lights: 'lights' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWxpZ2h0cy9odWV3aS1saWdodHMuY29tcG9uZW50Lm5nZmFjdG9yeS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWxpZ2h0cy9odWV3aS1saWdodHMuY29tcG9uZW50LnRzIiwibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktbGlnaHRzL2h1ZXdpLWxpZ2h0cy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWxpZ2h0cy9odWV3aS1saWdodHMuY29tcG9uZW50LnRzLkh1ZXdpTGlnaHRzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPG1kLWNhcmQgW0BSb3V0aW5nQW5pbWF0aW9uc10+XG5cbiAgPGRpdiAqbmdJZj1cIiFzZWxlY3RlZExpZ2h0XCI+XG4gICAgPG1kLWNhcmQtdGl0bGU+XG4gICAgICBMaWdodHNcbiAgICAgIDxpbnB1dCBtZElucHV0IHBsYWNlaG9sZGVyPVwiRmlsdGVyXCIgWyhuZ01vZGVsKV09XCJzZWFyY2hUZXh0XCI+XG4gICAgPC9tZC1jYXJkLXRpdGxlPlxuICAgIDxodWV3aS1saWdodCBcbiAgICAgICpuZ0Zvcj1cImxldCBsaWdodCBvZiBsaWdodHMgfCBvcmRlckJ5OlsnK25hbWUnXSB8IGZpbHRlcjpzZWFyY2hUZXh0OiduYW1lJ1wiXG4gICAgICBbbGlnaHRdPVwibGlnaHRcIj5cbiAgICA8L2h1ZXdpLWxpZ2h0PlxuICA8L2Rpdj5cblxuICA8ZGl2ICpuZ0lmPVwic2VsZWN0ZWRMaWdodFwiPlxuICAgIDxtZC1jYXJkLXRpdGxlPlxuICAgICAgPGEgW3JvdXRlckxpbmtdPVwiWycvbGlnaHRzJ11cIiBbcmVwbGFjZVVybF09XCJ0cnVlXCI+PG1kLWljb24+bmF2aWdhdGVfYmVmb3JlPC9tZC1pY29uPjwvYT5cbiAgICAgIExpZ2h0IERldGFpbHNcbiAgICA8L21kLWNhcmQtdGl0bGU+XG4gICAgPGh1ZXdpLWxpZ2h0LWRldGFpbHNcbiAgICAgIFtsaWdodF09XCJzZWxlY3RlZExpZ2h0XCI+XG4gICAgPC9odWV3aS1saWdodC1kZXRhaWxzPlxuICA8L2Rpdj5cblxuPC9tZC1jYXJkPlxuIiwiPGh1ZXdpLWxpZ2h0cz48L2h1ZXdpLWxpZ2h0cz4iXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JDT0k7TUFBQTt1Q0FBQSxVQUFBO01BQUEsK0RBRWtCO01BQUE7SUFBaEI7SUFGRixXQUVFLFNBRkY7Ozs7b0JBTEY7TUFBQSx3RUFBNEI7YUFBQSw0QkFDMUI7TUFBQTtNQUFBLG1EQUFBO01BQUE7YUFBQTtNQUFlLDJEQUViO1VBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQW9DO2NBQUE7Y0FBQTtZQUFBO1lBQXBDO1VBQUEsdUNBQUE7VUFBQTtVQUFBLHNCQUFBO1FBQUE7TUFBQSxvQ0FBQTtVQUFBO1VBQUEsMkNBQUE7VUFBQSxtQ0FBQTtVQUFBO21DQUFBO2NBQUEsc0NBQUE7VUFBQSw0Q0FBNkQ7VUFBQSxhQUMvQywyQ0FDaEI7VUFBQTthQUFBOzRCQUFBLGdEQUNFOzBCQUFBLHVEQUVZO2lCQUFBOztJQUx3QjtJQUFwQyxXQUFvQyxVQUFwQztJQUFlO0lBQWYsWUFBZSxVQUFmO0lBR0E7UUFBQTtRQUFBO0lBREYsWUFDRSxVQURGOztJQUZFO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUEsWUFBQSw0REFBQTtRQUFBLDhEQUFBOzs7O29CQVFKO01BQUEsd0VBQTJCO2FBQUEsNEJBQ3pCO01BQUE7TUFBQSxtREFBQTtNQUFBO2FBQUE7TUFBZSw2Q0FDYjtVQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7a0JBQUE7Y0FBQTtZQUFBO1lBQUE7VUFBQSx1Q0FBQTtVQUFBO2NBQUEsbURBQUcsSUFBK0M7VUFBQTtVQUFBO2FBQUE7dUJBQUEsc0NBQUE7VUFBQTtVQUFBLDZCQUFTLHdDQUE2QjtpQkFBQSxpREFFMUU7VUFBQSxhQUNoQjtVQUFBO21EQUFBLFVBQUE7VUFBQTtNQUMwQiwyQ0FDSjs7O1FBTFU7UUFBM0I7UUFBSCxXQUE4QixVQUEzQixTQUFIO1FBQWtEO1FBSWxEO1FBREYsWUFDRSxTQURGOztRQUhFO1FBQUE7UUFBQSxXQUFBLG1CQUFBOzs7O29CQWZOO01BQUE7MkJBQUEsVUFBQTtvQ0FBQTthQUFBO01BQThCLCtCQUU1QjtVQUFBLHFDQUFBO3dCQUFBLG1DQVNNO01BRU47YUFBQTtVQUFBLHdCQVFNLDZCQUVFO1VBQUE7O0lBckJIO0lBQUwsV0FBSyxTQUFMO0lBV0s7SUFBTCxXQUFLLFNBQUw7O0lBYk87SUFBVCxXQUFTLFNBQVQ7Ozs7b0JDQUE7TUFBQTtxQ0FBQSxVQUFBO01BQUE7O1FBQUE7O1FBQUE7UUFBQSxXQUFBLFNBQUE7Ozs7OyJ9
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
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__angular_router__ = __webpack_require__("BkNc");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */





var styles_HuewiRuleComponent = [huewi_rule_component_css_shim_ngstyle_styles];
var RenderType_HuewiRuleComponent = huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiRuleComponent, data: {} });
function View_HuewiRuleComponent_0(_l) {
    return huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 7, 'span', [['class',
                'row']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.select(_co.rule) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), (_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [['class', 'col-8 col-md-6']], null, null, null, null, null)),
        (_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    ', '\n  '])), (_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [['class',
                'col-2']], null, null, null, null, null)),
        (_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n'])),
        (_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.rule.name;
        _ck(_v, 3, 0, currVal_0);
    });
}
function View_HuewiRuleComponent_Host_0(_l) {
    return huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-rule', [], null, null, null, View_HuewiRuleComponent_0, RenderType_HuewiRuleComponent)),
        huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_rule_component_HuewiRuleComponent, [huepi_service_HuepiService, __WEBPACK_IMPORTED_MODULE_4__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiRuleComponentNgFactory = huewi_rule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-rule', huewi_rule_component_HuewiRuleComponent, View_HuewiRuleComponent_Host_0, { rule: 'rule' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXJ1bGVzL2h1ZXdpLXJ1bGUvaHVld2ktcnVsZS5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktcnVsZXMvaHVld2ktcnVsZS9odWV3aS1ydWxlLmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXJ1bGVzL2h1ZXdpLXJ1bGUvaHVld2ktcnVsZS5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXJ1bGVzL2h1ZXdpLXJ1bGUvaHVld2ktcnVsZS5jb21wb25lbnQudHMuSHVld2lSdWxlQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPHNwYW4gY2xhc3M9XCJyb3dcIlxuICAoY2xpY2spPVwic2VsZWN0KHJ1bGUpXCI+XG4gIDxzcGFuIGNsYXNzPVwiY29sLTggY29sLW1kLTZcIj5cbiAgICB7e3J1bGUubmFtZX19XG4gIDwvc3Bhbj5cbiAgPHNwYW4gY2xhc3M9XCJjb2wtMlwiPlxuICA8L3NwYW4+XG48L3NwYW4+XG4iLCI8aHVld2ktcnVsZT48L2h1ZXdpLXJ1bGU+Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JDQUE7TUFBQTtJQUFBO0lBQUE7SUFDRTtNQUFBO01BQUE7SUFBQTtJQURGO0VBQUEsZ0NBQ3lCLHlDQUN2QjthQUFBO1VBQUE7TUFBNkIsa0RBRXRCO1VBQUEsV0FDUDtVQUFBO01BQW9CLHlDQUNiO01BQ0Y7O0lBTHdCO0lBQUE7Ozs7b0JDRi9CO01BQUE7YUFBQTtVQUFBO0lBQUE7Ozs7In0=
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
 */ var huewi_rule_details_component_css_shim_ngstyle_styles = [''];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXJ1bGVzL2h1ZXdpLXJ1bGUtZGV0YWlscy9odWV3aS1ydWxlLWRldGFpbHMuY29tcG9uZW50LmNzcy5zaGltLm5nc3R5bGUudHMiLCJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZzovLy9Vc2Vycy9hcm5kL0RldmVsb3Blci9odWV3aTIvc3JjL2FwcC9odWV3aS1ydWxlcy9odWV3aS1ydWxlLWRldGFpbHMvaHVld2ktcnVsZS1kZXRhaWxzLmNvbXBvbmVudC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiICJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7OyJ9
//# sourceMappingURL=huewi-rule-details.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-rules/huewi-rule-details/huewi-rule-details.component.ts

var huewi_rule_details_component_HuewiRuleDetailsComponent = (function () {
    function HuewiRuleDetailsComponent(huepiService) {
        this.huepiService = huepiService;
    }
    HuewiRuleDetailsComponent.prototype.ngOnInit = function () {
    };
    HuewiRuleDetailsComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }]; };
    return HuewiRuleDetailsComponent;
}());

//# sourceMappingURL=huewi-rule-details.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-rules/huewi-rule-details/huewi-rule-details.component.ngfactory.ts
/* harmony import */ var huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__angular_router__ = __webpack_require__("BkNc");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */








var styles_HuewiRuleDetailsComponent = [huewi_rule_details_component_css_shim_ngstyle_styles];
var RenderType_HuewiRuleDetailsComponent = huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiRuleDetailsComponent, data: {} });
function View_HuewiRuleDetailsComponent_2(_l) {
    return huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [], null, null, null, null, null)), (_l()(),
            huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\'', '\'']))], null, function (_ck, _v) {
        var currVal_0 = _v.parent.context.$implicit.value;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiRuleDetailsComponent_3(_l) {
    return huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'span', [], null, null, null, null, null)), (_l()(),
            huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, [' & '])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null))], null, null);
}
function View_HuewiRuleDetailsComponent_1(_l) {
    return huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 7, 'span', [], null, null, null, null, null)), (_l()(),
            huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    ', ' ', ' ', '\n    '])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiRuleDetailsComponent_2)),
        huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_2__angular_common__["k" /* NgIf */], [huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, [' ', '\n    '])), (_l()(),
            huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiRuleDetailsComponent_3)),
        huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_2__angular_common__["k" /* NgIf */], [huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
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
function View_HuewiRuleDetailsComponent_5(_l) {
    return huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'span', [], null, null, null, null, null)), (_l()(),
            huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, [' + '])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null))], null, null);
}
function View_HuewiRuleDetailsComponent_4(_l) {
    return huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 5, 'span', [], null, null, null, null, null)), (_l()(),
            huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    ', ' ', ' ', ' ', ' ', '\n    '])), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, __WEBPACK_IMPORTED_MODULE_2__angular_common__["e" /* JsonPipe */], []), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiRuleDetailsComponent_5)), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_2__angular_common__["k" /* NgIf */], [huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */],
            huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var currVal_5 = !_v.context.last;
        _ck(_v, 4, 0, currVal_5);
    }, function (_ck, _v) {
        var currVal_0 = '{';
        var currVal_1 = _v.context.$implicit.method;
        var currVal_2 = _v.context.$implicit.address;
        var currVal_3 = huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵunv */](_v, 1, 3, huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2).transform(_v.context.$implicit.body));
        var currVal_4 = '}';
        _ck(_v, 1, 0, currVal_0, currVal_1, currVal_2, currVal_3, currVal_4);
    });
}
function View_HuewiRuleDetailsComponent_0(_l) {
    return huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-rule', [], null, null, null, View_HuewiRuleComponent_0, RenderType_HuewiRuleComponent)),
        huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_rule_component_HuewiRuleComponent, [huepi_service_HuepiService, __WEBPACK_IMPORTED_MODULE_6__angular_router__["k" /* Router */]], { rule: [0, 'rule'] }, null), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n'])),
        (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n\n'])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [], null, null, null, null, null)), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['rule ', ''])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n'])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 17, 'small', [], null, null, null, null, null)),
        (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'b', [], null, null, null, null, null)), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['conditions :'])), (_l()(),
            huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiRuleDetailsComponent_1)), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, __WEBPACK_IMPORTED_MODULE_2__angular_common__["j" /* NgForOf */], [huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */], huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'b', [], null, null, null, null, null)),
        (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['actions :'])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiRuleDetailsComponent_4)),
        huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, __WEBPACK_IMPORTED_MODULE_2__angular_common__["j" /* NgForOf */], [huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */],
            huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n'])), (_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.rule;
        _ck(_v, 1, 0, currVal_0);
        var currVal_2 = _co.rule.conditions;
        _ck(_v, 14, 0, currVal_2);
        var currVal_3 = _co.rule.actions;
        _ck(_v, 23, 0, currVal_3);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = _co.rule.__key;
        _ck(_v, 5, 0, currVal_1);
    });
}
function View_HuewiRuleDetailsComponent_Host_0(_l) {
    return huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-rule-details', [], null, null, null, View_HuewiRuleDetailsComponent_0, RenderType_HuewiRuleDetailsComponent)), huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_rule_details_component_HuewiRuleDetailsComponent, [huepi_service_HuepiService], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiRuleDetailsComponentNgFactory = huewi_rule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-rule-details', huewi_rule_details_component_HuewiRuleDetailsComponent, View_HuewiRuleDetailsComponent_Host_0, { rule: 'rule' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXJ1bGVzL2h1ZXdpLXJ1bGUtZGV0YWlscy9odWV3aS1ydWxlLWRldGFpbHMuY29tcG9uZW50Lm5nZmFjdG9yeS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXJ1bGVzL2h1ZXdpLXJ1bGUtZGV0YWlscy9odWV3aS1ydWxlLWRldGFpbHMuY29tcG9uZW50LnRzIiwibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktcnVsZXMvaHVld2ktcnVsZS1kZXRhaWxzL2h1ZXdpLXJ1bGUtZGV0YWlscy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXJ1bGVzL2h1ZXdpLXJ1bGUtZGV0YWlscy9odWV3aS1ydWxlLWRldGFpbHMuY29tcG9uZW50LnRzLkh1ZXdpUnVsZURldGFpbHNDb21wb25lbnRfSG9zdC5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIiAiLCI8aHVld2ktcnVsZSBcbiAgW3J1bGVdPVwicnVsZVwiPlxuPC9odWV3aS1ydWxlPlxuXG48ZGl2PnJ1bGUge3tydWxlLl9fa2V5fX08L2Rpdj5cbjxzbWFsbD5cbiAgPGI+Y29uZGl0aW9ucyA6PC9iPjxicj5cbiAgPHNwYW4gKm5nRm9yPSdsZXQgY29uZGl0aW9uIG9mIHJ1bGUuY29uZGl0aW9uczsgbGV0IGxhc3QgPSBsYXN0Jz5cbiAgICB7eyd7J319IHt7Y29uZGl0aW9uLmFkZHJlc3N9fSB7e2NvbmRpdGlvbi5vcGVyYXRvcn19XG4gICAgPHNwYW4gKm5nSWY9J2NvbmRpdGlvbi52YWx1ZSE9PVwiXCInPid7e2NvbmRpdGlvbi52YWx1ZX19Jzwvc3Bhbj4ge3snfSd9fVxuICAgIDxzcGFuICpuZ0lmPSchbGFzdCc+ICYgPGJyPjwvc3Bhbj5cbiAgPC9zcGFuPlxuICA8YnI+XG4gIDxiPmFjdGlvbnMgOjwvYj48YnI+XG4gIDxzcGFuICpuZ0Zvcj0nbGV0IGFjdGlvbiBvZiBydWxlLmFjdGlvbnM7IGxldCBsYXN0ID0gbGFzdCc+XG4gICAge3sneyd9fSB7e2FjdGlvbi5tZXRob2R9fSB7e2FjdGlvbi5hZGRyZXNzfX0ge3thY3Rpb24uYm9keSB8IGpzb259fSB7eyd9J319XG4gICAgPHNwYW4gKm5nSWY9JyFsYXN0Jz4gKyA8YnI+PC9zcGFuPlxuICA8L3NwYW4+XG48L3NtYWxsPlxuIiwiPGh1ZXdpLXJ1bGUtZGV0YWlscz48L2h1ZXdpLXJ1bGUtZGV0YWlscz4iXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkNTSTtNQUFBLHdFQUFtQzthQUFBO0lBQUE7SUFBQTs7OztvQkFDbkM7TUFBQSx3RUFBb0I7YUFBQSx5QkFBRztNQUFBO01BQUE7OztvQkFIekI7TUFBQSx3RUFBaUU7YUFBQSw2Q0FFL0Q7TUFBQTthQUFBO1VBQUEsd0JBQStELCtDQUMvRDtpQkFBQTthQUFBO1VBQUEsd0JBQWtDO0lBRDVCO0lBQU4sV0FBTSxTQUFOO0lBQ007SUFBTixXQUFNLFNBQU47O0lBSCtEO0lBQUE7SUFBQTtJQUFBO0lBRUE7SUFBQTs7OztvQkFPL0Q7TUFBQSx3RUFBb0I7YUFBQSx5QkFBRztNQUFBO01BQUE7OztvQkFGekI7TUFBQSx3RUFBMkQ7YUFBQTtNQUFBLGVBRXpEO01BQUEsMENBQUE7b0JBQUEsbUNBQWtDO01BQUE7SUFBNUI7SUFBTixXQUFNLFNBQU47O0lBRnlEO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTs7OztvQkFkN0Q7TUFBQTthQUFBO1VBQUEsaUNBQ2dCO01BQ0gseUNBRWI7VUFBQTtVQUFBLGdCQUFLLDZDQUF5QjtVQUFBLFNBQzlCO1VBQUE7TUFBTyx5Q0FDTDtVQUFBO1VBQUEsZ0JBQUcsaURBQWdCO2lCQUFBO2NBQUEsMERBQUk7VUFBQSxXQUN2QjtVQUFBLDBDQUFBO1VBQUE7VUFBQSxlQUlPLHlDQUNQO1VBQUE7VUFBQSw0Q0FBSTtVQUFBLFdBQ0o7VUFBQTtNQUFHLDhDQUFhO1VBQUE7VUFBQSw4QkFBSSx5Q0FDcEI7aUJBQUE7YUFBQTs0QkFBQSx5Q0FHTztVQUFBLFNBQ0Q7O0lBakJOO0lBREYsV0FDRSxTQURGO0lBT1E7SUFBTixZQUFNLFNBQU47SUFPTTtJQUFOLFlBQU0sU0FBTjs7O0lBVkc7SUFBQTs7OztvQkNKTDtNQUFBOzBDQUFBLFVBQUE7TUFBQTtJQUFBOzs7OzsifQ==
//# sourceMappingURL=huewi-rule-details.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-rules/huewi-rules.mock.ts
var HUEWI_RULES_MOCK = [];
//# sourceMappingURL=huewi-rules.mock.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-rules/huewi-rules.component.ts
/* harmony import */ var huewi_rules_component___WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_rules_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable__ = __webpack_require__("bKpL");
/* harmony import */ var huewi_rules_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable___default = __webpack_require__.n(huewi_rules_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable__);
/* harmony import */ var huewi_rules_component___WEBPACK_IMPORTED_MODULE_4_rxjs_add_observable_of__ = __webpack_require__("/zHi");
/* harmony import */ var huewi_rules_component___WEBPACK_IMPORTED_MODULE_4_rxjs_add_observable_of___default = __webpack_require__.n(huewi_rules_component___WEBPACK_IMPORTED_MODULE_4_rxjs_add_observable_of__);






var huewi_rules_component_HuewiRulesComponent = (function () {
    function HuewiRulesComponent(huepiService, activatedRoute, router) {
        this.huepiService = huepiService;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.rules = HUEWI_RULES_MOCK;
        this.ruleObserver = huewi_rules_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable__["Observable"].of(this.rules);
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
    HuewiRulesComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: huewi_rules_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["a" /* ActivatedRoute */] }, { type: huewi_rules_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return HuewiRulesComponent;
}());

//# sourceMappingURL=huewi-rules.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-rules/huewi-rules.component.ngfactory.ts
/* harmony import */ var huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__ = __webpack_require__("bm2B");
/* harmony import */ var huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_cdk__ = __webpack_require__("p4Sk");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__angular_common__ = __webpack_require__("qbdv");
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
    return huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-rule', [['md-list-item',
                '']], null, null, null, View_HuewiRuleComponent_0, RenderType_HuewiRuleComponent)), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_rule_component_HuewiRuleComponent, [huepi_service_HuepiService, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], { rule: [0, 'rule'] }, null), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      ']))], function (_ck, _v) {
        var currVal_0 = _v.context.$implicit;
        _ck(_v, 1, 0, currVal_0);
    }, null);
}
function View_HuewiRulesComponent_1(_l) {
    return huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 26, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 11, 'md-card-title', [['class', 'mat-card-title ']], null, null, null, null, null)), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["J" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      Rules\n      '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'input', [['class', 'mat-input-element'], ['mdInput',
                ''], ['placeholder', 'Filter']], [[8, 'id', 0], [8, 'placeholder', 0], [8, 'disabled',
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
                var pd_0 = (huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7)._handleInput($event.target.value) !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).onTouched() !== false);
                ad = (pd_1 && ad);
            }
            if (('compositionstart' === en)) {
                var pd_2 = (huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7)._compositionStart() !== false);
                ad = (pd_2 && ad);
            }
            if (('compositionend' === en)) {
                var pd_3 = (huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7)._compositionEnd($event.target.value) !== false);
                ad = (pd_3 && ad);
            }
            if (('blur' === en)) {
                var pd_4 = (huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onBlur() !== false);
                ad = (pd_4 && ad);
            }
            if (('focus' === en)) {
                var pd_5 = (huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onFocus() !== false);
                ad = (pd_5 && ad);
            }
            if (('input' === en)) {
                var pd_6 = (huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onInput() !== false);
                ad = (pd_6 && ad);
            }
            if (('ngModelChange' === en)) {
                var pd_7 = ((_co.searchText = $event) !== false);
                ad = (pd_7 && ad);
            }
            return ad;
        }, null, null)), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["b" /* DefaultValueAccessor */], [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["a" /* COMPOSITION_BUFFER_MODE */]]], null, null), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](1024, null, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["f" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["b" /* DefaultValueAccessor */]]), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["j" /* NgModel */], [[8, null],
            [8, null], [8, null], [2, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["f" /* NG_VALUE_ACCESSOR */]]], { model: [0,
                'model'] }, { update: 'ngModelChange' }), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](2048, null, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["g" /* NgControl */], null, [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["j" /* NgModel */]]), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_13" /* MdInputDirective */], [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_cdk__["L" /* Platform */], [2, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["g" /* NgControl */]], [2, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["i" /* NgForm */]], [2,
                huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["c" /* FormGroupDirective */]], [2, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["m" /* MD_ERROR_GLOBAL_OPTIONS */]]], { placeholder: [0,
                'placeholder'] }, null), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["h" /* NgControlStatus */], [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["g" /* NgControl */]], null, null), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 10, 'md-nav-list', [['class', 'mat-nav-list'], ['role',
                'list']], null, null, null, __WEBPACK_IMPORTED_MODULE_9__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdList_0 */], __WEBPACK_IMPORTED_MODULE_9__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdList */])), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_16" /* MdList */], [], null, null),
        huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_25" /* MdNavListCssMatStyler */], [], null, null), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n      '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 4, null, View_HuewiRulesComponent_2)), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, __WEBPACK_IMPORTED_MODULE_10__angular_common__["j" /* NgForOf */], [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, OrderByPipe, []), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, FilterPipe, []), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n    '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_13 = _co.searchText;
        _ck(_v, 9, 0, currVal_13);
        var currVal_14 = 'Filter';
        _ck(_v, 11, 0, currVal_14);
        var currVal_15 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵunv */](_v, 21, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 24).transform(huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵunv */](_v, 21, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 23).transform(_co.rules, _ck(_v, 22, 0, '+name'))), _co.searchText, 'name'));
        _ck(_v, 21, 0, currVal_15);
    }, function (_ck, _v) {
        var currVal_0 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).id;
        var currVal_1 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).placeholder;
        var currVal_2 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).disabled;
        var currVal_3 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).required;
        var currVal_4 = (huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).ariaDescribedby || null);
        var currVal_5 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._isErrorState();
        var currVal_6 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassUntouched;
        var currVal_7 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassTouched;
        var currVal_8 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassPristine;
        var currVal_9 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassDirty;
        var currVal_10 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassValid;
        var currVal_11 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassInvalid;
        var currVal_12 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassPending;
        _ck(_v, 6, 1, [currVal_0, currVal_1, currVal_2, currVal_3, currVal_4, currVal_5, currVal_6,
            currVal_7, currVal_8, currVal_9, currVal_10, currVal_11, currVal_12]);
    });
}
function View_HuewiRulesComponent_3(_l) {
    return huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 18, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 11, 'md-card-title', [['class', 'mat-card-title ']], null, null, null, null, null)), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["J" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'a', [], [[1, 'target', 0], [8, 'href', 4]], [[null,
                'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], __WEBPACK_IMPORTED_MODULE_10__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, __WEBPACK_IMPORTED_MODULE_9__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], __WEBPACK_IMPORTED_MODULE_9__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])),
        huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_7" /* MdIcon */], [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_10" /* MdIconRegistry */], [8, null]], null, null), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['navigate_before'])), (_l()(),
            huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      Rules Details\n    '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-rule-details', [], null, null, null, View_HuewiRuleDetailsComponent_0, RenderType_HuewiRuleDetailsComponent)), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_rule_details_component_HuewiRuleDetailsComponent, [huepi_service_HuepiService], { rule: [0, 'rule'] }, null),
        (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_2 = true;
        var currVal_3 = _ck(_v, 8, 0, '/rules');
        _ck(_v, 7, 0, currVal_2, currVal_3);
        _ck(_v, 11, 0);
        var currVal_4 = _co.selectedRule;
        _ck(_v, 16, 0, currVal_4);
    }, function (_ck, _v) {
        var currVal_0 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).target;
        var currVal_1 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).href;
        _ck(_v, 6, 0, currVal_0, currVal_1);
    });
}
function View_HuewiRulesComponent_0(_l) {
    return huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 9, 'md-card', [['class',
                'mat-card']], [[24, '@RoutingAnimations', 0]], null, null, __WEBPACK_IMPORTED_MODULE_9__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdCard_0 */], __WEBPACK_IMPORTED_MODULE_9__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2,
                huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["F" /* MdCard */], [], null, null),
        (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiRulesComponent_1)), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_10__angular_common__["k" /* NgIf */], [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */],
            huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n  '])),
        (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiRulesComponent_3)),
        huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_10__angular_common__["k" /* NgIf */], [huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n']))], function (_ck, _v) {
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
    return huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-rules', [], [[40, '@RoutingAnimations', 0]], null, null, View_HuewiRulesComponent_0, RenderType_HuewiRulesComponent)), huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_rules_component_HuewiRulesComponent, [huepi_service_HuepiService, huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).RoutingAnimations;
        _ck(_v, 0, 0, currVal_0);
    });
}
var HuewiRulesComponentNgFactory = huewi_rules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-rules', huewi_rules_component_HuewiRulesComponent, View_HuewiRulesComponent_Host_0, { rules: 'rules' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXJ1bGVzL2h1ZXdpLXJ1bGVzLmNvbXBvbmVudC5uZ2ZhY3RvcnkudHMiLCJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZzovLy9Vc2Vycy9hcm5kL0RldmVsb3Blci9odWV3aTIvc3JjL2FwcC9odWV3aS1ydWxlcy9odWV3aS1ydWxlcy5jb21wb25lbnQudHMiLCJuZzovLy9Vc2Vycy9hcm5kL0RldmVsb3Blci9odWV3aTIvc3JjL2FwcC9odWV3aS1ydWxlcy9odWV3aS1ydWxlcy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXJ1bGVzL2h1ZXdpLXJ1bGVzLmNvbXBvbmVudC50cy5IdWV3aVJ1bGVzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPG1kLWNhcmQgW0BSb3V0aW5nQW5pbWF0aW9uc10+XG5cbiAgPGRpdiAqbmdJZj1cIiFzZWxlY3RlZFJ1bGVcIj5cbiAgICA8bWQtY2FyZC10aXRsZT5cbiAgICAgIFJ1bGVzXG4gICAgICA8aW5wdXQgbWRJbnB1dCBwbGFjZWhvbGRlcj1cIkZpbHRlclwiIFsobmdNb2RlbCldPVwic2VhcmNoVGV4dFwiPlxuICAgIDwvbWQtY2FyZC10aXRsZT5cbiAgICA8bWQtbmF2LWxpc3Q+XG4gICAgICA8aHVld2ktcnVsZSBtZC1saXN0LWl0ZW0gXG4gICAgICAgICpuZ0Zvcj1cImxldCBydWxlIG9mIHJ1bGVzIHwgb3JkZXJCeTpbJytuYW1lJ10gfCBmaWx0ZXI6c2VhcmNoVGV4dDonbmFtZSdcIlxuICAgICAgICBbcnVsZV09XCJydWxlXCIgPlxuICAgICAgPC9odWV3aS1ydWxlPlxuICAgIDwvbWQtbmF2LWxpc3Q+XG4gIDwvZGl2PlxuXG4gIDxkaXYgKm5nSWY9XCJzZWxlY3RlZFJ1bGVcIj5cbiAgICA8bWQtY2FyZC10aXRsZT5cbiAgICAgIDxhIFtyb3V0ZXJMaW5rXT1cIlsnL3J1bGVzJ11cIiBbcmVwbGFjZVVybF09XCJ0cnVlXCI+PG1kLWljb24+bmF2aWdhdGVfYmVmb3JlPC9tZC1pY29uPjwvYT5cbiAgICAgIFJ1bGVzIERldGFpbHNcbiAgICA8L21kLWNhcmQtdGl0bGU+XG4gICAgPGh1ZXdpLXJ1bGUtZGV0YWlsc1xuICAgICAgW3J1bGVdPVwic2VsZWN0ZWRSdWxlXCI+XG4gICAgPC9odWV3aS1ydWxlLWRldGFpbHM+XG4gIDwvZGl2PlxuXG48L21kLWNhcmQ+IiwiPGh1ZXdpLXJ1bGVzPjwvaHVld2ktcnVsZXM+Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O29CQ1FNO01BQUE7c0NBQUEsVUFBQTtNQUFBLDZEQUVpQjtNQUFBO0lBQWY7SUFGRixXQUVFLFNBRkY7Ozs7b0JBTko7TUFBQSx3RUFBMkI7YUFBQSw0QkFDekI7TUFBQTtNQUFBLG1EQUFBO01BQUE7YUFBQTtNQUFlLDBEQUViO1VBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQW9DO2NBQUE7Y0FBQTtZQUFBO1lBQXBDO1VBQUEsdUNBQUE7VUFBQTtVQUFBLHNCQUFBO1FBQUE7TUFBQSxvQ0FBQTtVQUFBO1VBQUEsMkNBQUE7VUFBQSxtQ0FBQTtVQUFBO21DQUFBO2NBQUEsc0NBQUE7VUFBQSw0Q0FBNkQ7VUFBQSxhQUMvQywyQ0FDaEI7VUFBQTtjQUFBOzhCQUFBLFVBQUE7VUFBQTthQUFBO2FBQUE7VUFBQSxlQUFhLGlDQUNYO1VBQUEsb0VBQUE7VUFBQTtVQUFBLDhDQUNFO1VBQUEsdURBRVc7VUFBQSxhQUNEOztJQVB3QjtJQUFwQyxXQUFvQyxVQUFwQztJQUFlO0lBQWYsWUFBZSxVQUFmO0lBSUU7UUFBQTtRQUFBO0lBREYsWUFDRSxVQURGOztJQUhBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUEsWUFBQSw0REFBQTtRQUFBLDhEQUFBOzs7O29CQVVKO01BQUEsd0VBQTBCO2FBQUEsNEJBQ3hCO01BQUE7TUFBQSxtREFBQTtNQUFBO2FBQUE7TUFBZSw2Q0FDYjtVQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7a0JBQUE7Y0FBQTtZQUFBO1lBQUE7VUFBQSx1Q0FBQTtVQUFBO2NBQUEsbURBQUcsSUFBOEM7VUFBQTtVQUFBO2FBQUE7dUJBQUEsc0NBQUE7VUFBQTtVQUFBLDZCQUFTLHdDQUE2QjtpQkFBQSxpREFFekU7VUFBQSxhQUNoQjtVQUFBO2tEQUFBLFVBQUE7VUFBQTtNQUN3QiwyQ0FDSDs7O1FBTFU7UUFBMUI7UUFBSCxXQUE2QixVQUExQixTQUFIO1FBQWlEO1FBSWpEO1FBREYsWUFDRSxTQURGOztRQUhFO1FBQUE7UUFBQSxXQUFBLG1CQUFBOzs7O29CQWpCTjtNQUFBOzBCQUFBLFVBQUE7b0NBQUE7YUFBQTtNQUE4QiwrQkFFNUI7VUFBQSxvQ0FBQTt3QkFBQSxtQ0FXTTtNQUVOO2FBQUE7VUFBQSxpQ0FRTTs7SUFyQkQ7SUFBTCxXQUFLLFNBQUw7SUFhSztJQUFMLFdBQUssU0FBTDs7SUFmTztJQUFULFdBQVMsU0FBVDs7OztvQkNBQTtNQUFBO29DQUFBLFVBQUE7TUFBQTs7UUFBQTs7UUFBQTtRQUFBLFdBQUEsU0FBQTs7OzsifQ==
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
/* harmony import */ var huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_router__ = __webpack_require__("BkNc");
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
    return huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 7, 'span', [['class',
                'row']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.select(_co.scene) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), (_l()(), huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [['class', 'col-8 col-md-6']], null, null, null, null, null)),
        (_l()(), huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    ', '\n  '])), (_l()(), huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [['class',
                'col-2']], null, null, null, null, null)),
        (_l()(), huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.scene.name;
        _ck(_v, 3, 0, currVal_0);
    });
}
function View_HuewiSceneComponent_Host_0(_l) {
    return huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-scene', [], null, null, null, View_HuewiSceneComponent_0, RenderType_HuewiSceneComponent)), huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_scene_component_HuewiSceneComponent, [huepi_service_HuepiService, huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiSceneComponentNgFactory = huewi_scene_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-scene', huewi_scene_component_HuewiSceneComponent, View_HuewiSceneComponent_Host_0, { scene: 'scene' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZS9odWV3aS1zY2VuZS5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktc2NlbmVzL2h1ZXdpLXNjZW5lL2h1ZXdpLXNjZW5lLmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZS9odWV3aS1zY2VuZS5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZS9odWV3aS1zY2VuZS5jb21wb25lbnQudHMuSHVld2lTY2VuZUNvbXBvbmVudF9Ib3N0Lmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiICIsIjxzcGFuIGNsYXNzPVwicm93XCJcbiAgKGNsaWNrKT1cInNlbGVjdChzY2VuZSlcIj5cbiAgPHNwYW4gY2xhc3M9XCJjb2wtOCBjb2wtbWQtNlwiPlxuICAgIHt7c2NlbmUubmFtZX19XG4gIDwvc3Bhbj5cbiAgPHNwYW4gY2xhc3M9XCJjb2wtMlwiPlxuICA8L3NwYW4+XG48L3NwYW4+IiwiPGh1ZXdpLXNjZW5lPjwvaHVld2ktc2NlbmU+Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JDQUE7TUFBQTtJQUFBO0lBQUE7SUFDRTtNQUFBO01BQUE7SUFBQTtJQURGO0VBQUEsZ0NBQzBCLHlDQUN4QjthQUFBO1VBQUE7TUFBNkIsa0RBRXRCO1VBQUEsV0FDUDtVQUFBO01BQW9CLHlDQUNiOzs7UUFKc0I7UUFBQTs7OztvQkNGL0I7TUFBQTtvQ0FBQSxVQUFBO01BQUE7SUFBQTs7OzsifQ==
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
 */ var huewi_scene_details_component_css_shim_ngstyle_styles = [''];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZS1kZXRhaWxzL2h1ZXdpLXNjZW5lLWRldGFpbHMuY29tcG9uZW50LmNzcy5zaGltLm5nc3R5bGUudHMiLCJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZzovLy9Vc2Vycy9hcm5kL0RldmVsb3Blci9odWV3aTIvc3JjL2FwcC9odWV3aS1zY2VuZXMvaHVld2ktc2NlbmUtZGV0YWlscy9odWV3aS1zY2VuZS1kZXRhaWxzLmNvbXBvbmVudC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiICJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7OyJ9
//# sourceMappingURL=huewi-scene-details.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-scenes/huewi-scene-details/huewi-scene-details.component.ts

var huewi_scene_details_component_HuewiSceneDetailsComponent = (function () {
    function HuewiSceneDetailsComponent(huepiService) {
        this.huepiService = huepiService;
    }
    HuewiSceneDetailsComponent.prototype.ngOnInit = function () {
    };
    HuewiSceneDetailsComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }]; };
    return HuewiSceneDetailsComponent;
}());

//# sourceMappingURL=huewi-scene-details.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-scenes/huewi-scene-details/huewi-scene-details.component.ngfactory.ts
/* harmony import */ var huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__ = __webpack_require__("BkNc");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */







var styles_HuewiSceneDetailsComponent = [huewi_scene_details_component_css_shim_ngstyle_styles];
var RenderType_HuewiSceneDetailsComponent = huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiSceneDetailsComponent, data: {} });
function View_HuewiSceneDetailsComponent_0(_l) {
    return huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-scene', [], null, null, null, View_HuewiSceneComponent_0, RenderType_HuewiSceneComponent)), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_scene_component_HuewiSceneComponent, [huepi_service_HuepiService, huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], { scene: [0, 'scene'] }, null), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n'])), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n\n'])), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [], null, null, null, null, null)), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['scene ', ''])),
        (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n'])), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 7, 'small', [], null, null, null, null, null)), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  Lights: ', ''])), (_l()(),
            huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  Lastupdated: ', ''])), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  owned by ', ')'])), (_l()(),
            huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n'])), (_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.scene;
        _ck(_v, 1, 0, currVal_0);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = _co.scene.__key;
        _ck(_v, 5, 0, currVal_1);
        var currVal_2 = _co.scene.lights;
        _ck(_v, 8, 0, currVal_2);
        var currVal_3 = _co.scene.lastupdated;
        _ck(_v, 10, 0, currVal_3);
        var currVal_4 = _co.scene.owner;
        _ck(_v, 12, 0, currVal_4);
    });
}
function View_HuewiSceneDetailsComponent_Host_0(_l) {
    return huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-scene-details', [], null, null, null, View_HuewiSceneDetailsComponent_0, RenderType_HuewiSceneDetailsComponent)), huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_scene_details_component_HuewiSceneDetailsComponent, [huepi_service_HuepiService], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiSceneDetailsComponentNgFactory = huewi_scene_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-scene-details', huewi_scene_details_component_HuewiSceneDetailsComponent, View_HuewiSceneDetailsComponent_Host_0, { scene: 'scene' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZS1kZXRhaWxzL2h1ZXdpLXNjZW5lLWRldGFpbHMuY29tcG9uZW50Lm5nZmFjdG9yeS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZS1kZXRhaWxzL2h1ZXdpLXNjZW5lLWRldGFpbHMuY29tcG9uZW50LnRzIiwibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktc2NlbmVzL2h1ZXdpLXNjZW5lLWRldGFpbHMvaHVld2ktc2NlbmUtZGV0YWlscy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZS1kZXRhaWxzL2h1ZXdpLXNjZW5lLWRldGFpbHMuY29tcG9uZW50LnRzLkh1ZXdpU2NlbmVEZXRhaWxzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPGh1ZXdpLXNjZW5lIFxuICBbc2NlbmVdPVwic2NlbmVcIj5cbjwvaHVld2ktc2NlbmU+XG5cbjxkaXY+c2NlbmUge3tzY2VuZS5fX2tleX19PC9kaXY+XG48c21hbGw+XG4gIExpZ2h0czoge3tzY2VuZS5saWdodHN9fTxicj5cbiAgTGFzdHVwZGF0ZWQ6IHt7c2NlbmUubGFzdHVwZGF0ZWR9fTxicj5cbiAgb3duZWQgYnkge3tzY2VuZS5vd25lcn19KTxicj5cbjwvc21hbGw+XG4iLCI8aHVld2ktc2NlbmUtZGV0YWlscz48L2h1ZXdpLXNjZW5lLWRldGFpbHM+Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkNBQTtNQUFBO3VDQUFBLFVBQUE7TUFBQSwrREFDa0I7TUFBQSxTQUNKLHlDQUVkO01BQUE7TUFBQSw4QkFBSztNQUEyQix1Q0FDaEM7VUFBQTtVQUFBLGdCQUFPLG9EQUNtQjtpQkFBQTtjQUFBLDBEQUFJO1VBQUEsMkJBQ007VUFBQTtVQUFBLGdCQUFJLHNEQUNiO2lCQUFBO2NBQUEsMERBQUk7VUFBQSxTQUN2Qjs7SUFSTjtJQURGLFdBQ0UsU0FERjs7O0lBSUs7SUFBQTtJQUNFO0lBQUE7SUFDdUI7SUFBQTtJQUNVO0lBQUE7Ozs7b0JDUHhDO01BQUE7MkNBQUEsVUFBQTtNQUFBO0lBQUE7Ozs7OyJ9
//# sourceMappingURL=huewi-scene-details.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-scenes/huewi-scenes.mock.ts
var HUEWI_SCENES_MOCK = [];
//# sourceMappingURL=huewi-scenes.mock.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-scenes/huewi-scenes.component.ts
/* harmony import */ var huewi_scenes_component___WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_scenes_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable__ = __webpack_require__("bKpL");
/* harmony import */ var huewi_scenes_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable___default = __webpack_require__.n(huewi_scenes_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable__);
/* harmony import */ var huewi_scenes_component___WEBPACK_IMPORTED_MODULE_4_rxjs_add_observable_of__ = __webpack_require__("/zHi");
/* harmony import */ var huewi_scenes_component___WEBPACK_IMPORTED_MODULE_4_rxjs_add_observable_of___default = __webpack_require__.n(huewi_scenes_component___WEBPACK_IMPORTED_MODULE_4_rxjs_add_observable_of__);






var huewi_scenes_component_HuewiScenesComponent = (function () {
    function HuewiScenesComponent(huepiService, activatedRoute, router) {
        this.huepiService = huepiService;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.scenes = HUEWI_SCENES_MOCK;
        this.sceneObserver = huewi_scenes_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable__["Observable"].of(this.scenes);
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
    HuewiScenesComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: huewi_scenes_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["a" /* ActivatedRoute */] }, { type: huewi_scenes_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return HuewiScenesComponent;
}());

//# sourceMappingURL=huewi-scenes.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-scenes/huewi-scenes.component.ngfactory.ts
/* harmony import */ var huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__ = __webpack_require__("bm2B");
/* harmony import */ var huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_cdk__ = __webpack_require__("p4Sk");
/* harmony import */ var huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
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
    return huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-scene', [], null, null, null, View_HuewiSceneComponent_0, RenderType_HuewiSceneComponent)), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_scene_component_HuewiSceneComponent, [huepi_service_HuepiService, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], { scene: [0, 'scene'] }, null), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    ']))], function (_ck, _v) {
        var currVal_0 = _v.context.$implicit;
        _ck(_v, 1, 0, currVal_0);
    }, null);
}
function View_HuewiScenesComponent_1(_l) {
    return huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 20, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 11, 'md-card-title', [['class', 'mat-card-title ']], null, null, null, null, null)), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["J" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      Scenes\n      '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'input', [['class', 'mat-input-element'], ['mdInput',
                ''], ['placeholder', 'Filter']], [[8, 'id', 0], [8, 'placeholder', 0], [8, 'disabled',
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
                var pd_0 = (huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7)._handleInput($event.target.value) !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).onTouched() !== false);
                ad = (pd_1 && ad);
            }
            if (('compositionstart' === en)) {
                var pd_2 = (huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7)._compositionStart() !== false);
                ad = (pd_2 && ad);
            }
            if (('compositionend' === en)) {
                var pd_3 = (huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7)._compositionEnd($event.target.value) !== false);
                ad = (pd_3 && ad);
            }
            if (('blur' === en)) {
                var pd_4 = (huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onBlur() !== false);
                ad = (pd_4 && ad);
            }
            if (('focus' === en)) {
                var pd_5 = (huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onFocus() !== false);
                ad = (pd_5 && ad);
            }
            if (('input' === en)) {
                var pd_6 = (huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onInput() !== false);
                ad = (pd_6 && ad);
            }
            if (('ngModelChange' === en)) {
                var pd_7 = ((_co.searchText = $event) !== false);
                ad = (pd_7 && ad);
            }
            return ad;
        }, null, null)), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["b" /* DefaultValueAccessor */], [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["a" /* COMPOSITION_BUFFER_MODE */]]], null, null), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](1024, null, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["f" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["b" /* DefaultValueAccessor */]]), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["j" /* NgModel */], [[8, null],
            [8, null], [8, null], [2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["f" /* NG_VALUE_ACCESSOR */]]], { model: [0,
                'model'] }, { update: 'ngModelChange' }), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](2048, null, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["g" /* NgControl */], null, [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["j" /* NgModel */]]), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_13" /* MdInputDirective */], [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_cdk__["L" /* Platform */], [2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["g" /* NgControl */]], [2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["i" /* NgForm */]], [2,
                huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["c" /* FormGroupDirective */]], [2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["m" /* MD_ERROR_GLOBAL_OPTIONS */]]], { placeholder: [0,
                'placeholder'] }, null), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["h" /* NgControlStatus */], [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["g" /* NgControl */]], null, null), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 4, null, View_HuewiScenesComponent_2)),
        huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["j" /* NgForOf */], [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */],
            huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, OrderByPipe, []), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, FilterPipe, []), (_l()(),
            huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_13 = _co.searchText;
        _ck(_v, 9, 0, currVal_13);
        var currVal_14 = 'Filter';
        _ck(_v, 11, 0, currVal_14);
        var currVal_15 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵunv */](_v, 16, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 19).transform(huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵunv */](_v, 16, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 18).transform(_co.scenes, _ck(_v, 17, 0, '+name'))), _co.searchText, 'name'));
        _ck(_v, 16, 0, currVal_15);
    }, function (_ck, _v) {
        var currVal_0 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).id;
        var currVal_1 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).placeholder;
        var currVal_2 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).disabled;
        var currVal_3 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).required;
        var currVal_4 = (huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).ariaDescribedby || null);
        var currVal_5 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._isErrorState();
        var currVal_6 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassUntouched;
        var currVal_7 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassTouched;
        var currVal_8 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassPristine;
        var currVal_9 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassDirty;
        var currVal_10 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassValid;
        var currVal_11 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassInvalid;
        var currVal_12 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassPending;
        _ck(_v, 6, 1, [currVal_0, currVal_1, currVal_2, currVal_3, currVal_4, currVal_5, currVal_6,
            currVal_7, currVal_8, currVal_9, currVal_10, currVal_11, currVal_12]);
    });
}
function View_HuewiScenesComponent_3(_l) {
    return huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 18, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 11, 'md-card-title', [['class', 'mat-card-title ']], null, null, null, null, null)), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["J" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'a', [], [[1, 'target', 0], [8, 'href', 4]], [[null,
                'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])),
        huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_7" /* MdIcon */], [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_10" /* MdIconRegistry */], [8, null]], null, null), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['navigate_before'])), (_l()(),
            huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      Scene Details\n    '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-scene-details', [], null, null, null, View_HuewiSceneDetailsComponent_0, RenderType_HuewiSceneDetailsComponent)), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_scene_details_component_HuewiSceneDetailsComponent, [huepi_service_HuepiService], { scene: [0, 'scene'] }, null),
        (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_2 = true;
        var currVal_3 = _ck(_v, 8, 0, '/scenes');
        _ck(_v, 7, 0, currVal_2, currVal_3);
        _ck(_v, 11, 0);
        var currVal_4 = _co.selectedScene;
        _ck(_v, 16, 0, currVal_4);
    }, function (_ck, _v) {
        var currVal_0 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).target;
        var currVal_1 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).href;
        _ck(_v, 6, 0, currVal_0, currVal_1);
    });
}
function View_HuewiScenesComponent_0(_l) {
    return huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 9, 'md-card', [['class',
                'mat-card']], null, null, null, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdCard_0 */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])),
        huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["F" /* MdCard */], [], null, null), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiScenesComponent_1)),
        huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["k" /* NgIf */], [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiScenesComponent_3)), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["k" /* NgIf */], [huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n'])), (_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = !_co.selectedScene;
        _ck(_v, 5, 0, currVal_0);
        var currVal_1 = _co.selectedScene;
        _ck(_v, 8, 0, currVal_1);
    }, null);
}
function View_HuewiScenesComponent_Host_0(_l) {
    return huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-scenes', [], [[40, '@RoutingAnimations', 0]], null, null, View_HuewiScenesComponent_0, RenderType_HuewiScenesComponent)), huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_scenes_component_HuewiScenesComponent, [huepi_service_HuepiService, huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).RoutingAnimations;
        _ck(_v, 0, 0, currVal_0);
    });
}
var HuewiScenesComponentNgFactory = huewi_scenes_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-scenes', huewi_scenes_component_HuewiScenesComponent, View_HuewiScenesComponent_Host_0, { scenes: 'scenes' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZXMuY29tcG9uZW50Lm5nZmFjdG9yeS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZXMuY29tcG9uZW50LnRzIiwibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktc2NlbmVzL2h1ZXdpLXNjZW5lcy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjZW5lcy9odWV3aS1zY2VuZXMuY29tcG9uZW50LnRzLkh1ZXdpU2NlbmVzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPG1kLWNhcmQ+XG5cbiAgPGRpdiAqbmdJZj1cIiFzZWxlY3RlZFNjZW5lXCI+XG4gICAgPG1kLWNhcmQtdGl0bGU+XG4gICAgICBTY2VuZXNcbiAgICAgIDxpbnB1dCBtZElucHV0IHBsYWNlaG9sZGVyPVwiRmlsdGVyXCIgWyhuZ01vZGVsKV09XCJzZWFyY2hUZXh0XCI+XG4gICAgPC9tZC1jYXJkLXRpdGxlPlxuICAgIDxodWV3aS1zY2VuZSBcbiAgICAgICpuZ0Zvcj1cImxldCBzY2VuZSBvZiBzY2VuZXMgfCBvcmRlckJ5OlsnK25hbWUnXSB8IGZpbHRlcjpzZWFyY2hUZXh0OiduYW1lJ1wiXG4gICAgICBbc2NlbmVdPVwic2NlbmVcIj5cbiAgICA8L2h1ZXdpLXNjZW5lPlxuICA8L2Rpdj5cblxuICA8ZGl2ICpuZ0lmPVwic2VsZWN0ZWRTY2VuZVwiPlxuICAgIDxtZC1jYXJkLXRpdGxlPlxuICAgICAgPGEgW3JvdXRlckxpbmtdPVwiWycvc2NlbmVzJ11cIiBbcmVwbGFjZVVybF09XCJ0cnVlXCI+PG1kLWljb24+bmF2aWdhdGVfYmVmb3JlPC9tZC1pY29uPjwvYT5cbiAgICAgIFNjZW5lIERldGFpbHNcbiAgICA8L21kLWNhcmQtdGl0bGU+XG4gICAgPGh1ZXdpLXNjZW5lLWRldGFpbHNcbiAgICAgIFtzY2VuZV09XCJzZWxlY3RlZFNjZW5lXCI+XG4gICAgPC9odWV3aS1zY2VuZS1kZXRhaWxzPlxuICA8L2Rpdj5cblxuPC9tZC1jYXJkPlxuIiwiPGh1ZXdpLXNjZW5lcz48L2h1ZXdpLXNjZW5lcz4iXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JDT0k7TUFBQTt1Q0FBQSxVQUFBO01BQUEsK0RBRWtCO01BQUE7SUFBaEI7SUFGRixXQUVFLFNBRkY7Ozs7b0JBTEY7TUFBQSx3RUFBNEI7YUFBQSw0QkFDMUI7TUFBQTtNQUFBLG1EQUFBO01BQUE7YUFBQTtNQUFlLDJEQUViO1VBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQW9DO2NBQUE7Y0FBQTtZQUFBO1lBQXBDO1VBQUEsdUNBQUE7VUFBQTtVQUFBLHNCQUFBO1FBQUE7TUFBQSxvQ0FBQTtVQUFBO1VBQUEsMkNBQUE7VUFBQSxtQ0FBQTtVQUFBO21DQUFBO2NBQUEsc0NBQUE7VUFBQSw0Q0FBNkQ7VUFBQSxhQUMvQywyQ0FDaEI7VUFBQTthQUFBOzRCQUFBLGdEQUNFOzBCQUFBLHVEQUVZO2lCQUFBOztJQUx3QjtJQUFwQyxXQUFvQyxVQUFwQztJQUFlO0lBQWYsWUFBZSxVQUFmO0lBR0E7UUFBQTtRQUFBO0lBREYsWUFDRSxVQURGOztJQUZFO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUEsWUFBQSw0REFBQTtRQUFBLDhEQUFBOzs7O29CQVFKO01BQUEsd0VBQTJCO2FBQUEsNEJBQ3pCO01BQUE7TUFBQSxtREFBQTtNQUFBO2FBQUE7TUFBZSw2Q0FDYjtVQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7a0JBQUE7Y0FBQTtZQUFBO1lBQUE7VUFBQSx1Q0FBQTtVQUFBO2NBQUEsbURBQUcsSUFBK0M7VUFBQTtVQUFBO2FBQUE7dUJBQUEsc0NBQUE7VUFBQTtVQUFBLDZCQUFTLHdDQUE2QjtpQkFBQSxpREFFMUU7VUFBQSxhQUNoQjtVQUFBO21EQUFBLFVBQUE7VUFBQTtNQUMwQiwyQ0FDSjs7O1FBTFU7UUFBM0I7UUFBSCxXQUE4QixVQUEzQixTQUFIO1FBQWtEO1FBSWxEO1FBREYsWUFDRSxTQURGOztRQUhFO1FBQUE7UUFBQSxXQUFBLG1CQUFBOzs7O29CQWZOO01BQUE7YUFBQTt1QkFBQSxzQ0FBQTtVQUFBLHVEQUFTO1VBQUEsYUFFUDthQUFBO1VBQUEsd0JBU00sK0JBRU47VUFBQSxxRUFBQTtVQUFBO1VBQUEsZUFRTSw2QkFFRTtVQUFBOztJQXJCSDtJQUFMLFdBQUssU0FBTDtJQVdLO0lBQUwsV0FBSyxTQUFMOzs7O29CQ2JGO01BQUE7cUNBQUEsVUFBQTtNQUFBOztRQUFBOztRQUFBO1FBQUEsV0FBQSxTQUFBOzs7OzsifQ==
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
/* harmony import */ var huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_router__ = __webpack_require__("BkNc");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */





var styles_HuewiScheduleComponent = [huewi_schedule_component_css_shim_ngstyle_styles];
var RenderType_HuewiScheduleComponent = huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiScheduleComponent, data: {} });
function View_HuewiScheduleComponent_0(_l) {
    return huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 7, 'span', [['class',
                'row']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.select(_co.schedule) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), (_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [['class', 'col-8 col-md-6']], null, null, null, null, null)),
        (_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    ', '\n  '])), (_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [['class',
                'col-2']], null, null, null, null, null)),
        (_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n'])),
        (_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.schedule.name;
        _ck(_v, 3, 0, currVal_0);
    });
}
function View_HuewiScheduleComponent_Host_0(_l) {
    return huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-schedule', [], null, null, null, View_HuewiScheduleComponent_0, RenderType_HuewiScheduleComponent)), huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_schedule_component_HuewiScheduleComponent, [huepi_service_HuepiService, huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiScheduleComponentNgFactory = huewi_schedule_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-schedule', huewi_schedule_component_HuewiScheduleComponent, View_HuewiScheduleComponent_Host_0, { schedule: 'schedule' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZS9odWV3aS1zY2hlZHVsZS5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktc2NoZWR1bGVzL2h1ZXdpLXNjaGVkdWxlL2h1ZXdpLXNjaGVkdWxlLmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZS9odWV3aS1zY2hlZHVsZS5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZS9odWV3aS1zY2hlZHVsZS5jb21wb25lbnQudHMuSHVld2lTY2hlZHVsZUNvbXBvbmVudF9Ib3N0Lmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiICIsIjxzcGFuIGNsYXNzPVwicm93XCJcbiAgKGNsaWNrKT1cInNlbGVjdChzY2hlZHVsZSlcIj5cbiAgPHNwYW4gY2xhc3M9XCJjb2wtOCBjb2wtbWQtNlwiPlxuICAgIHt7c2NoZWR1bGUubmFtZX19XG4gIDwvc3Bhbj5cbiAgPHNwYW4gY2xhc3M9XCJjb2wtMlwiPlxuICA8L3NwYW4+XG48L3NwYW4+XG4iLCI8aHVld2ktc2NoZWR1bGU+PC9odWV3aS1zY2hlZHVsZT4iXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7OztvQkNBQTtNQUFBO0lBQUE7SUFBQTtJQUNFO01BQUE7TUFBQTtJQUFBO0lBREY7RUFBQSxnQ0FDNkIseUNBQzNCO2FBQUE7VUFBQTtNQUE2QixrREFFdEI7VUFBQSxXQUNQO1VBQUE7TUFBb0IseUNBQ2I7TUFDRjs7SUFMd0I7SUFBQTs7OztvQkNGL0I7TUFBQTt1Q0FBQSxVQUFBO01BQUE7SUFBQTs7Ozs7In0=
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
 */ var huewi_schedule_details_component_css_shim_ngstyle_styles = [''];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZS1kZXRhaWxzL2h1ZXdpLXNjaGVkdWxlLWRldGFpbHMuY29tcG9uZW50LmNzcy5zaGltLm5nc3R5bGUudHMiLCJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZzovLy9Vc2Vycy9hcm5kL0RldmVsb3Blci9odWV3aTIvc3JjL2FwcC9odWV3aS1zY2hlZHVsZXMvaHVld2ktc2NoZWR1bGUtZGV0YWlscy9odWV3aS1zY2hlZHVsZS1kZXRhaWxzLmNvbXBvbmVudC5jc3MiXSwic291cmNlc0NvbnRlbnQiOlsiICJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7OyJ9
//# sourceMappingURL=huewi-schedule-details.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-schedules/huewi-schedule-details/huewi-schedule-details.component.ts

var huewi_schedule_details_component_HuewiScheduleDetailsComponent = (function () {
    function HuewiScheduleDetailsComponent(huepiService) {
        this.huepiService = huepiService;
    }
    HuewiScheduleDetailsComponent.prototype.ngOnInit = function () {
    };
    HuewiScheduleDetailsComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }]; };
    return HuewiScheduleDetailsComponent;
}());

//# sourceMappingURL=huewi-schedule-details.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-schedules/huewi-schedule-details/huewi-schedule-details.component.ngfactory.ts
/* harmony import */ var huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__angular_common__ = __webpack_require__("qbdv");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */








var styles_HuewiScheduleDetailsComponent = [huewi_schedule_details_component_css_shim_ngstyle_styles];
var RenderType_HuewiScheduleDetailsComponent = huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiScheduleDetailsComponent, data: {} });
function View_HuewiScheduleDetailsComponent_0(_l) {
    return huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-schedule', [], null, null, null, View_HuewiScheduleComponent_0, RenderType_HuewiScheduleComponent)), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_schedule_component_HuewiScheduleComponent, [huepi_service_HuepiService, huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], { schedule: [0, 'schedule'] }, null), (_l()(),
            huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n'])), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n\n'])), (_l()(),
            huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [], null, null, null, null, null)), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['schedule ', ''])), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n'])), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'small', [], null, null, null, null, null)), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  Localtime: ',
            ' Time: ', ' (Created: ', ')'])), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  ', ' ', ' ', '\n'])), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, __WEBPACK_IMPORTED_MODULE_6__angular_common__["e" /* JsonPipe */], [])], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.schedule;
        _ck(_v, 1, 0, currVal_0);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = _co.schedule.__key;
        _ck(_v, 5, 0, currVal_1);
        var currVal_2 = _co.schedule.localtime;
        var currVal_3 = _co.schedule.time;
        var currVal_4 = _co.schedule.created;
        _ck(_v, 8, 0, currVal_2, currVal_3, currVal_4);
        var currVal_5 = _co.schedule.command.method;
        var currVal_6 = _co.schedule.command.address;
        var currVal_7 = huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵunv */](_v, 10, 2, huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).transform(_co.schedule.command.body));
        _ck(_v, 10, 0, currVal_5, currVal_6, currVal_7);
    });
}
function View_HuewiScheduleDetailsComponent_Host_0(_l) {
    return huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-schedule-details', [], null, null, null, View_HuewiScheduleDetailsComponent_0, RenderType_HuewiScheduleDetailsComponent)), huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_schedule_details_component_HuewiScheduleDetailsComponent, [huepi_service_HuepiService], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiScheduleDetailsComponentNgFactory = huewi_schedule_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-schedule-details', huewi_schedule_details_component_HuewiScheduleDetailsComponent, View_HuewiScheduleDetailsComponent_Host_0, { schedule: 'schedule' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZS1kZXRhaWxzL2h1ZXdpLXNjaGVkdWxlLWRldGFpbHMuY29tcG9uZW50Lm5nZmFjdG9yeS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZS1kZXRhaWxzL2h1ZXdpLXNjaGVkdWxlLWRldGFpbHMuY29tcG9uZW50LnRzIiwibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktc2NoZWR1bGVzL2h1ZXdpLXNjaGVkdWxlLWRldGFpbHMvaHVld2ktc2NoZWR1bGUtZGV0YWlscy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZS1kZXRhaWxzL2h1ZXdpLXNjaGVkdWxlLWRldGFpbHMuY29tcG9uZW50LnRzLkh1ZXdpU2NoZWR1bGVEZXRhaWxzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPGh1ZXdpLXNjaGVkdWxlIFxuICBbc2NoZWR1bGVdPVwic2NoZWR1bGVcIj5cbjwvaHVld2ktc2NoZWR1bGU+XG5cbjxkaXY+c2NoZWR1bGUge3tzY2hlZHVsZS5fX2tleX19PC9kaXY+XG48c21hbGw+XG4gIExvY2FsdGltZToge3tzY2hlZHVsZS5sb2NhbHRpbWV9fSBUaW1lOiB7e3NjaGVkdWxlLnRpbWV9fSAoQ3JlYXRlZDoge3tzY2hlZHVsZS5jcmVhdGVkfX0pPGJyPlxuICB7e3NjaGVkdWxlLmNvbW1hbmQubWV0aG9kfX0ge3tzY2hlZHVsZS5jb21tYW5kLmFkZHJlc3N9fSB7e3NjaGVkdWxlLmNvbW1hbmQuYm9keSB8IGpzb259fVxuPC9zbWFsbD4iLCI8aHVld2ktc2NoZWR1bGUtZGV0YWlscz48L2h1ZXdpLXNjaGVkdWxlLWRldGFpbHM+Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JDQUE7TUFBQTswQ0FBQSxVQUFBO01BQUEscUVBQ3dCO2FBQUEsd0JBQ1AseUNBRWpCO2FBQUE7VUFBQSw0Q0FBSztNQUFBLG1CQUFpQyx1Q0FDdEM7TUFBQTtNQUFBLDRDQUFPO01BQUEsK0JBQ29GO01BQUE7TUFBQSxnQkFBSTtrQkFBQTs7SUFMN0Y7SUFERixXQUNFLFNBREY7OztJQUlLO0lBQUE7SUFDRTtJQUFBO0lBQUE7SUFBQTtJQUN3RjtJQUFBO0lBQUE7SUFBQTs7OztvQkNOL0Y7TUFBQTs4Q0FBQSxVQUFBO01BQUE7SUFBQTs7Ozs7In0=
//# sourceMappingURL=huewi-schedule-details.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-schedules/huewi-schedules.mock.ts
var HUEWI_SCHEDULES_MOCK = [];
//# sourceMappingURL=huewi-schedules.mock.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-schedules/huewi-schedules.component.ts
/* harmony import */ var huewi_schedules_component___WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_schedules_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable__ = __webpack_require__("bKpL");
/* harmony import */ var huewi_schedules_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable___default = __webpack_require__.n(huewi_schedules_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable__);
/* harmony import */ var huewi_schedules_component___WEBPACK_IMPORTED_MODULE_4_rxjs_add_observable_of__ = __webpack_require__("/zHi");
/* harmony import */ var huewi_schedules_component___WEBPACK_IMPORTED_MODULE_4_rxjs_add_observable_of___default = __webpack_require__.n(huewi_schedules_component___WEBPACK_IMPORTED_MODULE_4_rxjs_add_observable_of__);






var huewi_schedules_component_HuewiSchedulesComponent = (function () {
    function HuewiSchedulesComponent(huepiService, activatedRoute, router) {
        this.huepiService = huepiService;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.schedules = HUEWI_SCHEDULES_MOCK;
        this.scheduleObserver = huewi_schedules_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable__["Observable"].of(this.schedules);
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
    HuewiSchedulesComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: huewi_schedules_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["a" /* ActivatedRoute */] }, { type: huewi_schedules_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return HuewiSchedulesComponent;
}());

//# sourceMappingURL=huewi-schedules.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-schedules/huewi-schedules.component.ngfactory.ts
/* harmony import */ var huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__ = __webpack_require__("bm2B");
/* harmony import */ var huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_cdk__ = __webpack_require__("p4Sk");
/* harmony import */ var huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
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
    return huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-schedule', [], null, null, null, View_HuewiScheduleComponent_0, RenderType_HuewiScheduleComponent)), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_schedule_component_HuewiScheduleComponent, [huepi_service_HuepiService, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], { schedule: [0, 'schedule'] }, null), (_l()(),
            huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    ']))], function (_ck, _v) {
        var currVal_0 = _v.context.$implicit;
        _ck(_v, 1, 0, currVal_0);
    }, null);
}
function View_HuewiSchedulesComponent_1(_l) {
    return huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 20, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 11, 'md-card-title', [['class', 'mat-card-title ']], null, null, null, null, null)), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["J" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      Schedules\n      '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'input', [['class', 'mat-input-element'], ['mdInput',
                ''], ['placeholder', 'Filter']], [[8, 'id', 0], [8, 'placeholder', 0], [8, 'disabled',
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
                var pd_0 = (huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7)._handleInput($event.target.value) !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).onTouched() !== false);
                ad = (pd_1 && ad);
            }
            if (('compositionstart' === en)) {
                var pd_2 = (huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7)._compositionStart() !== false);
                ad = (pd_2 && ad);
            }
            if (('compositionend' === en)) {
                var pd_3 = (huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7)._compositionEnd($event.target.value) !== false);
                ad = (pd_3 && ad);
            }
            if (('blur' === en)) {
                var pd_4 = (huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onBlur() !== false);
                ad = (pd_4 && ad);
            }
            if (('focus' === en)) {
                var pd_5 = (huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onFocus() !== false);
                ad = (pd_5 && ad);
            }
            if (('input' === en)) {
                var pd_6 = (huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onInput() !== false);
                ad = (pd_6 && ad);
            }
            if (('ngModelChange' === en)) {
                var pd_7 = ((_co.searchText = $event) !== false);
                ad = (pd_7 && ad);
            }
            return ad;
        }, null, null)), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["b" /* DefaultValueAccessor */], [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["a" /* COMPOSITION_BUFFER_MODE */]]], null, null), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](1024, null, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["f" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["b" /* DefaultValueAccessor */]]), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["j" /* NgModel */], [[8, null],
            [8, null], [8, null], [2, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["f" /* NG_VALUE_ACCESSOR */]]], { model: [0,
                'model'] }, { update: 'ngModelChange' }), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](2048, null, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["g" /* NgControl */], null, [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["j" /* NgModel */]]), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_13" /* MdInputDirective */], [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_cdk__["L" /* Platform */], [2, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["g" /* NgControl */]], [2, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["i" /* NgForm */]], [2,
                huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["c" /* FormGroupDirective */]], [2, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["m" /* MD_ERROR_GLOBAL_OPTIONS */]]], { placeholder: [0,
                'placeholder'] }, null), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["h" /* NgControlStatus */], [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["g" /* NgControl */]], null, null), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 4, null, View_HuewiSchedulesComponent_2)),
        huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["j" /* NgForOf */], [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */],
            huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, OrderByPipe, []), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, FilterPipe, []), (_l()(),
            huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_13 = _co.searchText;
        _ck(_v, 9, 0, currVal_13);
        var currVal_14 = 'Filter';
        _ck(_v, 11, 0, currVal_14);
        var currVal_15 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵunv */](_v, 16, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 19).transform(huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵunv */](_v, 16, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 18).transform(_co.schedules, _ck(_v, 17, 0, '+name'))), _co.searchText, 'name'));
        _ck(_v, 16, 0, currVal_15);
    }, function (_ck, _v) {
        var currVal_0 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).id;
        var currVal_1 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).placeholder;
        var currVal_2 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).disabled;
        var currVal_3 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).required;
        var currVal_4 = (huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).ariaDescribedby || null);
        var currVal_5 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._isErrorState();
        var currVal_6 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassUntouched;
        var currVal_7 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassTouched;
        var currVal_8 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassPristine;
        var currVal_9 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassDirty;
        var currVal_10 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassValid;
        var currVal_11 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassInvalid;
        var currVal_12 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassPending;
        _ck(_v, 6, 1, [currVal_0, currVal_1, currVal_2, currVal_3, currVal_4, currVal_5, currVal_6,
            currVal_7, currVal_8, currVal_9, currVal_10, currVal_11, currVal_12]);
    });
}
function View_HuewiSchedulesComponent_3(_l) {
    return huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 18, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 11, 'md-card-title', [['class', 'mat-card-title ']], null, null, null, null, null)), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["J" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'a', [], [[1, 'target', 0], [8, 'href', 4]], [[null,
                'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])),
        huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_7" /* MdIcon */], [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_10" /* MdIconRegistry */], [8, null]], null, null), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['navigate_before'])), (_l()(),
            huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      Schedules Details\n    '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-schedule-details', [], null, null, null, View_HuewiScheduleDetailsComponent_0, RenderType_HuewiScheduleDetailsComponent)), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_schedule_details_component_HuewiScheduleDetailsComponent, [huepi_service_HuepiService], { schedule: [0, 'schedule'] }, null), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_2 = true;
        var currVal_3 = _ck(_v, 8, 0, '/schedules');
        _ck(_v, 7, 0, currVal_2, currVal_3);
        _ck(_v, 11, 0);
        var currVal_4 = _co.selectedSchedule;
        _ck(_v, 16, 0, currVal_4);
    }, function (_ck, _v) {
        var currVal_0 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).target;
        var currVal_1 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).href;
        _ck(_v, 6, 0, currVal_0, currVal_1);
    });
}
function View_HuewiSchedulesComponent_0(_l) {
    return huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 9, 'md-card', [['class',
                'mat-card']], [[24, '@RoutingAnimations', 0]], null, null, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdCard_0 */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2,
                huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["F" /* MdCard */], [], null, null),
        (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiSchedulesComponent_1)), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["k" /* NgIf */], [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */],
            huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n  '])),
        (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiSchedulesComponent_3)),
        huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["k" /* NgIf */], [huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n'])), (_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n']))], function (_ck, _v) {
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
    return huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-schedules', [], [[40, '@RoutingAnimations', 0]], null, null, View_HuewiSchedulesComponent_0, RenderType_HuewiSchedulesComponent)), huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_schedules_component_HuewiSchedulesComponent, [huepi_service_HuepiService, huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).RoutingAnimations;
        _ck(_v, 0, 0, currVal_0);
    });
}
var HuewiSchedulesComponentNgFactory = huewi_schedules_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-schedules', huewi_schedules_component_HuewiSchedulesComponent, View_HuewiSchedulesComponent_Host_0, { schedules: 'schedules' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZXMuY29tcG9uZW50Lm5nZmFjdG9yeS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZXMuY29tcG9uZW50LnRzIiwibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktc2NoZWR1bGVzL2h1ZXdpLXNjaGVkdWxlcy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNjaGVkdWxlcy9odWV3aS1zY2hlZHVsZXMuY29tcG9uZW50LnRzLkh1ZXdpU2NoZWR1bGVzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPG1kLWNhcmQgW0BSb3V0aW5nQW5pbWF0aW9uc10+XG5cbiAgPGRpdiAqbmdJZj1cIiFzZWxlY3RlZFNjaGVkdWxlXCI+XG4gICAgPG1kLWNhcmQtdGl0bGU+XG4gICAgICBTY2hlZHVsZXNcbiAgICAgIDxpbnB1dCBtZElucHV0IHBsYWNlaG9sZGVyPVwiRmlsdGVyXCIgWyhuZ01vZGVsKV09XCJzZWFyY2hUZXh0XCI+XG4gICAgPC9tZC1jYXJkLXRpdGxlPlxuICAgIDxodWV3aS1zY2hlZHVsZSBcbiAgICAgICpuZ0Zvcj1cImxldCBzY2hlZHVsZSBvZiBzY2hlZHVsZXMgfCBvcmRlckJ5OlsnK25hbWUnXSB8IGZpbHRlcjpzZWFyY2hUZXh0OiduYW1lJ1wiXG4gICAgICBbc2NoZWR1bGVdPVwic2NoZWR1bGVcIj5cbiAgICA8L2h1ZXdpLXNjaGVkdWxlPlxuICA8L2Rpdj5cblxuICA8ZGl2ICpuZ0lmPVwic2VsZWN0ZWRTY2hlZHVsZVwiPlxuICAgIDxtZC1jYXJkLXRpdGxlPlxuICAgICAgPGEgW3JvdXRlckxpbmtdPVwiWycvc2NoZWR1bGVzJ11cIiBbcmVwbGFjZVVybF09XCJ0cnVlXCI+PG1kLWljb24+bmF2aWdhdGVfYmVmb3JlPC9tZC1pY29uPjwvYT5cbiAgICAgIFNjaGVkdWxlcyBEZXRhaWxzXG4gICAgPC9tZC1jYXJkLXRpdGxlPlxuICAgIDxodWV3aS1zY2hlZHVsZS1kZXRhaWxzXG4gICAgICBbc2NoZWR1bGVdPVwic2VsZWN0ZWRTY2hlZHVsZVwiPlxuICAgIDwvaHVld2ktc2NoZWR1bGUtZGV0YWlscz5cbiAgPC9kaXY+XG5cbjwvbWQtY2FyZD5cbiIsIjxodWV3aS1zY2hlZHVsZXM+PC9odWV3aS1zY2hlZHVsZXM+Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O29CQ09JO01BQUE7MENBQUEsVUFBQTtNQUFBLHFFQUV3QjthQUFBO0lBQXRCO0lBRkYsV0FFRSxTQUZGOzs7O29CQUxGO01BQUEsd0VBQStCO2FBQUEsNEJBQzdCO01BQUE7TUFBQSxtREFBQTtNQUFBO2FBQUE7TUFBZSw4REFFYjtVQUFBO2NBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFvQztjQUFBO2NBQUE7WUFBQTtZQUFwQztVQUFBLHVDQUFBO1VBQUE7VUFBQSxzQkFBQTtRQUFBO01BQUEsb0NBQUE7VUFBQTtVQUFBLDJDQUFBO1VBQUEsbUNBQUE7VUFBQTttQ0FBQTtjQUFBLHNDQUFBO1VBQUEsNENBQTZEO1VBQUEsYUFDL0MsMkNBQ2hCO1VBQUE7YUFBQTs0QkFBQSxnREFDRTswQkFBQSx1REFFZTtpQkFBQTs7SUFMcUI7SUFBcEMsV0FBb0MsVUFBcEM7SUFBZTtJQUFmLFlBQWUsVUFBZjtJQUdBO1FBQUE7UUFBQTtJQURGLFlBQ0UsVUFERjs7SUFGRTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBLFlBQUEsNERBQUE7UUFBQSw4REFBQTs7OztvQkFRSjtNQUFBLHdFQUE4QjthQUFBLDRCQUM1QjtNQUFBO01BQUEsbURBQUE7TUFBQTthQUFBO01BQWUsNkNBQ2I7VUFBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2tCQUFBO2NBQUE7WUFBQTtZQUFBO1VBQUEsdUNBQUE7VUFBQTtjQUFBLG1EQUFHLElBQWtEO1VBQUE7VUFBQTthQUFBO3VCQUFBLHNDQUFBO1VBQUE7VUFBQSw2QkFBUyx3Q0FBNkI7aUJBQUEscURBRTdFO1VBQUEsYUFDaEI7VUFBQTtzREFBQSxVQUFBO1VBQUE7VUFBQSxlQUNnQywyQ0FDUDtVQUFBOztJQUxVO0lBQTlCO0lBQUgsV0FBaUMsVUFBOUIsU0FBSDtJQUFxRDtJQUlyRDtJQURGLFlBQ0UsU0FERjs7SUFIRTtJQUFBO0lBQUEsV0FBQSxtQkFBQTs7OztvQkFmTjtNQUFBOzJCQUFBLFVBQUE7b0NBQUE7YUFBQTtNQUE4QiwrQkFFNUI7VUFBQSx3Q0FBQTt3QkFBQSxtQ0FTTTtNQUVOO2FBQUE7VUFBQSx3QkFRTSw2QkFFRTtVQUFBOztJQXJCSDtJQUFMLFdBQUssU0FBTDtJQVdLO0lBQUwsV0FBSyxTQUFMOztJQWJPO0lBQVQsV0FBUyxTQUFUOzs7O29CQ0FBO01BQUE7d0NBQUEsVUFBQTtNQUFBOztRQUFBOztRQUFBO1FBQUEsV0FBQSxTQUFBOzs7OzsifQ==
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
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__angular_router__ = __webpack_require__("BkNc");
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
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [], null, null, null, null, null)), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['', '']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.sensor.state.presence;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiSensorComponent_2(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [], null, null, null, null, null)), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['', '']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.sensor.state.lightlevel;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiSensorComponent_3(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [], null, null, null, null, null)), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['', '']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.sensor.state.temperature;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiSensorComponent_4(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [], null, null, null, null, null)), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['', '']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.sensor.state.buttonevent;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiSensorComponent_5(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [], null, null, null, null, null)), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['', '']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.sensor.state.buttonevent;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiSensorComponent_6(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [], null, null, null, null, null)), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['', '']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.sensor.state.status;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiSensorComponent_7(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [], null, null, null, null, null)), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['', '']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.sensor.state.presence;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiSensorComponent_8(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [], null, null, null, null, null)), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['', '']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.sensor.state.presence;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiSensorComponent_9(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [], null, null, null, null, null)), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['', '']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.sensor.state.daylight;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiSensorComponent_10(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, null, null, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2,
                __WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, __WEBPACK_IMPORTED_MODULE_3__angular_material__["_7" /* MdIcon */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['radio_button_checked']))], function (_ck, _v) {
        _ck(_v, 2, 0);
    }, null);
}
function View_HuewiSensorComponent_11(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, null, null, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2,
                __WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, __WEBPACK_IMPORTED_MODULE_3__angular_material__["_7" /* MdIcon */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['radio_button_unchecked']))], function (_ck, _v) {
        _ck(_v, 2, 0);
    }, null);
}
function View_HuewiSensorComponent_0(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 46, 'span', [['class',
                'row']], null, null, null, null, null)),
        (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'span', [['class', 'col-8 col-md-6']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.select(_co.sensor) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    ',
            '\n    '])), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'small', [], null, null, null, null, null)),
        (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['- ', ''])), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])),
        (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 28, 'span', [['class', 'col-2']], null, null, null, null, null)), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])),
        (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorComponent_1)),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorComponent_2)),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorComponent_3)),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorComponent_4)),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorComponent_5)),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorComponent_6)),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorComponent_7)),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorComponent_8)),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorComponent_9)),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 7, 'span', [['class', 'col-2']], null, null, null, null, null)), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorComponent_10)),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorComponent_11)),
        huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['      \n  '])), (_l()(),
            huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n'])), (_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_2 = (_co.sensor.type == 'ZLLPresence');
        _ck(_v, 11, 0, currVal_2);
        var currVal_3 = (_co.sensor.type == 'ZLLLightLevel');
        _ck(_v, 14, 0, currVal_3);
        var currVal_4 = (_co.sensor.type == 'ZLLTemperature');
        _ck(_v, 17, 0, currVal_4);
        var currVal_5 = (_co.sensor.type == 'ZLLSwitch');
        _ck(_v, 20, 0, currVal_5);
        var currVal_6 = (_co.sensor.type == 'ZGPSwitch');
        _ck(_v, 23, 0, currVal_6);
        var currVal_7 = (_co.sensor.type == 'CLIPGenericStatus');
        _ck(_v, 26, 0, currVal_7);
        var currVal_8 = (_co.sensor.type == 'CLIPPresence');
        _ck(_v, 29, 0, currVal_8);
        var currVal_9 = (_co.sensor.type == 'Geofence');
        _ck(_v, 32, 0, currVal_9);
        var currVal_10 = (_co.sensor.type == 'Daylight');
        _ck(_v, 35, 0, currVal_10);
        var currVal_11 = _co.sensor.config.on;
        _ck(_v, 41, 0, currVal_11);
        var currVal_12 = !_co.sensor.config.on;
        _ck(_v, 44, 0, currVal_12);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.sensor.name;
        _ck(_v, 3, 0, currVal_0);
        var currVal_1 = _co.sensor.type;
        _ck(_v, 5, 0, currVal_1);
    });
}
function View_HuewiSensorComponent_Host_0(_l) {
    return huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-sensor', [], null, null, null, View_HuewiSensorComponent_0, RenderType_HuewiSensorComponent)), huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_sensor_component_HuewiSensorComponent, [huepi_service_HuepiService, __WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiSensorComponentNgFactory = huewi_sensor_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-sensor', huewi_sensor_component_HuewiSensorComponent, View_HuewiSensorComponent_Host_0, { sensor: 'sensor' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29yL2h1ZXdpLXNlbnNvci5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktc2Vuc29ycy9odWV3aS1zZW5zb3IvaHVld2ktc2Vuc29yLmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29yL2h1ZXdpLXNlbnNvci5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29yL2h1ZXdpLXNlbnNvci5jb21wb25lbnQudHMuSHVld2lTZW5zb3JDb21wb25lbnRfSG9zdC5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIiAiLCI8c3BhbiBjbGFzcz1cInJvd1wiPlxuICA8c3BhbiBjbGFzcz1cImNvbC04IGNvbC1tZC02XCIgKGNsaWNrKT1cInNlbGVjdChzZW5zb3IpXCI+XG4gICAge3tzZW5zb3IubmFtZX19XG4gICAgPHNtYWxsPi0ge3tzZW5zb3IudHlwZX19PC9zbWFsbD5cbiAgPC9zcGFuPlxuICA8c3BhbiBjbGFzcz1cImNvbC0yXCI+XG4gICAgPHNwYW4gKm5nSWY9XCJzZW5zb3IudHlwZT09J1pMTFByZXNlbmNlJ1wiPnt7c2Vuc29yLnN0YXRlLnByZXNlbmNlfX08L3NwYW4+XG4gICAgPHNwYW4gKm5nSWY9XCJzZW5zb3IudHlwZT09J1pMTExpZ2h0TGV2ZWwnXCI+e3tzZW5zb3Iuc3RhdGUubGlnaHRsZXZlbH19PC9zcGFuPlxuICAgIDxzcGFuICpuZ0lmPVwic2Vuc29yLnR5cGU9PSdaTExUZW1wZXJhdHVyZSdcIj57e3NlbnNvci5zdGF0ZS50ZW1wZXJhdHVyZX19PC9zcGFuPlxuICAgIDxzcGFuICpuZ0lmPVwic2Vuc29yLnR5cGU9PSdaTExTd2l0Y2gnXCI+e3tzZW5zb3Iuc3RhdGUuYnV0dG9uZXZlbnR9fTwvc3Bhbj5cbiAgICA8c3BhbiAqbmdJZj1cInNlbnNvci50eXBlPT0nWkdQU3dpdGNoJ1wiPnt7c2Vuc29yLnN0YXRlLmJ1dHRvbmV2ZW50fX08L3NwYW4+XG4gICAgPHNwYW4gKm5nSWY9XCJzZW5zb3IudHlwZT09J0NMSVBHZW5lcmljU3RhdHVzJ1wiPnt7c2Vuc29yLnN0YXRlLnN0YXR1c319PC9zcGFuPlxuICAgIDxzcGFuICpuZ0lmPVwic2Vuc29yLnR5cGU9PSdDTElQUHJlc2VuY2UnXCI+e3tzZW5zb3Iuc3RhdGUucHJlc2VuY2V9fTwvc3Bhbj5cbiAgICA8c3BhbiAqbmdJZj1cInNlbnNvci50eXBlPT0nR2VvZmVuY2UnXCI+e3tzZW5zb3Iuc3RhdGUucHJlc2VuY2V9fTwvc3Bhbj5cbiAgICA8c3BhbiAqbmdJZj1cInNlbnNvci50eXBlPT0nRGF5bGlnaHQnXCI+e3tzZW5zb3Iuc3RhdGUuZGF5bGlnaHR9fTwvc3Bhbj5cbiAgPC9zcGFuPlxuICA8c3BhbiBjbGFzcz1cImNvbC0yXCI+XG4gICAgPG1kLWljb24gKm5nSWY9XCJzZW5zb3IuY29uZmlnLm9uXCI+cmFkaW9fYnV0dG9uX2NoZWNrZWQ8L21kLWljb24+XG4gICAgPG1kLWljb24gKm5nSWY9XCIhc2Vuc29yLmNvbmZpZy5vblwiPnJhZGlvX2J1dHRvbl91bmNoZWNrZWQ8L21kLWljb24+ICAgICAgXG4gIDwvc3Bhbj5cbjwvc3Bhbj5cbiIsIjxodWV3aS1zZW5zb3I+PC9odWV3aS1zZW5zb3I+Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JDTUk7TUFBQSx3RUFBeUM7YUFBQTs7SUFBQTtJQUFBOzs7O29CQUN6QztNQUFBLHdFQUEyQzthQUFBOztJQUFBO0lBQUE7Ozs7b0JBQzNDO01BQUEsd0VBQTRDO2FBQUE7O0lBQUE7SUFBQTs7OztvQkFDNUM7TUFBQSx3RUFBdUM7YUFBQTs7SUFBQTtJQUFBOzs7O29CQUN2QztNQUFBLHdFQUF1QzthQUFBOztJQUFBO0lBQUE7Ozs7b0JBQ3ZDO01BQUEsd0VBQStDO2FBQUE7O0lBQUE7SUFBQTs7OztvQkFDL0M7TUFBQSx3RUFBMEM7YUFBQTs7SUFBQTtJQUFBOzs7O29CQUMxQztNQUFBLHdFQUFzQzthQUFBOztJQUFBO0lBQUE7Ozs7b0JBQ3RDO01BQUEsd0VBQXNDO2FBQUE7O0lBQUE7SUFBQTs7OztvQkFHdEM7TUFBQTswQkFBQSxVQUFBO29DQUFBO2FBQUE7VUFBQSxnREFBa0M7O1FBQWxDOzs7O29CQUNBO01BQUE7MEJBQUEsVUFBQTtvQ0FBQTthQUFBO1VBQUEsZ0RBQW1DOztRQUFuQzs7OztvQkFsQko7TUFBQTtNQUFrQix5Q0FDaEI7VUFBQTtVQUFBO1lBQUE7WUFBQTtZQUE2QjtjQUFBO2NBQUE7WUFBQTtZQUE3QjtVQUFBLGdDQUFzRDtVQUFBLFlBRXBEO1VBQUE7TUFBTywwQ0FBeUI7TUFDM0IseUNBQ1A7VUFBQTtVQUFBLDhCQUFvQjtNQUNsQjthQUFBO1VBQUEsd0JBQXlFLDJDQUN6RTtpQkFBQTthQUFBO1VBQUEsd0JBQTZFLDJDQUM3RTtpQkFBQTthQUFBO1VBQUEsd0JBQStFLDJDQUMvRTtpQkFBQTthQUFBO1VBQUEsd0JBQTBFLDJDQUMxRTtpQkFBQTthQUFBO1VBQUEsd0JBQTBFLDJDQUMxRTtpQkFBQTthQUFBO1VBQUEsd0JBQTZFLDJDQUM3RTtpQkFBQTthQUFBO1VBQUEsd0JBQTBFLDJDQUMxRTtpQkFBQTthQUFBO1VBQUEsd0JBQXNFLDJDQUN0RTtpQkFBQTthQUFBO1VBQUEsd0JBQXNFLHlDQUNqRTtpQkFBQSwwQkFDUDtVQUFBO1VBQUEsZ0JBQW9CLDJDQUNsQjtVQUFBO2FBQUE7VUFBQSx3QkFBZ0UsMkNBQ2hFO2lCQUFBO2FBQUE7VUFBQSx3QkFBbUUsK0NBQzlEO2lCQUFBLHdCQUNGOzs7SUFkRztJQUFOLFlBQU0sU0FBTjtJQUNNO0lBQU4sWUFBTSxTQUFOO0lBQ007SUFBTixZQUFNLFNBQU47SUFDTTtJQUFOLFlBQU0sU0FBTjtJQUNNO0lBQU4sWUFBTSxTQUFOO0lBQ007SUFBTixZQUFNLFNBQU47SUFDTTtJQUFOLFlBQU0sU0FBTjtJQUNNO0lBQU4sWUFBTSxTQUFOO0lBQ007SUFBTixZQUFNLFVBQU47SUFHUztJQUFULFlBQVMsVUFBVDtJQUNTO0lBQVQsWUFBUyxVQUFUOzs7SUFqQm9EO0lBQUE7SUFFN0M7SUFBQTs7OztvQkNIWDtNQUFBO3FDQUFBLFVBQUE7TUFBQTtJQUFBOzs7OzsifQ==
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
    function HuewiSensorDetailsComponent(huepiService) {
        this.huepiService = huepiService;
        this.expand = false;
    }
    HuewiSensorDetailsComponent.prototype.ngOnInit = function () {
    };
    HuewiSensorDetailsComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }]; };
    return HuewiSensorDetailsComponent;
}());

//# sourceMappingURL=huewi-sensor-details.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-sensors/huewi-sensor-details/huewi-sensor-details.component.ngfactory.ts
/* harmony import */ var huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__angular_router__ = __webpack_require__("BkNc");
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
    return huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = ((_co.expand = true) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_7" /* MdIcon */], [huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['expand_more']))], function (_ck, _v) {
        _ck(_v, 2, 0);
    }, null);
}
function View_HuewiSensorDetailsComponent_2(_l) {
    return huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 26, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 23, 'small', [], null, null, null, null, null)), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      '])), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = ((_co.expand = false) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_7" /* MdIcon */], [huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['expand_less'])),
        (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      '])), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-divider', [['aria-orientation', 'horizontal'], ['class',
                'mat-divider'], ['role', 'separator']], null, null, null, null, null)), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_17" /* MdListDivider */], [], null, null),
        huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["Z" /* MdDividerCssMatStyler */], [], null, null), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      '])), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'b', [], null, null, null, null, null)), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['config: '])), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)),
        (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      ', '\n      '])), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, __WEBPACK_IMPORTED_MODULE_4__angular_common__["e" /* JsonPipe */], []), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)),
        (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      '])), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'b', [], null, null, null, null, null)), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['state: '])),
        (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      ', '\n    '])), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, __WEBPACK_IMPORTED_MODULE_4__angular_common__["e" /* JsonPipe */], []), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        _ck(_v, 6, 0);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵunv */](_v, 17, 0, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 18).transform(_co.sensor.config));
        _ck(_v, 17, 0, currVal_0);
        var currVal_1 = huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵunv */](_v, 24, 0, huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).transform(_co.sensor.state));
        _ck(_v, 24, 0, currVal_1);
    });
}
function View_HuewiSensorDetailsComponent_0(_l) {
    return huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-sensor', [], null, null, null, View_HuewiSensorComponent_0, RenderType_HuewiSensorComponent)), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_sensor_component_HuewiSensorComponent, [huepi_service_HuepiService, __WEBPACK_IMPORTED_MODULE_8__angular_router__["k" /* Router */]], { sensor: [0, 'sensor'] }, null), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n'])), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n\n'])), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 12, 'div', [], null, null, null, null, null)), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'div', [], null, null, null, null, null)), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['sensor ', ''])), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  ', ' - ', ''])), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])),
        (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorDetailsComponent_1)),
        huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_common__["k" /* NgIf */], [huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiSensorDetailsComponent_2)),
        huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_4__angular_common__["k" /* NgIf */], [huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n'])), (_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n']))], function (_ck, _v) {
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
    return huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-sensor-details', [], null, null, null, View_HuewiSensorDetailsComponent_0, RenderType_HuewiSensorDetailsComponent)), huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_sensor_details_component_HuewiSensorDetailsComponent, [huepi_service_HuepiService], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiSensorDetailsComponentNgFactory = huewi_sensor_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-sensor-details', huewi_sensor_details_component_HuewiSensorDetailsComponent, View_HuewiSensorDetailsComponent_Host_0, { sensor: 'sensor',
    expand: 'expand' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29yLWRldGFpbHMvaHVld2ktc2Vuc29yLWRldGFpbHMuY29tcG9uZW50Lm5nZmFjdG9yeS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29yLWRldGFpbHMvaHVld2ktc2Vuc29yLWRldGFpbHMuY29tcG9uZW50LnRzIiwibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktc2Vuc29ycy9odWV3aS1zZW5zb3ItZGV0YWlscy9odWV3aS1zZW5zb3ItZGV0YWlscy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29yLWRldGFpbHMvaHVld2ktc2Vuc29yLWRldGFpbHMuY29tcG9uZW50LnRzLkh1ZXdpU2Vuc29yRGV0YWlsc0NvbXBvbmVudF9Ib3N0Lmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiICIsIjxodWV3aS1zZW5zb3IgXG4gIFtzZW5zb3JdPVwic2Vuc29yXCI+XG48L2h1ZXdpLXNlbnNvcj5cblxuPGRpdj5cbiAgPGRpdj5zZW5zb3Ige3tzZW5zb3IuX19rZXl9fTwvZGl2PlxuICB7e3NlbnNvci50eXBlfX0gLSB7e3NlbnNvci5tb2RlbGlkfX08YnI+XG4gIDxtZC1pY29uICpuZ0lmPVwiIWV4cGFuZFwiIChjbGljayk9XCJleHBhbmQ9dHJ1ZVwiPmV4cGFuZF9tb3JlPC9tZC1pY29uPlxuICA8ZGl2ICpuZ0lmPVwiZXhwYW5kXCI+XG4gICAgPHNtYWxsPlxuICAgICAgPG1kLWljb24gKGNsaWNrKT1cImV4cGFuZD1mYWxzZVwiPmV4cGFuZF9sZXNzPC9tZC1pY29uPlxuICAgICAgPG1kLWRpdmlkZXI+PC9tZC1kaXZpZGVyPlxuICAgICAgPGI+Y29uZmlnOiA8L2I+PGJyPlxuICAgICAge3tzZW5zb3IuY29uZmlnIHwganNvbn19XG4gICAgICA8YnI+XG4gICAgICA8Yj5zdGF0ZTogPC9iPjxicj5cbiAgICAgIHt7c2Vuc29yLnN0YXRlIHwganNvbn19XG4gICAgPC9zbWFsbD5cbiAgPC9kaXY+XG48L2Rpdj5cbiIsIjxodWV3aS1zZW5zb3ItZGV0YWlscz48L2h1ZXdpLXNlbnNvci1kZXRhaWxzPiJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JDT0U7TUFBQTtJQUFBO0lBQUE7SUFBeUI7TUFBQTtNQUFBO0lBQUE7SUFBekI7RUFBQSxpREFBQTtNQUFBO2FBQUE7VUFBQSxnREFBK0M7O1FBQS9DOzs7O29CQUNBO01BQUEsd0VBQW9CO2FBQUEsNEJBQ2xCO01BQUE7TUFBQSxnQkFBTyw2Q0FDTDtNQUFBO01BQUE7UUFBQTtRQUFBO1FBQVM7VUFBQTtVQUFBO1FBQUE7UUFBVDtNQUFBLGlEQUFBO01BQUE7YUFBQTtVQUFBLGdEQUFnQztNQUFxQiw2Q0FDckQ7VUFBQTtjQUFBO1VBQUEscUNBQUE7VUFBQTthQUFBO2FBQUE7VUFBQSxlQUF5Qiw2Q0FDekI7VUFBQTtVQUFBLDRDQUFHO1VBQUEsZUFBWTtVQUFBO01BQUk7VUFBQSxlQUVuQjtVQUFBO01BQUksNkNBQ0o7VUFBQTtVQUFBLDhCQUFHO01BQVc7VUFBQSwwREFBSTtVQUFBLDZEQUVaO1VBQUE7SUFQTjs7O0lBRW1CO0lBQUE7SUFHRDtJQUFBOzs7O29CQWZ4QjtNQUFBO3dDQUFBLFVBQUE7TUFBQSxpRUFDb0I7TUFBQSxTQUNMLHlDQUVmO01BQUE7TUFBQSw4QkFBSyx5Q0FDSDthQUFBO1VBQUEsNENBQUs7TUFBQSxpQkFBNkIsa0RBQ0U7TUFBQTtNQUFBLDRDQUFJO01BQ3hDO2FBQUE7VUFBQSx3QkFBb0UseUNBQ3BFO2lCQUFBO2FBQUE7VUFBQSx3QkFVTSx1Q0FDRjtVQUFBOztJQWxCSjtJQURGLFdBQ0UsU0FERjtJQU9XO0lBQVQsWUFBUyxTQUFUO0lBQ0s7SUFBTCxZQUFLLFNBQUw7OztJQUhLO0lBQUE7SUFBNkI7SUFBQTtJQUFBOzs7O29CQ0xwQztNQUFBOzRDQUFBLFVBQUE7TUFBQTtJQUFBOzs7OzsifQ==
//# sourceMappingURL=huewi-sensor-details.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-sensors/huewi-sensors.mock.ts
var HUEWI_SENSORS_MOCK = [];
//# sourceMappingURL=huewi-sensors.mock.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-sensors/huewi-sensors.component.ts
/* harmony import */ var huewi_sensors_component___WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_sensors_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable__ = __webpack_require__("bKpL");
/* harmony import */ var huewi_sensors_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable___default = __webpack_require__.n(huewi_sensors_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable__);
/* harmony import */ var huewi_sensors_component___WEBPACK_IMPORTED_MODULE_4_rxjs_add_observable_of__ = __webpack_require__("/zHi");
/* harmony import */ var huewi_sensors_component___WEBPACK_IMPORTED_MODULE_4_rxjs_add_observable_of___default = __webpack_require__.n(huewi_sensors_component___WEBPACK_IMPORTED_MODULE_4_rxjs_add_observable_of__);






var huewi_sensors_component_HuewiSensorsComponent = (function () {
    function HuewiSensorsComponent(huepiService, activatedRoute, router) {
        this.huepiService = huepiService;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.sensors = HUEWI_SENSORS_MOCK;
        this.sensorObserver = huewi_sensors_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable__["Observable"].of(this.sensors);
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
    HuewiSensorsComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: huewi_sensors_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["a" /* ActivatedRoute */] }, { type: huewi_sensors_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return HuewiSensorsComponent;
}());

//# sourceMappingURL=huewi-sensors.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-sensors/huewi-sensors.component.ngfactory.ts
/* harmony import */ var huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__ = __webpack_require__("bm2B");
/* harmony import */ var huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_cdk__ = __webpack_require__("p4Sk");
/* harmony import */ var huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
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
    return huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-sensor', [], null, null, null, View_HuewiSensorComponent_0, RenderType_HuewiSensorComponent)), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_sensor_component_HuewiSensorComponent, [huepi_service_HuepiService, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], { sensor: [0, 'sensor'] }, null), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    ']))], function (_ck, _v) {
        var currVal_0 = _v.context.$implicit;
        _ck(_v, 1, 0, currVal_0);
    }, null);
}
function View_HuewiSensorsComponent_1(_l) {
    return huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 20, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 11, 'md-card-title', [['class', 'mat-card-title ']], null, null, null, null, null)), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["J" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      Sensors\n      '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'input', [['class', 'mat-input-element'], ['mdInput',
                ''], ['placeholder', 'Filter']], [[8, 'id', 0], [8, 'placeholder', 0], [8, 'disabled',
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
                var pd_0 = (huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7)._handleInput($event.target.value) !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).onTouched() !== false);
                ad = (pd_1 && ad);
            }
            if (('compositionstart' === en)) {
                var pd_2 = (huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7)._compositionStart() !== false);
                ad = (pd_2 && ad);
            }
            if (('compositionend' === en)) {
                var pd_3 = (huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7)._compositionEnd($event.target.value) !== false);
                ad = (pd_3 && ad);
            }
            if (('blur' === en)) {
                var pd_4 = (huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onBlur() !== false);
                ad = (pd_4 && ad);
            }
            if (('focus' === en)) {
                var pd_5 = (huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onFocus() !== false);
                ad = (pd_5 && ad);
            }
            if (('input' === en)) {
                var pd_6 = (huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._onInput() !== false);
                ad = (pd_6 && ad);
            }
            if (('ngModelChange' === en)) {
                var pd_7 = ((_co.searchText = $event) !== false);
                ad = (pd_7 && ad);
            }
            return ad;
        }, null, null)), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["b" /* DefaultValueAccessor */], [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["a" /* COMPOSITION_BUFFER_MODE */]]], null, null), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](1024, null, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["f" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["b" /* DefaultValueAccessor */]]), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["j" /* NgModel */], [[8, null],
            [8, null], [8, null], [2, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["f" /* NG_VALUE_ACCESSOR */]]], { model: [0,
                'model'] }, { update: 'ngModelChange' }), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](2048, null, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["g" /* NgControl */], null, [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["j" /* NgModel */]]), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_13" /* MdInputDirective */], [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_cdk__["L" /* Platform */], [2, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["g" /* NgControl */]], [2, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["i" /* NgForm */]], [2,
                huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["c" /* FormGroupDirective */]], [2, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["m" /* MD_ERROR_GLOBAL_OPTIONS */]]], { placeholder: [0,
                'placeholder'] }, null), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["h" /* NgControlStatus */], [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_forms__["g" /* NgControl */]], null, null), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 4, null, View_HuewiSensorsComponent_2)),
        huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["j" /* NgForOf */], [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */],
            huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, OrderByPipe, []), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, FilterPipe, []), (_l()(),
            huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_13 = _co.searchText;
        _ck(_v, 9, 0, currVal_13);
        var currVal_14 = 'Filter';
        _ck(_v, 11, 0, currVal_14);
        var currVal_15 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵunv */](_v, 16, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 19).transform(huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵunv */](_v, 16, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 18).transform(_co.sensors, _ck(_v, 17, 0, '+name'))), _co.searchText, 'name'));
        _ck(_v, 16, 0, currVal_15);
    }, function (_ck, _v) {
        var currVal_0 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).id;
        var currVal_1 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).placeholder;
        var currVal_2 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).disabled;
        var currVal_3 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).required;
        var currVal_4 = (huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).ariaDescribedby || null);
        var currVal_5 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11)._isErrorState();
        var currVal_6 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassUntouched;
        var currVal_7 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassTouched;
        var currVal_8 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassPristine;
        var currVal_9 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassDirty;
        var currVal_10 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassValid;
        var currVal_11 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassInvalid;
        var currVal_12 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 12).ngClassPending;
        _ck(_v, 6, 1, [currVal_0, currVal_1, currVal_2, currVal_3, currVal_4, currVal_5, currVal_6,
            currVal_7, currVal_8, currVal_9, currVal_10, currVal_11, currVal_12]);
    });
}
function View_HuewiSensorsComponent_3(_l) {
    return huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 18, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 11, 'md-card-title', [['class', 'mat-card-title ']], null, null, null, null, null)), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["J" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'a', [], [[1, 'target', 0], [8, 'href', 4]], [[null,
                'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])),
        huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_7" /* MdIcon */], [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_10" /* MdIconRegistry */], [8, null]], null, null), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['navigate_before'])), (_l()(),
            huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      Sensor Details\n    '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-sensor-details', [], null, null, null, View_HuewiSensorDetailsComponent_0, RenderType_HuewiSensorDetailsComponent)), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_sensor_details_component_HuewiSensorDetailsComponent, [huepi_service_HuepiService], { sensor: [0, 'sensor'] }, null), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_2 = true;
        var currVal_3 = _ck(_v, 8, 0, '/sensors');
        _ck(_v, 7, 0, currVal_2, currVal_3);
        _ck(_v, 11, 0);
        var currVal_4 = _co.selectedSensor;
        _ck(_v, 16, 0, currVal_4);
    }, function (_ck, _v) {
        var currVal_0 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).target;
        var currVal_1 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).href;
        _ck(_v, 6, 0, currVal_0, currVal_1);
    });
}
function View_HuewiSensorsComponent_0(_l) {
    return huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 9, 'md-card', [['class',
                'mat-card']], [[24, '@RoutingAnimations', 0]], null, null, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdCard_0 */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_12__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["_31" /* MdPrefixRejector */], [[2,
                huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_material__["F" /* MdCard */], [], null, null),
        (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiSensorsComponent_1)), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["k" /* NgIf */], [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */],
            huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n  '])),
        (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiSensorsComponent_3)),
        huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["k" /* NgIf */], [huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n \n'])), (_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n']))], function (_ck, _v) {
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
    return huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-sensors', [], [[40, '@RoutingAnimations', 0]], null, null, View_HuewiSensorsComponent_0, RenderType_HuewiSensorsComponent)), huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_sensors_component_HuewiSensorsComponent, [huepi_service_HuepiService, huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).RoutingAnimations;
        _ck(_v, 0, 0, currVal_0);
    });
}
var HuewiSensorsComponentNgFactory = huewi_sensors_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-sensors', huewi_sensors_component_HuewiSensorsComponent, View_HuewiSensorsComponent_Host_0, { sensors: 'sensors' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29ycy5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktc2Vuc29ycy9odWV3aS1zZW5zb3JzLmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29ycy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLXNlbnNvcnMvaHVld2ktc2Vuc29ycy5jb21wb25lbnQudHMuSHVld2lTZW5zb3JzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPG1kLWNhcmQgW0BSb3V0aW5nQW5pbWF0aW9uc10+XG5cbiAgPGRpdiAqbmdJZj1cIiFzZWxlY3RlZFNlbnNvclwiPlxuICAgIDxtZC1jYXJkLXRpdGxlPlxuICAgICAgU2Vuc29yc1xuICAgICAgPGlucHV0IG1kSW5wdXQgcGxhY2Vob2xkZXI9XCJGaWx0ZXJcIiBbKG5nTW9kZWwpXT1cInNlYXJjaFRleHRcIj5cbiAgICA8L21kLWNhcmQtdGl0bGU+XG4gICAgPGh1ZXdpLXNlbnNvciBcbiAgICAgICpuZ0Zvcj1cImxldCBzZW5zb3Igb2Ygc2Vuc29ycyB8IG9yZGVyQnk6WycrbmFtZSddIHwgZmlsdGVyOnNlYXJjaFRleHQ6J25hbWUnXCJcbiAgICAgIFtzZW5zb3JdPVwic2Vuc29yXCI+XG4gICAgPC9odWV3aS1zZW5zb3I+XG4gIDwvZGl2PlxuXG4gIDxkaXYgKm5nSWY9XCJzZWxlY3RlZFNlbnNvclwiPlxuICAgIDxtZC1jYXJkLXRpdGxlPlxuICAgICAgPGEgW3JvdXRlckxpbmtdPVwiWycvc2Vuc29ycyddXCIgW3JlcGxhY2VVcmxdPVwidHJ1ZVwiPjxtZC1pY29uPm5hdmlnYXRlX2JlZm9yZTwvbWQtaWNvbj48L2E+XG4gICAgICBTZW5zb3IgRGV0YWlsc1xuICAgIDwvbWQtY2FyZC10aXRsZT5cbiAgICA8aHVld2ktc2Vuc29yLWRldGFpbHNcbiAgICAgIFtzZW5zb3JdPVwic2VsZWN0ZWRTZW5zb3JcIj5cbiAgICA8L2h1ZXdpLXNlbnNvci1kZXRhaWxzPlxuICA8L2Rpdj5cbiBcbjwvbWQtY2FyZD5cbiIsIjxodWV3aS1zZW5zb3JzPjwvaHVld2ktc2Vuc29ycz4iXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JDT0k7TUFBQTt3Q0FBQSxVQUFBO01BQUEsaUVBRW9CO01BQUE7SUFBbEI7SUFGRixXQUVFLFNBRkY7Ozs7b0JBTEY7TUFBQSx3RUFBNkI7YUFBQSw0QkFDM0I7TUFBQTtNQUFBLG1EQUFBO01BQUE7YUFBQTtNQUFlLDREQUViO1VBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO2NBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQW9DO2NBQUE7Y0FBQTtZQUFBO1lBQXBDO1VBQUEsdUNBQUE7VUFBQTtVQUFBLHNCQUFBO1FBQUE7TUFBQSxvQ0FBQTtVQUFBO1VBQUEsMkNBQUE7VUFBQSxtQ0FBQTtVQUFBO21DQUFBO2NBQUEsc0NBQUE7VUFBQSw0Q0FBNkQ7VUFBQSxhQUMvQywyQ0FDaEI7VUFBQTthQUFBOzRCQUFBLGdEQUNFOzBCQUFBLHVEQUVhO2lCQUFBOztJQUx1QjtJQUFwQyxXQUFvQyxVQUFwQztJQUFlO0lBQWYsWUFBZSxVQUFmO0lBR0E7UUFBQTtRQUFBO0lBREYsWUFDRSxVQURGOztJQUZFO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUEsWUFBQSw0REFBQTtRQUFBLDhEQUFBOzs7O29CQVFKO01BQUEsd0VBQTRCO2FBQUEsNEJBQzFCO01BQUE7TUFBQSxtREFBQTtNQUFBO2FBQUE7TUFBZSw2Q0FDYjtVQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7a0JBQUE7Y0FBQTtZQUFBO1lBQUE7VUFBQSx1Q0FBQTtVQUFBO2NBQUEsbURBQUcsSUFBZ0Q7VUFBQTtVQUFBO2FBQUE7dUJBQUEsc0NBQUE7VUFBQTtVQUFBLDZCQUFTLHdDQUE2QjtpQkFBQSxrREFFM0U7VUFBQSxhQUNoQjtVQUFBO29EQUFBLFVBQUE7VUFBQTtVQUFBLGVBQzRCLDJDQUNMO1VBQUE7O0lBTFU7SUFBNUI7SUFBSCxXQUErQixVQUE1QixTQUFIO0lBQW1EO0lBSW5EO0lBREYsWUFDRSxTQURGOztJQUhFO0lBQUE7SUFBQSxXQUFBLG1CQUFBOzs7O29CQWZOO01BQUE7MkJBQUEsVUFBQTtvQ0FBQTthQUFBO01BQThCLCtCQUU1QjtVQUFBLHNDQUFBO3dCQUFBLG1DQVNNO01BRU47YUFBQTtVQUFBLHdCQVFNLDhCQUVFO1VBQUE7O0lBckJIO0lBQUwsV0FBSyxTQUFMO0lBV0s7SUFBTCxXQUFLLFNBQUw7O0lBYk87SUFBVCxXQUFTLFNBQVQ7Ozs7b0JDQUE7TUFBQTtzQ0FBQSxVQUFBO01BQUE7O1FBQUE7O1FBQUE7UUFBQSxXQUFBLFNBQUE7Ozs7OyJ9
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
 */ var huewi_bridges_component_css_shim_ngstyle_styles = [''];
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
    return huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, null, null, huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2,
                huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_7" /* MdIcon */], [huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['link']))], function (_ck, _v) {
        _ck(_v, 2, 0);
    }, null);
}
function View_HuewiBridgeComponent_2(_l) {
    return huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [['class',
                'col-6 col-md-3']], null, null, null, null, null)),
        (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    Name: ', '\n  ']))], null, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.bridge.name;
        _ck(_v, 1, 0, currVal_0);
    });
}
function View_HuewiBridgeComponent_0(_l) {
    return huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 13, 'span', [['class',
                'row']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.select(_co.bridge) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'span', [['class', 'col-6 col-md-3']], null, null, null, null, null)),
        (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    ', '\n    '])), (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiBridgeComponent_1)),
        huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(),
            huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiBridgeComponent_2)), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [['class', 'col-6 col-md-3']], null, null, null, null, null)), (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    ', '\n  '])), (_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n']))], function (_ck, _v) {
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
    return huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-bridge', [], null, null, null, View_HuewiBridgeComponent_0, RenderType_HuewiBridgeComponent)), huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_bridge_component_HuewiBridgeComponent, [huepi_service_HuepiService, huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_7__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiBridgeComponentNgFactory = huewi_bridge_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-bridge', huewi_bridge_component_HuewiBridgeComponent, View_HuewiBridgeComponent_Host_0, { bridge: 'bridge' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlL2h1ZXdpLWJyaWRnZS5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktYnJpZGdlcy9odWV3aS1icmlkZ2UvaHVld2ktYnJpZGdlLmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlL2h1ZXdpLWJyaWRnZS5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlL2h1ZXdpLWJyaWRnZS5jb21wb25lbnQudHMuSHVld2lCcmlkZ2VDb21wb25lbnRfSG9zdC5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIiAiLCI8c3BhbiBjbGFzcz1cInJvd1wiIChjbGljayk9XCJzZWxlY3QoYnJpZGdlKVwiPlxuICA8c3BhbiBjbGFzcz1cImNvbC02IGNvbC1tZC0zXCI+XG4gICAge3ticmlkZ2UuaWQudG9Mb3dlckNhc2UoKX19XG4gICAgPG1kLWljb24gKm5nSWY9XCJicmlkZ2UuaWQudG9Mb3dlckNhc2UoKSA9PT0gY29uZmlnLmJyaWRnZWlkLnRvTG93ZXJDYXNlKClcIj5saW5rPC9tZC1pY29uPlxuICA8L3NwYW4+XG4gIDxzcGFuIGNsYXNzPVwiY29sLTYgY29sLW1kLTNcIiAqbmdJZj1cImJyaWRnZS5uYW1lXCI+XG4gICAgTmFtZToge3ticmlkZ2UubmFtZX19XG4gIDwvc3Bhbj5cbiAgPHNwYW4gY2xhc3M9XCJjb2wtNiBjb2wtbWQtM1wiPlxuICAgIHt7YnJpZGdlLmludGVybmFsaXBhZGRyZXNzfX1cbiAgPC9zcGFuPlxuPC9zcGFuPiIsIjxodWV3aS1icmlkZ2U+PC9odWV3aS1icmlkZ2U+Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JDR0k7TUFBQTswQkFBQSxVQUFBO29DQUFBO2FBQUE7VUFBQSxnREFBMkU7O1FBQTNFOzs7O29CQUVGO01BQUE7TUFBaUQ7OztJQUFBO0lBQUE7Ozs7b0JBTG5EO01BQUE7SUFBQTtJQUFBO0lBQWtCO01BQUE7TUFBQTtJQUFBO0lBQWxCO0VBQUEsZ0NBQTJDLHlDQUN6QzthQUFBO1VBQUE7TUFBNkIsb0RBRTNCO1VBQUE7YUFBQTtVQUFBLHdCQUF5Rix5Q0FDcEY7aUJBQUEsMEJBQ1A7VUFBQSxtRUFBQTtVQUFBO1VBQUEsZUFFTyx5Q0FDUDtVQUFBO1VBQUEsMERBQTZCO1VBQUEsb0JBRXRCOztJQVBJO0lBQVQsV0FBUyxTQUFUO0lBRTJCO0lBQTdCLFdBQTZCLFNBQTdCOzs7SUFKNkI7SUFBQTtJQU9BO0lBQUE7Ozs7b0JDUi9CO01BQUE7cUNBQUEsVUFBQTtNQUFBO0lBQUE7Ozs7OyJ9
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
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__angular_cdk__ = __webpack_require__("p4Sk");
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
    return huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, null, null, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2,
                huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_7" /* MdIcon */], [huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['link']))], function (_ck, _v) {
        _ck(_v, 2, 0);
    }, null);
}
function View_HuewiBridgeDetailsComponent_3(_l) {
    return huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, null, null, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2,
                huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_7" /* MdIcon */], [huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['link']))], function (_ck, _v) {
        _ck(_v, 2, 0);
    }, null);
}
function View_HuewiBridgeDetailsComponent_1(_l) {
    return huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 26, 'div', [['class',
                'row']], null, null, null, null, null)),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 14, 'div', [['class', 'col-8 col-sm-10']], null, [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.link(_v.context.$implicit.__key) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      ',
            '\n      '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 8, 'small', [], null, null, null, null, null)),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n        ', '\n        '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 5, 'small', [], null, null, null, null, null)), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n          '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n          '])), (_l()(),
            huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'small', [], null, null, null, null, null)), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n            ', '\n          '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n        '])),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['    \n      '])),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiBridgeDetailsComponent_2)),
        huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_common__["k" /* NgIf */], [huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, [' \n    '])), (_l()(),
            huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 7, 'button', [['class', 'col-4 col-sm-2 mat-raised-button'], ['md-raised-button',
                '']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.delete(_v.context.$implicit.__key) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["w" /* MdButton */], [huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_5__angular_cdk__["L" /* Platform */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["g" /* FocusOriginMonitor */]], { disabled: [0,
                'disabled'] }, null), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_40" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n      '])),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiBridgeDetailsComponent_3)),
        huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_common__["k" /* NgIf */], [huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n      Delete\n    '])), (_l()(),
            huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
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
    return huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 35, 'md-card', [['class',
                'mat-card']], null, null, null, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdCard_0 */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])),
        huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["F" /* MdCard */], [], null, null), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n  '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 3, 'md-card-subtitle', [['class',
                'mat-card-subtitle ']], null, null, null, null, null)), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["I" /* MdCardSubtitle */], [], null, null), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['Details'])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n  '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 25, 'div', [['class', 'row']], null, null, null, null, null)), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [['class', 'col-6 col-md-3']], null, null, null, null, null)), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      Id: ', '\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [['class', 'col-6 col-md-3']], null, null, null, null, null)),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      Name: ', '\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [['class',
                'col-6 col-md-3']], null, null, null, null, null)), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      Model: ', '\n    '])),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [['class', 'col-6 col-md-3']], null, null, null, null, null)), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      Timezone: ',
            '\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [['class', 'col-6 col-md-3']], null, null, null, null, null)), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      Mac: ', '\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [['class', 'col-6 col-md-3']], null, null, null, null, null)),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      Software: ', '\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [['class',
                'col-6 col-md-3']], null, null, null, null, null)), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      API: ', '\n    '])),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [['class', 'col-6 col-md-3']], null, null, null, null, null)), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      Datastore: ',
            '\n    '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n'])),
        (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n\n'])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n\n'])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 13, 'md-card', [['class', 'mat-card']], null, null, null, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdCard_0 */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["F" /* MdCard */], [], null, null), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n  '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 3, 'md-card-subtitle', [['class',
                'mat-card-subtitle ']], null, null, null, null, null)), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["I" /* MdCardSubtitle */], [], null, null), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['Whitelist authorisations'])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n  '])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 3, null, View_HuewiBridgeDetailsComponent_1)), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_common__["j" /* NgForOf */], [huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */], huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_37" /* ɵpid */](0, OrderByPipe, []), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n'])), (_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_8 = huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_43" /* ɵunv */](_v, 49, 0, huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 51).transform(_co.whitelist, _ck(_v, 50, 0, '-last use date')));
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
    return huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-bridge-details', [], null, null, null, View_HuewiBridgeDetailsComponent_0, RenderType_HuewiBridgeDetailsComponent)), huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_bridge_details_component_HuewiBridgeDetailsComponent, [huepi_service_HuepiService], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiBridgeDetailsComponentNgFactory = huewi_bridge_details_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-bridge-details', huewi_bridge_details_component_HuewiBridgeDetailsComponent, View_HuewiBridgeDetailsComponent_Host_0, { bridge: 'bridge' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlLWRldGFpbHMvaHVld2ktYnJpZGdlLWRldGFpbHMuY29tcG9uZW50Lm5nZmFjdG9yeS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlLWRldGFpbHMvaHVld2ktYnJpZGdlLWRldGFpbHMuY29tcG9uZW50LnRzIiwibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktYnJpZGdlcy9odWV3aS1icmlkZ2UtZGV0YWlscy9odWV3aS1icmlkZ2UtZGV0YWlscy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlLWRldGFpbHMvaHVld2ktYnJpZGdlLWRldGFpbHMuY29tcG9uZW50LnRzLkh1ZXdpQnJpZGdlRGV0YWlsc0NvbXBvbmVudF9Ib3N0Lmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiICIsIjxtZC1jYXJkPlxuICA8bWQtY2FyZC1zdWJ0aXRsZT5EZXRhaWxzPC9tZC1jYXJkLXN1YnRpdGxlPlxuICA8ZGl2IGNsYXNzPVwicm93XCI+XG4gICAgPHNwYW4gY2xhc3M9XCJjb2wtNiBjb2wtbWQtM1wiPlxuICAgICAgSWQ6IHt7Y29uZmlnLmJyaWRnZWlkLnRvTG93ZXJDYXNlKCl9fVxuICAgIDwvc3Bhbj5cbiAgICA8c3BhbiBjbGFzcz1cImNvbC02IGNvbC1tZC0zXCI+XG4gICAgICBOYW1lOiB7e2NvbmZpZy5uYW1lfX1cbiAgICA8L3NwYW4+XG4gICAgPHNwYW4gY2xhc3M9XCJjb2wtNiBjb2wtbWQtM1wiPlxuICAgICAgTW9kZWw6IHt7Y29uZmlnLm1vZGVsaWR9fVxuICAgIDwvc3Bhbj5cbiAgICA8c3BhbiBjbGFzcz1cImNvbC02IGNvbC1tZC0zXCI+XG4gICAgICBUaW1lem9uZToge3tjb25maWcudGltZXpvbmV9fVxuICAgIDwvc3Bhbj5cbiAgICA8c3BhbiBjbGFzcz1cImNvbC02IGNvbC1tZC0zXCI+XG4gICAgICBNYWM6IHt7Y29uZmlnLm1hY319XG4gICAgPC9zcGFuPlxuICAgIDxzcGFuIGNsYXNzPVwiY29sLTYgY29sLW1kLTNcIj5cbiAgICAgIFNvZnR3YXJlOiB7e2NvbmZpZy5zd3ZlcnNpb259fVxuICAgIDwvc3Bhbj5cbiAgICA8c3BhbiBjbGFzcz1cImNvbC02IGNvbC1tZC0zXCI+XG4gICAgICBBUEk6IHt7Y29uZmlnLmFwaXZlcnNpb259fVxuICAgIDwvc3Bhbj5cbiAgICA8c3BhbiBjbGFzcz1cImNvbC02IGNvbC1tZC0zXCI+XG4gICAgICBEYXRhc3RvcmU6IHt7Y29uZmlnLmRhdGFzdG9yZXZlcnNpb259fVxuICAgIDwvc3Bhbj5cbiAgPC9kaXY+XG48L21kLWNhcmQ+XG5cbjxicj5cblxuPG1kLWNhcmQ+XG4gIDxtZC1jYXJkLXN1YnRpdGxlPldoaXRlbGlzdCBhdXRob3Jpc2F0aW9uczwvbWQtY2FyZC1zdWJ0aXRsZT5cbiAgPGRpdiBjbGFzcz1cInJvd1wiICpuZ0Zvcj1cImxldCBsaXN0ZWQgb2Ygd2hpdGVsaXN0IHwgb3JkZXJCeTpbJy1sYXN0IHVzZSBkYXRlJ11cIj5cbiAgICA8ZGl2IGNsYXNzPVwiY29sLTggY29sLXNtLTEwXCIgKGNsaWNrKT1cImxpbmsobGlzdGVkLl9fa2V5KVwiPlxuICAgICAge3tsaXN0ZWQubmFtZX19XG4gICAgICA8c21hbGw+XG4gICAgICAgIHt7bGlzdGVkW1wibGFzdCB1c2UgZGF0ZVwiXX19XG4gICAgICAgIDxzbWFsbD5cbiAgICAgICAgICA8IS0tIHt7bGlzdGVkW1wiY3JlYXRlIGRhdGVcIl19fSAtLT5cbiAgICAgICAgICA8c21hbGw+XG4gICAgICAgICAgICB7e2xpc3RlZC5fX2tleX19XG4gICAgICAgICAgPC9zbWFsbD5cbiAgICAgICAgPC9zbWFsbD5cbiAgICAgIDwvc21hbGw+ICAgIFxuICAgICAgPG1kLWljb24gKm5nSWY9XCJpc0N1cnJlbnQobGlzdGVkLl9fa2V5KVwiPmxpbms8L21kLWljb24+IFxuICAgIDwvZGl2PlxuICAgIDxidXR0b24gbWQtcmFpc2VkLWJ1dHRvbiBbZGlzYWJsZWRdPVwiaXNDdXJyZW50KGxpc3RlZC5fX2tleSlcIiAoY2xpY2spPVwiZGVsZXRlKGxpc3RlZC5fX2tleSlcIiBjbGFzcz1cImNvbC00IGNvbC1zbS0yXCI+XG4gICAgICA8bWQtaWNvbiAqbmdJZj1cImlzQ3VycmVudChsaXN0ZWQuX19rZXkpXCI+bGluazwvbWQtaWNvbj5cbiAgICAgIERlbGV0ZVxuICAgIDwvYnV0dG9uPlxuICA8L2Rpdj5cbjwvbWQtY2FyZD5cbiIsIjxodWV3aS1icmlkZ2UtZGV0YWlscz48L2h1ZXdpLWJyaWRnZS1kZXRhaWxzPiJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkM4Q007TUFBQTswQkFBQSxVQUFBO29DQUFBO2FBQUE7VUFBQSxnREFBeUM7O1FBQXpDOzs7O29CQUdBO01BQUE7MEJBQUEsVUFBQTtvQ0FBQTthQUFBO1VBQUEsZ0RBQXlDOztRQUF6Qzs7OztvQkFmSjtNQUFBO01BQStFLDJDQUM3RTtVQUFBO1VBQUE7WUFBQTtZQUFBO1lBQTZCO2NBQUE7Y0FBQTtZQUFBO1lBQTdCO1VBQUEsZ0NBQTBEO1VBQUEsY0FFeEQ7VUFBQTtNQUFPLDREQUVMO1VBQUE7VUFBQSw0Q0FBTztVQUFBLG1CQUM2QixpREFDbEM7aUJBQUE7Y0FBQSwwREFBTztVQUFBLG9DQUVDO01BQ0YsNkNBQ0Y7TUFDUjthQUFBO1VBQUEsd0JBQXVELDRDQUNuRDtpQkFBQSw0QkFDTjtVQUFBO2NBQUE7WUFBQTtZQUFBO1lBQThEO2NBQUE7Y0FBQTtZQUFBO1lBQTlEO1VBQUEscURBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7Y0FBQSxtQ0FBQTtVQUFBLDJDQUFvSDtNQUNsSDthQUFBO1VBQUEsd0JBQXVELDZDQUVoRDtpQkFBQTs7SUFMRTtJQUFULFlBQVMsU0FBVDtJQUV1QjtJQUF6QixZQUF5QixTQUF6QjtJQUNXO0lBQVQsWUFBUyxTQUFUOztJQWR3RDtJQUFBO0lBRWpEO0lBQUE7SUFJSTtJQUFBO0lBT2I7SUFBQSxZQUFBLFNBQUE7Ozs7b0JBaERKO01BQUE7YUFBQTt1QkFBQSxzQ0FBQTtVQUFBLHVEQUFTO1VBQUEsV0FDUDtVQUFBO1VBQUEsdUJBQUE7dUJBQUEsc0NBQUE7VUFBQSwrREFBa0I7VUFBQSxjQUEwQiw2QkFDNUM7VUFBQTtVQUFBLGdCQUFpQiwyQ0FDZjtVQUFBO1VBQUEsMERBQTZCO1VBQUEsNEJBRXRCLDJDQUNQO2lCQUFBO2NBQUE7TUFBNkIsNERBRXRCO1VBQUEsYUFDUDtVQUFBO1VBQUEsZ0JBQTZCO01BRXRCLDJDQUNQO1VBQUE7VUFBQSw4QkFBNkI7VUFBQSxZQUV0QiwyQ0FDUDtVQUFBO1VBQUEsMERBQTZCO1VBQUEsNkJBRXRCO01BQ1A7VUFBQTtNQUE2QixnRUFFdEI7VUFBQSxhQUNQO1VBQUE7VUFBQSxnQkFBNkI7TUFFdEIsMkNBQ1A7VUFBQTtVQUFBLDhCQUE2QjtVQUFBLFlBRXRCLHlDQUNIO01BQ0UseUNBRVY7VUFBQTtVQUFBLGdCQUFJLHlDQUVKO1VBQUE7VUFBQSwyRUFBQTtVQUFBOzJCQUFBLHNDQUFBO1VBQUEsdURBQVM7VUFBQSxXQUNQO1VBQUE7VUFBQSx1QkFBQTt1QkFBQSxzQ0FBQTtVQUFBLCtEQUFrQjtVQUFBLCtCQUEyQyw2QkFDN0Q7VUFBQSw0RUFBQTtVQUFBO1VBQUEsOENBQWlCO1VBQUEsZUFrQlgsMkJBQ0U7VUFBQTs7SUFuQlM7UUFBQTtJQUFqQixZQUFpQixTQUFqQjs7O0lBL0IrQjtJQUFBO0lBR0E7SUFBQTtJQUdBO0lBQUE7SUFHQTtJQUFBO0lBR0E7SUFBQTtJQUdBO0lBQUE7SUFHQTtJQUFBO0lBR0E7SUFBQTs7OztvQkN4QmpDO01BQUE7NENBQUEsVUFBQTtNQUFBO0lBQUE7Ozs7OyJ9
//# sourceMappingURL=huewi-bridge-details.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-bridges/huewi-bridges.mock.ts
var HUEWI_BRIDGES_MOCK = [];
//# sourceMappingURL=huewi-bridges.mock.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-bridges/huewi-bridges.component.ts
/* harmony import */ var huewi_bridges_component___WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_bridges_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable__ = __webpack_require__("bKpL");
/* harmony import */ var huewi_bridges_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable___default = __webpack_require__.n(huewi_bridges_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable__);
/* harmony import */ var huewi_bridges_component___WEBPACK_IMPORTED_MODULE_4_rxjs_add_observable_of__ = __webpack_require__("/zHi");
/* harmony import */ var huewi_bridges_component___WEBPACK_IMPORTED_MODULE_4_rxjs_add_observable_of___default = __webpack_require__.n(huewi_bridges_component___WEBPACK_IMPORTED_MODULE_4_rxjs_add_observable_of__);






var huewi_bridges_component_HuewiBridgesComponent = (function () {
    function HuewiBridgesComponent(huepiService, activatedRoute, router) {
        this.huepiService = huepiService;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.bridges = HUEWI_BRIDGES_MOCK;
        this.manualIP = '192.168.0.2';
        this.bridgeObserver = huewi_bridges_component___WEBPACK_IMPORTED_MODULE_3_rxjs_Observable__["Observable"].of(this.bridges);
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
    HuewiBridgesComponent.ctorParameters = function () { return [{ type: huepi_service_HuepiService }, { type: huewi_bridges_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["a" /* ActivatedRoute */] }, { type: huewi_bridges_component___WEBPACK_IMPORTED_MODULE_0__angular_router__["k" /* Router */] }]; };
    return HuewiBridgesComponent;
}());

//# sourceMappingURL=huewi-bridges.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-bridges/huewi-bridges.component.ngfactory.ts
/* harmony import */ var huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__angular_cdk__ = __webpack_require__("p4Sk");
/* harmony import */ var huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__ = __webpack_require__("qbdv");
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
    return huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class',
                'col-6 col-md-2 mat-raised-button'], ['md-raised-button', '']], [[8, 'disabled',
                0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.scan() !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["w" /* MdButton */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_4__angular_cdk__["L" /* Platform */],
            huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["g" /* FocusOriginMonitor */]], null, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_40" /* MdRaisedButtonCssMatStyler */], [], null, null),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['Scan']))], null, function (_ck, _v) {
        var currVal_0 = (huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2).disabled || null);
        _ck(_v, 0, 0, currVal_0);
    });
}
function View_HuewiBridgesComponent_3(_l) {
    return huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class',
                'col-6 col-md-2 mat-raised-button'], ['color', 'accent'], ['md-raised-button', '']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.cancelScan() !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["w" /* MdButton */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */],
            __WEBPACK_IMPORTED_MODULE_4__angular_cdk__["L" /* Platform */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["g" /* FocusOriginMonitor */]], { color: [0, 'color'] }, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_40" /* MdRaisedButtonCssMatStyler */], [], null, null),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['Cancel Scan']))], function (_ck, _v) {
        var currVal_1 = 'accent';
        _ck(_v, 2, 0, currVal_1);
    }, function (_ck, _v) {
        var currVal_0 = (huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 2).disabled || null);
        _ck(_v, 0, 0, currVal_0);
    });
}
function View_HuewiBridgesComponent_4(_l) {
    return huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-bridge', [['md-list-item', '']], null, null, null, View_HuewiBridgeComponent_0, RenderType_HuewiBridgeComponent)), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_bridge_component_HuewiBridgeComponent, [huepi_service_HuepiService, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_router__["k" /* Router */]], { bridge: [0, 'bridge'] }, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      ']))], function (_ck, _v) {
        var currVal_0 = _v.context.$implicit;
        _ck(_v, 1, 0, currVal_0);
    }, null);
}
function View_HuewiBridgesComponent_1(_l) {
    return huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 54, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-card-title', [['class', 'mat-card-title ']], null, null, null, null, null)), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["J" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['Bridges'])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 35, 'div', [['class', 'row']], null, null, null, null, null)), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'col-6 col-md-2 mat-raised-button'], ['md-raised-button', '']], [[8,
                'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.discover() !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["w" /* MdButton */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_4__angular_cdk__["L" /* Platform */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["g" /* FocusOriginMonitor */]], null, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_40" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['Discover'])),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiBridgesComponent_2)), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["k" /* NgIf */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiBridgesComponent_3)),
        huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["k" /* NgIf */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0,
                'ngIf'] }, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      '])), (_l()(),
            huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [['class', 'col-6 col-md-2']], null, null, null, null, null)),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, [' Manual IP: '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 5, 'input', [['class',
                'col-6 col-md-2']], [[2, 'ng-untouched', null], [2, 'ng-touched', null],
            [2, 'ng-pristine', null], [2, 'ng-dirty', null], [2, 'ng-valid',
                null], [2, 'ng-invalid', null], [2, 'ng-pending', null]], [[null, 'ngModelChange'], [null, 'input'], [null,
                'blur'], [null, 'compositionstart'], [null, 'compositionend']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('input' === en)) {
                var pd_0 = (huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25)._handleInput($event.target.value) !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25).onTouched() !== false);
                ad = (pd_1 && ad);
            }
            if (('compositionstart' === en)) {
                var pd_2 = (huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25)._compositionStart() !== false);
                ad = (pd_2 && ad);
            }
            if (('compositionend' === en)) {
                var pd_3 = (huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 25)._compositionEnd($event.target.value) !== false);
                ad = (pd_3 && ad);
            }
            if (('ngModelChange' === en)) {
                var pd_4 = ((_co.manualIP = $event) !== false);
                ad = (pd_4 && ad);
            }
            return ad;
        }, null, null)), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_10__angular_forms__["b" /* DefaultValueAccessor */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, __WEBPACK_IMPORTED_MODULE_10__angular_forms__["a" /* COMPOSITION_BUFFER_MODE */]]], null, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](1024, null, __WEBPACK_IMPORTED_MODULE_10__angular_forms__["f" /* NG_VALUE_ACCESSOR */], function (p0_0) {
            return [p0_0];
        }, [__WEBPACK_IMPORTED_MODULE_10__angular_forms__["b" /* DefaultValueAccessor */]]), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, __WEBPACK_IMPORTED_MODULE_10__angular_forms__["j" /* NgModel */], [[8,
                null], [8, null], [8, null], [2, __WEBPACK_IMPORTED_MODULE_10__angular_forms__["f" /* NG_VALUE_ACCESSOR */]]], { model: [0, 'model'] }, { update: 'ngModelChange' }), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_39" /* ɵprd */](2048, null, __WEBPACK_IMPORTED_MODULE_10__angular_forms__["g" /* NgControl */], null, [__WEBPACK_IMPORTED_MODULE_10__angular_forms__["j" /* NgModel */]]), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, __WEBPACK_IMPORTED_MODULE_10__angular_forms__["h" /* NgControlStatus */], [__WEBPACK_IMPORTED_MODULE_10__angular_forms__["g" /* NgControl */]], null, null), (_l()(),
            huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'col-6 col-md-2 mat-raised-button'], ['md-raised-button',
                '']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.connect() !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["w" /* MdButton */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_4__angular_cdk__["L" /* Platform */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["g" /* FocusOriginMonitor */]], null, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_40" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['Connect'])),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 4, 'button', [['class', 'col-6 col-md-2 mat-raised-button'], ['md-raised-button',
                '']], [[8, 'disabled', 0]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('click' === en)) {
                var pd_0 = (_co.reload() !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["w" /* MdButton */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], __WEBPACK_IMPORTED_MODULE_4__angular_cdk__["L" /* Platform */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["g" /* FocusOriginMonitor */]], null, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_40" /* MdRaisedButtonCssMatStyler */], [], null, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['Reload'])),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 0, 'br', [], null, null, null, null, null)), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 7, 'md-nav-list', [['class', 'mat-nav-list'], ['role', 'list']], null, null, null, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdList_0 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdList */])), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_16" /* MdList */], [], null, null),
        huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_25" /* MdNavListCssMatStyler */], [], null, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n      '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiBridgesComponent_4)), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](802816, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["j" /* NgForOf */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["B" /* IterableDiffers */]], { ngForOf: [0, 'ngForOf'] }, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n    '])), (_l()(),
            huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = !_co.isScanning();
        _ck(_v, 16, 0, currVal_1);
        var currVal_2 = _co.isScanning();
        _ck(_v, 19, 0, currVal_2);
        var currVal_10 = _co.manualIP;
        _ck(_v, 27, 0, currVal_10);
        var currVal_13 = _co.bridges;
        _ck(_v, 52, 0, currVal_13);
    }, function (_ck, _v) {
        var currVal_0 = (huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 11).disabled || null);
        _ck(_v, 9, 0, currVal_0);
        var currVal_3 = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 29).ngClassUntouched;
        var currVal_4 = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 29).ngClassTouched;
        var currVal_5 = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 29).ngClassPristine;
        var currVal_6 = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 29).ngClassDirty;
        var currVal_7 = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 29).ngClassValid;
        var currVal_8 = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 29).ngClassInvalid;
        var currVal_9 = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 29).ngClassPending;
        _ck(_v, 24, 0, currVal_3, currVal_4, currVal_5, currVal_6, currVal_7, currVal_8, currVal_9);
        var currVal_11 = (huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 33).disabled || null);
        _ck(_v, 31, 0, currVal_11);
        var currVal_12 = (huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 39).disabled || null);
        _ck(_v, 37, 0, currVal_12);
    });
}
function View_HuewiBridgesComponent_5(_l) {
    return huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 18, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 11, 'md-card-title', [['class', 'mat-card-title ']], null, null, null, null, null)), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["J" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 6, 'a', [], [[1, 'target', 0], [8, 'href', 4]], [[null,
                'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_router__["m" /* RouterLinkWithHref */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_router__["k" /* Router */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_router__["a" /* ActivatedRoute */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])),
        huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_7" /* MdIcon */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdIconRegistry */], [8, null]], null, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['navigate_before'])), (_l()(),
            huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n      Bridge Details\n    '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['    \n    '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-bridge-details', [], null, null, null, View_HuewiBridgeDetailsComponent_0, RenderType_HuewiBridgeDetailsComponent)), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_bridge_details_component_HuewiBridgeDetailsComponent, [huepi_service_HuepiService], { bridge: [0, 'bridge'] }, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_2 = true;
        var currVal_3 = _ck(_v, 8, 0, '/bridges');
        _ck(_v, 7, 0, currVal_2, currVal_3);
        _ck(_v, 11, 0);
        var currVal_4 = _co.selectedBridge;
        _ck(_v, 16, 0, currVal_4);
    }, function (_ck, _v) {
        var currVal_0 = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).target;
        var currVal_1 = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 7).href;
        _ck(_v, 6, 0, currVal_0, currVal_1);
    });
}
function View_HuewiBridgesComponent_0(_l) {
    return huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 9, 'md-card', [['class',
                'mat-card']], [[24, '@RoutingAnimations', 0]], null, null, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdCard_0 */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2,
                huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["F" /* MdCard */], [], null, null),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n    \n  '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiBridgesComponent_1)), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["k" /* NgIf */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null),
        (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiBridgesComponent_5)), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_9__angular_common__["k" /* NgIf */], [huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */],
            huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n']))], function (_ck, _v) {
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
    return huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-bridges', [], [[40, '@RoutingAnimations', 0]], null, null, View_HuewiBridgesComponent_0, RenderType_HuewiBridgesComponent)), huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_bridges_component_HuewiBridgesComponent, [huepi_service_HuepiService, huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_router__["a" /* ActivatedRoute */], huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_8__angular_router__["k" /* Router */]], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).RoutingAnimations;
        _ck(_v, 0, 0, currVal_0);
    });
}
var HuewiBridgesComponentNgFactory = huewi_bridges_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-bridges', huewi_bridges_component_HuewiBridgesComponent, View_HuewiBridgesComponent_Host_0, { bridges: 'bridges' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlcy5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktYnJpZGdlcy9odWV3aS1icmlkZ2VzLmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlcy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWJyaWRnZXMvaHVld2ktYnJpZGdlcy5jb21wb25lbnQudHMuSHVld2lCcmlkZ2VzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPG1kLWNhcmQgW0BSb3V0aW5nQW5pbWF0aW9uc10+XG4gICAgXG4gIDxkaXYgKm5nSWY9XCIhc2VsZWN0ZWRCcmlkZ2VcIj5cbiAgPG1kLWNhcmQtdGl0bGU+QnJpZGdlczwvbWQtY2FyZC10aXRsZT5cbiAgICA8ZGl2IGNsYXNzPVwicm93XCI+XG4gICAgICA8YnV0dG9uIG1kLXJhaXNlZC1idXR0b24gY2xhc3M9XCJjb2wtNiBjb2wtbWQtMlwiIChjbGljayk9XCJkaXNjb3ZlcigpXCI+RGlzY292ZXI8L2J1dHRvbj5cbiAgICAgIDxidXR0b24gbWQtcmFpc2VkLWJ1dHRvbiBjbGFzcz1cImNvbC02IGNvbC1tZC0yXCIgKGNsaWNrKT1cInNjYW4oKVwiICpuZ0lmPVwiIWlzU2Nhbm5pbmcoKVwiPlNjYW48L2J1dHRvbj5cbiAgICAgIDxidXR0b24gbWQtcmFpc2VkLWJ1dHRvbiBjbGFzcz1cImNvbC02IGNvbC1tZC0yXCIgKGNsaWNrKT1cImNhbmNlbFNjYW4oKVwiIGNvbG9yPVwiYWNjZW50XCIgKm5nSWY9XCJpc1NjYW5uaW5nKClcIj5DYW5jZWwgU2NhbjwvYnV0dG9uPlxuICAgICAgPHNwYW4gY2xhc3M9XCJjb2wtNiBjb2wtbWQtMlwiPiBNYW51YWwgSVA6IDwvc3Bhbj5cbiAgICAgIDxpbnB1dCBjbGFzcz1cImNvbC02IGNvbC1tZC0yXCIgWyhuZ01vZGVsKV09XCJtYW51YWxJUFwiPlxuICAgICAgPGJ1dHRvbiBtZC1yYWlzZWQtYnV0dG9uIGNsYXNzPVwiY29sLTYgY29sLW1kLTJcIiAoY2xpY2spPVwiY29ubmVjdCgpXCI+Q29ubmVjdDwvYnV0dG9uPlxuICAgICAgPGJ1dHRvbiBtZC1yYWlzZWQtYnV0dG9uIGNsYXNzPVwiY29sLTYgY29sLW1kLTJcIiAoY2xpY2spPVwicmVsb2FkKClcIj5SZWxvYWQ8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgICA8YnI+XG4gICAgPG1kLW5hdi1saXN0PlxuICAgICAgPGh1ZXdpLWJyaWRnZSBtZC1saXN0LWl0ZW0gKm5nRm9yPVwibGV0IGJyaWRnZSBvZiBicmlkZ2VzXCIgW2JyaWRnZV09XCJicmlkZ2VcIj5cbiAgICAgIDwvaHVld2ktYnJpZGdlPlxuICAgIDwvbWQtbmF2LWxpc3Q+XG4gIDwvZGl2PlxuXG4gIDxkaXYgKm5nSWY9XCJzZWxlY3RlZEJyaWRnZVwiPlxuICAgIDxtZC1jYXJkLXRpdGxlPlxuICAgICAgPGEgW3JvdXRlckxpbmtdPVwiWycvYnJpZGdlcyddXCIgW3JlcGxhY2VVcmxdPVwidHJ1ZVwiPjxtZC1pY29uPm5hdmlnYXRlX2JlZm9yZTwvbWQtaWNvbj48L2E+XG4gICAgICBCcmlkZ2UgRGV0YWlsc1xuICAgIDwvbWQtY2FyZC10aXRsZT4gICAgXG4gICAgPGh1ZXdpLWJyaWRnZS1kZXRhaWxzIFticmlkZ2VdPVwic2VsZWN0ZWRCcmlkZ2VcIj5cbiAgICA8L2h1ZXdpLWJyaWRnZS1kZXRhaWxzPlxuICA8L2Rpdj5cblxuPC9tZC1jYXJkPiIsIjxodWV3aS1icmlkZ2VzPjwvaHVld2ktYnJpZGdlcz4iXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O29CQ01NO01BQUE7TUFBQTtJQUFBO0lBQUE7SUFBZ0Q7TUFBQTtNQUFBO0lBQUE7SUFBaEQ7RUFBQSxxREFBQTtNQUFBO2FBQUE7K0JBQUEsc0NBQUE7VUFBQTtNQUF1RjtJQUF2RjtJQUFBLFdBQUEsU0FBQTs7OztvQkFDQTtNQUFBO01BQUE7UUFBQTtRQUFBO1FBQWdEO1VBQUE7VUFBQTtRQUFBO1FBQWhEO01BQUEscURBQUE7MEJBQUE7TUFBQSxzQkFBQTt1Q0FBQSw0Q0FBQTtNQUFBO01BQTJHO0lBQXBDO0lBQXZFLFdBQXVFLFNBQXZFOztJQUFBO0lBQUEsV0FBQSxTQUFBOzs7O29CQVFBO01BQUE7d0NBQUEsVUFBQTtNQUFBLGlFQUE0RTtNQUFBO0lBQWxCO0lBQTFELFdBQTBELFNBQTFEOzs7O29CQWJKO01BQUEsd0VBQTZCO2FBQUEsMEJBQzdCO01BQUE7TUFBQSxtREFBQTtNQUFBO2FBQUE7TUFBZSw0Q0FBdUI7TUFDcEM7VUFBQSwwREFBaUI7VUFBQSxlQUNmO1VBQUE7Y0FBQTtZQUFBO1lBQUE7WUFBZ0Q7Y0FBQTtjQUFBO1lBQUE7WUFBaEQ7VUFBQSxxREFBQTtVQUFBO1VBQUEsb0NBQUE7VUFBQTtVQUFBLHNCQUFBO1VBQUEsMkNBQXFFO01BQWlCLDZDQUN0RjtVQUFBLG9FQUFBO1VBQUE7VUFBQSxlQUFvRyw2Q0FDcEc7VUFBQTthQUFBO1VBQUEsd0JBQStILDZDQUMvSDtpQkFBQTtjQUFBO01BQTZCLGlEQUFtQjtVQUFBLGVBQ2hEO1VBQUE7VUFBQTtjQUFBO1VBQUE7Y0FBQTtVQUFBO1lBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQThCO2NBQUE7Y0FBQTtZQUFBO1lBQTlCO1VBQUEsdUNBQUE7VUFBQTtVQUFBLHNCQUFBO1FBQUE7TUFBQSxxQ0FBQTtVQUFBO1VBQUEscURBQUE7d0JBQUEsb0NBQUE7OEJBQUEsNkNBQXFEO2lCQUFBLDhCQUNyRDtVQUFBO2NBQUE7WUFBQTtZQUFBO1lBQWdEO2NBQUE7Y0FBQTtZQUFBO1lBQWhEO1VBQUEscURBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQSxzQkFBQTtVQUFBLDJDQUFvRTtNQUFnQiw2Q0FDcEY7VUFBQTtjQUFBO1lBQUE7WUFBQTtZQUFnRDtjQUFBO2NBQUE7WUFBQTtZQUFoRDtVQUFBLHFEQUFBO1VBQUE7VUFBQSxvQ0FBQTtVQUFBO1VBQUEsc0JBQUE7VUFBQSwyQ0FBbUU7TUFBZSwyQ0FDOUU7TUFDTjtVQUFBLDBEQUFJO1VBQUEsYUFDSjtVQUFBOytDQUFBLFVBQUE7VUFBQTthQUFBO2FBQUE7VUFBQSxlQUFhLGlDQUNYO1VBQUEsc0VBQUE7VUFBQTtVQUFBLHVDQUNlLCtCQUNIO2lCQUFBOztJQVhxRDtJQUFqRSxZQUFpRSxTQUFqRTtJQUNzRjtJQUF0RixZQUFzRixTQUF0RjtJQUU4QjtJQUE5QixZQUE4QixVQUE5QjtJQU0yQjtJQUEzQixZQUEyQixVQUEzQjs7SUFWQTtJQUFBLFdBQUEsU0FBQTtJQUlBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUEsWUFBQSxxRUFBQTtJQUNBO0lBQUEsWUFBQSxVQUFBO0lBQ0E7SUFBQSxZQUFBLFVBQUE7Ozs7b0JBU0o7TUFBQSx3RUFBNEI7YUFBQSw0QkFDMUI7TUFBQTtNQUFBLG1EQUFBO01BQUE7YUFBQTtNQUFlLDZDQUNiO1VBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtrQkFBQTtjQUFBO1lBQUE7WUFBQTtVQUFBLHVDQUFBO1VBQUE7Y0FBQSxtREFBRyxJQUFnRDtVQUFBO1VBQUE7YUFBQTt1QkFBQSxzQ0FBQTtVQUFBO1VBQUEsNkJBQVMsd0NBQTZCO2lCQUFBLGtEQUUzRTtVQUFBLGlCQUNoQjtVQUFBO29EQUFBLFVBQUE7VUFBQTtVQUFBLGVBQWdELDJDQUN6QjtVQUFBOztJQUpVO0lBQTVCO0lBQUgsV0FBK0IsVUFBNUIsU0FBSDtJQUFtRDtJQUcvQjtJQUF0QixZQUFzQixTQUF0Qjs7SUFIRTtJQUFBO0lBQUEsV0FBQSxtQkFBQTs7OztvQkF0Qk47TUFBQTswQkFBQSxVQUFBO29DQUFBO2FBQUE7TUFBOEIsbUNBRTVCO1VBQUEsc0RBQUE7VUFBQTtNQWdCTSwrQkFFTjtVQUFBLHNDQUFBO3dCQUFBLG1DQU9NOzs7UUF6QkQ7UUFBTCxXQUFLLFNBQUw7UUFrQks7UUFBTCxXQUFLLFNBQUw7O1FBcEJPO1FBQVQsV0FBUyxTQUFUOzs7O29CQ0FBO01BQUE7c0NBQUEsVUFBQTtNQUFBOztRQUFBOztRQUFBO1FBQUEsV0FBQSxTQUFBOzs7OzsifQ==
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
 */ var huewi_home_component_css_shim_ngstyle_styles = ['@media screen and (orientation:landscape){div[_ngcontent-%COMP%]{float:left;width:50%}}@media screen and (orientation:portrait){div[_ngcontent-%COMP%]{float:left;width:100%}}'];
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWhvbWUvaHVld2ktaG9tZS5jb21wb25lbnQuY3NzLnNoaW0ubmdzdHlsZS50cyIsInZlcnNpb24iOjMsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWhvbWUvaHVld2ktaG9tZS5jb21wb25lbnQuY3NzIl0sInNvdXJjZXNDb250ZW50IjpbIiAiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7OzsifQ==
//# sourceMappingURL=huewi-home.component.css.shim.ngstyle.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/app/huewi-home/huewi-home.component.ts
var HuewiHomeComponent = (function () {
    function HuewiHomeComponent() {
    }
    HuewiHomeComponent.prototype.ngOnInit = function () {
    };
    HuewiHomeComponent.ctorParameters = function () { return []; };
    return HuewiHomeComponent;
}());

//# sourceMappingURL=huewi-home.component.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/huewi-home/huewi-home.component.ngfactory.ts
/* harmony import */ var huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__ = __webpack_require__("BkNc");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */









var styles_HuewiHomeComponent = [huewi_home_component_css_shim_ngstyle_styles];
var RenderType_HuewiHomeComponent = huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0,
    styles: styles_HuewiHomeComponent, data: {} });
function View_HuewiHomeComponent_0(_l) {
    return huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 5, 'div', [], null, null, null, null, null)), (_l()(),
            huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-groups', [], [[40, '@RoutingAnimations', 0]], null, null, View_HuewiGroupsComponent_0, RenderType_HuewiGroupsComponent)), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_groups_component_HuewiGroupsComponent, [huepi_service_HuepiService, huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], null, null), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(),
            huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n'])), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n'])), (_l()(),
            huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 5, 'div', [], null, null, null, null, null)), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-lights', [], [[40, '@RoutingAnimations', 0]], null, null, View_HuewiLightsComponent_0, RenderType_HuewiLightsComponent)), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](245760, null, 0, huewi_lights_component_HuewiLightsComponent, [huepi_service_HuepiService, huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], null, null), (_l()(),
            huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n    '])), (_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n'])), (_l()(),
            huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        _ck(_v, 3, 0);
        _ck(_v, 10, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 3).RoutingAnimations;
        _ck(_v, 2, 0, currVal_0);
        var currVal_1 = huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 10).RoutingAnimations;
        _ck(_v, 9, 0, currVal_1);
    });
}
function View_HuewiHomeComponent_Host_0(_l) {
    return huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-home', [], null, null, null, View_HuewiHomeComponent_0, RenderType_HuewiHomeComponent)),
        huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, HuewiHomeComponent, [], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, null);
}
var HuewiHomeComponentNgFactory = huewi_home_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-home', HuewiHomeComponent, View_HuewiHomeComponent_Host_0, {}, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWhvbWUvaHVld2ktaG9tZS5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktaG9tZS9odWV3aS1ob21lLmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWhvbWUvaHVld2ktaG9tZS5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWhvbWUvaHVld2ktaG9tZS5jb21wb25lbnQudHMuSHVld2lIb21lQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPGRpdj5cbiAgICA8aHVld2ktZ3JvdXBzPlxuICAgIDwvaHVld2ktZ3JvdXBzPlxuPC9kaXY+XG48ZGl2PlxuICAgIDxodWV3aS1saWdodHM+XG4gICAgPC9odWV3aS1saWdodHM+XG48L2Rpdj5cbiIsIjxodWV3aS1ob21lPjwvaHVld2ktaG9tZT4iXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JDQUE7TUFBQSx3RUFBSzthQUFBLDRCQUNEO01BQUE7dUVBQUEsVUFBQTtNQUFBO01BQUEsNkJBQWMsMkNBQ0M7YUFBQSx3QkFDYix1Q0FDTjthQUFBO1VBQUEsNENBQUs7TUFBQSxhQUNEO01BQUE7d0NBQUEsVUFBQTtNQUFBLDJFQUFjO2FBQUEsNEJBQ0MsdUNBQ2I7YUFBQTtJQU5GO0lBSUE7O0lBSkE7SUFBQSxXQUFBLFNBQUE7SUFJQTtJQUFBLFdBQUEsU0FBQTs7OztvQkNMSjtNQUFBO2FBQUE7VUFBQTtJQUFBOzs7OyJ9
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
/* harmony import */ var huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__ = __webpack_require__("qbdv");
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
    return huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 3, 'md-card', [['class',
                'mat-card']], null, null, null, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdCard_0 */], huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])),
        huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["F" /* MdCard */], [], null, null), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n    Using HammerJS for touch-events and -sequences like you just discovered.\n  ']))], null, null);
}
function View_HuewiAboutComponent_0(_l) {
    return huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 29, 'md-card', [['class',
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
        }, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdCard_0 */], huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["F" /* MdCard */], [], null, null),
        (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 3, 'md-card-title', [['class', 'mat-card-title ']], null, null, null, null, null)), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["J" /* MdCardTitle */], [], null, null),
        (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['About'])), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n  '])), (_l()(),
            huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 3, 'md-card-subtitle', [['class', 'mat-card-subtitle ']], null, null, null, null, null)),
        huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["I" /* MdCardSubtitle */], [], null, null), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['hue Web Interface...'])), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 3, 'md-card', [['class', 'mat-card']], null, null, null, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdCard_0 */], huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["F" /* MdCard */], [], null, null), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n    Made with Angular 2+, Angular Material, Bootstrap grid, HammerJS, huepi and a little focus with some patience.\n  '])),
        (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n  '])), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 6, 'md-card', [['class',
                'mat-card']], null, null, null, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdCard_0 */], huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["F" /* MdCard */], [], null, null),
        (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n    Designed as a sample application for '])), (_l()(),
            huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 1, 'a', [['url', 'https://github.com/ArndBrugman/huepi']], null, null, null, null, null)),
        (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['huepi'])), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['.\n  '])), (_l()(),
            huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n  '])), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiAboutComponent_1)), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_common__["k" /* NgIf */], [huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */],
            huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = _co.touchDiscovered;
        _ck(_v, 28, 0, currVal_1);
    }, function (_ck, _v) {
        var currVal_0 = undefined;
        _ck(_v, 0, 0, currVal_0);
    });
}
function View_HuewiAboutComponent_Host_0(_l) {
    return huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-about', [], [[40, '@RoutingAnimations', 0]], null, null, View_HuewiAboutComponent_0, RenderType_HuewiAboutComponent)), huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, HuewiAboutComponent, [], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).RoutingAnimations;
        _ck(_v, 0, 0, currVal_0);
    });
}
var HuewiAboutComponentNgFactory = huewi_about_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-about', HuewiAboutComponent, View_HuewiAboutComponent_Host_0, { touchSequence: 'touchSequence' }, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWFib3V0L2h1ZXdpLWFib3V0LmNvbXBvbmVudC5uZ2ZhY3RvcnkudHMiLCJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZzovLy9Vc2Vycy9hcm5kL0RldmVsb3Blci9odWV3aTIvc3JjL2FwcC9odWV3aS1hYm91dC9odWV3aS1hYm91dC5jb21wb25lbnQudHMiLCJuZzovLy9Vc2Vycy9hcm5kL0RldmVsb3Blci9odWV3aTIvc3JjL2FwcC9odWV3aS1hYm91dC9odWV3aS1hYm91dC5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWFib3V0L2h1ZXdpLWFib3V0LmNvbXBvbmVudC50cy5IdWV3aUFib3V0Q29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPG1kLWNhcmQgW0BSb3V0aW5nQW5pbWF0aW9uc11cbihzd2lwZWxlZnQpPVwib25Ub3VjaCgkZXZlbnQudHlwZSlcIlxuKHN3aXBlcmlnaHQpPVwib25Ub3VjaCgkZXZlbnQudHlwZSlcIlxuKHRhcCk9XCJvblRvdWNoKCRldmVudC50eXBlKVwiXG4ocHJlc3MpPVwib25Ub3VjaCgkZXZlbnQudHlwZSlcIj5cblxuICA8bWQtY2FyZC10aXRsZT5BYm91dDwvbWQtY2FyZC10aXRsZT5cblxuICA8bWQtY2FyZC1zdWJ0aXRsZT5odWUgV2ViIEludGVyZmFjZS4uLjwvbWQtY2FyZC1zdWJ0aXRsZT5cblxuICA8bWQtY2FyZD5cbiAgICBNYWRlIHdpdGggQW5ndWxhciAyKywgQW5ndWxhciBNYXRlcmlhbCwgQm9vdHN0cmFwIGdyaWQsIEhhbW1lckpTLCBodWVwaSBhbmQgYSBsaXR0bGUgZm9jdXMgd2l0aCBzb21lIHBhdGllbmNlLlxuICA8L21kLWNhcmQ+XG4gIDxtZC1jYXJkPlxuICAgIERlc2lnbmVkIGFzIGEgc2FtcGxlIGFwcGxpY2F0aW9uIGZvciA8YSB1cmw9J2h0dHBzOi8vZ2l0aHViLmNvbS9Bcm5kQnJ1Z21hbi9odWVwaSc+aHVlcGk8L2E+LlxuICA8L21kLWNhcmQ+XG4gIDxtZC1jYXJkICpuZ0lmPVwidG91Y2hEaXNjb3ZlcmVkXCI+XG4gICAgVXNpbmcgSGFtbWVySlMgZm9yIHRvdWNoLWV2ZW50cyBhbmQgLXNlcXVlbmNlcyBsaWtlIHlvdSBqdXN0IGRpc2NvdmVyZWQuXG4gIDwvbWQtY2FyZD5cblxuPC9tZC1jYXJkPiIsIjxodWV3aS1hYm91dD48L2h1ZXdpLWFib3V0PiJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O29CQ2dCRTtNQUFBO2FBQUE7dUJBQUEsc0NBQUE7VUFBQSx1REFBaUM7VUFBQTs7OztvQkFoQm5DO01BQUE7TUFBQTtJQUFBO0lBQUE7SUFDQTtNQUFBO01BQUE7SUFBQTtJQUNBO01BQUE7TUFBQTtJQUFBO0lBQ0E7TUFBQTtNQUFBO0lBQUE7SUFDQTtNQUFBO01BQUE7SUFBQTtJQUpBO0VBQUEsaURBQUE7TUFBQTthQUFBO01BSStCLCtCQUU3QjtVQUFBO1VBQUEscUNBQUE7VUFBQTthQUFBO01BQWUsMENBQXFCLCtCQUVwQztpQkFBQTtjQUFBO2FBQUE7dUJBQUEsc0NBQUE7VUFBQSwrREFBa0I7VUFBQSwyQkFBdUMsK0JBRXpEO1VBQUE7VUFBQSw2REFBQTtVQUFBO1VBQUEsb0NBQUE7VUFBQSw2QkFBUztNQUVDLDZCQUNWO1VBQUE7OEJBQUEsVUFBQTtVQUFBO2FBQUE7TUFBUyxvRUFDOEI7aUJBQUE7Y0FBQTtNQUE4QywwQ0FBUyw4QkFDcEY7aUJBQUEsY0FDVjtVQUFBLG9DQUFBO3dCQUFBLG1DQUVVOzs7UUFGRDtRQUFULFlBQVMsU0FBVDs7UUFoQk87UUFBVCxXQUFTLFNBQVQ7Ozs7b0JDQUE7TUFBQTtvQ0FBQSxVQUFBO01BQUE7SUFBQTs7SUFBQTtJQUFBLFdBQUEsU0FBQTs7Ozs7In0=
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
    return huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 7, 'md-toolbar', [['class',
                'mat-toolbar'], ['role', 'toolbar']], [[24, '@StatusAnimations', 0]], null, null, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["E" /* View_MdToolbar_0 */], huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["p" /* RenderType_MdToolbar */])), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_72" /* MdToolbar */], [huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], { color: [0, 'color'] }, null), (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n    '])), (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 2, 'small', [], null, null, null, null, null)), (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'span', [], null, null, null, null, null)), (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['', ''])), (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n  ']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_1 = _co.accent;
        _ck(_v, 2, 0, currVal_1);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = undefined;
        _ck(_v, 0, 0, currVal_0);
        var currVal_2 = _co.getMessage();
        _ck(_v, 6, 0, currVal_2);
    });
}
function View_HuewiConnectionstatusComponent_1(_l) {
    return huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 18, 'md-card', [['class',
                'status mat-card']], [[24, '@StatusAnimations', 0]], null, null, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["t" /* View_MdCard_0 */], huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["e" /* RenderType_MdCard */])), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["F" /* MdCard */], [], null, null),
        (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n  '])), (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 2, 'md-progress-bar', [['aria-valuemax', '100'], ['aria-valuemin', '0'], ['class', 'mat-progress-bar'],
            ['mode', 'indeterminate'], ['role', 'progressbar']], [[2, 'mat-primary', null],
            [2, 'mat-accent', null], [2, 'mat-warn', null], [1, 'aria-valuenow',
                0], [1, 'mode', 0]], null, null, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["y" /* View_MdProgressBar_0 */], huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["j" /* RenderType_MdProgressBar */])), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_32" /* MdProgressBar */], [], { mode: [0, 'mode'] }, null), (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n  '])), (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 6, 'md-toolbar', [['class', 'mat-toolbar'], ['role', 'toolbar']], null, null, null, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["E" /* View_MdToolbar_0 */], huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["p" /* RenderType_MdToolbar */])),
        huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_72" /* MdToolbar */], [huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], { color: [0, 'color'] }, null),
        (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n    '])), (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 1, 'span', [], null, null, null, null, null)),
        (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['', ''])), (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n  '])), (_l()(),
            huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n  '])), (_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, 0, 1, null, View_HuewiConnectionstatusComponent_2)), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_common__["k" /* NgIf */], [huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(),
            huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n\n']))], function (_ck, _v) {
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
        var currVal_1 = (huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 6).color == 'primary');
        var currVal_2 = (huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 6).color == 'accent');
        var currVal_3 = (huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 6).color == 'warn');
        var currVal_4 = huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 6).value;
        var currVal_5 = huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 6).mode;
        _ck(_v, 4, 0, currVal_1, currVal_2, currVal_3, currVal_4, currVal_5);
        var currVal_8 = _co.getStatus();
        _ck(_v, 13, 0, currVal_8);
    });
}
function View_HuewiConnectionstatusComponent_0(_l) {
    return huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_15" /* ɵand */](16777216, null, null, 1, null, View_HuewiConnectionstatusComponent_1)), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_common__["k" /* NgIf */], [huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Z" /* TemplateRef */]], { ngIf: [0, 'ngIf'] }, null), (_l()(),
            huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n']))], function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = (_co.getStatus() !== 'Connected');
        _ck(_v, 1, 0, currVal_0);
    }, null);
}
function View_HuewiConnectionstatusComponent_Host_0(_l) {
    return huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-connectionstatus', [], [[40, '@StatusAnimations', 0]], null, null, View_HuewiConnectionstatusComponent_0, RenderType_HuewiConnectionstatusComponent)), huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_connectionstatus_component_HuewiConnectionstatusComponent, [huepi_service_HuepiService], null, null)], function (_ck, _v) {
        _ck(_v, 1, 0);
    }, function (_ck, _v) {
        var currVal_0 = huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 1).StatusAnimations;
        _ck(_v, 0, 0, currVal_0);
    });
}
var HuewiConnectionstatusComponentNgFactory = huewi_connectionstatus_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-connectionstatus', huewi_connectionstatus_component_HuewiConnectionstatusComponent, View_HuewiConnectionstatusComponent_Host_0, {}, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWNvbm5lY3Rpb25zdGF0dXMvaHVld2ktY29ubmVjdGlvbnN0YXR1cy5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvaHVld2ktY29ubmVjdGlvbnN0YXR1cy9odWV3aS1jb25uZWN0aW9uc3RhdHVzLmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWNvbm5lY3Rpb25zdGF0dXMvaHVld2ktY29ubmVjdGlvbnN0YXR1cy5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2h1ZXdpLWNvbm5lY3Rpb25zdGF0dXMvaHVld2ktY29ubmVjdGlvbnN0YXR1cy5jb21wb25lbnQudHMuSHVld2lDb25uZWN0aW9uc3RhdHVzQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPG1kLWNhcmQgY2xhc3M9XCJzdGF0dXNcIiAqbmdJZj1cImdldFN0YXR1cygpICE9PSAnQ29ubmVjdGVkJ1wiIFtAU3RhdHVzQW5pbWF0aW9uc10+XG5cbiAgPG1kLXByb2dyZXNzLWJhciBtb2RlPVwiaW5kZXRlcm1pbmF0ZVwiPjwvbWQtcHJvZ3Jlc3MtYmFyPlxuICA8bWQtdG9vbGJhciBbY29sb3JdPVwid2FyblwiID5cbiAgICA8c3Bhbj57e2dldFN0YXR1cygpfX08L3NwYW4+XG4gIDwvbWQtdG9vbGJhcj5cbiAgPG1kLXRvb2xiYXIgW2NvbG9yXT1cImFjY2VudFwiICpuZ0lmPVwiZ2V0TWVzc2FnZSgpICE9PSAnJ1wiIFtAU3RhdHVzQW5pbWF0aW9uc10+XG4gICAgPHNtYWxsPjxzcGFuPnt7Z2V0TWVzc2FnZSgpfX08L3NwYW4+PC9zbWFsbD5cbiAgPC9tZC10b29sYmFyPlxuXG48L21kLWNhcmQ+XG4iLCI8aHVld2ktY29ubmVjdGlvbnN0YXR1cz48L2h1ZXdpLWNvbm5lY3Rpb25zdGF0dXM+Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JDTUU7TUFBQTtNQUFBLG1FQUFBO01BQUE7TUFBQSxzQkFBQTtNQUFBLG1DQUE2RSwrQkFDM0U7TUFBQTtNQUFBLDhCQUFPO01BQUE7TUFBQSxnQkFBTSx3Q0FBK0I7OztRQURsQztRQUFaLFdBQVksU0FBWjs7O1FBQXlEO1FBQXpELFdBQXlELFNBQXpEO1FBQ2U7UUFBQTs7OztvQkFQakI7TUFBQTsyQ0FBQSxVQUFBO01BQUE7YUFBQTtNQUFnRiwrQkFFOUU7VUFBQTtjQUFBO2NBQUE7a0JBQUE7cUNBQUEsVUFBQTtVQUFBO2FBQUE7VUFBQSxlQUF3RCw2QkFDeEQ7VUFBQTtVQUFBO2FBQUE7dUJBQUEsc0NBQUE7VUFBQTtNQUE0QiwrQkFDMUI7VUFBQTtNQUFNLHdDQUFzQiw2QkFDakI7aUJBQUEsY0FDYjtVQUFBLCtDQUFBO1VBQUEsc0VBRWE7aUJBQUE7O0lBTkk7SUFBakIsV0FBaUIsU0FBakI7SUFDWTtJQUFaLFlBQVksU0FBWjtJQUc2QjtJQUE3QixZQUE2QixTQUE3Qjs7O0lBTjBEO0lBQTVELFdBQTRELFNBQTVEO0lBRUU7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBLFdBQUEsaURBQUE7SUFFUTtJQUFBOzs7O29CQUpWO01BQUEsK0NBQUE7TUFBQSxzRUFVVTthQUFBOztJQVZjO0lBQXhCLFdBQXdCLFNBQXhCOzs7O29CQ0FBO01BQUE7K0NBQUEsVUFBQTtNQUFBO0lBQUE7O0lBQUE7SUFBQSxXQUFBLFNBQUE7Ozs7OyJ9
//# sourceMappingURL=huewi-connectionstatus.component.ngfactory.js.map
// CONCATENATED MODULE: /Users/arnd/Developer/huewi2/src/$$_gendir/app/app.component.ngfactory.ts
/* harmony import */ var app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("/oeL");
/* harmony import */ var app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__ = __webpack_require__("v6Q/");
/* harmony import */ var app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__ = __webpack_require__("Z04r");
/* harmony import */ var app_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_cdk__ = __webpack_require__("p4Sk");
/* harmony import */ var app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__ = __webpack_require__("BkNc");
/* harmony import */ var app_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_common__ = __webpack_require__("qbdv");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__angular_platform_browser__ = __webpack_require__("fc+i");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */












var styles_AppComponent = [app_component_css_shim_ngstyle_styles];
var RenderType_AppComponent = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_18" /* ɵcrt */]({ encapsulation: 0, styles: styles_AppComponent,
    data: {} });
function View_AppComponent_0(_l) {
    return app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 254, 'div', [], [[8, 'className', 0]], null, null, null, null)),
        (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n\n'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 247, 'md-sidenav-container', [['class', 'mat-sidenav-container'], ['fullscreen',
                '']], [[2, 'mat-sidenav-transition', null]], null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["z" /* View_MdSidenavContainer_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["l" /* RenderType_MdSidenavContainer */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1097728, null, 1, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_48" /* MdSidenavContainer */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_cdk__["q" /* Directionality */]], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["J" /* NgZone */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 1, { _sidenavs: 1 }),
        (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](1, ['\n\n  '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 1, 17, 'md-toolbar', [['class', 'mat-toolbar'], ['color', 'primary'], ['role', 'toolbar']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["E" /* View_MdToolbar_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["p" /* RenderType_MdToolbar */])),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_72" /* MdToolbar */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], { color: [0, 'color'] }, null),
        (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 9, 'button', [['class', 'mat-icon-button'], ['md-icon-button', '']], [[8, 'disabled', 0]], [[null,
                'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 77).toggle() !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["s" /* View_MdButton_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["d" /* RenderType_MdButton */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](180224, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["w" /* MdButton */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_cdk__["L" /* Platform */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["g" /* FocusOriginMonitor */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_8" /* MdIconButtonCssMatStyler */], [], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n        '])),
        (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 3, 'md-icon', [['class', 'mat-icon'], ['role',
                'img']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_7" /* MdIcon */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdIconRegistry */], [8, null]], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['menu'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 1, 'span', [], null, null, null, null, null)), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['', ''])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n    '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](1, ['\n\n  '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 1, 47, 'nav', [['class', 'mat-tab-nav-bar'], ['md-tab-nav-bar', '']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["D" /* View_MdTabNav_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["o" /* RenderType_MdTabNav */])),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](3325952, [['navbar', 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_68" /* MdTabNav */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_cdk__["q" /* Directionality */]], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["J" /* NgZone */]], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n    '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 7, 'a', [['class', 'mat-tab-link'], ['md-tab-link', ''], ['routerLinkActive',
                'active-link']], [[1, 'aria-disabled', 0], [2, 'mat-tab-disabled', null],
            [8, 'tabIndex', 0], [1, 'target', 0], [8, 'href', 4]], [[null, 'click']], function (_v, en, $event) {
            var ad = true;
            if (('click' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 31).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_0 && ad);
            }
            return ad;
        }, null, null)), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](147456, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_67" /* MdTabLink */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_68" /* MdTabNav */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["J" /* NgZone */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_93" /* ViewportRuler */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_cdk__["L" /* Platform */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["p" /* MD_RIPPLE_GLOBAL_OPTIONS */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[3, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 2, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 3, { linksWithHrefs: 1 }), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['Home'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n    '])), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 7, 'a', [['class', 'mat-tab-link'], ['md-tab-link',
                    ''], ['routerLinkActive', 'active-link']], [[1, 'aria-disabled', 0], [2, 'mat-tab-disabled',
                    null], [8, 'tabIndex', 0], [1, 'target', 0], [8, 'href', 4]], [[null,
                    'click']], function (_v, en, $event) {
                var ad = true;
                if (('click' === en)) {
                    var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 40).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                    ad = (pd_0 && ad);
                }
                return ad;
            }, null, null)), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](147456, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_67" /* MdTabLink */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_68" /* MdTabNav */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["J" /* NgZone */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_93" /* ViewportRuler */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_cdk__["L" /* Platform */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["p" /* MD_RIPPLE_GLOBAL_OPTIONS */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[5, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 4, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 5, { linksWithHrefs: 1 }), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['Groups'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n    '])), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 7, 'a', [['class', 'mat-tab-link'], ['md-tab-link',
                    ''], ['routerLinkActive', 'active-link']], [[1, 'aria-disabled', 0], [2, 'mat-tab-disabled',
                    null], [8, 'tabIndex', 0], [1, 'target', 0], [8, 'href', 4]], [[null,
                    'click']], function (_v, en, $event) {
                var ad = true;
                if (('click' === en)) {
                    var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 49).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                    ad = (pd_0 && ad);
                }
                return ad;
            }, null, null)), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](147456, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_67" /* MdTabLink */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_68" /* MdTabNav */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["J" /* NgZone */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_93" /* ViewportRuler */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_cdk__["L" /* Platform */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["p" /* MD_RIPPLE_GLOBAL_OPTIONS */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[7, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 6, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 7, { linksWithHrefs: 1 }), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['Lights'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n    '])), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 7, 'a', [['class', 'mat-tab-link'], ['md-tab-link',
                    ''], ['routerLinkActive', 'active-link']], [[1, 'aria-disabled', 0], [2, 'mat-tab-disabled',
                    null], [8, 'tabIndex', 0], [1, 'target', 0], [8, 'href', 4]], [[null,
                    'click']], function (_v, en, $event) {
                var ad = true;
                if (('click' === en)) {
                    var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 58).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                    ad = (pd_0 && ad);
                }
                return ad;
            }, null, null)), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](147456, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_67" /* MdTabLink */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_68" /* MdTabNav */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["J" /* NgZone */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_93" /* ViewportRuler */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_cdk__["L" /* Platform */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["p" /* MD_RIPPLE_GLOBAL_OPTIONS */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[9, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 8, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 9, { linksWithHrefs: 1 }), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['Bridges'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n    '])), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 7, 'a', [['class', 'mat-tab-link'], ['md-tab-link',
                    ''], ['routerLinkActive', 'active-link']], [[1, 'aria-disabled', 0], [2, 'mat-tab-disabled',
                    null], [8, 'tabIndex', 0], [1, 'target', 0], [8, 'href', 4]], [[null,
                    'click']], function (_v, en, $event) {
                var ad = true;
                if (('click' === en)) {
                    var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 67).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                    ad = (pd_0 && ad);
                }
                return ad;
            }, null, null)), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](147456, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_67" /* MdTabLink */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_68" /* MdTabNav */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["J" /* NgZone */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_93" /* ViewportRuler */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_cdk__["L" /* Platform */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["p" /* MD_RIPPLE_GLOBAL_OPTIONS */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[11, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'],
            routerLink: [1, 'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 10, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 11, { linksWithHrefs: 1 }), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['About'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n  '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](1, ['\n\n  '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 169, 'md-sidenav', [['class',
                'mat-sidenav'], ['tabIndex', '-1']], [[1, 'align', 0], [2, 'mat-sidenav-closed',
                null], [2, 'mat-sidenav-closing', null], [2, 'mat-sidenav-end',
                null], [2, 'mat-sidenav-opened', null], [2, 'mat-sidenav-opening',
                null], [2, 'mat-sidenav-over', null], [2, 'mat-sidenav-push',
                null], [2, 'mat-sidenav-side', null]], [[null, 'transitionend'],
            [null, 'keydown']], function (_v, en, $event) {
            var ad = true;
            if (('transitionend' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 77)._onTransitionEnd($event) !== false);
                ad = (pd_0 && ad);
            }
            if (('keydown' === en)) {
                var pd_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 77).handleKeydown($event) !== false);
                ad = (pd_1 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["A" /* View_MdSidenav_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["k" /* RenderType_MdSidenav */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1228800, [[1, 4], ['sidenav', 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_47" /* MdSidenav */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_4__angular_cdk__["w" /* FocusTrapFactory */], [2, __WEBPACK_IMPORTED_MODULE_7__angular_platform_browser__["b" /* DOCUMENT */]]], null, null),
        (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n    '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 164, 'md-nav-list', [['class', 'mat-nav-list'], ['role', 'list']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["x" /* View_MdList_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["h" /* RenderType_MdList */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_16" /* MdList */], [], null, null),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_25" /* MdNavListCssMatStyler */], [], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 13, 'a', [['class', 'mat-list-item'], ['md-list-item', ''], ['role', 'listitem'],
            ['routerLinkActive', 'active-link']], [[1, 'target', 0], [8, 'href', 4]], [[null,
                'click'], [null, 'focus'], [null, 'blur']], function (_v, en, $event) {
            var ad = true;
            if (('focus' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 85)._handleFocus() !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 85)._handleBlur() !== false);
                ad = (pd_1 && ad);
            }
            if (('click' === en)) {
                var pd_2 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 88).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_2 && ad);
            }
            if (('click' === en)) {
                var pd_3 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 77).toggle() !== false);
                ad = (pd_3 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["w" /* View_MdListItem_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["i" /* RenderType_MdListItem */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1097728, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_18" /* MdListItem */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_16" /* MdList */]], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_25" /* MdNavListCssMatStyler */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 12, { _lines: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](335544320, 13, { _hasAvatar: 0 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[15, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'], routerLink: [1,
                'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 14, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 15, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 2, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_7" /* MdIcon */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdIconRegistry */], [8, null]], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['home'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](2, ['Home'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 13, 'a', [['class', 'mat-list-item'], ['md-list-item', ''], ['role', 'listitem'],
            ['routerLinkActive', 'active-link']], [[1, 'target', 0], [8, 'href', 4]], [[null,
                'click'], [null, 'focus'], [null, 'blur']], function (_v, en, $event) {
            var ad = true;
            if (('focus' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 100)._handleFocus() !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 100)._handleBlur() !== false);
                ad = (pd_1 && ad);
            }
            if (('click' === en)) {
                var pd_2 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 103).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_2 && ad);
            }
            if (('click' === en)) {
                var pd_3 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 77).toggle() !== false);
                ad = (pd_3 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["w" /* View_MdListItem_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["i" /* RenderType_MdListItem */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1097728, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_18" /* MdListItem */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_16" /* MdList */]], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_25" /* MdNavListCssMatStyler */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 16, { _lines: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](335544320, 17, { _hasAvatar: 0 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[19, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'], routerLink: [1,
                'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 18, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 19, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 2, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_7" /* MdIcon */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdIconRegistry */], [8, null]], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['group_work'])), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](2, ['Groups'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 13, 'a', [['class', 'mat-list-item'], ['md-list-item', ''], ['role',
                'listitem'], ['routerLinkActive', 'active-link']], [[1, 'target', 0], [8, 'href',
                4]], [[null, 'click'], [null, 'focus'], [null,
                'blur']], function (_v, en, $event) {
            var ad = true;
            if (('focus' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 115)._handleFocus() !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 115)._handleBlur() !== false);
                ad = (pd_1 && ad);
            }
            if (('click' === en)) {
                var pd_2 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 118).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_2 && ad);
            }
            if (('click' === en)) {
                var pd_3 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 77).toggle() !== false);
                ad = (pd_3 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["w" /* View_MdListItem_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["i" /* RenderType_MdListItem */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1097728, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_18" /* MdListItem */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_16" /* MdList */]], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_25" /* MdNavListCssMatStyler */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 20, { _lines: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](335544320, 21, { _hasAvatar: 0 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[23, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'], routerLink: [1,
                'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 22, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 23, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 2, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_7" /* MdIcon */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdIconRegistry */], [8, null]], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['lightbulb_outline'])), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](2, ['Lights'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 3, 'md-divider', [['aria-orientation', 'horizontal'], ['class',
                'mat-divider'], ['role', 'separator']], null, null, null, null, null)), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_17" /* MdListDivider */], [], null, null),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["Z" /* MdDividerCssMatStyler */], [], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 13, 'a', [['class', 'mat-list-item'], ['md-list-item', ''], ['role', 'listitem'],
            ['routerLinkActive', 'active-link']], [[1, 'target', 0], [8, 'href', 4]], [[null,
                'click'], [null, 'focus'], [null, 'blur']], function (_v, en, $event) {
            var ad = true;
            if (('focus' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 135)._handleFocus() !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 135)._handleBlur() !== false);
                ad = (pd_1 && ad);
            }
            if (('click' === en)) {
                var pd_2 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 138).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_2 && ad);
            }
            if (('click' === en)) {
                var pd_3 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 77).toggle() !== false);
                ad = (pd_3 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["w" /* View_MdListItem_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["i" /* RenderType_MdListItem */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1097728, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_18" /* MdListItem */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_16" /* MdList */]], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_25" /* MdNavListCssMatStyler */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 24, { _lines: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](335544320, 25, { _hasAvatar: 0 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[27, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'], routerLink: [1,
                'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 26, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 27, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 2, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_7" /* MdIcon */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdIconRegistry */], [8, null]], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['assignment'])), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](2, ['Rules'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 13, 'a', [['class', 'mat-list-item'], ['md-list-item', ''], ['role',
                'listitem'], ['routerLinkActive', 'active-link']], [[1, 'target', 0], [8, 'href',
                4]], [[null, 'click'], [null, 'focus'], [null,
                'blur']], function (_v, en, $event) {
            var ad = true;
            if (('focus' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 150)._handleFocus() !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 150)._handleBlur() !== false);
                ad = (pd_1 && ad);
            }
            if (('click' === en)) {
                var pd_2 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 153).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_2 && ad);
            }
            if (('click' === en)) {
                var pd_3 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 77).toggle() !== false);
                ad = (pd_3 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["w" /* View_MdListItem_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["i" /* RenderType_MdListItem */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1097728, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_18" /* MdListItem */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_16" /* MdList */]], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_25" /* MdNavListCssMatStyler */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 28, { _lines: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](335544320, 29, { _hasAvatar: 0 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[31, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'], routerLink: [1,
                'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 30, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 31, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 2, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_7" /* MdIcon */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdIconRegistry */], [8, null]], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['assignment_ind'])), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](2, ['Scenes'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 13, 'a', [['class', 'mat-list-item'], ['md-list-item', ''], ['role',
                'listitem'], ['routerLinkActive', 'active-link']], [[1, 'target', 0], [8, 'href',
                4]], [[null, 'click'], [null, 'focus'], [null,
                'blur']], function (_v, en, $event) {
            var ad = true;
            if (('focus' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 165)._handleFocus() !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 165)._handleBlur() !== false);
                ad = (pd_1 && ad);
            }
            if (('click' === en)) {
                var pd_2 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 168).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_2 && ad);
            }
            if (('click' === en)) {
                var pd_3 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 77).toggle() !== false);
                ad = (pd_3 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["w" /* View_MdListItem_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["i" /* RenderType_MdListItem */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1097728, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_18" /* MdListItem */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_16" /* MdList */]], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_25" /* MdNavListCssMatStyler */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 32, { _lines: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](335544320, 33, { _hasAvatar: 0 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[35, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'], routerLink: [1,
                'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 34, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 35, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 2, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_7" /* MdIcon */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdIconRegistry */], [8, null]], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['alarm'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](2, ['Schedules'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 13, 'a', [['class', 'mat-list-item'], ['md-list-item', ''], ['role', 'listitem'],
            ['routerLinkActive', 'active-link']], [[1, 'target', 0], [8, 'href', 4]], [[null,
                'click'], [null, 'focus'], [null, 'blur']], function (_v, en, $event) {
            var ad = true;
            if (('focus' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 180)._handleFocus() !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 180)._handleBlur() !== false);
                ad = (pd_1 && ad);
            }
            if (('click' === en)) {
                var pd_2 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 183).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_2 && ad);
            }
            if (('click' === en)) {
                var pd_3 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 77).toggle() !== false);
                ad = (pd_3 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["w" /* View_MdListItem_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["i" /* RenderType_MdListItem */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1097728, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_18" /* MdListItem */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_16" /* MdList */]], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_25" /* MdNavListCssMatStyler */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 36, { _lines: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](335544320, 37, { _hasAvatar: 0 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[39, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'], routerLink: [1,
                'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 38, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 39, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 2, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_7" /* MdIcon */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdIconRegistry */], [8, null]], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['all_out'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](2, ['Sensors'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 3, 'md-divider', [['aria-orientation', 'horizontal'], ['class', 'mat-divider'],
            ['role', 'separator']], null, null, null, null, null)), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_17" /* MdListDivider */], [], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["Z" /* MdDividerCssMatStyler */], [], null, null),
        (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 13, 'a', [['class',
                'mat-list-item'], ['md-list-item', ''], ['role', 'listitem'], ['routerLinkActive',
                'active-link']], [[1, 'target', 0], [8, 'href', 4]], [[null, 'click'], [null,
                'focus'], [null, 'blur']], function (_v, en, $event) {
            var ad = true;
            if (('focus' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 200)._handleFocus() !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 200)._handleBlur() !== false);
                ad = (pd_1 && ad);
            }
            if (('click' === en)) {
                var pd_2 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 203).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_2 && ad);
            }
            if (('click' === en)) {
                var pd_3 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 77).toggle() !== false);
                ad = (pd_3 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["w" /* View_MdListItem_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["i" /* RenderType_MdListItem */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1097728, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_18" /* MdListItem */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_16" /* MdList */]], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_25" /* MdNavListCssMatStyler */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 40, { _lines: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](335544320, 41, { _hasAvatar: 0 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[43, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'], routerLink: [1,
                'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 42, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 43, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 2, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_7" /* MdIcon */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdIconRegistry */], [8, null]], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['device_hub'])), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](2, ['Bridges'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 13, 'a', [['class', 'mat-list-item'], ['md-list-item', ''], ['role',
                'listitem'], ['routerLinkActive', 'active-link']], [[1, 'target', 0], [8, 'href',
                4]], [[null, 'click'], [null, 'focus'], [null,
                'blur']], function (_v, en, $event) {
            var ad = true;
            if (('focus' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 215)._handleFocus() !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 215)._handleBlur() !== false);
                ad = (pd_1 && ad);
            }
            if (('click' === en)) {
                var pd_2 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 218).onClick($event.button, $event.ctrlKey, $event.metaKey, $event.shiftKey) !== false);
                ad = (pd_2 && ad);
            }
            if (('click' === en)) {
                var pd_3 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 77).toggle() !== false);
                ad = (pd_3 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["w" /* View_MdListItem_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["i" /* RenderType_MdListItem */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1097728, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_18" /* MdListItem */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_16" /* MdList */]], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_25" /* MdNavListCssMatStyler */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 44, { _lines: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](335544320, 45, { _hasAvatar: 0 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](671744, [[47, 4]], 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["m" /* RouterLinkWithHref */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["a" /* ActivatedRoute */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_6__angular_common__["h" /* LocationStrategy */]], { replaceUrl: [0, 'replaceUrl'], routerLink: [1,
                'routerLink'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_36" /* ɵpad */](1), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1720320, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["l" /* RouterLinkActive */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], { routerLinkActive: [0, 'routerLinkActive'] }, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 46, { links: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 47, { linksWithHrefs: 1 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 2, 3, 'md-icon', [['class', 'mat-icon'], ['role', 'img']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_7" /* MdIcon */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdIconRegistry */], [8, null]], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['info'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](2, ['About'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 3, 'md-divider', [['aria-orientation', 'horizontal'], ['class', 'mat-divider'],
            ['role', 'separator']], null, null, null, null, null)), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]],
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_17" /* MdListDivider */], [], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["Z" /* MdDividerCssMatStyler */], [], null, null),
        (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n      '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 0, 8, 'a', [['class',
                'mat-list-item'], ['md-list-item', ''], ['role', 'listitem']], null, [[null, 'click'], [null, 'focus'], [null, 'blur']], function (_v, en, $event) {
            var ad = true;
            var _co = _v.component;
            if (('focus' === en)) {
                var pd_0 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 235)._handleFocus() !== false);
                ad = (pd_0 && ad);
            }
            if (('blur' === en)) {
                var pd_1 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 235)._handleBlur() !== false);
                ad = (pd_1 && ad);
            }
            if (('click' === en)) {
                var pd_2 = (_co.toggleTheme() !== false);
                ad = (pd_2 && ad);
            }
            return ad;
        }, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["w" /* View_MdListItem_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["i" /* RenderType_MdListItem */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](1097728, null, 2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_18" /* MdListItem */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_16" /* MdList */]], [2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_25" /* MdNavListCssMatStyler */]]], null, null), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](603979776, 48, { _lines: 1 }), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_40" /* ɵqud */](335544320, 49, { _hasAvatar: 0 }), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, 2, 3, 'md-icon', [['class',
                'mat-icon'], ['role', 'img']], null, null, null, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["v" /* View_MdIcon_0 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_2__gendir_node_modules_angular_material_typings_index_ngfactory__["g" /* RenderType_MdIcon */])), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](16384, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_31" /* MdPrefixRejector */], [[2, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["j" /* MATERIAL_COMPATIBILITY_MODE */]], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */]], null, null),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](638976, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_7" /* MdIcon */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["Q" /* Renderer2 */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["q" /* ElementRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_3__angular_material__["_10" /* MdIconRegistry */],
            [8, null]], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['invert_colors'])),
        (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](2, ['Theme'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n    '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](0, ['\n  '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](1, ['\n\n  '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](16777216, null, 1, 2, 'router-outlet', [], null, null, null, null, null)), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](212992, null, 0, app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["o" /* RouterOutlet */], [app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["b" /* ChildrenOutletContexts */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_3" /* ViewContainerRef */], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["m" /* ComponentFactoryResolver */],
            [8, null], app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["j" /* ChangeDetectorRef */]], null, null),
        (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n  '])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](1, ['\n\n'])), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n\n'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 2, 'huewi-connectionstatus', [], [[40, '@StatusAnimations', 0]], null, null, View_HuewiConnectionstatusComponent_0, RenderType_HuewiConnectionstatusComponent)),
        app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](114688, null, 0, huewi_connectionstatus_component_HuewiConnectionstatusComponent, [huepi_service_HuepiService], null, null), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n'])), (_l()(),
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, ['\n\n'])), (_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_42" /* ɵted */](null, [' ']))], function (_ck, _v) {
        var currVal_2 = 'primary';
        _ck(_v, 9, 0, currVal_2);
        _ck(_v, 18, 0);
        var currVal_10 = true;
        var currVal_11 = _ck(_v, 32, 0, '/home');
        _ck(_v, 31, 0, currVal_10, currVal_11);
        var currVal_12 = 'active-link';
        _ck(_v, 33, 0, currVal_12);
        var currVal_18 = true;
        var currVal_19 = _ck(_v, 41, 0, '/groups');
        _ck(_v, 40, 0, currVal_18, currVal_19);
        var currVal_20 = 'active-link';
        _ck(_v, 42, 0, currVal_20);
        var currVal_26 = true;
        var currVal_27 = _ck(_v, 50, 0, '/lights');
        _ck(_v, 49, 0, currVal_26, currVal_27);
        var currVal_28 = 'active-link';
        _ck(_v, 51, 0, currVal_28);
        var currVal_34 = true;
        var currVal_35 = _ck(_v, 59, 0, '/bridges');
        _ck(_v, 58, 0, currVal_34, currVal_35);
        var currVal_36 = 'active-link';
        _ck(_v, 60, 0, currVal_36);
        var currVal_42 = true;
        var currVal_43 = _ck(_v, 68, 0, '/about');
        _ck(_v, 67, 0, currVal_42, currVal_43);
        var currVal_44 = 'active-link';
        _ck(_v, 69, 0, currVal_44);
        var currVal_56 = true;
        var currVal_57 = _ck(_v, 89, 0, '/home');
        _ck(_v, 88, 0, currVal_56, currVal_57);
        var currVal_58 = 'active-link';
        _ck(_v, 90, 0, currVal_58);
        _ck(_v, 95, 0);
        var currVal_61 = true;
        var currVal_62 = _ck(_v, 104, 0, '/groups');
        _ck(_v, 103, 0, currVal_61, currVal_62);
        var currVal_63 = 'active-link';
        _ck(_v, 105, 0, currVal_63);
        _ck(_v, 110, 0);
        var currVal_66 = true;
        var currVal_67 = _ck(_v, 119, 0, '/lights');
        _ck(_v, 118, 0, currVal_66, currVal_67);
        var currVal_68 = 'active-link';
        _ck(_v, 120, 0, currVal_68);
        _ck(_v, 125, 0);
        var currVal_71 = true;
        var currVal_72 = _ck(_v, 139, 0, '/rules');
        _ck(_v, 138, 0, currVal_71, currVal_72);
        var currVal_73 = 'active-link';
        _ck(_v, 140, 0, currVal_73);
        _ck(_v, 145, 0);
        var currVal_76 = true;
        var currVal_77 = _ck(_v, 154, 0, '/scenes');
        _ck(_v, 153, 0, currVal_76, currVal_77);
        var currVal_78 = 'active-link';
        _ck(_v, 155, 0, currVal_78);
        _ck(_v, 160, 0);
        var currVal_81 = true;
        var currVal_82 = _ck(_v, 169, 0, '/schedules');
        _ck(_v, 168, 0, currVal_81, currVal_82);
        var currVal_83 = 'active-link';
        _ck(_v, 170, 0, currVal_83);
        _ck(_v, 175, 0);
        var currVal_86 = true;
        var currVal_87 = _ck(_v, 184, 0, '/sensors');
        _ck(_v, 183, 0, currVal_86, currVal_87);
        var currVal_88 = 'active-link';
        _ck(_v, 185, 0, currVal_88);
        _ck(_v, 190, 0);
        var currVal_91 = true;
        var currVal_92 = _ck(_v, 204, 0, '/bridges');
        _ck(_v, 203, 0, currVal_91, currVal_92);
        var currVal_93 = 'active-link';
        _ck(_v, 205, 0, currVal_93);
        _ck(_v, 210, 0);
        var currVal_96 = true;
        var currVal_97 = _ck(_v, 219, 0, '/about');
        _ck(_v, 218, 0, currVal_96, currVal_97);
        var currVal_98 = 'active-link';
        _ck(_v, 220, 0, currVal_98);
        _ck(_v, 225, 0);
        _ck(_v, 240, 0);
        _ck(_v, 247, 0);
        _ck(_v, 252, 0);
    }, function (_ck, _v) {
        var _co = _v.component;
        var currVal_0 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_24" /* ɵinlineInterpolate */](1, '', _co.theme, '');
        _ck(_v, 0, 0, currVal_0);
        var currVal_1 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 4)._enableTransitions;
        _ck(_v, 2, 0, currVal_1);
        var currVal_3 = (app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 13).disabled || null);
        _ck(_v, 11, 0, currVal_3);
        var currVal_4 = _co.title;
        _ck(_v, 23, 0, currVal_4);
        var currVal_5 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 30).disabled.toString();
        var currVal_6 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 30).disabled;
        var currVal_7 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 30).tabIndex;
        var currVal_8 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 31).target;
        var currVal_9 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 31).href;
        _ck(_v, 29, 0, currVal_5, currVal_6, currVal_7, currVal_8, currVal_9);
        var currVal_13 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 39).disabled.toString();
        var currVal_14 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 39).disabled;
        var currVal_15 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 39).tabIndex;
        var currVal_16 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 40).target;
        var currVal_17 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 40).href;
        _ck(_v, 38, 0, currVal_13, currVal_14, currVal_15, currVal_16, currVal_17);
        var currVal_21 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 48).disabled.toString();
        var currVal_22 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 48).disabled;
        var currVal_23 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 48).tabIndex;
        var currVal_24 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 49).target;
        var currVal_25 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 49).href;
        _ck(_v, 47, 0, currVal_21, currVal_22, currVal_23, currVal_24, currVal_25);
        var currVal_29 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 57).disabled.toString();
        var currVal_30 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 57).disabled;
        var currVal_31 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 57).tabIndex;
        var currVal_32 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 58).target;
        var currVal_33 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 58).href;
        _ck(_v, 56, 0, currVal_29, currVal_30, currVal_31, currVal_32, currVal_33);
        var currVal_37 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 66).disabled.toString();
        var currVal_38 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 66).disabled;
        var currVal_39 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 66).tabIndex;
        var currVal_40 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 67).target;
        var currVal_41 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 67).href;
        _ck(_v, 65, 0, currVal_37, currVal_38, currVal_39, currVal_40, currVal_41);
        var currVal_45 = null;
        var currVal_46 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 77)._isClosed;
        var currVal_47 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 77)._isClosing;
        var currVal_48 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 77)._isEnd;
        var currVal_49 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 77)._isOpened;
        var currVal_50 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 77)._isOpening;
        var currVal_51 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 77)._modeOver;
        var currVal_52 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 77)._modePush;
        var currVal_53 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 77)._modeSide;
        _ck(_v, 75, 0, currVal_45, currVal_46, currVal_47, currVal_48, currVal_49, currVal_50, currVal_51, currVal_52, currVal_53);
        var currVal_54 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 88).target;
        var currVal_55 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 88).href;
        _ck(_v, 84, 0, currVal_54, currVal_55);
        var currVal_59 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 103).target;
        var currVal_60 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 103).href;
        _ck(_v, 99, 0, currVal_59, currVal_60);
        var currVal_64 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 118).target;
        var currVal_65 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 118).href;
        _ck(_v, 114, 0, currVal_64, currVal_65);
        var currVal_69 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 138).target;
        var currVal_70 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 138).href;
        _ck(_v, 134, 0, currVal_69, currVal_70);
        var currVal_74 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 153).target;
        var currVal_75 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 153).href;
        _ck(_v, 149, 0, currVal_74, currVal_75);
        var currVal_79 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 168).target;
        var currVal_80 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 168).href;
        _ck(_v, 164, 0, currVal_79, currVal_80);
        var currVal_84 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 183).target;
        var currVal_85 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 183).href;
        _ck(_v, 179, 0, currVal_84, currVal_85);
        var currVal_89 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 203).target;
        var currVal_90 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 203).href;
        _ck(_v, 199, 0, currVal_89, currVal_90);
        var currVal_94 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 218).target;
        var currVal_95 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 218).href;
        _ck(_v, 214, 0, currVal_94, currVal_95);
        var currVal_99 = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_35" /* ɵnov */](_v, 252).StatusAnimations;
        _ck(_v, 251, 0, currVal_99);
    });
}
function View_AppComponent_Host_0(_l) {
    return app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_44" /* ɵvid */](0, [(_l()(), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_21" /* ɵeld */](0, null, null, 1, 'huewi-app-root', [], null, null, null, View_AppComponent_0, RenderType_AppComponent)), app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_19" /* ɵdid */](49152, null, 0, app_component_AppComponent, [huepi_service_HuepiService,
            app_component_ngfactory___WEBPACK_IMPORTED_MODULE_5__angular_router__["k" /* Router */]], null, null)], null, null);
}
var AppComponentNgFactory = app_component_ngfactory___WEBPACK_IMPORTED_MODULE_1__angular_core__["_16" /* ɵccf */]('huewi-app-root', app_component_AppComponent, View_AppComponent_Host_0, {}, {}, []);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2FwcC5jb21wb25lbnQubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvYXBwLmNvbXBvbmVudC50cyIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2FwcC5jb21wb25lbnQuaHRtbCIsIm5nOi8vL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2FwcC5jb21wb25lbnQudHMuQXBwQ29tcG9uZW50X0hvc3QuaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyIgIiwiPGRpdiBjbGFzcz17e3RoZW1lfX0+XG5cbjxtZC1zaWRlbmF2LWNvbnRhaW5lciBmdWxsc2NyZWVuPlxuXG4gIDxtZC10b29sYmFyIGNvbG9yPVwicHJpbWFyeVwiPlxuICAgICAgPGJ1dHRvbiBtZC1pY29uLWJ1dHRvbiAoY2xpY2spPVwic2lkZW5hdi50b2dnbGUoKVwiPlxuICAgICAgICA8bWQtaWNvbj5tZW51PC9tZC1pY29uPlxuICAgICAgPC9idXR0b24+XG4gICAgICA8c3Bhbj57e3RpdGxlfX08L3NwYW4+XG4gICAgPC9tZC10b29sYmFyPlxuXG4gIDxuYXYgbWQtdGFiLW5hdi1iYXIgI25hdmJhcj5cbiAgICA8YSBtZC10YWItbGluayBbcm91dGVyTGlua109XCJbJy9ob21lJ11cIiBbcmVwbGFjZVVybF09XCJ0cnVlXCIgcm91dGVyTGlua0FjdGl2ZT1cImFjdGl2ZS1saW5rXCI+SG9tZTwvYT5cbiAgICA8YSBtZC10YWItbGluayBbcm91dGVyTGlua109XCJbJy9ncm91cHMnXVwiIFtyZXBsYWNlVXJsXT1cInRydWVcIiByb3V0ZXJMaW5rQWN0aXZlPVwiYWN0aXZlLWxpbmtcIj5Hcm91cHM8L2E+XG4gICAgPGEgbWQtdGFiLWxpbmsgW3JvdXRlckxpbmtdPVwiWycvbGlnaHRzJ11cIiBbcmVwbGFjZVVybF09XCJ0cnVlXCIgcm91dGVyTGlua0FjdGl2ZT1cImFjdGl2ZS1saW5rXCI+TGlnaHRzPC9hPlxuICAgIDxhIG1kLXRhYi1saW5rIFtyb3V0ZXJMaW5rXT1cIlsnL2JyaWRnZXMnXVwiIFtyZXBsYWNlVXJsXT1cInRydWVcIiByb3V0ZXJMaW5rQWN0aXZlPVwiYWN0aXZlLWxpbmtcIj5CcmlkZ2VzPC9hPlxuICAgIDxhIG1kLXRhYi1saW5rIFtyb3V0ZXJMaW5rXT1cIlsnL2Fib3V0J11cIiBbcmVwbGFjZVVybF09XCJ0cnVlXCIgcm91dGVyTGlua0FjdGl2ZT1cImFjdGl2ZS1saW5rXCI+QWJvdXQ8L2E+XG4gIDwvbmF2PlxuXG4gIDxtZC1zaWRlbmF2ICNzaWRlbmF2PlxuICAgIDxtZC1uYXYtbGlzdD5cbiAgICAgIDxhIG1kLWxpc3QtaXRlbSBbcm91dGVyTGlua109XCJbJy9ob21lJ11cIiBbcmVwbGFjZVVybF09XCJ0cnVlXCIgcm91dGVyTGlua0FjdGl2ZT1cImFjdGl2ZS1saW5rXCIgKGNsaWNrKT1cInNpZGVuYXYudG9nZ2xlKClcIj48bWQtaWNvbj5ob21lPC9tZC1pY29uPkhvbWU8L2E+XG4gICAgICA8YSBtZC1saXN0LWl0ZW0gW3JvdXRlckxpbmtdPVwiWycvZ3JvdXBzJ11cIiBbcmVwbGFjZVVybF09XCJ0cnVlXCIgcm91dGVyTGlua0FjdGl2ZT1cImFjdGl2ZS1saW5rXCIgKGNsaWNrKT1cInNpZGVuYXYudG9nZ2xlKClcIj48bWQtaWNvbj5ncm91cF93b3JrPC9tZC1pY29uPkdyb3VwczwvYT5cbiAgICAgIDxhIG1kLWxpc3QtaXRlbSBbcm91dGVyTGlua109XCJbJy9saWdodHMnXVwiIFtyZXBsYWNlVXJsXT1cInRydWVcIiByb3V0ZXJMaW5rQWN0aXZlPVwiYWN0aXZlLWxpbmtcIiAoY2xpY2spPVwic2lkZW5hdi50b2dnbGUoKVwiPjxtZC1pY29uPmxpZ2h0YnVsYl9vdXRsaW5lPC9tZC1pY29uPkxpZ2h0czwvYT5cbiAgICAgIDxtZC1kaXZpZGVyPjwvbWQtZGl2aWRlcj5cbiAgICAgIDxhIG1kLWxpc3QtaXRlbSBbcm91dGVyTGlua109XCJbJy9ydWxlcyddXCIgW3JlcGxhY2VVcmxdPVwidHJ1ZVwiIHJvdXRlckxpbmtBY3RpdmU9XCJhY3RpdmUtbGlua1wiIChjbGljayk9XCJzaWRlbmF2LnRvZ2dsZSgpXCI+PG1kLWljb24+YXNzaWdubWVudDwvbWQtaWNvbj5SdWxlczwvYT5cbiAgICAgIDxhIG1kLWxpc3QtaXRlbSBbcm91dGVyTGlua109XCJbJy9zY2VuZXMnXVwiIFtyZXBsYWNlVXJsXT1cInRydWVcIiByb3V0ZXJMaW5rQWN0aXZlPVwiYWN0aXZlLWxpbmtcIiAoY2xpY2spPVwic2lkZW5hdi50b2dnbGUoKVwiPjxtZC1pY29uPmFzc2lnbm1lbnRfaW5kPC9tZC1pY29uPlNjZW5lczwvYT5cbiAgICAgIDxhIG1kLWxpc3QtaXRlbSBbcm91dGVyTGlua109XCJbJy9zY2hlZHVsZXMnXVwiIFtyZXBsYWNlVXJsXT1cInRydWVcIiByb3V0ZXJMaW5rQWN0aXZlPVwiYWN0aXZlLWxpbmtcIiAoY2xpY2spPVwic2lkZW5hdi50b2dnbGUoKVwiPjxtZC1pY29uPmFsYXJtPC9tZC1pY29uPlNjaGVkdWxlczwvYT5cbiAgICAgIDxhIG1kLWxpc3QtaXRlbSBbcm91dGVyTGlua109XCJbJy9zZW5zb3JzJ11cIiBbcmVwbGFjZVVybF09XCJ0cnVlXCIgcm91dGVyTGlua0FjdGl2ZT1cImFjdGl2ZS1saW5rXCIgKGNsaWNrKT1cInNpZGVuYXYudG9nZ2xlKClcIj48bWQtaWNvbj5hbGxfb3V0PC9tZC1pY29uPlNlbnNvcnM8L2E+XG4gICAgICA8bWQtZGl2aWRlcj48L21kLWRpdmlkZXI+XG4gICAgICA8YSBtZC1saXN0LWl0ZW0gW3JvdXRlckxpbmtdPVwiWycvYnJpZGdlcyddXCIgW3JlcGxhY2VVcmxdPVwidHJ1ZVwiIHJvdXRlckxpbmtBY3RpdmU9XCJhY3RpdmUtbGlua1wiIChjbGljayk9XCJzaWRlbmF2LnRvZ2dsZSgpXCI+PG1kLWljb24+ZGV2aWNlX2h1YjwvbWQtaWNvbj5CcmlkZ2VzPC9hPlxuICAgICAgPGEgbWQtbGlzdC1pdGVtIFtyb3V0ZXJMaW5rXT1cIlsnL2Fib3V0J11cIiBbcmVwbGFjZVVybF09XCJ0cnVlXCIgcm91dGVyTGlua0FjdGl2ZT1cImFjdGl2ZS1saW5rXCIgKGNsaWNrKT1cInNpZGVuYXYudG9nZ2xlKClcIj48bWQtaWNvbj5pbmZvPC9tZC1pY29uPkFib3V0PC9hPlxuICAgICAgPG1kLWRpdmlkZXI+PC9tZC1kaXZpZGVyPlxuICAgICAgPGEgbWQtbGlzdC1pdGVtIChjbGljayk9XCJ0b2dnbGVUaGVtZSgpXCI+PG1kLWljb24+aW52ZXJ0X2NvbG9yczwvbWQtaWNvbj5UaGVtZTwvYT5cbiAgICA8L21kLW5hdi1saXN0PlxuICA8L21kLXNpZGVuYXY+XG5cbiAgPHJvdXRlci1vdXRsZXQ+XG4gIDwvcm91dGVyLW91dGxldD5cblxuPC9tZC1zaWRlbmF2LWNvbnRhaW5lcj5cblxuPGh1ZXdpLWNvbm5lY3Rpb25zdGF0dXM+XG48L2h1ZXdpLWNvbm5lY3Rpb25zdGF0dXM+XG5cbjwvZGl2PiA8IS0tZGl2IGNsYXNzPXt7dGhlbWV9fS0tPiIsIjxodWV3aS1hcHAtcm9vdD48L2h1ZXdpLWFwcC1yb290PiJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkNBQTtNQUFBO01BQXFCLHlDQUVyQjtVQUFBO2NBQUE7dUVBQUEsVUFBQTtVQUFBOzJCQUFBLHNDQUFBO1VBQUE7dUJBQUE7TUFBaUMsK0JBRS9CO1VBQUE7VUFBQTthQUFBO3VCQUFBLHNDQUFBO1VBQUE7TUFBNEIsaUNBQ3hCO1VBQUE7Y0FBQTtZQUFBO1lBQXVCO2NBQUE7Y0FBQTtZQUFBO1lBQXZCO1VBQUEscURBQUE7VUFBQTtVQUFBLG9DQUFBO1VBQUE7VUFBQSxzQkFBQTtVQUFBLDJDQUFrRDtNQUNoRDtVQUFBO2FBQUE7dUJBQUEsc0NBQUE7VUFBQTtVQUFBLDZCQUFTLDZCQUFjO1VBQUEsZUFDaEIsaUNBQ1Q7VUFBQTtVQUFBLGdCQUFNLHdDQUFnQjtVQUFBLGFBQ1gsK0JBRWY7VUFBQTtVQUFBO2FBQUE7VUFBQSw2QkFBNEIsK0JBQzFCO1VBQUE7Y0FBQTtjQUFBO1VBQUE7WUFBQTtZQUFBO2NBQUE7a0JBQUE7Y0FBQTtZQUFBO1lBQUE7VUFBQSx1Q0FBQTtVQUFBO1VBQUEsb0NBQUE7VUFBQTtjQUFBLG1EQUFlLFdBQWY7VUFBQTtrQ0FBQTthQUFBLGdFQUEyRjtpQkFBQSwwQkFBUSwrQkFDbkc7aUJBQUE7Y0FBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7a0JBQUE7Y0FBQTtZQUFBO1lBQUE7VUFBQSx1Q0FBQTtVQUFBO1VBQUEsb0NBQUE7VUFBQTtjQUFBLG1EQUFlLFdBQWY7VUFBQTtrQ0FBQTthQUFBLGdFQUE2RjtpQkFBQSw0QkFBVSwrQkFDdkc7aUJBQUE7Y0FBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7a0JBQUE7Y0FBQTtZQUFBO1lBQUE7VUFBQSx1Q0FBQTtVQUFBO1VBQUEsb0NBQUE7VUFBQTtjQUFBLG1EQUFlLFdBQWY7VUFBQTtrQ0FBQTthQUFBLGdFQUE2RjtpQkFBQSw0QkFBVSwrQkFDdkc7aUJBQUE7Y0FBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7a0JBQUE7Y0FBQTtZQUFBO1lBQUE7VUFBQSx1Q0FBQTtVQUFBO1VBQUEsb0NBQUE7VUFBQTtjQUFBLG1EQUFlLFdBQWY7VUFBQTtrQ0FBQTthQUFBLGdFQUE4RjtpQkFBQSw2QkFBVywrQkFDekc7aUJBQUE7Y0FBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7a0JBQUE7Y0FBQTtZQUFBO1lBQUE7VUFBQSx1Q0FBQTtVQUFBO1VBQUEsb0NBQUE7VUFBQTtjQUFBLG1EQUFlLFdBQWY7VUFBQTtrQ0FBQTthQUFBLGtFQUE0RjtpQkFBQSwyQkFBUyw2QkFDakc7VUFBQSxhQUVOO1VBQUE7VUFBQTtVQUFBO1VBQUE7VUFBQTtVQUFBO1FBQUE7UUFBQTtVQUFBO1VBQUE7UUFBQTtRQUFBO1VBQUE7VUFBQTtRQUFBO1FBQUE7TUFBQSx1REFBQTtVQUFBO1VBQUEsb0NBQUE7VUFBQTtNQUFxQiwrQkFDbkI7VUFBQTsrQ0FBQSxVQUFBO1VBQUE7YUFBQTthQUFBO1VBQUEsZUFBYSxpQ0FDWDtVQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7a0JBQUE7Y0FBQTtZQUFBO1lBQTRGO2NBQUE7Y0FBQTtZQUFBO1lBQTVGO1VBQUEseURBQUE7VUFBQTtVQUFBO1VBQUEsMEJBQUE7K0NBQUE7VUFBQSxxQ0FBZ0IsV0FBaEI7OEJBQUE7VUFBQTtVQUFBLHVEQUF1SDtVQUFBO1VBQUEsMkVBQUE7VUFBQTsyQkFBQSxzQ0FBQTtVQUFBO1VBQUEsNkJBQVMsNkJBQWM7VUFBQSxXQUFRLGlDQUN0SjtVQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7a0JBQUE7Y0FBQTtZQUFBO1lBQThGO2NBQUE7Y0FBQTtZQUFBO1lBQTlGO1VBQUEseURBQUE7VUFBQTtVQUFBO1VBQUEsMEJBQUE7K0NBQUE7VUFBQSxxQ0FBZ0IsV0FBaEI7OEJBQUE7VUFBQTtVQUFBLHVEQUF5SDtVQUFBO1VBQUEsMkVBQUE7VUFBQTsyQkFBQSxzQ0FBQTtVQUFBO1VBQUEsNkJBQVMsbUNBQW9CO2lCQUFBLGdCQUFVLGlDQUNoSztVQUFBO2NBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtrQkFBQTtjQUFBO1lBQUE7WUFBOEY7Y0FBQTtjQUFBO1lBQUE7WUFBOUY7VUFBQSx5REFBQTtVQUFBO1VBQUE7VUFBQSwwQkFBQTsrQ0FBQTtVQUFBLHFDQUFnQixXQUFoQjs4QkFBQTtVQUFBO1VBQUEsdURBQXlIO1VBQUE7VUFBQSwyRUFBQTtVQUFBOzJCQUFBLHNDQUFBO1VBQUE7VUFBQSw2QkFBUywwQ0FBMkI7aUJBQUEsZ0JBQVUsaUNBQ3ZLO1VBQUE7Y0FBQTtVQUFBLHFDQUFBO1VBQUE7YUFBQTthQUFBO1VBQUEsZUFBeUIsaUNBQ3pCO1VBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtrQkFBQTtjQUFBO1lBQUE7WUFBNkY7Y0FBQTtjQUFBO1lBQUE7WUFBN0Y7VUFBQSx5REFBQTtVQUFBO1VBQUE7VUFBQSwwQkFBQTsrQ0FBQTtVQUFBLHFDQUFnQixXQUFoQjs4QkFBQTtVQUFBO1VBQUEsdURBQXdIO1VBQUE7VUFBQSwyRUFBQTtVQUFBOzJCQUFBLHNDQUFBO1VBQUE7VUFBQSw2QkFBUyxtQ0FBb0I7aUJBQUEsZUFBUyxpQ0FDOUo7VUFBQTtjQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7a0JBQUE7Y0FBQTtZQUFBO1lBQThGO2NBQUE7Y0FBQTtZQUFBO1lBQTlGO1VBQUEseURBQUE7VUFBQTtVQUFBO1VBQUEsMEJBQUE7K0NBQUE7VUFBQSxxQ0FBZ0IsV0FBaEI7OEJBQUE7VUFBQTtVQUFBLHVEQUF5SDtVQUFBO1VBQUEsMkVBQUE7VUFBQTsyQkFBQSxzQ0FBQTtVQUFBO1VBQUEsNkJBQVMsdUNBQXdCO2lCQUFBLGdCQUFVLGlDQUNwSztVQUFBO2NBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtrQkFBQTtjQUFBO1lBQUE7WUFBaUc7Y0FBQTtjQUFBO1lBQUE7WUFBakc7VUFBQSx5REFBQTtVQUFBO1VBQUE7VUFBQSwwQkFBQTsrQ0FBQTtVQUFBLHFDQUFnQixXQUFoQjs4QkFBQTtVQUFBO1VBQUEsdURBQTRIO1VBQUE7VUFBQSwyRUFBQTtVQUFBOzJCQUFBLHNDQUFBO1VBQUE7VUFBQSw2QkFBUyw4QkFBZTtVQUFBLGdCQUFhLGlDQUNqSztVQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7a0JBQUE7Y0FBQTtZQUFBO1lBQStGO2NBQUE7Y0FBQTtZQUFBO1lBQS9GO1VBQUEseURBQUE7VUFBQTtVQUFBO1VBQUEsMEJBQUE7K0NBQUE7VUFBQSxxQ0FBZ0IsV0FBaEI7OEJBQUE7VUFBQTtVQUFBLHVEQUEwSDtVQUFBO1VBQUEsMkVBQUE7VUFBQTsyQkFBQSxzQ0FBQTtVQUFBO1VBQUEsNkJBQVMsZ0NBQWlCO1VBQUEsY0FBVyxpQ0FDL0o7VUFBQTtjQUFBO1VBQUEsdUJBQUE7dUJBQUEsc0NBQUE7VUFBQSxxRUFBQTtVQUFBO01BQXlCLGlDQUN6QjtVQUFBO1VBQUE7VUFBQTtRQUFBO1FBQUE7VUFBQTtVQUFBO1FBQUE7UUFBQTtVQUFBO1VBQUE7UUFBQTtRQUFBO1VBQUE7Y0FBQTtVQUFBO1FBQUE7UUFBK0Y7VUFBQTtVQUFBO1FBQUE7UUFBL0Y7TUFBQSx5REFBQTtVQUFBO1VBQUE7VUFBQSwwQkFBQTsrQ0FBQTtVQUFBLHFDQUFnQixXQUFoQjs4QkFBQTtVQUFBO1VBQUEsdURBQTBIO1VBQUE7VUFBQSwyRUFBQTtVQUFBOzJCQUFBLHNDQUFBO1VBQUE7VUFBQSw2QkFBUyxtQ0FBb0I7aUJBQUEsaUJBQVcsaUNBQ2xLO1VBQUE7Y0FBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQUE7Y0FBQTtjQUFBO1lBQUE7WUFBQTtjQUFBO2tCQUFBO2NBQUE7WUFBQTtZQUE2RjtjQUFBO2NBQUE7WUFBQTtZQUE3RjtVQUFBLHlEQUFBO1VBQUE7VUFBQTtVQUFBLDBCQUFBOytDQUFBO1VBQUEscUNBQWdCLFdBQWhCOzhCQUFBO1VBQUE7VUFBQSx1REFBd0g7VUFBQTtVQUFBLDJFQUFBO1VBQUE7MkJBQUEsc0NBQUE7VUFBQTtVQUFBLDZCQUFTLDZCQUFjO1VBQUEsWUFBUyxpQ0FDeEo7VUFBQTtjQUFBO1VBQUEsdUJBQUE7dUJBQUEsc0NBQUE7VUFBQSxxRUFBQTtVQUFBO01BQXlCLGlDQUN6QjtVQUFBO1VBQUE7VUFBQTtZQUFBO1lBQUE7WUFBQTtjQUFBO2NBQUE7WUFBQTtZQUFBO2NBQUE7Y0FBQTtZQUFBO1lBQWdCO2NBQUE7Y0FBQTtZQUFBO1lBQWhCO1VBQUEseURBQUE7VUFBQTtVQUFBO1VBQUEsbUJBQXdDO1VBQUE7OEJBQUEsVUFBQTtVQUFBO2FBQUE7VUFBQSxnREFBUztNQUF1Qiw4QkFBUywrQkFDckU7VUFBQSxXQUNILCtCQUViO1VBQUE7VUFBQSxxQ0FBQTtVQUFBO2NBQUE7TUFBZSx5Q0FDQyw2QkFFSztpQkFBQSwwQkFFdkI7VUFBQTtVQUFBO2FBQUE7VUFBQSw2QkFBd0IsdUNBQ0M7aUJBQUEsMEJBRW5COztRQXpDUTtRQUFaLFdBQVksU0FBWjtRQUVNO1FBTW9DO1FBQXpCO1FBQWYsWUFBd0MsV0FBekIsVUFBZjtRQUE0RDtRQUE1RCxZQUE0RCxVQUE1RDtRQUMwQztRQUEzQjtRQUFmLFlBQTBDLFdBQTNCLFVBQWY7UUFBOEQ7UUFBOUQsWUFBOEQsVUFBOUQ7UUFDMEM7UUFBM0I7UUFBZixZQUEwQyxXQUEzQixVQUFmO1FBQThEO1FBQTlELFlBQThELFVBQTlEO1FBQzJDO1FBQTVCO1FBQWYsWUFBMkMsV0FBNUIsVUFBZjtRQUErRDtRQUEvRCxZQUErRCxVQUEvRDtRQUN5QztRQUExQjtRQUFmLFlBQXlDLFdBQTFCLFVBQWY7UUFBNkQ7UUFBN0QsWUFBNkQsVUFBN0Q7UUFLMkM7UUFBekI7UUFBaEIsWUFBeUMsV0FBekIsVUFBaEI7UUFBNkQ7UUFBN0QsWUFBNkQsVUFBN0Q7UUFBdUg7UUFDNUU7UUFBM0I7UUFBaEIsYUFBMkMsV0FBM0IsVUFBaEI7UUFBK0Q7UUFBL0QsYUFBK0QsVUFBL0Q7UUFBeUg7UUFDOUU7UUFBM0I7UUFBaEIsYUFBMkMsV0FBM0IsVUFBaEI7UUFBK0Q7UUFBL0QsYUFBK0QsVUFBL0Q7UUFBeUg7UUFFL0U7UUFBMUI7UUFBaEIsYUFBMEMsV0FBMUIsVUFBaEI7UUFBOEQ7UUFBOUQsYUFBOEQsVUFBOUQ7UUFBd0g7UUFDN0U7UUFBM0I7UUFBaEIsYUFBMkMsV0FBM0IsVUFBaEI7UUFBK0Q7UUFBL0QsYUFBK0QsVUFBL0Q7UUFBeUg7UUFDM0U7UUFBOUI7UUFBaEIsYUFBOEMsV0FBOUIsVUFBaEI7UUFBa0U7UUFBbEUsYUFBa0UsVUFBbEU7UUFBNEg7UUFDaEY7UUFBNUI7UUFBaEIsYUFBNEMsV0FBNUIsVUFBaEI7UUFBZ0U7UUFBaEUsYUFBZ0UsVUFBaEU7UUFBMEg7UUFFOUU7UUFBNUI7UUFBaEIsYUFBNEMsV0FBNUIsVUFBaEI7UUFBZ0U7UUFBaEUsYUFBZ0UsVUFBaEU7UUFBMEg7UUFDaEY7UUFBMUI7UUFBaEIsYUFBMEMsV0FBMUIsVUFBaEI7UUFBOEQ7UUFBOUQsYUFBOEQsVUFBOUQ7UUFBd0g7UUFFaEY7UUFJNUM7UUFLRjs7O1FBMUNLO1FBQUwsV0FBSyxTQUFMO1FBRUE7UUFBQSxXQUFBLFNBQUE7UUFHTTtRQUFBLFlBQUEsU0FBQTtRQUdNO1FBQUE7UUFJUjtRQUFBO1FBQUE7UUFBQTtRQUFBO1FBQUEsWUFBQSw4QkFBQSxtQkFBQTtRQUNBO1FBQUE7UUFBQTtRQUFBO1FBQUE7UUFBQSxZQUFBLGlDQUFBLHFCQUFBO1FBQ0E7UUFBQTtRQUFBO1FBQUE7UUFBQTtRQUFBLFlBQUEsaUNBQUEscUJBQUE7UUFDQTtRQUFBO1FBQUE7UUFBQTtRQUFBO1FBQUEsWUFBQSxpQ0FBQSxxQkFBQTtRQUNBO1FBQUE7UUFBQTtRQUFBO1FBQUE7UUFBQSxZQUFBLGlDQUFBLHFCQUFBO1FBR0Y7UUFBQTtRQUFBO1FBQUE7UUFBQTtRQUFBO1FBQUE7UUFBQTtRQUFBO1FBQUEsWUFBQTtZQUFBLGdDQUFBO1FBRUk7UUFBQTtRQUFBLFlBQUEscUJBQUE7UUFDQTtRQUFBO1FBQUEsWUFBQSxxQkFBQTtRQUNBO1FBQUE7UUFBQSxhQUFBLHFCQUFBO1FBRUE7UUFBQTtRQUFBLGFBQUEscUJBQUE7UUFDQTtRQUFBO1FBQUEsYUFBQSxxQkFBQTtRQUNBO1FBQUE7UUFBQSxhQUFBLHFCQUFBO1FBQ0E7UUFBQTtRQUFBLGFBQUEscUJBQUE7UUFFQTtRQUFBO1FBQUEsYUFBQSxxQkFBQTtRQUNBO1FBQUE7UUFBQSxhQUFBLHFCQUFBO1FBV047UUFBQSxhQUFBLFVBQUE7Ozs7b0JDMUNBO01BQUE7NkJBQUEsVUFBQTtlQUFBOzs7In0=
//# sourceMappingURL=app.component.ngfactory.js.map
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
    { path: 'home', component: HuewiHomeComponent },
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
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_20__angular_cdk__ = __webpack_require__("p4Sk");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_21__angular_forms__ = __webpack_require__("bm2B");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_22__angular_http__ = __webpack_require__("CPp0");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_23__angular_router__ = __webpack_require__("BkNc");
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
/* tslint:disable */



















































var AppModuleNgFactory = __WEBPACK_IMPORTED_MODULE_0__angular_core__["_17" /* ɵcmf */](AppModule, [app_component_AppComponent], function (_l) {
    return __WEBPACK_IMPORTED_MODULE_0__angular_core__["_32" /* ɵmod */]([__WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* ComponentFactoryResolver */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["_13" /* ɵCodegenComponentFactoryResolver */], [[8, [__WEBPACK_IMPORTED_MODULE_3__gendir_node_modules_angular_material_typings_index_ngfactory__["b" /* MdDialogContainerNgFactory */], __WEBPACK_IMPORTED_MODULE_3__gendir_node_modules_angular_material_typings_index_ngfactory__["a" /* MdDatepickerContentNgFactory */], __WEBPACK_IMPORTED_MODULE_3__gendir_node_modules_angular_material_typings_index_ngfactory__["r" /* TooltipComponentNgFactory */],
                    __WEBPACK_IMPORTED_MODULE_3__gendir_node_modules_angular_material_typings_index_ngfactory__["c" /* MdSnackBarContainerNgFactory */], __WEBPACK_IMPORTED_MODULE_3__gendir_node_modules_angular_material_typings_index_ngfactory__["q" /* SimpleSnackBarNgFactory */], HuewiGroupsComponentNgFactory,
                    HuewiLightsComponentNgFactory, HuewiRulesComponentNgFactory, HuewiScenesComponentNgFactory,
                    HuewiSchedulesComponentNgFactory, HuewiSensorsComponentNgFactory,
                    HuewiBridgesComponentNgFactory, HuewiHomeComponentNgFactory, HuewiAboutComponentNgFactory,
                    AppComponentNgFactory]], [3, __WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* ComponentFactoryResolver */]], __WEBPACK_IMPORTED_MODULE_0__angular_core__["H" /* NgModuleRef */]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_0__angular_core__["D" /* LOCALE_ID */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["_31" /* ɵm */], [[3, __WEBPACK_IMPORTED_MODULE_0__angular_core__["D" /* LOCALE_ID */]]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_14__angular_common__["m" /* NgLocalization */], __WEBPACK_IMPORTED_MODULE_14__angular_common__["l" /* NgLocaleLocalization */], [__WEBPACK_IMPORTED_MODULE_0__angular_core__["D" /* LOCALE_ID */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_0__angular_core__["c" /* APP_ID */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["_22" /* ɵf */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_0__angular_core__["B" /* IterableDiffers */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["_28" /* ɵk */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_0__angular_core__["C" /* KeyValueDiffers */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["_29" /* ɵl */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["c" /* DomSanitizer */], __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["t" /* ɵe */], [__WEBPACK_IMPORTED_MODULE_14__angular_common__["c" /* DOCUMENT */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](6144, __WEBPACK_IMPORTED_MODULE_0__angular_core__["T" /* Sanitizer */], null, [__WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["c" /* DomSanitizer */]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["f" /* HAMMER_GESTURE_CONFIG */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["h" /* GestureConfig */], []),
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
            __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["b" /* DOCUMENT */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](6144, __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["o" /* DIR_DOCUMENT */], null, [__WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["b" /* DOCUMENT */]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["q" /* Directionality */], __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["q" /* Directionality */], [[2, __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["o" /* DIR_DOCUMENT */]]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["L" /* Platform */], __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["L" /* Platform */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_86" /* ScrollDispatcher */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_96" /* ɵe */], [[3, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_86" /* ScrollDispatcher */]], __WEBPACK_IMPORTED_MODULE_0__angular_core__["J" /* NgZone */], __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["L" /* Platform */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_93" /* ViewportRuler */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_95" /* ɵc */], [[3, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_93" /* ViewportRuler */]], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_86" /* ScrollDispatcher */]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_87" /* ScrollStrategyOptions */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_87" /* ScrollStrategyOptions */], [__WEBPACK_IMPORTED_MODULE_16__angular_material__["_86" /* ScrollDispatcher */],
            __WEBPACK_IMPORTED_MODULE_16__angular_material__["_93" /* ViewportRuler */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_82" /* OverlayContainer */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_94" /* ɵa */], [[3, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_82" /* OverlayContainer */]]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_99" /* ɵt */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_99" /* ɵt */], [__WEBPACK_IMPORTED_MODULE_16__angular_material__["_93" /* ViewportRuler */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_81" /* Overlay */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_81" /* Overlay */], [__WEBPACK_IMPORTED_MODULE_16__angular_material__["_87" /* ScrollStrategyOptions */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_82" /* OverlayContainer */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* ComponentFactoryResolver */],
            __WEBPACK_IMPORTED_MODULE_16__angular_material__["_99" /* ɵt */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["g" /* ApplicationRef */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["z" /* Injector */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["J" /* NgZone */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_16__angular_material__["g" /* FocusOriginMonitor */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["f" /* FOCUS_ORIGIN_MONITOR_PROVIDER_FACTORY */], [[3, __WEBPACK_IMPORTED_MODULE_16__angular_material__["g" /* FocusOriginMonitor */]],
            __WEBPACK_IMPORTED_MODULE_0__angular_core__["J" /* NgZone */], __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["L" /* Platform */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_21__angular_forms__["m" /* ɵi */], __WEBPACK_IMPORTED_MODULE_21__angular_forms__["m" /* ɵi */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_92" /* UniqueSelectionDispatcher */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_97" /* ɵh */], [[3, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_92" /* UniqueSelectionDispatcher */]]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["G" /* MdMutationObserverFactory */], __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["G" /* MdMutationObserverFactory */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["z" /* InteractivityChecker */], __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["z" /* InteractivityChecker */], [__WEBPACK_IMPORTED_MODULE_20__angular_cdk__["L" /* Platform */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["w" /* FocusTrapFactory */], __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["w" /* FocusTrapFactory */], [__WEBPACK_IMPORTED_MODULE_20__angular_cdk__["z" /* InteractivityChecker */], __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["L" /* Platform */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["J" /* NgZone */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["F" /* LiveAnnouncer */], __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["D" /* LIVE_ANNOUNCER_PROVIDER_FACTORY */], [[3, __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["F" /* LiveAnnouncer */]], [2, __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["B" /* LIVE_ANNOUNCER_ELEMENT_TOKEN */]],
            __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["L" /* Platform */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_16__angular_material__["W" /* MdDialog */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["W" /* MdDialog */], [__WEBPACK_IMPORTED_MODULE_16__angular_material__["_81" /* Overlay */],
            __WEBPACK_IMPORTED_MODULE_0__angular_core__["z" /* Injector */], [2, __WEBPACK_IMPORTED_MODULE_14__angular_common__["g" /* Location */]], [3, __WEBPACK_IMPORTED_MODULE_16__angular_material__["W" /* MdDialog */]]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_16__angular_material__["T" /* MdDatepickerIntl */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["T" /* MdDatepickerIntl */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_10" /* MdIconRegistry */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["i" /* ICON_REGISTRY_PROVIDER_FACTORY */], [[3, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_10" /* MdIconRegistry */]], [2, __WEBPACK_IMPORTED_MODULE_22__angular_http__["a" /* Http */]],
            __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["c" /* DomSanitizer */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_100" /* ɵx */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_100" /* ɵx */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_54" /* MdSnackBar */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_54" /* MdSnackBar */], [__WEBPACK_IMPORTED_MODULE_16__angular_material__["_81" /* Overlay */], __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["F" /* LiveAnnouncer */], [3, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_54" /* MdSnackBar */]]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_59" /* MdSortHeaderIntl */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_59" /* MdSortHeaderIntl */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_23__angular_router__["a" /* ActivatedRoute */], __WEBPACK_IMPORTED_MODULE_23__angular_router__["x" /* ɵf */], [__WEBPACK_IMPORTED_MODULE_23__angular_router__["k" /* Router */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_23__angular_router__["d" /* NoPreloading */], __WEBPACK_IMPORTED_MODULE_23__angular_router__["d" /* NoPreloading */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](6144, __WEBPACK_IMPORTED_MODULE_23__angular_router__["f" /* PreloadingStrategy */], null, [__WEBPACK_IMPORTED_MODULE_23__angular_router__["d" /* NoPreloading */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](135680, __WEBPACK_IMPORTED_MODULE_23__angular_router__["p" /* RouterPreloader */], __WEBPACK_IMPORTED_MODULE_23__angular_router__["p" /* RouterPreloader */], [__WEBPACK_IMPORTED_MODULE_23__angular_router__["k" /* Router */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["G" /* NgModuleFactoryLoader */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["k" /* Compiler */],
            __WEBPACK_IMPORTED_MODULE_0__angular_core__["z" /* Injector */], __WEBPACK_IMPORTED_MODULE_23__angular_router__["f" /* PreloadingStrategy */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](4608, __WEBPACK_IMPORTED_MODULE_23__angular_router__["e" /* PreloadAllModules */], __WEBPACK_IMPORTED_MODULE_23__angular_router__["e" /* PreloadAllModules */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_23__angular_router__["h" /* ROUTER_INITIALIZER */], __WEBPACK_IMPORTED_MODULE_23__angular_router__["A" /* ɵi */], [__WEBPACK_IMPORTED_MODULE_23__angular_router__["y" /* ɵg */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](5120, __WEBPACK_IMPORTED_MODULE_0__angular_core__["b" /* APP_BOOTSTRAP_LISTENER */], function (p0_0) {
            return [p0_0];
        }, [__WEBPACK_IMPORTED_MODULE_23__angular_router__["h" /* ROUTER_INITIALIZER */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](135680, huepi_service_HuepiService, huepi_service_HuepiService, [__WEBPACK_IMPORTED_MODULE_23__angular_router__["k" /* Router */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_14__angular_common__["b" /* CommonModule */], __WEBPACK_IMPORTED_MODULE_14__angular_common__["b" /* CommonModule */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](1024, __WEBPACK_IMPORTED_MODULE_0__angular_core__["r" /* ErrorHandler */], __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["r" /* ɵa */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](1024, __WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgProbeToken */], function () {
            return [__WEBPACK_IMPORTED_MODULE_23__angular_router__["t" /* ɵb */]()];
        }, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_23__angular_router__["y" /* ɵg */], __WEBPACK_IMPORTED_MODULE_23__angular_router__["y" /* ɵg */], [__WEBPACK_IMPORTED_MODULE_0__angular_core__["z" /* Injector */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](1024, __WEBPACK_IMPORTED_MODULE_0__angular_core__["d" /* APP_INITIALIZER */], function (p0_0, p0_1, p1_0) {
            return [__WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["s" /* ɵc */](p0_0, p0_1), __WEBPACK_IMPORTED_MODULE_23__angular_router__["z" /* ɵh */](p1_0)];
        }, [[2, __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["i" /* NgProbeToken */]], [2, __WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgProbeToken */]], __WEBPACK_IMPORTED_MODULE_23__angular_router__["y" /* ɵg */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_0__angular_core__["e" /* ApplicationInitStatus */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["e" /* ApplicationInitStatus */], [[2, __WEBPACK_IMPORTED_MODULE_0__angular_core__["d" /* APP_INITIALIZER */]]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](131584, __WEBPACK_IMPORTED_MODULE_0__angular_core__["_20" /* ɵe */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["_20" /* ɵe */], [__WEBPACK_IMPORTED_MODULE_0__angular_core__["J" /* NgZone */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["_14" /* ɵConsole */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["z" /* Injector */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["r" /* ErrorHandler */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* ComponentFactoryResolver */],
            __WEBPACK_IMPORTED_MODULE_0__angular_core__["e" /* ApplicationInitStatus */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](2048, __WEBPACK_IMPORTED_MODULE_0__angular_core__["g" /* ApplicationRef */], null, [__WEBPACK_IMPORTED_MODULE_0__angular_core__["_20" /* ɵe */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_0__angular_core__["f" /* ApplicationModule */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["f" /* ApplicationModule */], [__WEBPACK_IMPORTED_MODULE_0__angular_core__["g" /* ApplicationRef */]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["a" /* BrowserModule */], __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["a" /* BrowserModule */], [[3, __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["a" /* BrowserModule */]]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_18__angular_platform_browser_animations__["a" /* BrowserAnimationsModule */], __WEBPACK_IMPORTED_MODULE_18__angular_platform_browser_animations__["a" /* BrowserAnimationsModule */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["c" /* CompatibilityModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["c" /* CompatibilityModule */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["c" /* BidiModule */], __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["c" /* BidiModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](256, __WEBPACK_IMPORTED_MODULE_16__angular_material__["k" /* MATERIAL_SANITY_CHECKS */], true, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["P" /* MdCommonModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["P" /* MdCommonModule */], [[2, __WEBPACK_IMPORTED_MODULE_15__angular_platform_browser__["b" /* DOCUMENT */]], [2, __WEBPACK_IMPORTED_MODULE_16__angular_material__["k" /* MATERIAL_SANITY_CHECKS */]]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["M" /* PlatformModule */], __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["M" /* PlatformModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_85" /* ScrollDispatchModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_85" /* ScrollDispatchModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_42" /* MdRippleModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_42" /* MdRippleModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_46" /* MdSelectionModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_46" /* MdSelectionModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_28" /* MdOptionModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_28" /* MdOptionModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["O" /* PortalModule */], __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["O" /* PortalModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_83" /* OverlayModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_83" /* OverlayModule */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["v" /* MdAutocompleteModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["v" /* MdAutocompleteModule */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_90" /* StyleModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_90" /* StyleModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["y" /* MdButtonModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["y" /* MdButtonModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_21__angular_forms__["l" /* ɵba */], __WEBPACK_IMPORTED_MODULE_21__angular_forms__["l" /* ɵba */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_21__angular_forms__["d" /* FormsModule */], __WEBPACK_IMPORTED_MODULE_21__angular_forms__["d" /* FormsModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["C" /* MdButtonToggleModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["C" /* MdButtonToggleModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["H" /* MdCardModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["H" /* MdCardModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["O" /* MdChipsModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["O" /* MdChipsModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["I" /* ObserveContentModule */], __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["I" /* ObserveContentModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["M" /* MdCheckboxModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["M" /* MdCheckboxModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["a" /* A11yModule */], __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["a" /* A11yModule */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["Y" /* MdDialogModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["Y" /* MdDialogModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["U" /* MdDatepickerModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["U" /* MdDatepickerModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["m" /* CdkTableModule */], __WEBPACK_IMPORTED_MODULE_20__angular_cdk__["m" /* CdkTableModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_70" /* MdTableModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_70" /* MdTableModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_0" /* MdExpansionModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_0" /* MdExpansionModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_15" /* MdLineModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_15" /* MdLineModule */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_4" /* MdGridListModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_4" /* MdGridListModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_9" /* MdIconModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_9" /* MdIconModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_14" /* MdInputModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_14" /* MdInputModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_19" /* MdListModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_19" /* MdListModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_22" /* MdMenuModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_22" /* MdMenuModule */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_45" /* MdSelectModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_45" /* MdSelectModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_76" /* MdTooltipModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_76" /* MdTooltipModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_30" /* MdPaginatorModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_30" /* MdPaginatorModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_33" /* MdProgressBarModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_33" /* MdProgressBarModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_35" /* MdProgressSpinnerModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_35" /* MdProgressSpinnerModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_39" /* MdRadioModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_39" /* MdRadioModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_49" /* MdSidenavModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_49" /* MdSidenavModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_53" /* MdSliderModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_53" /* MdSliderModule */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_51" /* MdSlideToggleModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_51" /* MdSlideToggleModule */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_56" /* MdSnackBarModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_56" /* MdSnackBarModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_60" /* MdSortModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_60" /* MdSortModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_71" /* MdTabsModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_71" /* MdTabsModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["_73" /* MdToolbarModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["_73" /* MdToolbarModule */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_16__angular_material__["r" /* MaterialModule */], __WEBPACK_IMPORTED_MODULE_16__angular_material__["r" /* MaterialModule */], []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, OrderByModule, OrderByModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, FilterModule, FilterModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](1024, __WEBPACK_IMPORTED_MODULE_23__angular_router__["s" /* ɵa */], __WEBPACK_IMPORTED_MODULE_23__angular_router__["v" /* ɵd */], [[3, __WEBPACK_IMPORTED_MODULE_23__angular_router__["k" /* Router */]]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_23__angular_router__["r" /* UrlSerializer */], __WEBPACK_IMPORTED_MODULE_23__angular_router__["c" /* DefaultUrlSerializer */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_23__angular_router__["b" /* ChildrenOutletContexts */], __WEBPACK_IMPORTED_MODULE_23__angular_router__["b" /* ChildrenOutletContexts */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](256, __WEBPACK_IMPORTED_MODULE_23__angular_router__["g" /* ROUTER_CONFIGURATION */], { useHash: true }, []),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](1024, __WEBPACK_IMPORTED_MODULE_14__angular_common__["h" /* LocationStrategy */], __WEBPACK_IMPORTED_MODULE_23__angular_router__["u" /* ɵc */], [__WEBPACK_IMPORTED_MODULE_14__angular_common__["s" /* PlatformLocation */], [2, __WEBPACK_IMPORTED_MODULE_14__angular_common__["a" /* APP_BASE_HREF */]],
            __WEBPACK_IMPORTED_MODULE_23__angular_router__["g" /* ROUTER_CONFIGURATION */]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_14__angular_common__["g" /* Location */], __WEBPACK_IMPORTED_MODULE_14__angular_common__["g" /* Location */], [__WEBPACK_IMPORTED_MODULE_14__angular_common__["h" /* LocationStrategy */]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_0__angular_core__["k" /* Compiler */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["k" /* Compiler */], []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_0__angular_core__["G" /* NgModuleFactoryLoader */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["X" /* SystemJsNgModuleLoader */], [__WEBPACK_IMPORTED_MODULE_0__angular_core__["k" /* Compiler */], [2, __WEBPACK_IMPORTED_MODULE_0__angular_core__["Y" /* SystemJsNgModuleLoaderConfig */]]]),
        __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](1024, __WEBPACK_IMPORTED_MODULE_23__angular_router__["i" /* ROUTES */], function () {
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
                        component: HuewiHomeComponent }, { path: 'about', component: HuewiAboutComponent },
                    { path: '', redirectTo: '/home', pathMatch: 'full' }, { path: '**', redirectTo: '/home' }]];
        }, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](1024, __WEBPACK_IMPORTED_MODULE_23__angular_router__["k" /* Router */], __WEBPACK_IMPORTED_MODULE_23__angular_router__["w" /* ɵe */], [__WEBPACK_IMPORTED_MODULE_0__angular_core__["g" /* ApplicationRef */], __WEBPACK_IMPORTED_MODULE_23__angular_router__["r" /* UrlSerializer */],
            __WEBPACK_IMPORTED_MODULE_23__angular_router__["b" /* ChildrenOutletContexts */], __WEBPACK_IMPORTED_MODULE_14__angular_common__["g" /* Location */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["z" /* Injector */], __WEBPACK_IMPORTED_MODULE_0__angular_core__["G" /* NgModuleFactoryLoader */],
            __WEBPACK_IMPORTED_MODULE_0__angular_core__["k" /* Compiler */], __WEBPACK_IMPORTED_MODULE_23__angular_router__["i" /* ROUTES */], __WEBPACK_IMPORTED_MODULE_23__angular_router__["g" /* ROUTER_CONFIGURATION */], [2, __WEBPACK_IMPORTED_MODULE_23__angular_router__["q" /* UrlHandlingStrategy */]],
            [2, __WEBPACK_IMPORTED_MODULE_23__angular_router__["j" /* RouteReuseStrategy */]]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, __WEBPACK_IMPORTED_MODULE_23__angular_router__["n" /* RouterModule */], __WEBPACK_IMPORTED_MODULE_23__angular_router__["n" /* RouterModule */], [[2, __WEBPACK_IMPORTED_MODULE_23__angular_router__["s" /* ɵa */]], [2, __WEBPACK_IMPORTED_MODULE_23__angular_router__["k" /* Router */]]]), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiGroupsRoutingModule, HuewiGroupsRoutingModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiGroupsModule, HuewiGroupsModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiLightsRoutingModule, HuewiLightsRoutingModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiLightsModule, HuewiLightsModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiRulesRoutingModule, HuewiRulesRoutingModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiRulesModule, HuewiRulesModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiScenesRoutingModule, HuewiScenesRoutingModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiScenesModule, HuewiScenesModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiSchedulesRoutingModule, HuewiSchedulesRoutingModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiSchedulesModule, HuewiSchedulesModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiSensorsRoutingModule, HuewiSensorsRoutingModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiSensorsModule, HuewiSensorsModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiBridgesRoutingModule, HuewiBridgesRoutingModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, HuewiBridgesModule, HuewiBridgesModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, AppRoutingModule, AppRoutingModule, []), __WEBPACK_IMPORTED_MODULE_0__angular_core__["_33" /* ɵmpd */](512, AppModule, AppModule, [])]);
});
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2FybmQvRGV2ZWxvcGVyL2h1ZXdpMi9zcmMvYXBwL2FwcC5tb2R1bGUubmdmYWN0b3J5LnRzIiwidmVyc2lvbiI6Mywic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmc6Ly8vVXNlcnMvYXJuZC9EZXZlbG9wZXIvaHVld2kyL3NyYy9hcHAvYXBwLm1vZHVsZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIgIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsifQ==
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