let SerialPort = require('serialport'); 
let	portName =  process.argv[2];     

const { ReadlineParser } = require('@serialport/parser-readline')



if (!portName) {
  giveInstructions();
}

var myPort = new SerialPort.SerialPort({
    path:portName,
    baudRate:115200,
});

const parser = myPort.pipe(new ReadlineParser({ delimiter: '\r\n' }))           
// myPort.pipe(parser);                         



myPort.on('open', showPortOpen);   
myPort.on('close', showPortClose);   
myPort.on('error', showError);      
parser.on('data', readSerialData);  


function showPortOpen() {
  console.log('port open. Data rate: ' + myPort.baudRate);
}

function readSerialData(data) {
  console.log(data);
}

function showPortClose() {
  console.log('port closed.');
}

function showError(error) {
  console.log('Serial port error: ' + error);
}