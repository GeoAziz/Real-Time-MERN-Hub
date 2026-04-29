import { useEffect, useState } from 'react';
import { useAuthContext } from './AuthContext';
import { SocketContext } from './SocketContext';
import io from 'socket.io-client';

const SOCKET_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { authUser } = useAuthContext();

  useEffect(() => {
    if (authUser) {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }

      const newSocket = io(SOCKET_URL, {
        query: {
          userId: authUser._id,
        },
      });

      setSocket(newSocket);
      newSocket.on('getOnlineUsers', (users) => {
        setOnlineUsers(users);
      });

      return () => {
        newSocket.close();
      };
    } else {
      setSocket((currentSocket) => {
        if (currentSocket) {
          currentSocket.close();
        }
        return null;
      });
    }
  }, [authUser]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
