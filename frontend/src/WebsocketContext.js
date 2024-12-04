/**
 * @file WebSocketProvider.js
 * @description Provides a WebSocket connection context for real-time communication within the application.
 */

import React, { createContext, useEffect, useRef } from 'react';
import { useContext } from 'react';
import { useUser } from './userContext.js';

export const WebSocketContext = createContext(null);

/**
 * WebSocketProvider Component
 *
 * @component
 * @description Wraps the application with a WebSocket context, establishing a WebSocket connection for real-time communication.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components that will consume the WebSocket context.
 * @returns {JSX.Element} The WebSocketProvider component.
 */
export const WebSocketProvider = ({ children }) => {
  const { uid, setUid} = useUser();
  const socketRef = useRef(null);
  const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3001';

  /**
   * Establishes and manages the WebSocket connection.
   * Sends a connection message with the user ID on connection.
   * Closes the WebSocket connection when the component unmounts or `uid` changes.
   */
  useEffect(() => {
    if (uid) {  // Ensure uid is available
      socketRef.current = new WebSocket(WEBSOCKET_URL);

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
