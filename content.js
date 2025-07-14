
const SLACK_FAVICON_URL = 'https://a.slack-edge.com/80588/img/icons/favicon-32.png';

function setSlackFavicon() {
  let favicon = document.querySelector("link[rel*='icon']");
  if (favicon) {
    favicon.href = SLACK_FAVICON_URL;
  } else {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = SLACK_FAVICON_URL;
    document.head.appendChild(favicon);
  }
}

function setSlackTitle() {
  document.title = 'Slack';
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
