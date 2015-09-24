// temporary until the DOM loads
var title = null;
var subtitle = null;
var id = null;

document.addEventListener("DOMContentLoaded", function() {
  title = document.getElementById("title");
  subtitle = document.getElementById("subtitle");
  id = document.getElementById("id");
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log("got message: " + request.message);

  function respond(closed) {
    sendResponse({message: "popupMessageReceived", closed: closed});
  }

  if (request.message === "findImageIdAttempt") {
    if (id === null) { return; }

    respond(false); // respond acknowledging closure [false == not closed]

    id.innerHTML = request.id;
  }

  if (request.message === "findImageIdComplete") {
    respond(true); // respond acknowledging closure [true == closed]

    window.close(); // done! close the popup
  }

  if (request.message === "findImageIdFailed") {
    if (title === null || subtitle === null || id === null) { return; }

    respond(false); // respond acknowledging closure [false == not closed]

    title.innerHTML = "Failed to retreive the image id"
    subtitle.innerHTML = "Make sure you're trying to find the image id of a decal.<br>(You can close this window)"
    id.innerHTML = "";
  }
});
