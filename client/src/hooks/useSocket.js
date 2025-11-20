import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function useSocket() {
  const socketRef = useRef(null);
  useEffect(() => {
    socketRef.current = io(process.env.VITE_API_WS || 'http://localhost:5000');
    return () => socketRef.current?.disconnect();
  }, []);
  return socketRef;
}
