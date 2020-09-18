const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');
const demosSection = document.getElementById('demos');
const enableWebcamButton = document.getElementById('webcamButton');
const stopButton = document.getElementById('stopButton');
const results = document.getElementById('results');
const status = document.getElementById('status');
const buttons = document.getElementById('buttons');
var reqId;
var startTime;
var endTime;
var totalTime;

var mobileDeviceTime = [];
var personPresentTimeList = [];
var personPartiallyPresentTimeList = [];
var faceCoveredTimeList = [];
var faceDetectedTimeList = [];
var multipleUserTimeList = [];
var faceCoverCounter = 0;
function getUserMediaSupported() {
  return !!(navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia);
}


if (getUserMediaSupported()) {
  enableWebcamButton.addEventListener('click', enableCam);
} else {
  console.warn('getUserMedia() is not supported by your browser');
}

function enableCam(event) {
  // Only continue if the COCO-SSD has finished loading.
  if (!odmodel && !fdmodel) {
    return;
  }
  // Hide the button once clicked.
  enableWebcamButton.disabled = true;
  stopButton.disabled = false;

  // getUsermedia parameters to force video but not audio.
  const constraints = {
    video: true
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    video.srcObject = stream;
    video.addEventListener('loadeddata', predictWebcam);
  });
  var startDate = new Date();
  startTime = startDate.getTime();
  demosSection.classList.remove('removed');
  status.classList.add('removed');
}
// script tag import so ignore any warning in Glitch.
blazeface.load().then(function (loadedmodel) {
  fdmodel = loadedmodel;
  console.log("Blazeface model loaded");
});
cocoSsd.load().then(function (loadedModel) {
  odmodel = loadedModel;
  console.log("Coco-ssd model loaded");
  // Show demo section now model is ready to use.
  status.innerText = "Model loaded successfully. Click start to continue."
});

var children = [];

function predictWebcam() {
  // Now let's start classifying a frame in the stream.
  odmodel.detect(video).then(function (predictions) {
    // Remove any highlighting we did previous frame.
    for (let i = 0; i < children.length; i++) {
      liveView.removeChild(children[i]);
    }
    children.splice(0);

    // Now lets loop through predictions and draw them to the live view if
    // they have a high confidence score.
    for (let n = 0; n < predictions.length; n++) {
      // If we are over 66% sure we are sure we classified it right, draw it!

      if (predictions[n].score > 0.66) {
        if (predictions[n].class == "cell phone"
          || predictions[n].class == "laptop"
          || predictions[n].class == "remote"
          || predictions[n].class == "tv") {
          var d = new Date();
          var noo = d.getTime();
          mobileDeviceTime.push(noo);
        }

        if (predictions[n].class == "person") {
          var d = new Date();
          var noo = d.getTime();
          personPresentTimeList.push(noo);
        }

        if (predictions[n].class == "person" && predictions[n].score <= 0.75
          && (predictions[n].bbox[0] < 0.2 || predictions[n].bbox[1] < 0.2 || predictions[n].bbox[2] > 0.8 || predictions[n].bbox[3] > 0.8)) {
          var d = new Date();
          var noo = d.getTime();
          personPartiallyPresentTimeList.push(noo);
        }
        const p = document.createElement('p');
        p.innerText = predictions[n].class + ' - with '
          + Math.round(parseFloat(predictions[n].score) * 100)
          + '% confidence.';
        p.style = 'margin-left: ' + predictions[n].bbox[0] + 'px; margin-top: '
          + (predictions[n].bbox[1] - 10) + 'px; width: '
          + (predictions[n].bbox[2] - 10) + 'px; top: 0; left: 0;';

        const highlighter = document.createElement('div');
        highlighter.setAttribute('class', 'highlighter');
        highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px; top: '
          + predictions[n].bbox[1] + 'px; width: '
          + predictions[n].bbox[2] + 'px; height: '
          + predictions[n].bbox[3] + 'px;';

        liveView.appendChild(highlighter);
        liveView.appendChild(p);
        children.push(highlighter);
        children.push(p);
      }
    }
    // Call this function again to keep predicting when the browser is ready.
    reqId = window.requestAnimationFrame(predictWebcam);
  });
  detectFace();
  stopButton.addEventListener('click', stopCam);
}
async function detectFace() {
  const predictions = await fdmodel.estimateFaces(video, false);
  for (let i = 0; i < predictions.length; i++) {
    var probability = predictions[i].probability;
    if (probability <= 90) {
      var d = new Date();
      var noo = d.getTime();
      faceDetectedTimeList.push(noo);
    }
  }
}
function findCommonTime(arr1, arr2) {
  for (let i = 0; i < arr1.length; i++) {

    for (let j = 0; j < arr2.length; j++) {

      if (arr1[i] >= arr2[j] - 1000 && arr1[i] <= (arr2[j] + 1000)) {
        faceCoveredTimeList.push(arr1[i]);
      }
    }
  }
  faceCoveredCounter(faceCoveredTimeList);
}
function faceCoveredCounter(list) {
  var forward = list[0];
  var tempI = list[0];
  for (var i = 0; i < list.length; i++) {
    if (list[i + 1] - list[i] <= 700) {
      forward = list[i + 1];
    }
    else {
      faceCoverCounter++;
      forward = list[i + 1];
      tempI = list[i + 1];
    }
  }
}
function getDuplicateArrayElements(arr) {
  var sorted_arr = arr.slice().sort();
  var results = [];
  for (var i = 0; i < sorted_arr.length - 1; i++) {
    if (sorted_arr[i + 1] === sorted_arr[i]) {
      results.push(sorted_arr[i]);
    }
  }
  return results;
}
function stopCam() {
  window.cancelAnimationFrame(reqId);
  liveView.classList.add('removed');
  video.srcObject.getTracks().forEach(function (track) {
    track.stop();
  });
  var endDate = new Date();
  endTime = endDate.getTime();
  totalTime = (endTime - startTime) / 1000;
  var cellPhoneDetectedFor = calulateTotalTime.apply(null, mobileDeviceTime);
  var userNotPresentFor = parseFloat(totalTime - (calulateTotalTime.apply(null, personPresentTimeList))).toFixed(3);
  var userPartiallyPresentFor = calulateTotalTime.apply(null, personPartiallyPresentTimeList);
  buttons.classList.add('removed');
  findCommonTime(faceDetectedTimeList, personPresentTimeList);
  multipleUserTimeList = getDuplicateArrayElements(personPresentTimeList);
  var multipleUserPresentFor = calulateTotalTime.apply(null, multipleUserTimeList);
  console.log(personPartiallyPresentTimeList);
  addResultToHtml(cellPhoneDetectedFor, userNotPresentFor, userPartiallyPresentFor, multipleUserPresentFor, faceCoverCounter);
}
function calulateTotalTime() {
  var list = [];
  for (var i = 0; i < arguments.length; i++) {
    list.push(arguments[i]);
  }
  var forward = list[0];
  var tempI = list[0];
  var totalTime = 0;
  var tempDiff = 0;
  for (var i = 0; i < list.length; i++) {
    if (list[i + 1] != list[i]) {
      if (list[i + 1] - list[i] <= 1000) {
        forward = list[i + 1]
      }
      else {
        tempDiff = forward - tempI;
        totalTime = totalTime + tempDiff;
        forward = list[i + 1];
        tempI = list[i + 1];
      }
    }
  }
  return totalTime / 1000;
}
function addResultToHtml(a, b, c, d, e) {
  var formate = "seconds";
  if (totalTime > 300) {
    a = a / 60;
    b = b / 60;
    c = c / 60;
    d = d / 60;
    formate = "minutes";
  }
  var li = document.createElement('li');
  li.innerText = "Results";
  results.appendChild(li);
  var li = document.createElement('li');
  li.innerText = "CellPhone and other electronic devices were detected for " + a + " " + formate;
  results.appendChild(li);
  var li = document.createElement('li');
  li.innerText = "User was not present for " + b + " " + formate + " out of " + totalTime + " " + formate + " of the total test time";
  results.appendChild(li);
  var li = document.createElement('li');
  li.innerText = "User was partially present for " + c + " " + formate + " out of " + totalTime + " " + formate + " of the total test time";
  results.appendChild(li);
  var li = document.createElement('li');
  li.innerText = "Multiple users detected for " + d + " " + formate + " out of " + totalTime + " " + formate + " of the total test time";
  results.appendChild(li);
  var li = document.createElement('li');
  li.innerText = "User covered his face " + (e - 1) + " times";
  results.appendChild(li);
}