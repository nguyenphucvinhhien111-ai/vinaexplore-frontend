import React, { createContext, useContext, useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import useAuthStore from "@/store/useAuthStore";
import type { Notification } from "@/types/database";

interface WebSocketContextType {
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  stompClient: Client | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stompClient, setStompClient] = useState<Client | null>(null);

  useEffect(() => {
    if (!user?.username) {
      if (stompClient) {
        stompClient.deactivate();
        setStompClient(null);
      }
      return;
    }

    const socket = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      debug: () => {},
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/user/${user.username}/queue/notifications`, (message) => {
          if (message.body) {
            const newNotif = JSON.parse(message.body);
            setNotifications((prev) => [newNotif, ...prev]);
            window.dispatchEvent(new CustomEvent("NEW_NOTIFICATION", { detail: newNotif }));
          }
        });

        client.subscribe("/topic/locations", (message) => {
          if (message.body) {
            const newLocation = JSON.parse(message.body);
            window.dispatchEvent(new CustomEvent("NEW_LOCATION_PUBLISHED", { detail: newLocation }));
          }
        });

        client.subscribe("/topic/users/stats", (message) => {
          if (message.body) {
            const data = JSON.parse(message.body);
            window.dispatchEvent(new CustomEvent("REFRESH_USER_STATS", { detail: data }));
          }
        });

        client.subscribe("/topic/locations/stats", (message) => {
          if (message.body) {
            const stats = JSON.parse(message.body);
            window.dispatchEvent(new CustomEvent("LOCATION_STATS_UPDATE", { detail: stats }));
          }
        });

        client.subscribe("/topic/locations/reviews", (message) => {
          if (message.body) {
            const review = JSON.parse(message.body);
            window.dispatchEvent(new CustomEvent("NEW_REVIEW_PUBLISHED", { detail: review }));
          }
        });

        client.subscribe("/topic/admin/edits", (message) => {
          if (message.body) {
            const edit = JSON.parse(message.body);
            window.dispatchEvent(new CustomEvent("NEW_EDIT_PROPOSAL", { detail: edit }));
          }
        });

        client.subscribe("/topic/users/avatar", (message) => {
          if (message.body) {
            const data = JSON.parse(message.body);
            window.dispatchEvent(new CustomEvent("USER_AVATAR_UPDATED", { detail: data }));
            
            // If it's the current user, update the store
            const store = useAuthStore.getState();
            if (store.user && store.user.id === data.userId) {
              store.login({ ...store.user, avatarUrl: data.avatarUrl }, localStorage.getItem("token") || "");
            }
          }
        });

        client.subscribe(`/user/${user.username}/queue/status`, (message) => {
          if (message.body === "FORCE_LOGOUT") {
            alert("Tài khoản của bạn đã bị vô hiệu hóa hoặc thay đổi quyền. Vui lòng đăng nhập lại!");
            useAuthStore.getState().logout();
            window.location.href = "/login";
          }
        });
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, [user?.username]);

  return (
    <WebSocketContext.Provider value={{ notifications, setNotifications, stompClient }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
