import { useEffect } from 'react';

import { useSocketContext } from '../context/SocketContext';
import useConversation from '../zustand/useConversation';
import notificationSound from '../assets/sounds/notification.mp3';
const useListenMessages = () => {
  const { socket } = useSocketContext();
  const { setMessages } = useConversation();

  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      newMessage.shouldShake = true;
      const sound = new Audio(notificationSound);
      sound.play();
      if (document.visibilityState === 'hidden' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('New message received', {
          body: newMessage.message,
        });
      }
      setMessages((prev) => [...prev, newMessage]);
    };

    const handleMessageStatus = ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((message) =>
          message._id === messageId ? { ...message, status } : message
        )
      );
    };

    socket?.on('newMessage', handleNewMessage);
    socket?.on('message_status', handleMessageStatus);

    return () => {
      socket?.off('newMessage', handleNewMessage);
      socket?.off('message_status', handleMessageStatus);
    };
  }, [socket, setMessages]);
};
export default useListenMessages;
