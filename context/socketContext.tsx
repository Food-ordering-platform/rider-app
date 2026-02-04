// food-ordering-platform/rider-app/rider-app-work-branch/context/socketContext.tsx

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "./authContext"; 

// Replace with your actual backend URL
const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || "https://food-ordering-app.up.railway.app";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, user } = useAuth(); // Ensure you check if user is logged in

  useEffect(() => {
    let socketInstance: Socket;

    const connectSocket = async () => {
      if (!isAuthenticated || !user) return;

      const token = await SecureStore.getItemAsync("auth_token");
      
      socketInstance = io(SOCKET_URL, {
        auth: { token }, // 👈 Send token for auth
        transports: ["websocket"],
      });

      socketInstance.on("connect", () => {
        console.log("✅ Socket connected:", socketInstance.id);
        setIsConnected(true);
      });

      socketInstance.on("disconnect", () => {
        console.log("❌ Socket disconnected");
        setIsConnected(false);
      });

      setSocket(socketInstance);
    };

    connectSocket();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);