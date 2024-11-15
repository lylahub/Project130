import React, { createContext, useEffect, useRef } from 'react';
import { useContext } from 'react';
import { useUser } from './userContext.js';

export const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { uid, setUid} = useUser();
  const socketRef = useRef(null);

  useEffect(() => {
    if (uid) {  // Ensure uid is available
      const socketUrl = process.env.REACT_APP_WEBSOCKET_URL || "ws://localhost:3001"; // Use env variable for WebSocket URL, fallback to localhost for local dev
      socketRef.current = new WebSocket(socketUrl);

      socketRef.current.onopen = () => {
        console.log("Connected to WebSocket");

        const connectMessage = {
          action: "connect",
          userId: uid,
        };
        socketRef.current.send(JSON.stringify(connectMessage));
      };

      socketRef.current.onclose = () => console.log("WebSocket disconnected");

      return () => {
        socketRef.current.close();
      };
    }
  }, [uid]); // Ensure user.uid is available

  return (
    <WebSocketContext.Provider value={socketRef.current}>
      {children}
    </WebSocketContext.Provider>
  );
};
