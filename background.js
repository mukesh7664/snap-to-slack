chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ isEnabled: true });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.storage.local.get(['isEnabled'], (result) => {
    const newIsEnabledState = !result.isEnabled;
    chrome.storage.local.set({ isEnabled: newIsEnabledState }, () => {
      updateIcon(newIsEnabledState);
      
      // Check if the tab URL matches Snapchat web
      if (tab.url && tab.url.includes('www.snapchat.com/web')) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      }
    });
  });
});

function updateIcon(isEnabled) {
  const iconPaths = isEnabled
    ? {
        '16': 'icons/slack-16.png',
        '32': 'icons/slack-32.png',
        '48': 'icons/slack-48.png',
        '128': 'icons/slack-128.png'
      }
    : {
        '16': 'icons/default-16.png',
        '32': 'icons/default-32.png',
        '48': 'icons/default-48.png',
        '128': 'icons/default-128.png'
      };

  chrome.action.setIcon({ path: iconPaths });
}

// Initialize icon on startup
chrome.storage.local.get(['isEnabled'], (result) => {
  updateIcon(result.isEnabled || false);
});