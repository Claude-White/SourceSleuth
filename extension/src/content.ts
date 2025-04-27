function updateSelection() {
    const selectedText = window.getSelection().toString();
    chrome.storage.local.set({ highlightedText: selectedText });
    chrome.runtime.sendMessage({
      type: 'HIGHLIGHTED_TEXT',
      text: selectedText
    });
  }
  
  document.addEventListener('mouseup', updateSelection);
  document.addEventListener('keyup', updateSelection);
  document.addEventListener('selectionchange', updateSelection);
