const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');
const demosSection = document.getElementById('demos');
const enableWebcamButton = document.getElementById('webcamButton');
const stopButton = document.getElementById('stopButton');
const results = document.getElementById('results');
var reqId;


var mobileDeviceTime = [];
var personPresentTimeList=[];
var personNotPresentTimeList = [];
var personPartiallyPresentTimeList = [];
var faceCoveredTimeList = [];
var faceDetectedTimeList=[];
var faceCoverCounter =0;
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
  event.target.classList.add('removed');

  // getUsermedia parameters to force video but not audio.
  const constraints = {
    video: true
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    video.srcObject = stream;
    video.addEventListener('loadeddata', predictWebcam);
  });
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
  demosSection.classList.remove('invisible');
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
        if (predictions[n].class != "person") {
          var d = new Date();
          var noo = d.getTime();
          personNotPresentTimeList.push(noo);
        }
        if (predictions[n].class == "person") {
          var d = new Date();
          var noo = d.getTime();
          personPresentTimeList.push(noo);
        }
        if (predictions[n].class == "person" && predictions[n].score <= 0.80) {
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
async function detectFace(){
  const predictions = await fdmodel.estimateFaces(video, false);
  for (let i = 0; i < predictions.length; i++) {
    var probability = predictions[i].probability;
    if(probability <=90){
      var d = new Date();
      var noo = d.getTime();
      faceDetectedTimeList.push(noo);
    }
  }
  console.log(faceDetectedTimeList);
}
function findCommonTime(arr1, arr2) { 
  for(let i = 0; i < arr1.length; i++) { 
          
    for(let j = 0; j < arr2.length; j++) { 
          
        if(arr1[i]>= arr2[j]-1000 && arr1[i] <= (arr2[j] + 1000) ) { 
          faceCoveredTimeList.push(arr1[i]);
        } 
    } 
    console.log(faceCoveredTimeList);
  }
  faceCoveredCounter(faceCoveredTimeList);
}
function faceCoveredCounter(list){
  var forward = list[0];
  var tempI = list[0];
  for (var i = 0; i < list.length; i++) {
    if (list[i + 1] - list[i] <= 1000) {
      forward = list[i + 1]
    }
    else {
      faceCoverCounter++;
      forward = list[i + 1];
      tempI = list[i + 1];
    }
  }
}
function stopCam() {
  window.cancelAnimationFrame(reqId);
  liveView.classList.add('removed');
  video.srcObject.getTracks().forEach(function (track) {
    track.stop();
  });
  var cellPhoneDetectedFor = calulateTotalTime.apply(null, mobileDeviceTime);
  var userNotPresentFor = calulateTotalTime.apply(null, personNotPresentTimeList);
  var userPartiallyPresentFor = calulateTotalTime.apply(null, personPartiallyPresentTimeList);
  findCommonTime(faceDetectedTimeList, personPresentTimeList);
  addResultToHtml(cellPhoneDetectedFor, userNotPresentFor, userPartiallyPresentFor, faceCoverCounter);
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
  return totalTime / 1000;
}
function addResultToHtml(a, b, c, d) {
  var li = document.createElement('li');
  li.innerText = "CellPhone and other electronic devices were detected for " + a + " seconds";
  results.appendChild(li);
  var li = document.createElement('li');
  li.innerText = "User was not present for " + b + " seconds out of the total test time";
  results.appendChild(li);
  var li = document.createElement('li');
  li.innerText = "User was partially present for " + c + " seconds out of the total test time";
  results.appendChild(li);
  var li = document.createElement('li');
  li.innerText = "User covered his face " + d + " times";
  results.appendChild(li);
}