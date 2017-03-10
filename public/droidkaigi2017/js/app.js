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
      var associations = getAssociations(key) * (1000 / group[key].max);
      var clonedDataPoint = (JSON.parse(JSON.stringify(_dataPoint)));
      clonedDataPoint.x = group[key].coordinates.x;
      clonedDataPoint.y = group[key].coordinates.y;
      clonedDataPoint.value = associations;
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
    httpRequest.open('GET', "http://api.conbu.net/v1/associations/" + place + "/both", false);
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
