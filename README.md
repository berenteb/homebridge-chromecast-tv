![Version: see package.json](https://img.shields.io/github/package-json/v/berenteb/homebridge-chromecast-tv)
# Homebridge TV Plugin with Chromecast and TP-Link Smart Plug support
Control your Chromecast and TP-Link Smart Plug equipped TV!
## Currently supported features:
- Turning on/off TV by switching the configured TP-Link smart plug (Apple Home App)
- Changing volume with the volume buttons of your smartphone/tablet (Apple TV Remote App in the control center)
- Changing volume with the arrow up and down buttons (Apple TV Remote App in the control center)
- Mute with center/ok/select button(Apple TV Remote App in the control center)
- Exit the current application on the Chromecast with the Back button (Apple TV Remote App in the control center)

## Current issues:
- Play/pause button is coded but not working, Chromecast does nothing receiving these messages.
- When the plug with the configured MAC address is not found, the plugin will crash and so will Homebridge.
- ~For some reasons Homebridge logs an error saying 'Cannot read port of undefined' when connecting to the Chromecast.~ (Error has been handled.)
- If you have more than one Chromecast devices (Google Home devices doesn't count) you'll have problems...

## Some good features
The plugin works really reliably if configured properly and the required devices are available. It can handle that the Chromecast is offline, but it'll crash once the plug is offline. The connection to the Chromecast when adjusting volume is better than the Google Home app itself IMO. This is because the plugin tries to connect every time HomeKit sends a get request. So the downside is the network is unnecessarily loaded, but hey, It works well!.

## Config
```
"platforms":[
    {
      "platform":"ChromecastTV", //Do not change
      "name":"Bedroom TV", //Home app display name
      "plugMac": "12:34:56:78:90:AF", //Your TP-Link Plug Mac address
      "debug": false //More detailed logging, optional
    }
]
```

## Special thanks to
- node-castv2 project contributors: https://github.com/thibauts/node-castv2#protocol-description
- plasticrake for the tplink-smarthome-api package: https://github.com/plasticrake/tplink-smarthome-api#readme
Without them, this project would have a hard time.
