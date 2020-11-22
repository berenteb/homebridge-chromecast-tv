var Client = require('castv2').Client;
var mdns = require('mdns');

var connected = false;
var client;
var receiver;
var volume;
var muted = false;
var playState = true;
var ip;
var log = false;

var sequence = [
    mdns.rst.DNSServiceResolve(),
    'DNSServiceGetAddrInfo' in mdns.dns_sd ? mdns.rst.DNSServiceGetAddrInfo() : mdns.rst.getaddrinfo({ families: [4] }),
    mdns.rst.makeAddressesUnique()
];
var browser = mdns.createBrowser(mdns.tcp('googlecast'), { resolverSequence: sequence });
//var browser = mdns.createBrowser(mdns.tcp('googlecast'));

browser.on('serviceUp', function (service) {
    if (service.name.includes("Chromecast") && !connected) {
        console.log('Found Chromecast at %s:%d', service.addresses[0], service.port || 8009);
        ip = service.addresses[0];
        ondeviceup(ip);
    }
});
browser.on("serviceDown", function (service) {
    if (service.name.includes("Chromecast")) {
        if(log)console.log("Chromecast down");
        connected = false;
    }
});

function ondeviceup(host) {
    client = new Client();
    client.on("error", () => {
        if(log)console.log("Disconnected");
        connected = false;
    })
    client.on("close", () => {
        if(log)console.log("Disconnected");
        connected = false;
    });
    client.connect(host, function () {
        console.log("Connecting to " + host);
        var connection = client.createChannel('sender-0', 'receiver-0', 'urn:x-cast:com.google.cast.tp.connection', 'JSON');
        var heartbeat = client.createChannel('sender-0', 'receiver-0', 'urn:x-cast:com.google.cast.tp.heartbeat', 'JSON');
        receiver = client.createChannel('sender-0', 'receiver-0', 'urn:x-cast:com.google.cast.receiver', 'JSON');

        // Establish virtual connection to the receiver
        connection.send({ type: 'CONNECT' });
        console.log("Connected!");
        connected = true;
        // Start heartbeating
        var hb_interval = setInterval(function () {
            try {
                heartbeat.send({ type: 'PING' });
            } catch (err) {
                clearInterval(hb_interval);
                if(log)console.log("Stopped heartbeat");
            }
        }, 5000);

        receiver.send({ "type": "GET_STATUS", requestId: 1 });

        receiver.on('message', function (data, broadcast) {
            if (data.type = 'RECEIVER_STATUS' && data.status) {
                volume = data.status.volume.level || volume;
                muted = data.status.volume.muted || muted;
            }
        });
    });
}

var closeAll = () => {
    if (client) {
        try {
            client.close();
        } catch (err) {
            if(log)console.log("Client already closed");
        }
    }
    connected = false;
}

var connect = () => {
    closeAll();
    if(log)console.log("Starting device browser");
    try {
        browser.start();
    } catch (err) {
        if(log)console.log("Could not start browser");
    }
    ondeviceup(ip);
}

var disconnect = () => {
    if(log)console.log("Stopping device browser");
    try {
        browser.stop();
    } catch (err) {
        if(log)console.log("Could not stop browser");
    }
}

var setVolume = (dir) => {
    if (connected) {
        if (dir === 0) {
            if (volume < 1) {
                volume += 0.1;
                if (volume > 1)
                    volume = 1;
            }
        }
        else
            if (volume > 0) {
                volume -= 0.1;
                if (volume < 0)
                    volume = 0;
            }
        try {
            receiver.send({ "type": "SET_VOLUME", "volume": { level: parseFloat(volume) }, requestId: 1 });
        } catch (err) {
            if(log)console.log("Could not set volume");
        }
    }
}

var toggleMute = () => {
    if (connected) {
        muted = !muted;
        try {
            receiver.send({ "type": "SET_VOLUME", "volume": { muted: muted }, requestId: 1 });
        } catch (err) {
            if(log)console.log("Could not mute");
        }
    }
}

var stop = () => {
    if (connected)
        try {
            receiver.send({ "type": "STOP", requestId: 1 });
        } catch (err) {
            if(log)console.log("Could not stop");
        }
}

var playPause = () => {
    if (connected) {
        playState = !playState;
        try {
            if (playState)
                receiver.send({ "type": "PLAY", requestId: 1 });
            else
                receiver.send({ "type": "PAUSE", requestId: 1 });
        } catch (err) {
            if(log)console.log("Could not play/pause")
        }
    }
}

var setDebug = (state)=>{
    log = state;
}

module.exports = {
    connect: connect,
    disconnect: disconnect,
    setVolume: setVolume,
    toggleMute: toggleMute,
    stop: stop,
    playPause: playPause,
    setDebug: setDebug
}