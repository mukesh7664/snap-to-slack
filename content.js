let cssInjected = false;

function setSlackFavicon() {
  // Remove all existing favicon links
  document.querySelectorAll('link[rel*="icon"]').forEach(el => el.remove());
  // Add Slack favicon using local icon
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = chrome.runtime.getURL('icons/slack-128.png');
  document.head.appendChild(link);
}

function setSlackTitle() {
  if (document.title !== 'Slack | #general | Mukesh Soni') {
    document.title = 'Slack | #general | Mukesh Soni';
  }
}

function injectCss() {
  if (!cssInjected) {
    const link = document.createElement('link');
    link.href = chrome.runtime.getURL('slack-theme.css');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.id = 'slack-theme-css';
    document.head.appendChild(link);
    cssInjected = true;
    console.log('Snap-to-Slack: CSS injected at', link.href);

    // Verify it loaded
    link.onload = () => {
      console.log('Snap-to-Slack: CSS loaded successfully');
    };
    link.onerror = () => {
      console.error('Snap-to-Slack: CSS failed to load');
    };
  }
}

// Channel names to use instead of contact names
const channelNames = [
  'general',
  'random',
  'marketing',
  'sales',
  'ecommerce',
  'engineering',
  'design',
  'product',
  'customer-support',
  'announcements',
  'watercooler',
  'bugs',
  'feedback'
];

let channelIndex = 0;
const nameMapping = new Map(); // Store original name to channel name mapping

function getChannelName(originalName) {
  // If we've already mapped this name, return the same channel
  if (nameMapping.has(originalName)) {
    return nameMapping.get(originalName);
  }

  // Otherwise, assign a new channel name
  const channelName = channelNames[channelIndex % channelNames.length];
  channelIndex++;
  nameMapping.set(originalName, channelName);
  return channelName;
}

function addChannelPrefixes() {
  try {
    // Find text nodes that look like contact names by walking the DOM
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Only process visible text nodes
          if (!node.parentElement) return NodeFilter.FILTER_REJECT;

          const text = node.textContent.trim();

          // Skip empty or very long text
          if (text.length === 0 || text.length > 30) return NodeFilter.FILTER_REJECT;

          // Skip status messages
          if (text.match(/delivered|received|opened|ago|today|yesterday|search|reply/i)) {
            return NodeFilter.FILTER_REJECT;
          }

          // Check if parent or grandparent has already been processed
          if (node.parentElement.getAttribute('data-slack-channel') ||
              node.parentElement.parentElement?.getAttribute('data-slack-channel')) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const namesToReplace = new Map();
    let node;

    // First pass: collect all text nodes that might be names
    while (node = walker.nextNode()) {
      const text = node.textContent.trim();
      const parent = node.parentElement;

      // Look for likely name elements (not status, not timestamps)
      if (parent && !text.match(/\d{1,2}[mhd]|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i)) {
        namesToReplace.set(node, text);
      }
    }

    console.log('Snap-to-Slack: Found', namesToReplace.size, 'potential name elements');

    // Second pass: replace the names
    let replaceCount = 0;
    namesToReplace.forEach((originalText, textNode) => {
      try {
        const parent = textNode.parentElement;
        if (!parent) return;

        // Skip if already processed
        if (parent.getAttribute('data-slack-channel')) return;

        const channelName = getChannelName(originalText);

        // Create new container for the styled name
        const container = document.createElement('span');
        container.setAttribute('data-slack-channel', 'true');
        container.setAttribute('data-original-name', originalText);
        container.style.color = '#D1D2D3';

        // Add # prefix
        const hash = document.createElement('span');
        hash.className = 'slack-hash';
        hash.textContent = '# ';
        hash.style.color = '#888';
        hash.style.fontWeight = 'bold';
        hash.style.marginRight = '2px';
        container.appendChild(hash);

        // Add channel name
        const nameText = document.createTextNode(channelName);
        container.appendChild(nameText);

        // Replace the text node with our container
        parent.replaceChild(container, textNode);
        replaceCount++;
      } catch (err) {
        console.debug('Error replacing text node:', err);
      }
    });

    console.log('Snap-to-Slack: Replaced', replaceCount, 'names with channels');
  } catch (err) {
    console.error('Snap-to-Slack: Error in addChannelPrefixes:', err);
  }
}

function applyTransformations() {
  setSlackFavicon();
  setSlackTitle();
  injectCss();
  addChannelPrefixes();
}

function init() {
  chrome.storage.local.get(['isEnabled'], (result) => {
    console.log('Snap-to-Slack: isEnabled =', result.isEnabled);

    if (result.isEnabled) {
      // Apply initial transformations
      applyTransformations();

      // Watch for title and favicon changes in head
      const headObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          // Check if title changed
          if (mutation.type === 'childList' && mutation.target === document.head) {
            const titleElement = document.querySelector('title');
            if (titleElement && titleElement.textContent !== 'Slack | #general | Mukesh Soni') {
              setSlackTitle();
            }
            // Check if favicon was removed or changed
            const favicon = document.querySelector('link[rel*="icon"]');
            if (!favicon || !favicon.href.includes('slack-128.png')) {
              setSlackFavicon();
            }
          }
        }
      });

      headObserver.observe(document.head, { childList: true, subtree: true });

      // Watch for new contacts/channels being added to sidebar
      const bodyObserver = new MutationObserver(() => {
        addChannelPrefixes();
      });

      // Start observing after a short delay to let the page load
      setTimeout(() => {
        bodyObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
      }, 1000);

      // Also watch for title changes via property setter
      const originalTitle = Object.getOwnPropertyDescriptor(Document.prototype, 'title');
      Object.defineProperty(document, 'title', {
        get: originalTitle.get,
        set: function(newTitle) {
          originalTitle.set.call(this, 'Slack | #general | Mukesh Soni');
        }
      });
    } else {
      console.log('Snap-to-Slack: Extension is disabled. Click the extension icon to enable.');
    }
  });
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
