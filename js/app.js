var config = {
  ap_config: "conf/ap_setting/conf.json",
  global_config: "config.json",
  api_head: "http://163.43.249.200/api/v1/associations/",
};
var global_config = {};

var heatmapInstance;
var hmRun = false;
var _dataPoint = {
  radius: 130,
//  opacity: 1,
  maxOpacity: .9,
  minOpacity: .3,
  blur: 1,
  gradient: {
    '.3': 'blue',
    '.5': 'red',
    '.85': 'white'
  }
};

var apSetting;

function getDataPoints(group) {
  var dataPoints = [];
  var p_arr = [];
  Object.keys(group).forEach(function (key) {
    p_arr.push(
      fetch(config.api_head + key + "/both",
        {cache: "no-cache", method: "GET"})
      .then((response) => {
        if (response.ok) { return response.json(); }
        throw('API access error for ' + key + ' : ' + response.status);
      }).then(data => {
        var dp = {};
        Object.assign(dp, _dataPoint);
        dp.x = group[key].coordinates.x;
        dp.y = group[key].coordinates.y;
        dp.key = key;
        dp.rowValue = data.associations;
        dp.value = data.associations * (1000 / group[key].max);
        return dp;
      }) );
  });
  return Promise.all(p_arr).then(vals => {
    vals.forEach(cval => {dataPoints.push(cval); }) })
  .catch(reason => {
    console.log("API error, failed on data acquisition: " + reason.message);
    return undefined;
  }).then(vals => { return dataPoints; });
}

function updateTime() {
  var date = new Date();
  var clock = date.getFullYear() + "-"
      + ("0" + (date.getMonth() + 1)).slice(-2) + "-"
      + ("0" + date.getDate()).slice(-2) + " "
      + ("0" + date.getHours()).slice(-2) + ":"
      + ("0" + date.getMinutes()).slice(-2) + ":"
      + ("0" + date.getSeconds()).slice(-2);
  document.getElementById("time").innerHTML = clock;
}

function start() {

  if (hmRun) {
    console.log('Not running data retrieve. Already running until timeout.');
    setTimeout(start, global_config.interval * 1000);
    return;
  };

  var dataPoints = [];
  var p_arr = [];
  Object.keys(apSetting).forEach(function (key) {
    p_arr.push(getDataPoints(apSetting[key])
      .then(val => {if (!(! val)) {dataPoints.push(val); } })
  ); });
  hmRun = true;
  Promise.all(p_arr).then(vals => {
    dataPoints = dataPoints.flat();
    heatmapInstance.setData({ max: 1000, min: 0, data: dataPoints });

  // add new
  var tipCanvas = document.getElementById("tip");
  var tipCtx = tipCanvas.getContext("2d");

  var c = document.getElementsByClassName("heatmap-canvas")[0];
  var ctx = c.getContext("2d");
  Object.keys(dataPoints).forEach(function (i) {
    var dataPoint = dataPoints[i];
    ctx.beginPath();
    ctx.arc(dataPoint.x, dataPoint.y, 5, 0, 2 * Math.PI);
    ctx.strokeStyle = "#D7000F";
    ctx.stroke();
  });
  c.onmousemove = function(e) {
    var skip = skip || 0;
    if (skip++ % 3) return;
    var hit = false;
    var self = this;
    Object.keys(dataPoints).forEach(function (i) {

      var dataPoint = dataPoints[i];
      ctx.beginPath();
      ctx.arc(dataPoint.x, dataPoint.y, 5, 0, 2 * Math.PI);

      var rect = self.getBoundingClientRect(),
          x = e.clientX - rect.left,
          y = e.clientY - rect.top;

      if(ctx.isPointInPath(x, y)) {
        tipCanvas.style.left = (x) + "px";
        tipCanvas.style.top = (y - 20) + "px";
        tipCtx.clearRect(0, 0, tipCanvas.width, tipCanvas.height);
        tipCtx.font = "12px 'ＭＳ Ｐゴシック'";
        tipCtx.fillStyle = "black";
        tipCtx.fillText(dataPoint.key + ": {\"assoc\"," + dataPoint.rowValue + "}", 5, 10);
        hit = true;
      }
    });
    if (!hit) { tipCanvas.style.left = "-200px"; }
  }

    updateTime();
    hmRun = false;
  });

  setTimeout(start, global_config.interval * 1000);
}

function ModifyEvent() {
  // title
  var re = /\{EVENTNAME\}/;
  var tstr;
  tstr = document.title;
  document.title = tstr.replace(re, global_config.event);
  tstr = document.getElementById('h_title').innerText;
  document.getElementById('h_title').innerText = 
    tstr.replace(re, global_config.event);
}

function LoadImage(url) {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.onload = () => resolve(img);
    img.onerror = e => reject(e);
    img.src = url;
    img.id = 'back_img';
    img.alt = url;
    document.getElementById('floor').appendChild(img);
  });
}

window.addEventListener("DOMContentLoaded", function(event) {
  Promise.all([
    fetch(config.ap_config, {cache: "no-cache", method: "GET"})
    .then((response) => {
      if (response.ok) { return response.json(); }
      throw('ap_config load error with ' + response.status);
    }).then(data => { apSetting = data }),
    fetch(config.global_config, {cache: "no-cache", method: "GET"})
    .then((response) => {
      if (response.ok) { return response.json(); }
      throw('global_config load error with ' + response.status);
    }).then(data => { global_config = data }),
  ]).then(vals => {
    ModifyEvent();
    LoadImage(global_config.image).then(img => {
      heatmapInstance = h337.create({
        container: document.getElementById('top-view'),
      });
      console.log('Starting process');
      start();
    });
  }).catch(reason => {
    console.log("API error, failed on initial load: " + reason.message);
    return;
  })
});

