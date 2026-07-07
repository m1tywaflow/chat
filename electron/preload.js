const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  notifyNewMessage(data) {
    ipcRenderer.send("new-message", data);
  },

  onNotification(callback) {
    ipcRenderer.on("show-notification", (_, data) => {
      callback(data);
    });
  },

  resetUnread() {
    ipcRenderer.send("reset-unread");
  },

  onOpenChat(callback) {
    ipcRenderer.on("open-chat", (_, chatId) => {
      callback(chatId);
    });
  },


  openChatFromNotification(chatId) {
    ipcRenderer.send("open-chat-request", chatId);
  },
});
