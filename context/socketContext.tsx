import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./authContext";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // 1. Setup URL
    const rawUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";
    const socketUrl = rawUrl.replace("/api", "");

    console.log("🔌 Connecting Socket to:", socketUrl);

    // 2. Initialize
    const newSocket = io(socketUrl, {
      transports: ["websocket"],
      reconnection: true,
    });

    setSocket(newSocket);

    // 3. Join Rooms based on Role
    if (user) {
      // If I am a Logistics Manager (Dispatcher)
      if (user.role === "DISPATCHER") {
        // 1. Join Personal Room (Keep this for direct assignments later)
        const roomName = `dispatcher_${user.id}`;
        newSocket.emit("join_room", roomName);

        // 2. ✅ JOIN THE GLOBAL ROOM (Add this line)
        // This allows you to hear the "new_dispatcher_request" event we just added above
        newSocket.emit("join_room", "dispatchers");

        console.log("📍 Dispatcher connected to Command Center");
        newSocket.emit("join_room", `restaurant_${user.restaurant?.id}`);
      }
    }

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
