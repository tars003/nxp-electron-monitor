let { SerialPort } = require('serialport');
const tableToCsv = require('node-table-to-csv');
const fs = require('fs');
const { ReadlineParser } = require('@serialport/parser-readline');
const { ByteLengthParser } = require('@serialport/parser-byte-length');
const { ReadyParser } = require('@serialport/parser-ready');
const { DelimiterParser } = require('@serialport/parser-delimiter')
const { read } = require('original-fs');

const { ipcRenderer } = require('electron');

let portsCurr = [];
let isConnected = false;
let parser;
let myPort;

let parsedStr;
let blr1Led, conf11Led, conf12Led, comp11Led, comp12Led, htr1Led;
let blr2Led, conf21Led, conf22Led, comp21Led, comp22Led, htr2Led;
let blr12Led, blr22Led;
let spare1Led, spare2Led, spare3Led, spare4Led, contFaultLed;
let blr1Ip, conf11Ip, conf12Ip, lp11Ip, lp12Ip, hp11Ip, hp12Ip, htr1Ip, airConIp, cnp1Ip;
let blr2Ip, conf21Ip, conf22Ip, lp21Ip, lp22Ip, hp21Ip, hp22Ip, htr2Ip, v400Ip, cnp2Ip;
let timeHeader, dateHeader, fault1, fault2;
let rt1Val, rt2Val, st1Val, st2Val, at1Val, at2Val, rhVal;
let hp11Val, hp12Val, lp11Val, lp12Val, hp21Val, hp22Val, lp21Val, lp22Val;

let portSelect;
let portForm;
let mainBody;
let connBtn, disconnBtn;
let alertToast;
let alertToastText;
let loopTimer;
let scanTimer;
let autoBtn;
let manualBtn;
let dataModeBtn;
let toggleBtns;

let isModeAuto = true;
let isDataMode = false;

let blr1Toggle, conf11Toggle, conf12Toggle, comp11Toggle, comp12Toggle, htr1Toggle;
let blr2Toggle, conf21Toggle, conf22Toggle, comp21Toggle, comp22Toggle, htr2Toggle;
let spare1Toggle, spare2Toggle, spare3Toggle, spare4Toggle, contFaultToggle;
let blr12Toggle, blr22Toggle;

let dataBody;
let dataTableBody;
let navBtnDiv;
let exportBtn;
let dataLogTable;

let dataInterval;

// NAV BTNS & CONNECT BTN LOADING & LISTENING
const loadInitialElements = async () => {
  // ADD EVENT LISTNER ON SUBMIT AND CONNECT TO SELECTED PORT
    loadStartExportBtn();
    // LOAD ALERT TOAST HTML
    // loadToast();

    // LOAD AND ADD NAV BUTTON LISTENERS
    loadNavButtons();

    // LOAD DISCONNECT AND CONNECT BUTTON
    loadConnDisconn();
}
const loadStartExportBtn = () => {
  portForm = document.getElementById("port-form");

  exportBtn = document.getElementById('export-btn');

  portForm.addEventListener('submit', e => {
    e.preventDefault();
    startConnection();
  });

  // HANDLES ACTUALLY EXPORTING THE DATA
  exportBtn.addEventListener('click', (e) => {
    e.preventDefault();
    dataLogTable = document.getElementById('scroll-div');
    let csv = tableToCsv(dataLogTable.innerHTML);

    ipcRenderer.send('file-request');

    ipcRenderer.on('file-response', (event, data) => {
      // console.log('obtained file from main process: ' + data );
      // console.log(dataLogTable.innerHTML);
      fs.writeFile(data, csv, (err) => {

        // In case of a error throw err.
        if (err) throw err;
        alert('File Saved Successfully!')

      });
    });

  });
}
const loadNavButtons = () => {
  autoBtn = document.getElementById("auto-btn");
  manualBtn = document.getElementById("manual-btn");
  dataModeBtn = document.getElementById("data-btn");

  toggleBtns = document.getElementsByClassName("switch");
  toggleBtns = [...toggleBtns];

  autoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    autoModeON();
  });
  manualBtn.addEventListener('click', (e) => {
    e.preventDefault();
    manualModeON();
  });
  dataModeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    dataModeON();
  });

  autoModeON();

  manualBtn.hidden = true;

}
// NAV BTNS & CONNECT BTN LOADING & LISTENING


// NAV BTN LISTENERS
const autoModeON = () => {

  mainBody = document.getElementById('body-div');
  dataBody = document.getElementById('data-div');

  isModeAuto = true;
  isDataMode = false;
  autoBtn.style.backgroundColor = "#de4d31";
  manualBtn.style.backgroundColor = "#c9c4c3";
  dataModeBtn.style.backgroundColor = "#c9c4c3";
  autoBtn.style.color = "white";
  manualBtn.style.color = "black";
  dataModeBtn.style.color = "black";


  // CHANGING TABLE COLOR TO RED FOR MANUAL & BLUE FOR AUTO
  let tables = document.getElementsByTagName('table');
  tables = [...tables]
  tables.map(table => {
    table.style.backgroundColor = '#d0f5ec';
  });

  // HIDING SHOWING TOGGLE BUTTONS
  toggleBtns.map((btn) => {
    // console.log('toggle hidden', btn);
    btn.style.display = "none";
  });

  mainBody.style.display = "block";
  dataBody.style.display = "none";
  exportBtn.style.display = "none";

  // if (isConnected) myPort.write("AUTO\n");

  // WHEN EXITING MANUAL MODE, TURNING ALL TOGGLE SWITCHES OFF
  if (isConnected) {
    blr1Toggle.checked = false;
    htr1Toggle.checked = false;
    conf11Toggle.checked = false;
    conf12Toggle.checked = false;
    comp11Toggle.checked = false;
    comp12Toggle.checked = false;

    blr2Toggle.checked = false;
    htr2Toggle.checked = false;
    conf21Toggle.checked = false;
    conf22Toggle.checked = false;
    comp21Toggle.checked = false;
    comp22Toggle.checked = false;

    spare1Toggle.checked = false;
    spare2Toggle.checked = false;
    spare3Toggle.checked = false;
    spare4Toggle.checked = false;
    contFaultToggle.checked = false;

    blr12Toggle.checked = false;
    blr22Toggle.checked = false;
  }
}
const manualModeON = () => {

  mainBody = document.getElementById('body-div');
  dataBody = document.getElementById('data-div');

  isModeAuto = false;
  isDataMode = false;
  manualBtn.style.backgroundColor = "#de4d31";
  autoBtn.style.backgroundColor = "#c9c4c3";
  dataModeBtn.style.backgroundColor = "#c9c4c3";
  autoBtn.style.color = "black";
  manualBtn.style.color = "white";
  dataModeBtn.style.color = "black";


  // CHANGING TABLE COLOR TO RED FOR MANUAL & BLUE FOR AUTO
  let tables = document.getElementsByTagName('table');
  tables = [...tables]
  tables.map(table => {
    table.style.backgroundColor = "#fcd2ca";
  });

  // HIDING SHOWING TOGGLE BUTTONS
  toggleBtns.map((btn) => {
    btn.style.display = "block";
  });

  mainBody.style.display = "block";
  dataBody.style.display = "none";
  exportBtn.style.display = "none";

  // if (isConnected) myPort.write("MANU\n");
}
const dataModeON = () => {

  mainBody = document.getElementById('body-div');
  dataBody = document.getElementById('data-div');

  exportBtn = document.getElementById('export-btn');

  isModeAuto = true;
  isDataMode = true;
  manualBtn.style.backgroundColor = "#c9c4c3";
  autoBtn.style.backgroundColor = "#c9c4c3";
  dataModeBtn.style.backgroundColor = "#de4d31";
  autoBtn.style.color = "black";
  manualBtn.style.color = "black";
  dataModeBtn.style.color = "white";

  mainBody.style.display = "none";
  dataBody.style.display = "block";
  exportBtn.style.display = "block";

  // if (isConnected) myPort.write("AUTO\n");

}
const loadConnDisconn = () => {
  connBtn = document.getElementById('port-submit');
  disconnBtn = document.getElementById('port-disconnect');
  exportBtn = document.getElementById('export-btn');

  disconnBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isConnected = false;
    disconnectPort();
  });

  mainBody = document.getElementById('body-div');
  dataBody = document.getElementById('data-div');
  navBtnDiv = document.getElementById('nav-btn-div');

  if (isConnected) {
    connBtn.style.display = "none";
    disconnBtn.style.display = "block";
    navBtnDiv.style.display = "block";
    if (isDataMode) {
      mainBody.style.display = "none";
      dataBody.style.display = "block";
      exportBtn.style.display = "block";
    }
    else {
      mainBody.style.display = "block";
      dataBody.style.display = "none";
      exportBtn.style.display = "none";
    }
  } else {
    console.log('inside hide disconnect')
    connBtn.style.display = "block";
    disconnBtn.style.display = "none";
    mainBody.style.display = "none";
    dataBody.style.display = "none";
    navBtnDiv.style.display = "none";
    exportBtn.style.display = "none";
  }
}
// NAV BTN LISTENERS




// LOAD I/0 AND ANALOG TABLES AND START HITTING API
const startConnection = () => {

  loadToggleListeners();

  // GET OUTPUT ELEMENTS HTML, INTO MEMORY
  getOutputElements();
  // LOAD INPUT ELEMENTS HTML INTO MEMORY
  getInputElements();
  // LOAD TEMP TABLE
  getTempElements();
  // LOAD PRESSURE TABLE
  getPressureElements();


  // parser.on('data', readSerialData);
  startListening();

  isConnected = true;

  loopTimer = setInterval(loadConnDisconn, 500);

}
const startListening = () => {
  dataInterval = setInterval(() => {
    fetch('https://nxp-server.herokuapp.com/get-data')
      .then(response => response.json())
      .then(data => {
        console.log(data);
        let str = JSON.stringify(data.data.data);
        str = str.slice(1, str.length-1)
        readSerialData(str);
      });
  }, 2000);
}
const readSerialData = (data) => {
  parsedStr = data;
  if (data.substring(0, 1) == '<') {
    // CHANGE OUTPUTS AND SOON AS NEW DATA RECEIVED
    changeOutput(data);
    changeInput(data);
    changeTemp(data);
    changePressure(data);

    if (isDataMode) addRow(data);
  }

  console.log('inside parsing data', data);
}
// LOAD I/0 AND ANALOG TABLES AND START HITTING API

const disconnectPort = () => {
  myPort.close();
  loadConnDisconn();
  clearTimeout(loopTimer);

  autoModeON();
  mainBody.style.display = "none";
}


// TABLE VALUE LISTENERS
const changeOutput = (data) => {
  // UNIT 1
  if (parsedStr.substring(164, 165) == '1') {
    blr1Led.style = "background-color: rgb(88, 206, 88); color: white;";
    blr1Led.innerHTML = "ON";
  } else {
    blr1Led.style = "background-color: rgb(228, 58, 58); color: white;";
    blr1Led.innerHTML = "OFF";
  }

  if (parsedStr.substring(168, 169) == '1') {
    conf11Led.style = "background-color: rgb(88, 206, 88); color: white;";
    conf11Led.innerHTML = "ON";
  } else {
    conf11Led.style = "background-color: rgb(228, 58, 58); color: white;";
    conf11Led.innerHTML = "OFF";
  }

  if (parsedStr.substring(170, 171) == '1') {
    conf12Led.style = "background-color: rgb(88, 206, 88); color: white;";
    conf12Led.innerHTML = "ON";
  } else {
    conf12Led.style = "background-color: rgb(228, 58, 58); color: white;";
    conf12Led.innerHTML = "OFF";
  }

  if (parsedStr.substring(176, 177) == '1') {
    comp11Led.style = "background-color: rgb(88, 206, 88); color: white;";
    comp11Led.innerHTML = "ON";
  } else {
    comp11Led.style = "background-color: rgb(228, 58, 58); color: white;";
    comp11Led.innerHTML = "OFF";
  }

  if (parsedStr.substring(178, 179) == '1') {
    comp12Led.style = "background-color: rgb(88, 206, 88); color: white;";
    comp12Led.innerHTML = "ON";
  } else {
    comp12Led.style = "background-color: rgb(228, 58, 58); color: white;";
    comp12Led.innerHTML = "OFF";
  }

  if (parsedStr.substring(160, 161) == '1') {
    htr1Led.style = "background-color: rgb(88, 206, 88); color: white;";
    htr1Led.innerHTML = "ON";
  } else {
    htr1Led.style = "background-color: rgb(228, 58, 58); color: white;";
    htr1Led.innerHTML = "OFF";
  }
  // UNIT 2
  if (parsedStr.substring(166, 167) == '1') {
    blr2Led.style = "background-color: rgb(88, 206, 88); color: white;";
    blr2Led.innerHTML = "ON";
  } else {
    blr2Led.style = "background-color: rgb(228, 58, 58); color: white;";
    blr2Led.innerHTML = "OFF";
  }

  if (parsedStr.substring(172, 173) == '1') {
    conf21Led.style = "background-color: rgb(88, 206, 88); color: white;";
    conf21Led.innerHTML = "ON";
  } else {
    conf21Led.style = "background-color: rgb(228, 58, 58); color: white;";
    conf21Led.innerHTML = "OFF";
  }

  if (parsedStr.substring(174, 175) == '1') {
    conf22Led.style = "background-color: rgb(88, 206, 88); color: white;";
    conf22Led.innerHTML = "ON";
  } else {
    conf22Led.style = "background-color: rgb(228, 58, 58); color: white;";
    conf22Led.innerHTML = "OFF";
  }

  if (parsedStr.substring(180, 181) == '1') {
    comp21Led.style = "background-color: rgb(88, 206, 88); color: white;";
    comp21Led.innerHTML = "ON";
  } else {
    comp21Led.style = "background-color: rgb(228, 58, 58); color: white;";
    comp21Led.innerHTML = "OFF";
  }

  if (parsedStr.substring(182, 183) == '1') {
    comp22Led.style = "background-color: rgb(88, 206, 88); color: white;";
    comp22Led.innerHTML = "ON";
  } else {
    comp22Led.style = "background-color: rgb(228, 58, 58); color: white;";
    comp22Led.innerHTML = "OFF";
  }

  if (parsedStr.substring(162, 163) == '1') {
    htr2Led.style = "background-color: rgb(88, 206, 88); color: white;";
    htr2Led.innerHTML = "ON";
  } else {
    htr2Led.style = "background-color: rgb(228, 58, 58); color: white;";
    htr2Led.innerHTML = "OFF";
  }
  // SPARES
  if (spare1Toggle.checked && !isModeAuto) {
    spare1Led.style = "background-color: rgb(88, 206, 88); color: white;";
    spare1Led.innerHTML = "ON";
  } else {
    spare1Led.style = "background-color: rgb(228, 58, 58); color: white;";
    spare1Led.innerHTML = "OFF";
  }
  if (spare2Toggle.checked && !isModeAuto) {
    spare2Led.style = "background-color: rgb(88, 206, 88); color: white;";
    spare2Led.innerHTML = "ON";
  } else {
    spare2Led.style = "background-color: rgb(228, 58, 58); color: white;";
    spare2Led.innerHTML = "OFF";
  }
  if (spare3Toggle.checked && !isModeAuto) {
    spare3Led.style = "background-color: rgb(88, 206, 88); color: white;";
    spare3Led.innerHTML = "ON";
  } else {
    spare3Led.style = "background-color: rgb(228, 58, 58); color: white;";
    spare3Led.innerHTML = "OFF";
  }
  if (spare4Toggle.checked && !isModeAuto) {
    spare4Led.style = "background-color: rgb(88, 206, 88); color: white;";
    spare4Led.innerHTML = "ON";
  } else {
    spare4Led.style = "background-color: rgb(228, 58, 58); color: white;";
    spare4Led.innerHTML = "OFF";
  }

  if (contFaultToggle.checked && !isModeAuto) {
    contFaultLed.style = "background-color: rgb(88, 206, 88); color: white;";
    contFaultLed.innerHTML = "ON";
  } else {
    contFaultLed.style = "background-color: rgb(228, 58, 58); color: white;";
    contFaultLed.innerHTML = "OFF";
  }

  if (blr12Toggle.checked && !isModeAuto) {
    blr12Led.style = "background-color: rgb(88, 206, 88); color: white;";
    blr12Led.innerHTML = "ON";
  } else {
    blr12Led.style = "background-color: rgb(228, 58, 58); color: white;";
    blr12Led.innerHTML = "OFF";
  }

  if (blr22Toggle.checked && !isModeAuto) {
    blr22Led.style = "background-color: rgb(88, 206, 88); color: white;";
    blr22Led.innerHTML = "ON";
  } else {
    blr22Led.style = "background-color: rgb(228, 58, 58); color: white;";
    blr22Led.innerHTML = "OFF";
  }

}
const getOutputElements = () => {
  blr1Led = document.getElementById('blr1-led');
  conf11Led = document.getElementById('conf11-led');
  conf12Led = document.getElementById('conf12-led');
  comp11Led = document.getElementById('comp11-led');
  comp12Led = document.getElementById('comp12-led');
  htr1Led = document.getElementById('htr1-led');

  blr2Led = document.getElementById('blr2-led');
  conf21Led = document.getElementById('conf21-led');
  conf22Led = document.getElementById('conf22-led');
  comp21Led = document.getElementById('comp21-led');
  comp22Led = document.getElementById('comp22-led');
  htr2Led = document.getElementById('htr2-led');

  spare1Led = document.getElementById('spare1-led');
  spare2Led = document.getElementById('spare2-led');
  spare3Led = document.getElementById('spare3-led');
  spare4Led = document.getElementById('spare4-led');
  contFaultLed = document.getElementById('contFault-led');

  blr12Led = document.getElementById('blr12-led');
  blr22Led = document.getElementById('blr22-led');
}
const changeInput = (data) => {
  // UNIT 1
  if (parsedStr.substring(128, 129) == '1') {
    blr1Ip.style = "background-color: rgb(88, 206, 88); color: white;";
    blr1Ip.innerHTML = "OK";
  } else {
    blr1Ip.style = "background-color: rgb(228, 58, 58); color: white;";
    blr1Ip.innerHTML = "NOT OK";
  }

  if (parsedStr.substring(116, 117) == '1') {
    conf11Ip.style = "background-color: rgb(88, 206, 88); color: white;";
    conf11Ip.innerHTML = "OK";
  } else {
    conf11Ip.style = "background-color: rgb(228, 58, 58); color: white;";
    conf11Ip.innerHTML = "NOT OK";
  }

  if (parsedStr.substring(118, 119) == '1') {
    conf12Ip.style = "background-color: rgb(88, 206, 88); color: white;";
    conf12Ip.innerHTML = "OK";
  } else {
    conf12Ip.style = "background-color: rgb(228, 58, 58); color: white;";
    conf12Ip.innerHTML = "NOT OK";
  }

  if (parsedStr.substring(108, 109) == '1') {
    lp11Ip.style = "background-color: rgb(88, 206, 88); color: white;";
    lp11Ip.innerHTML = "OK";
  } else {
    lp11Ip.style = "background-color: rgb(228, 58, 58); color: white;";
    lp11Ip.innerHTML = "NOT OK";
  }

  if (parsedStr.substring(110, 111) == '1') {
    lp12Ip.style = "background-color: rgb(88, 206, 88); color: white;";
    lp12Ip.innerHTML = "OK";
  } else {
    lp12Ip.style = "background-color: rgb(228, 58, 58); color: white;";
    lp12Ip.innerHTML = "NOT OK";
  }

  if (parsedStr.substring(100, 101) == '1') {
    hp11Ip.style = "background-color: rgb(88, 206, 88); color: white;";
    hp11Ip.innerHTML = "OK";
  } else {
    hp11Ip.style = "background-color: rgb(228, 58, 58); color: white;";
    hp11Ip.innerHTML = "NOT OK";
  }

  if (parsedStr.substring(102, 103) == '1') {
    hp12Ip.style = "background-color: rgb(88, 206, 88); color: white;";
    hp12Ip.innerHTML = "OK";
  } else {
    hp12Ip.style = "background-color: rgb(228, 58, 58); color: white;";
    hp12Ip.innerHTML = "NOT OK";
  }

  if (parsedStr.substring(124, 125) == '1') {
    htr1Ip.style = "background-color: rgb(88, 206, 88); color: white;";
    htr1Ip.innerHTML = "OK";
  } else {
    htr1Ip.style = "background-color: rgb(228, 58, 58); color: white;";
    htr1Ip.innerHTML = "NOT OK";
  }
  if (parsedStr.substring(1, 4) == 'NOR') {
    airConIp.style = "background-color: rgb(88, 206, 88); color: white;";
    airConIp.innerHTML = "ON";
  } else {
    airConIp.style = "background-color: rgb(228, 58, 58); color: white;";
    airConIp.innerHTML = "OFF";
  }
  if (parsedStr.substring(148, 149) == '1') {
    cnp1Ip.style = "background-color: rgb(88, 206, 88); color: white;";
    cnp1Ip.innerHTML = "ON";
  } else {
    cnp1Ip.style = "background-color: rgb(228, 58, 58); color: white;";
    cnp1Ip.innerHTML = "OFF";
  }
  // UNIT 2
  if (parsedStr.substring(130, 131) == '1') {
    blr2Ip.style = "background-color: rgb(88, 206, 88); color: white;";
    blr2Ip.innerHTML = "OK";
  } else {
    blr2Ip.style = "background-color: rgb(228, 58, 58); color: white;";
    blr2Ip.innerHTML = "NOT OK";
  }

  if (parsedStr.substring(120, 121) == '1') {
    conf21Ip.style = "background-color: rgb(88, 206, 88); color: white;";
    conf21Ip.innerHTML = "OK";
  } else {
    conf21Ip.style = "background-color: rgb(228, 58, 58); color: white;";
    conf21Ip.innerHTML = "NOT OK";
  }

  if (parsedStr.substring(122, 123) == '1') {
    conf22Ip.style = "background-color: rgb(88, 206, 88); color: white;";
    conf22Ip.innerHTML = "OK";
  } else {
    conf22Ip.style = "background-color: rgb(228, 58, 58); color: white;";
    conf22Ip.innerHTML = "NOT OK";
  }

  if (parsedStr.substring(112, 113) == '1') {
    lp21Ip.style = "background-color: rgb(88, 206, 88); color: white;";
    lp21Ip.innerHTML = "OK";
  } else {
    lp21Ip.style = "background-color: rgb(228, 58, 58); color: white;";
    lp21Ip.innerHTML = "NOT OK";
  }

  if (parsedStr.substring(114, 115) == '1') {
    lp22Ip.style = "background-color: rgb(88, 206, 88); color: white;";
    lp22Ip.innerHTML = "OK";
  } else {
    lp22Ip.style = "background-color: rgb(228, 58, 58); color: white;";
    lp22Ip.innerHTML = "NOT OK";
  }

  if (parsedStr.substring(104, 105) == '1') {
    hp21Ip.style = "background-color: rgb(88, 206, 88); color: white;";
    hp21Ip.innerHTML = "OK";
  } else {
    hp21Ip.style = "background-color: rgb(228, 58, 58); color: white;";
    hp21Ip.innerHTML = "NOT OK";
  }

  if (parsedStr.substring(106, 107) == '1') {
    hp22Ip.style = "background-color: rgb(88, 206, 88); color: white;";
    hp22Ip.innerHTML = "OK";
  } else {
    hp22Ip.style = "background-color: rgb(228, 58, 58); color: white;";
    hp22Ip.innerHTML = "NOT OK";
  }

  if (parsedStr.substring(126, 127) == '1') {
    htr2Ip.style = "background-color: rgb(88, 206, 88); color: white;";
    htr2Ip.innerHTML = "OK";
  } else {
    htr2Ip.style = "background-color: rgb(228, 58, 58); color: white;";
    htr2Ip.innerHTML = "NOT OK";
  }
  if (parsedStr.substring(132, 133) == '1') {
    v400Ip.style = "background-color: rgb(88, 206, 88); color: white;";
    v400Ip.innerHTML = "OK";
  } else {
    v400Ip.style = "background-color: rgb(228, 58, 58); color: white;";
    v400Ip.innerHTML = "NOT OK";
  }
  if (parsedStr.substring(150, 151) == '1') {
    cnp2Ip.style = "background-color: rgb(88, 206, 88); color: white;";
    cnp2Ip.innerHTML = "ON";
  } else {
    cnp2Ip.style = "background-color: rgb(228, 58, 58); color: white;";
    cnp2Ip.innerHTML = "OFF";
  }

  timeHeader.innerHTML = parsedStr.substring(14, 24);
  dateHeader.innerHTML = parsedStr.substring(5, 13);
  fault1.innerHTML = parsedStr.substring(184, 198);
  fault2.innerHTML = parsedStr.substring(199, 212);
}
const getInputElements = () => {
  blr1Ip = document.getElementById('blr1-ip');
  conf11Ip = document.getElementById('conf11-ip');
  conf12Ip = document.getElementById('conf12-ip');
  lp11Ip = document.getElementById('lp11-ip');
  lp12Ip = document.getElementById('lp12-ip');
  hp11Ip = document.getElementById('hp11-ip');
  hp12Ip = document.getElementById('hp12-ip');
  htr1Ip = document.getElementById('htr1-ip');
  cnp1Ip = document.getElementById('cnp1-ip');
  airConIp = document.getElementById('aircon-ip');

  blr2Ip = document.getElementById('blr2-ip');
  conf21Ip = document.getElementById('conf21-ip');
  conf22Ip = document.getElementById('conf22-ip');
  lp21Ip = document.getElementById('lp21-ip');
  lp22Ip = document.getElementById('lp22-ip');
  hp21Ip = document.getElementById('hp21-ip');
  hp22Ip = document.getElementById('hp22-ip');
  htr2Ip = document.getElementById('htr2-ip');
  cnp2Ip = document.getElementById('cnp2-ip');
  v400Ip = document.getElementById('400v-ip');

  timeHeader = document.getElementById('time-header');
  dateHeader = document.getElementById('date-header');
  fault1 = document.getElementById('fault1');
  fault2 = document.getElementById('fault2');
}
const changeTemp = (data) => {
  rt1Val.innerHTML = data.substring(25, 29);
  rt2Val.innerHTML = data.substring(30, 34);
  at1Val.innerHTML = data.substring(35, 39);
  at2Val.innerHTML = data.substring(40, 44);
  st1Val.innerHTML = data.substring(45, 49);
  st2Val.innerHTML = data.substring(50, 54);
  rhVal.innerHTML = data.substring(55, 59);
}
const getTempElements = () => {
  rt1Val = document.getElementById('rt1Temp');
  rt2Val = document.getElementById('rt2Temp');
  at1Val = document.getElementById('at1Temp');
  at2Val = document.getElementById('at2Temp');
  st1Val = document.getElementById('st1Temp');
  st2Val = document.getElementById('st2Temp');
  rhVal = document.getElementById('rh-value');
}
const changePressure = (data) => {
  hp11Val.innerHTML = data.substring(55, 59);
  hp12Val.innerHTML = data.substring(60, 64);
  hp21Val.innerHTML = data.substring(65, 69);
  hp22Val.innerHTML = data.substring(70, 74);

  lp11Val.innerHTML = data.substring(75, 79);
  lp12Val.innerHTML = data.substring(80, 84);
  lp21Val.innerHTML = data.substring(85, 89);
  lp22Val.innerHTML = data.substring(90, 94);
}
const getPressureElements = () => {
  hp11Val = document.getElementById('hp11-value');
  hp12Val = document.getElementById('hp12-value');
  hp21Val = document.getElementById('hp21-value');
  hp22Val = document.getElementById('hp22-value');

  lp11Val = document.getElementById('lp11-value');
  lp12Val = document.getElementById('lp12-value');
  lp21Val = document.getElementById('lp21-value');
  lp22Val = document.getElementById('lp22-value');
}
// TABLE VALUE LISTENERS

// LOAD TOGGLE LISTENERS FOR MANUAL MODE
const loadToggleListeners = () => {
  blr1Toggle = document.getElementById('blr1-toggle');
  htr1Toggle = document.getElementById('htr1-toggle');
  conf11Toggle = document.getElementById('conf11-toggle');
  conf12Toggle = document.getElementById('conf12-toggle');
  comp11Toggle = document.getElementById('comp11-toggle');
  comp12Toggle = document.getElementById('comp12-toggle');

  blr2Toggle = document.getElementById('blr2-toggle');
  htr2Toggle = document.getElementById('htr2-toggle');
  conf21Toggle = document.getElementById('conf21-toggle');
  conf22Toggle = document.getElementById('conf22-toggle');
  comp21Toggle = document.getElementById('comp21-toggle');
  comp22Toggle = document.getElementById('comp22-toggle');

  spare1Toggle = document.getElementById('spare1-toggle');
  spare2Toggle = document.getElementById('spare2-toggle');
  spare3Toggle = document.getElementById('spare3-toggle');
  spare4Toggle = document.getElementById('spare4-toggle');
  contFaultToggle = document.getElementById('contFault-toggle');

  blr12Toggle = document.getElementById('blr12-toggle');
  blr22Toggle = document.getElementById('blr22-toggle');

  // UNIT 1
  blr1Toggle.addEventListener('change', (e) => {
    // console.log('inside change', e.target.checked);
    if (isConnected) {
      if (e.target.checked) myPort.write("<MNOP,5,1>");
      else myPort.write("<MNOP,5,0>");
    }
  });
  htr1Toggle.addEventListener('change', (e) => {
    // console.log('inside change', e.target.checked);
    if (isConnected) {
      if (e.target.checked) myPort.write("<MNOP,6,1>");
      else myPort.write("<MNOP,6,0>");
    }
  });
  conf11Toggle.addEventListener('change', (e) => {
    if (isConnected) {
      if (e.target.checked) myPort.write("<MNOP,1,1>");
      else myPort.write("<MNOP,1,0>");
    }
  });
  conf12Toggle.addEventListener('change', (e) => {
    if (isConnected) {
      if (e.target.checked) myPort.write("<MNOP,2,1>");
      else myPort.write("<MNOP,2,0>");
    }
  });
  comp11Toggle.addEventListener('change', (e) => {
    if (isConnected) {
      if (e.target.checked) myPort.write("<MNOP,3,1>");
      else myPort.write("<MNOP,3,0>");
    }
  });
  comp12Toggle.addEventListener('change', (e) => {
    if (isConnected) {
      if (e.target.checked) myPort.write("<MNOP,4,1>");
      else myPort.write("<MNOP,4,0>");
    }
  });

  // UNIT 2
  blr2Toggle.addEventListener('change', (e) => {
    if (isConnected) {
      if (e.target.checked) myPort.write("<MNOP,11,1>");
      else myPort.write("<MNOP,11,0>");
    }
  });
  htr2Toggle.addEventListener('change', (e) => {
    if (isConnected) {
      if (e.target.checked) myPort.write("<MNOP,12,1>");
      else myPort.write("<MNOP,12,0>");
    }
  });
  conf21Toggle.addEventListener('change', (e) => {
    if (isConnected) {
      if (e.target.checked) myPort.write("<MNOP,7,1>");
      else myPort.write("<MNOP,7,0>");
    }
  });
  conf22Toggle.addEventListener('change', (e) => {
    if (isConnected) {
      if (e.target.checked) myPort.write("<MNOP,8,1>");
      else myPort.write("<MNOP,8,0>");
    }
  });
  comp21Toggle.addEventListener('change', (e) => {
    if (isConnected) {
      if (e.target.checked) myPort.write("<MNOP,9,1>");
      else myPort.write("<MNOP,9,0>");
    }
  });
  comp22Toggle.addEventListener('change', (e) => {
    if (isConnected) {
      // console.log("<MNOP,10,1>");
      if (e.target.checked) myPort.write("<MNOP,10,1>");
      else myPort.write("<MNOP,10,0>");
    }
  });
  // SPARE TOGGLES
  spare1Toggle.addEventListener('change', (e) => {
    if (isConnected) {
      // console.log("<MNOP,10,1>");
      if (e.target.checked) myPort.write("<MNOP,13,1>");
      else myPort.write("<MNOP,13,0>");
    }
  });
  spare2Toggle.addEventListener('change', (e) => {
    if (isConnected) {
      // console.log("<MNOP,10,1>");
      if (e.target.checked) myPort.write("<MNOP,14,1>");
      else myPort.write("<MNOP,14,0>");
    }
  });
  spare3Toggle.addEventListener('change', (e) => {
    if (isConnected) {
      // console.log("<MNOP,10,1>");
      if (e.target.checked) myPort.write("<MNOP,15,1>");
      else myPort.write("<MNOP,15,0>");
    }
  });
  spare4Toggle.addEventListener('change', (e) => {
    if (isConnected) {
      // console.log("<MNOP,10,1>");
      if (e.target.checked) myPort.write("<MNOP,16,1>");
      else myPort.write("<MNOP,16,0>");
    }
  });
  contFaultToggle.addEventListener('change', (e) => {
    if (isConnected) {
      // console.log("<MNOP,10,1>");
      if (e.target.checked) myPort.write("<MNOP,17,1>");
      else myPort.write("<MNOP,17,0>");
    }
  });

  blr12Toggle.addEventListener('change', (e) => {
    if (isConnected) {
      // console.log("<MNOP,10,1>");
      if (e.target.checked) myPort.write("<MNOP,18,1>");
      else myPort.write("<MNOP,18,0>");
    }
  });
  blr22Toggle.addEventListener('change', (e) => {
    if (isConnected) {
      // console.log("<MNOP,10,1>");
      if (e.target.checked) myPort.write("<MNOP,19,1>");
      else myPort.write("<MNOP,19,0>");
    }
  });
}
// LOAD TOGGLE LISTENERS FOR MANUAL MODE


// ADD ROW TO DATA TABLE
const addRow = (data) => {
  dataTableBody = document.getElementById('data-table-body');
  let scrollDiv = document.getElementById('scroll-div');
  let resString = "";
  let logString = "";

  if (1) {
    //DATE
    resString += `<td class="stickyCell1">${parsedStr.substring(14, 24)}</td>`;
    logString += `${parsedStr.substring(14, 24)},`;

    //TIME
    resString += `<td class="stickyCell2">${parsedStr.substring(5, 13)}</td>`;
    logString += `${parsedStr.substring(5, 13)},`;

    // BLR1/1
    if (parsedStr.substring(164, 165) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">ON</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">OFF</td>';
    if (parsedStr.substring(164, 165) == '1') logString += 'ON,';
    else logString += 'OFF,';

    // BLR1/2
    if (0) resString += '<td style="background-color: rgb(88, 206, 88); color: white;">ON</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">OFF</td>';
    if (0) logString += 'ON,';
    else logString += 'OFF,';

    // BLR2/1
    if (parsedStr.substring(166, 167) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">ON</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">OFF</td>';
    if (parsedStr.substring(166, 167) == '1') logString += 'ON,';
    else logString += 'OFF,';

    // BLR2/2
    if (0) resString += '<td style="background-color: rgb(88, 206, 88); color: white;">ON</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">OFF</td>';
    if (0) logString += 'ON,';
    else logString += 'OFF,';

    // CONF1/1
    if (parsedStr.substring(168, 169) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">ON</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">OFF</td>';
    if (parsedStr.substring(168, 169) == '1') logString += 'ON,';
    else logString += 'OFF,';

    // CONF1/2
    if (parsedStr.substring(170, 171) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">ON</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">OFF</td>';
    if (parsedStr.substring(170, 171) == '1') logString += 'ON,';
    else logString += 'OFF,';


    // CONF2/1
    if (parsedStr.substring(172, 173) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">ON</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">OFF</td>';
    if (parsedStr.substring(172, 173) == '1') logString += 'ON,';
    else logString += 'OFF,';

    // CONF2/2
    if (parsedStr.substring(174, 175) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">ON</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">OFF</td>';
    if (parsedStr.substring(174, 175) == '1') logString += 'ON,';
    else logString += 'OFF,';

    // COMP1/1
    if (parsedStr.substring(176, 177) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">ON</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">OFF</td>';
    if (parsedStr.substring(176, 177) == '1') logString += 'ON,';
    else logString += 'OFF,';

    // COMP1/2
    if (parsedStr.substring(178, 179) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">ON</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">OFF</td>';
    if (parsedStr.substring(178, 179) == '1') logString += 'ON,';
    else logString += 'OFF,';

    // COMP2/1
    if (parsedStr.substring(180, 181) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">ON</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">OFF</td>';
    if (parsedStr.substring(180, 181) == '1') logString += 'ON,';
    else logString += 'OFF,';

    // COMP2/2
    if (parsedStr.substring(182, 183) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">ON</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">OFF</td>';
    if (parsedStr.substring(182, 183) == '1') logString += 'ON,';
    else logString += 'OFF,';

    // HTR1
    if (parsedStr.substring(160, 161) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">ON</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">OFF</td>';
    if (parsedStr.substring(160, 161) == '1') logString += 'ON,';
    else logString += 'OFF,';

    // HTR2
    if (parsedStr.substring(162, 163) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">ON</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">OFF</td>';
    if (parsedStr.substring(162, 163) == '1') logString += 'ON,';
    else logString += 'OFF,';

  }
  if (1) {
    // RT1
    resString += `<td style="background-color: #ABDD93;">${data.substring(25, 29)}</td>`;
    // RT2
    resString += `<td style="background-color: #ABDD93;">${data.substring(30, 34)}</td>`;
    // AT1
    resString += `<td style="background-color: #ABDD93;">${data.substring(35, 39)}</td>`;
    // AT2
    resString += `<td style="background-color: #ABDD93;">${data.substring(40, 44)}</td>`;
    // ST1
    resString += `<td style="background-color: #ABDD93;">${data.substring(45, 49)}</td>`;
    // ST2
    resString += `<td style="background-color: #ABDD93;">${data.substring(50, 54)}</td>`;
    // RH
    resString += `<td style="background-color: #ABDD93;">${data.substring(55, 59)}</td>`;
  }
  if (1) {
    // HP11
    resString += `<td style="background-color: #ABDD93;">${data.substring(55, 59)}</td>`;
    // HP12
    resString += `<td style="background-color: #ABDD93;">${data.substring(60, 64)}</td>`;
    // HP21
    resString += `<td style="background-color: #ABDD93;">${data.substring(65, 69)}</td>`;
    // HP22
    resString += `<td style="background-color: #ABDD93;">${data.substring(70, 74)}</td>`;
    // LP11
    resString += `<td style="background-color: #ABDD93;">${data.substring(75, 79)}</td>`;
    // LP12
    resString += `<td style="background-color: #ABDD93;">${data.substring(80, 84)}</td>`;
    // LP21
    resString += `<td style="background-color: #ABDD93;">${data.substring(85, 89)}</td>`;
    // LP22
    resString += `<td style="background-color: #ABDD93;">${data.substring(90, 94)}</td>`;
  }
  if (1) {
    // BLR1/1
    if (parsedStr.substring(128, 129) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">OK</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">N_OK</td>';

    // BLR1/2
    if (0) resString += '<td style="background-color: rgb(88, 206, 88); color: white;">OK</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">N_OK</td>';

    // BLR2/1
    if (parsedStr.substring(130, 131) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">OK</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">N_OK</td>';

    // BLR2/2
    if (0) resString += '<td style="background-color: rgb(88, 206, 88); color: white;">OK</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">N_OK</td>';

    // COKF1/1
    if (parsedStr.substring(116, 117) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">OK</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">N_OK</td>';

    // COKF1/2
    if (parsedStr.substring(118, 119) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">OK</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">N_OK</td>';

    // COKF2/1
    if (parsedStr.substring(120, 121) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">OK</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">N_OK</td>';

    // COKF2/2
    if (parsedStr.substring(122, 123) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">OK</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">N_OK</td>';

    // HP1/1
    if (parsedStr.substring(100, 101) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">OK</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">N_OK</td>';

    // HP1/2
    if (parsedStr.substring(102, 103) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">OK</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">N_OK</td>';

    // HP2/1
    if (parsedStr.substring(104, 105) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">OK</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">N_OK</td>';

    // HP2/2
    if (parsedStr.substring(106, 107) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">OK</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">N_OK</td>';

    // LP1/1
    if (parsedStr.substring(108, 109) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">OK</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">N_OK</td>';

    // LP1/2
    if (parsedStr.substring(110, 111) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">OK</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">N_OK</td>';

    // LP2/1
    if (parsedStr.substring(112, 113) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">OK</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">N_OK</td>';

    // LP2/2
    if (parsedStr.substring(114, 115) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">OK</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">N_OK</td>';

    // HTR1
    if (parsedStr.substring(124, 125) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">OK</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">N_OK</td>';

    // HTR2
    if (parsedStr.substring(126, 127) == '1') resString += '<td style="background-color: rgb(88, 206, 88); color: white;">OK</td>';
    else resString += '<td style="background-color: rgb(228, 58, 58); color: white;">N_OK</td>';
  }
  dataTableBody.innerHTML += `<tr>${resString}</tr>`;

  scrollDiv.scrollTop = scrollDiv.scrollHeight;
}
// ADD ROW TO DATA TABLE



loadInitialElements();



