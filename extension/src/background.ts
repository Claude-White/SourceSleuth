chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'HIGHLIGHTED_TEXT') {
      chrome.storage.local.set({ highlightedText: message.text });
    }
  });