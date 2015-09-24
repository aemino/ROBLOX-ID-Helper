// REGISTER CONTEXT MENUS //

function createContextMenus() {
  chrome.contextMenus.create({
    id: "copyId",
    title: "Copy ROBLOX id",
    contexts: ["page", "image", "link"],
    documentUrlPatterns: ["*://www.roblox.com/*"],
    targetUrlPatterns: ["*://www.roblox.com/*item*", "*://www.roblox.com/item*"]
  });

  chrome.contextMenus.create({
    id: "copyIdToList",
    title: "Copy ROBLOX id to list",
    contexts: ["page", "image", "link"],
    documentUrlPatterns: ["*://www.roblox.com/*"],
    targetUrlPatterns: ["*://www.roblox.com/*item*", "*://www.roblox.com/item*"]
  });

  chrome.contextMenus.create({
    id: "copyImageId",
    title: "Copy ROBLOX image id from decal",
    contexts: ["page", "image", "link"],
    documentUrlPatterns: ["*://www.roblox.com/*"],
    targetUrlPatterns: ["*://www.roblox.com/*item*", "*://www.roblox.com/item*"]
  });

  chrome.contextMenus.create({
    id: "copyImageIdToList",
    title: "Copy ROBLOX image id to list from decal",
    contexts: ["page", "image", "link"],
    documentUrlPatterns: ["*://www.roblox.com/*"],
    targetUrlPatterns: ["*://www.roblox.com/item*"]
  });

  chrome.contextMenus.create({
      id: "copyUserId",
      title: "Copy ROBLOX user id",
      contexts: ["page", "image", "link"],
      documentUrlPatterns: ["*://www.roblox.com/*"],
      targetUrlPatterns: ["*://www.roblox.com/user*"]
  });

  chrome.contextMenus.create({
    id: "copyUserIdToList",
    title: "Copy ROBLOX user id to list",
    contexts: ["page", "image", "link"],
    documentUrlPatterns: ["*://www.roblox.com/*"],
    targetUrlPatterns: ["*://www.roblox.com/user*"]
  });

  chrome.contextMenus.create({
    id: "clearIdList",
    title: "Clear ROBLOX id list",
    contexts: ["page", "image", "link"],
    documentUrlPatterns: ["*://www.roblox.com/*"],
    targetUrlPatterns: ["*://www.roblox.com/*item*"]
  });
}

chrome.contextMenus.removeAll();
createContextMenus();


// DECLARE HANDLER USAGE //

chrome.contextMenus.onClicked.addListener(function(info) {
  var id = info.menuItemId;
  var pageUrl = info.pageUrl;
  var linkUrl = info.linkUrl;

  var url = (linkUrl ? linkUrl : pageUrl);
  url = url.toLowerCase().replace("&forcepublicview=true", "");

  if (id === "copyId") {
    copyId(url, false);
  }

  if (id === "copyIdToList") {
    copyId(url, true);
  }

  if (id === "copyImageId") {
    copyImageId(url, false);
  }

  if (id === "copyImageIdToList") {
    copyImageId(url, true);
  }

  if (id === "copyUserId") {
    copyId(url, false);
  }

  if (id === "copyUserIdtoList") {
    copyId(url, true);
  }

  if (id === "clearIdList") {
    clearIdList();
  }
});


// CONTEXT ACTION HANDLERS //

function copyId(url, list) {
  var id = getIdFromUrl(url);

  if (id === null) { return; } // something weird happened, do nothing

  if (list) {
    writeClipboardList(id);
  }
  else {
    writeClipboard(id);
  }
}

function copyImageId(url, list) {
  var id = getIdFromUrl(url);

  if (id === null) { return; } // something weird happened, do nothing

  chrome.windows.create({
    type: "popup",
    url: "processing.html",
    width: 640,
    height: 160
  });

  chrome.alarms.clear("attemptCooldown");

  var productInfo = getProductInfo(id);

  if (productInfo.AssetTypeId !== 13) {
    sendPopupMessage({message: "findImageIdFailed"}); // not a decal, inform the processing popup
    return;
  }

  var userId = productInfo.Creator.Id; // the owner of the decal

  function sendPopupMessage(message) {
    var received = false;

    function sendMessage() {
      console.log("sending message");
      chrome.runtime.sendMessage(message, function(response) {
        console.log("received response");

        if (response.message !== "popupMessageReceived") { return; }

        received = true;

        if (response.closed) {
          // the popup closed

          chrome.alarms.clear("sendMessage"); // make sure the timer is cleared
        }
      }); // done, tell the processing popup to close

      if (!received) {
        // it probably won't have updated by this point, but whatever :D

        chrome.alarms.onAlarm.addListener(function sendCompleted(alarm) {
          if (alarm.name === "sendMessage") {
            chrome.alarms.onAlarm.removeListener(sendCompleted);
            chrome.alarms.clear("sendMessage");

            sendMessage(); // try again
          }
        });

        chrome.alarms.create("sendMessage", {when: (new Date().getTime()) + 200}); // wait 0.2 seconds
      }
    }

    sendMessage();
  }

  function checkId(Id) {
    sendPopupMessage({message: "findImageIdAttempt", id: Id});

    chrome.alarms.clear("attemptCooldown");

    var response = getProductInfo(Id);

    if (response.AssetTypeId === 1 && response.Creator.Id === userId) {
      // it's an image and it is owned by the decal owner

      chrome.alarms.clear("attemptCooldown");

      if (list) {
        writeClipboardList(Id);
      }
      else {
        writeClipboard(Id);
      }

      sendPopupMessage({message: "findImageIdComplete"})
      return;
    }

    if (Id >= (id - 10)) {
      chrome.alarms.onAlarm.addListener(function attempt(alarm) {
        if (alarm.name === "attemptCooldown") {
          chrome.alarms.onAlarm.removeListener(attempt);
          chrome.alarms.clear("attemptCooldown");
          checkId(Id - 1);
        }
      });

      chrome.alarms.create("attemptCooldown", {when: (new Date().getTime()) + 500}); // wait 0.5 seconds before attempting the next request
    }
    else {
      // give up after checking 10 ids

      chrome.alarms.clear("attemptCooldown");

      sendPopupMessage({message: "findImageIdFailed"}); // failed, inform the processing popup
      return;
    }
  }

  checkId(id - 1);
}

function clearIdList() {
  writeClipboard(" ");
}


// UTILITIES //

function getIdFromUrl(url) {
  var splitUrl = url.toLowerCase().split("?id=", 2);

  if (splitUrl.length !== 2) { return null; } // ?id= wasn't found in the url

  if (isNaN(splitUrl[1])) { return null; } // id wasn't numerical

  var id = parseInt(splitUrl[1]);

  if (isNaN(id)) { return null; } // if it's not considered NaN, parsing it and checking for NaN will fully determine whether it is numerical

  return id;
}

function getProductInfo(assetId) {
  var request = new XMLHttpRequest();
  request.open("GET", "http://api.roblox.com/Marketplace/ProductInfo?assetId=" + assetId, false);
  request.send();

  var response = request.responseText;
  response = JSON.parse(response);

  return response;
}

function isIdList(str) {
  var splitStr = str.split(", ");

  if (splitStr.length === 0) { return false; } // redundancy check

  for (var i = 0; i < splitStr.length; i++) {
    var s = splitStr[i];

    if (isNaN(s)) { return false; }

    if (isNaN(parseInt(s))) { return null; } // if it's not considered NaN, parsing it and checking for NaN will fully determine whether it is numerical
  }

  return true;
}

function readClipboard() {
  var input = document.createElement("textarea");
  document.body.appendChild(input);
  input.focus();
  document.execCommand("Paste");
  var clipboardText = input.value
  input.remove();

  return clipboardText;
}

function writeClipboard(clipboardText) {
  var input = document.createElement("textarea");
  document.body.appendChild(input);
  input.value = clipboardText;
  input.focus();
  input.select();
  document.execCommand("Copy");
  input.remove();
}

function writeClipboardList(id) {
  var clipboardText = readClipboard();

  if (isIdList(clipboardText)) {
    var idList = clipboardText + ", " + id;

    writeClipboard(idList);
  }
  else {
    writeClipboard(id);
  }
}
