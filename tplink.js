const { Client } = require('tplink-smarthome-api');
var plugMac;
var setState = (state) => {
    const client = new Client();
    client.startDiscovery({ macAddresses: plugMac, discoveryTimeout: 3000 }).on('device-new', (device) => {
        device.getSysInfo().then((result) => {
            console.log(`${result.alias} found, turning ${state?"on":"off"}.`);
            device.setPowerState(state);
        }).catch((err) => {
            console.log("Couldn't get sysInfo.");
        });
    });
}
var getState = ()=>{
    return new Promise( (res, rej) => {
        const client = new Client();
        client.startDiscovery({ macAddresses: plugMac, discoveryTimeout: 3000 }).on('device-new', (device) => {
            device.getSysInfo().then((result) => {
                res(result);
            }).catch((err) => {
                console.log("Couldn't get sysInfo.");
                rej(err);
            });
        }).on('device-offline',()=>{
            rej("Error");
        });
    });
};

var setMac = (mac)=>{
    plugMac = mac;
}

// setMac("50:d4:f7:64:78:b6");

// getState().then(result => {
//     console.log(result)
//   }).catch(err => {
//     console.log(err);
//   })

module.exports = {
    setState: setState,
    getState: getState,
    setMac: setMac
}