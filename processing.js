// temporary until the DOM loads
var title = null;
var subtitle = null;
var id = null;

document.addEventListener("DOMContentLoaded", function() {
  title = document.getElementById("title");
  subtitle = document.getElementById("subtitle");
  id = document.getElementById("id");
});

chrome.runtime.onMessage.addListener(function(request) {
  if (request.message === "findImageIdAttempt") {
    if (id !== null) {
      id.innerHTML = request.id;
    }
  }

  if (request.message === "findImageIdComplete") {
    window.close(); // done! close the popup
  }

  if (request.message === "findImageIdFailed") {
    // failed
    title.innerHTML = "Failed to retreive the image id for this decal"
    subtitle.innerHTML = "(You can close this window)"
    id.innerHTML = "";
  }
});
