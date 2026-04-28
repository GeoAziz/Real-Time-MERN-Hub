import { createContext, useContext, useEffect, useState } from 'react';
import { useAuthContext } from './AuthContext';
import io from 'socket.io-client';

const SOCKET_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';

export const SocketContext = createContext();
export const useSocketContext = () => {
  return useContext(SocketContext);
};
export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { authUser } = useAuthContext();
  useEffect(() => {
    if (authUser) {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }

      //creating a socket connection for client and passing backend url
      const socket = io(SOCKET_URL, {
        query: {
          userId: authUser._id,
        },
      });

      setSocket(socket);
      socket.on('getOnlineUsers', (users) => {
        setOnlineUsers(users);
      });
      return () => {
        socket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [authUser]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
