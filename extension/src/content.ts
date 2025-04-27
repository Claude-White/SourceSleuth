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
// import React from "react"
// import { createRoot } from "react-dom/client"

// import Modal from "./Modal"

// chrome.runtime.onMessage.addListener((message) => {
//   if (message.type === "SHOW_MODAL") {
//     // Prevent multiple modals
//     if (document.getElementById("my-extension-modal-root")) return

//     const container = document.createElement("div")
//     container.id = "my-extension-modal-root"
//     document.body.appendChild(container)

//     // Create a root
//     const root = createRoot(container)

//     // Function to handle closing the modal
//     const handleClose = () => {
//       root.unmount()
//       document.body.removeChild(container)
//     }

//     // Render the Modal component - using the correct property name
//     root.render(
//       React.createElement(Modal, {
//         text: message.data || "", // Changed from message.text to message.data
//         onClose: handleClose
//       })
//     )
//   }
// })
