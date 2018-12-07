(function(){
  var config = {
    container: document.getElementById('top-view')
  };
  var heatmapInstance = h337.create(config);
  var _dataPoint = {
    radius: 130,
//    opacity: 1,
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
    Object.keys(group).forEach(function (key) {
      var associations = getAssociations(key);
      var clonedDataPoint = (JSON.parse(JSON.stringify(_dataPoint)));
      clonedDataPoint.x = group[key].coordinates.x;
      clonedDataPoint.y = group[key].coordinates.y;
      clonedDataPoint.key = key;
      clonedDataPoint.rowValue = associations;
      clonedDataPoint.value = associations * (1000 / group[key].max);
      dataPoints.push(clonedDataPoint);
    });
    return dataPoints;
  }

  function getAssociations(place) {
    var httpRequest;
    var associations;
    if (window.XMLHttpRequest) { // Mozilla, Safari, IE7+ ...
        httpRequest = new XMLHttpRequest();
    } else if (window.ActiveXObject) { // IE 6 and older
        httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
    }
    httpRequest.open('GET', "http://noc-hm.official.live:9292/v1/associations/" + place + "/both", false);
    httpRequest.send();
    if (httpRequest.status === 200) {
      associations = JSON.parse(httpRequest.responseText).associations;
    } else {
      console.log("api error");
    }
    return associations;
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

    var dataPoints = [];
    Object.keys(apSetting).forEach(function (key) {
      dataPoints = dataPoints.concat(getDataPoints(apSetting[key]));
    });
    var data = {
      max: 1000,
      min: 0,
      data: dataPoints
    };
    heatmapInstance.setData(data);

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

    setTimeout(start, 10000);
  }

  function loadApSetting(){
    var httpRequest;
    var associations;
    if (window.XMLHttpRequest) { // Mozilla, Safari, IE7+ ...
        httpRequest = new XMLHttpRequest();
    } else if (window.ActiveXObject) { // IE 6 and older
        httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
    }
    httpRequest.open('GET', "conf/ap_setting/conf.json", false);
    httpRequest.send();
    if (httpRequest.status === 200) {
      apSetting = JSON.parse(httpRequest.responseText);
    } else {
      console.log("api error");
    }
  }

  window.onload = function() {
    loadApSetting();
    start();
  };
})();
