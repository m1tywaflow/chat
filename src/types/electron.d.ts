export {};
declare global {
  interface Window {
    electronAPI?: {
      notifyNewMessage: (payload: {
        title: string;
        body: string;
        chatId: string;
      }) => void;
      resetUnread: () => void;
      onOpenChat: (callback: (chatId: string) => void) => void;
      onNotification: (
        callback: (data: {
          title?: string;
          body?: string;
          chatId?: string;
          avatar?: string;
        }) => void
      ) => void;
      openChatFromNotification: (chatId: string) => void;
      notifyToastCountChanged: (count: number) => void;
    };
  }
}
