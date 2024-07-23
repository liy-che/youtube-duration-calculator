// runs on extension install, extension update, and browser update
// does not run on extension enable
chrome.runtime.onInstalled.addListener((details) => {
  // Page actions are disabled by default and enabled on select tabs
  chrome.action.disable();

  // Clear all rules to ensure only our expected rules are set
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    // Declare a rule to enable the action on example.com pages
    let exampleRule = {
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {urlContains: 'www.youtube.com/'},
        })
      ],
      actions: [new chrome.declarativeContent.ShowAction()],
    };

    // Finally, apply our new array of rules
    let rules = [exampleRule];
    chrome.declarativeContent.onPageChanged.addRules(rules);
  });

  // re-inject content scripts and set badge to matches after install or update
  for (const cs of chrome.runtime.getManifest().content_scripts) {
    chrome.tabs.query({url: cs.matches}, (tabs)=> {
      for (const tab of tabs) {
        chrome.scripting.executeScript({
          target: {tabId: tab.id},
          files: cs.js,
        }).then(() => {
          chrome.tabs.sendMessage(tab.id, { msgType: "inject" });
        });

        chrome.scripting.insertCSS({
          target: {tabId: tab.id},
          files: cs.css,
        });

      }
    });
  }

  if (details.reason === 'update' || details.reason === 'install') {
    chrome.storage.sync.set({ opened: false });
      chrome.action.setBadgeText({
        text: "New",
      });

    chrome.storage.sync.set({seen: false});

    let feedbackLink = 'https://docs.google.com/forms/d/e/1FAIpQLSegS8BO6kGBKUNNnMlfZknkwHoQCdMTmcYC98CT6iote4s45g/viewform?usp=pp_url&entry.114183664=n/a&entry.1747003213=No,+thank+you';
    if (chrome.runtime.setUninstallURL) {
      chrome.runtime.setUninstallURL(feedbackLink);
    }
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.msgType === 'handshake') {
    chrome.storage.sync.set({ opened: true });
    for (const cs of chrome.runtime.getManifest().content_scripts) {
      chrome.tabs.query({url: cs.matches}, (tabs)=> {
        for (const tab of tabs) {
          chrome.action.setBadgeText({
            text: "",
          });
        }
      });
    }
  }
});