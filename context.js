// REGISTER CONTEXT MENUS //

chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    id: "copyId",
    title: "Copy ROBLOX id",
    contexts: ["page", "image"],
    documentUrlPatterns: ["*://www.roblox.com/*item*"]
  });

  chrome.contextMenus.create({
    id: "copyIdToList",
    title: "Copy ROBLOX id to list",
    contexts: ["page", "image"],
    documentUrlPatterns: ["*://www.roblox.com/*item*"]
  });

  chrome.contextMenus.create({
    id: "clearIdList",
    title: "Clear ROBLOX id list",
    contexts: ["page", "image"],
    documentUrlPatterns: ["*://www.roblox.com/*item*"]
  });


  // CONTEXTUAL ENABLING //

  chrome.tabs.onUpdated.addListener(function(tabId, tabInfo) {
    var url = tabInfo.url

    if (url === undefined) { return; }

    var id = getIdFromUrl(url);

    if (id === null) { return; } // ignore, no id

    var productInfo = getProductInfo(id);

    if (productInfo.AssetTypeId === 13) {
      // decal, show decal context options

      chrome.contextMenus.create({
        id: "copyImageId",
        title: "Copy ROBLOX image id from decal",
        contexts: ["page", "image"],
        documentUrlPatterns: ["*://www.roblox.com/*item*"],
      });

      chrome.contextMenus.create({
        id: "copyImageIdToList",
        title: "Copy ROBLOX image id to list from decal",
        contexts: ["page", "image"],
        documentUrlPatterns: ["*://www.roblox.com/*item*"],
      });
    }
    else {
      // not a decal, remove the contextual options if they exist

      chrome.contextMenus.remove("copyImageId");
      chrome.contextMenus.remove("copyImageIdToList");
    }
  });
});


// DECLARE HANDLER USAGE //

chrome.contextMenus.onClicked.addListener(function(info) {
  var id = info.menuItemId;
  var pageUrl = info.pageUrl;

  if (id === "copyId") {
    copyId(pageUrl, false);
  }

  if (id === "copyImageId") {
    copyImageId(pageUrl, false);
  }

  if (id === "copyIdToList") {
    copyId(pageUrl, true);
  }

  if (id === "copyImageIdToList") {
    copyImageId(pageUrl, true);
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

  var userId = getProductInfo(id).Creator.Id; // the owner of the decal

  function checkId(Id) {
    chrome.runtime.sendMessage({message: "findImageIdAttempt", id: Id});

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

      chrome.runtime.sendMessage({message: "findImageIdComplete"}); // done, tell the processing popup to close
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

      chrome.alarms.create("attemptCooldown", {when: (new Date().getTime()) + 100}); // wait 0.1 seconds before attempting the next request
    }
    else {
      // give up after checking 10 ids

      chrome.alarms.clear("attemptCooldown");

      chrome.runtime.sendMessage({message: "findImageIdFailed"}); // failed, inform the processing popup
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
  var splitUrl = url.split("?id=", 2);

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
