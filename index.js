const cast = require("./cast");
const tplink = require("./tplink");
const plug = require("./tplink");

const PLUGIN_NAME = 'homebridge-chromecast-tv';
const PLATFORM_NAME = 'ChromecastTV';

var volume = 0.5;

module.exports = (api) => {
  api.registerPlatform(PLATFORM_NAME, ChromecastTV);
}

var setVolume = (dir) => {
  if (dir === 0) {
    if (volume < 1)
      volume += 0.1;
  } else {
    if (volume > 0)
      volume -= 0.1;
  }
}

class ChromecastTV {
  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;
    if(config.plugMac)
      plug.setMac(config.plugMac);
    else
      throw("You need to set the Mac address of the TV plug!");
    cast.setDebug(config.debug || false);
    // get the name
    const tvName = this.config.name || 'Chromecast TV';

    // generate a UUID
    const uuid = this.api.hap.uuid.generate('homebridge:chromecast-tv' + tvName);

    // create the accessory
    this.tvAccessory = new api.platformAccessory(tvName, uuid);

    // set the accessory category
    this.tvAccessory.category = this.api.hap.Categories.TELEVISION;

    // add the tv service
    const tvService = this.tvAccessory.addService(this.Service.Television);

    // information service
    var informationService = new this.Service(this.Service.AccessoryInformation);;
    informationService
      .setCharacteristic(Characteristic.Manufacturer, "BB")
      .setCharacteristic(Characteristic.Model, "Chromecast TV")
      .setCharacteristic(Characteristic.SerialNumber, "Version 1.0");
    
    // set sleep discovery characteristic
    tvService.setCharacteristic(this.Characteristic.SleepDiscoveryMode, this.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);
    tvService.setCharacteristic(this.Characteristic.name)
    // handle on / off events using the Active characteristic
    tvService.getCharacteristic(this.Characteristic.Active)
      .on('set', (newValue, callback) => {
        this.log.info('Active => ' + newValue);
        if (newValue === 1) {
          tplink.setState(true);
          //cast.connect();
        } else if (newValue === 0) {
          tplink.setState(false);
          cast.disconnect();
        }
        tvService.updateCharacteristic(this.Characteristic.Active, newValue);
        callback(null);
      })
      .on('get', (callback) => {
        this.log.info("Getting TV plug state");
        tplink.getState().then(result => {
          if (result.relay_state === 1) {
            cast.connect();
          } else if (result.relay_state === 0) {
            cast.disconnect();
          }
          console.log(`TV Plug is ${result.relay_state === 1 ? "on" : "off"}`)
          callback(null, result.relay_state);
        }).catch(err => {
          console.log(err);
          callback(err, null);
        })
      });

    // handle remote control input
    tvService.getCharacteristic(this.Characteristic.RemoteKey)
      .on('set', (newValue, callback) => {
        switch (newValue) {
          case this.Characteristic.RemoteKey.REWIND: {
            // this.log.info('set Remote Key Pressed: REWIND');
            break;
          }
          case this.Characteristic.RemoteKey.FAST_FORWARD: {
            // this.log.info('set Remote Key Pressed: FAST_FORWARD');
            break;
          }
          case this.Characteristic.RemoteKey.NEXT_TRACK: {
            // this.log.info('set Remote Key Pressed: NEXT_TRACK');
            break;
          }
          case this.Characteristic.RemoteKey.PREVIOUS_TRACK: {
            // this.log.info('set Remote Key Pressed: PREVIOUS_TRACK');
            break;
          }
          case this.Characteristic.RemoteKey.ARROW_UP: {
            cast.setVolume(0);
            break;
          }
          case this.Characteristic.RemoteKey.ARROW_DOWN: {
            cast.setVolume(1);
            break;
          }
          case this.Characteristic.RemoteKey.ARROW_LEFT: {
            // this.log.info('set Remote Key Pressed: ARROW_LEFT');
            break;
          }
          case this.Characteristic.RemoteKey.ARROW_RIGHT: {
            // this.log.info('set Remote Key Pressed: ARROW_RIGHT');
            break;
          }
          case this.Characteristic.RemoteKey.SELECT: {
            cast.toggleMute();
            break;
          }
          case this.Characteristic.RemoteKey.BACK: {
            cast.stop();
            break;
          }
          case this.Characteristic.RemoteKey.EXIT: {
            cast.stop();
            break;
          }
          case this.Characteristic.RemoteKey.PLAY_PAUSE: {
            cast.playPause();
            break;
          }
          case this.Characteristic.RemoteKey.INFORMATION: {
            // this.log.info('set Remote Key Pressed: INFORMATION');
            break;
          }
        }

        // don't forget to callback!
        callback(null);
      });

    /**
     * Create a speaker service to allow volume control
     */

    const speakerService = this.tvAccessory.addService(this.Service.TelevisionSpeaker);

    speakerService
      .setCharacteristic(this.Characteristic.Active, this.Characteristic.Active.ACTIVE)
      .setCharacteristic(this.Characteristic.VolumeControlType, this.Characteristic.VolumeControlType.RELATIVE_WITH_CURRENT);

    // handle volume control
    speakerService.getCharacteristic(this.Characteristic.VolumeSelector)
      .on('set', (direction, callback) => {
        cast.setVolume(direction);
        callback(null);
      });
    this.api.publishExternalAccessories(PLUGIN_NAME, [this.tvAccessory]);
  }
}