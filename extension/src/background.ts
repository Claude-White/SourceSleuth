chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'HIGHLIGHTED_TEXT') {
      chrome.storage.local.set({ highlightedText: message.text });
    }
  });
// chrome.runtime.onInstalled.addListener(() => {
//   chrome.contextMenus.create({
//     id: "myContextMenuId",
//     title: "Source Sleuth",
//     contexts: ["selection"]
//   })
// })

// chrome.contextMenus.onClicked.addListener((info, tab) => {
//   if (info.menuItemId === "myContextMenuId" && info.selectionText) {
//     // Send the selected text to the content script in the current tab
//     chrome.tabs.sendMessage(tab.id, {
//       type: "SHOW_MODAL",
//       data: info.selectionText
//     })
//   }
// })
