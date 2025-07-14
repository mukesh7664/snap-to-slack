
const SLACK_FAVICON_URL = 'https://a.slack-edge.com/80588/img/icons/favicon-32.png';

function setSlackFavicon() {
  // Remove all existing favicon links
  document.querySelectorAll('link[rel*="icon"]').forEach(el => el.remove());
  // Add Slack favicon
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = 'https://a.slack-edge.com/80588/img/icons/favicon-32.png';
  document.head.appendChild(link);
}

function setSlackTitle() {
  document.title = 'Slack | #general | Mukesh Soni'; // You can customize this as needed
}

function injectCss() {
  const link = document.createElement('link');
  link.href = chrome.runtime.getURL('slack-theme.css');
  link.type = 'text/css';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

function applyTransformations() {
  setSlackFavicon();
  setSlackTitle();
  injectCss();
}

chrome.storage.local.get(['isEnabled'], (result) => {
  if (result.isEnabled) {
    applyTransformations();

    const observer = new MutationObserver(applyTransformations);
    observer.observe(document.body, { childList: true, subtree: true });
  }
});
