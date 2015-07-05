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
  console.log("receieved message: " + request.message);
  if (request.message === "findImageIdAttempt") {
    if (id !== null) {
      id.innerHTML = request.id;
    }
  }

  if (request.message === "findImageIdComplete") {
    sendResponse(); // no data needed, we know it means that the window closed successfully
    window.close(); // done! close the popup
  }

  if (request.message === "findImageIdFailed") {
    // failed
    title.innerHTML = "Failed to retreive the image id for this decal"
    subtitle.innerHTML = "(You can close this window)"
    id.innerHTML = "";
  }
});
