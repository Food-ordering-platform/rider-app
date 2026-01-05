import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './authContext';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // 1. Get the URL from Environment Variables
    const rawUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";
    
    // 2. CLEAN THE URL: Socket.io needs the "Root" (no /api)
    // If url is "https://app.com/api", this makes it "https://app.com"
    const socketUrl = rawUrl.replace('/api', '');

    console.log("🔌 Connecting Socket to:", socketUrl);

    // 3. Initialize Socket
    const newSocket = io(socketUrl, {
      transports: ['websocket'], // Force websocket to avoid polling lag
      reconnection: true,
      reconnectionAttempts: 5,
    });

    setSocket(newSocket);

    // 4. Join the "Restaurant Room" if user is logged in
    if (user?.restaurant?.id) {
      const roomName = `restaurant_${user.restaurant.id}`;
      newSocket.emit("join_room", roomName);
      console.log("🟢 Joining Socket Room:", roomName);
    }

    // 5. Cleanup on Unmount
    return () => {
      console.log("🔴 Disconnecting Socket");
      newSocket.disconnect();
    };
  }, [user]); // Re-run if user changes (e.g. login/logout)

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);