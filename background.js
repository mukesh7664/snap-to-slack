
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ isEnabled: false });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.storage.local.get(['isEnabled'], (result) => {
    const newIsEnabledState = !result.isEnabled;
    chrome.storage.local.set({ isEnabled: newIsEnabledState }, () => {
      updateIcon(newIsEnabledState);
      if (tab.url.startsWith('https://web.snapchat.com')) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      }
    });
  });
});

function updateIcon(isEnabled) {
  const iconPath = isEnabled ? 'icons/slack-128.png' : 'icons/default-128.png';
  chrome.action.setIcon({ path: iconPath });
}
