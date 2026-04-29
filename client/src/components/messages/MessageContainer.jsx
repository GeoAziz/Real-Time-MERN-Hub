import { useEffect, useState } from 'react';
import useConversation from '../../zustand/useConversation.js';
import MessageInput from './MessageInput.jsx';
import Messages from './Messages.jsx';
import { TiMessages } from 'react-icons/ti';
import { useAuthContext } from '../../context/AuthContext.jsx';
import { useSocketContext } from '../../context/SocketContext';
const MessageContainer = () => {
  const { selectedConversation, setSelectedConversation } = useConversation();
  const { socket } = useSocketContext();
  const [typingUserId, setTypingUserId] = useState(null);

  useEffect(() => {
    //cleanup functtion(unmounts)
    return () => setSelectedConversation(null);
  }, [setSelectedConversation]);

  useEffect(() => {
    if (!socket || !selectedConversation?._id) return;

    setTypingUserId(null);

    socket.emit('conversation_opened', {
      conversationId: selectedConversation._id,
    });

    const handleTypingState = ({ userId, isTyping }) => {
      setTypingUserId(isTyping ? userId : null);
    };

    const handleMessageStatus = () => {
      // Status updates can be surfaced later in the message bubble UI.
    };

    socket.on('typing_state', handleTypingState);
    socket.on('message_status', handleMessageStatus);

    return () => {
      socket.emit('conversation_closed', {
        conversationId: selectedConversation._id,
      });
      socket.off('typing_state', handleTypingState);
      socket.off('message_status', handleMessageStatus);
    };
  }, [socket, selectedConversation?._id]);

  return (
    <div className="md:min-w-[450px] flex flex-col">
      {!selectedConversation ? (
        <NoChatSelected />
      ) : (
        <>
          {/* Header */}
          <div className="bg-slate-500 px-4 py-2 mb-2">
            <span className="label-text">To:</span>{' '}
            <span className="text-gray-900 font-bold">
              {selectedConversation.displayName || selectedConversation.fullName}
            </span>
          </div>
          {typingUserId ? (
            <div className="px-4 pb-2 text-xs text-slate-200 italic">
              {selectedConversation.displayName || selectedConversation.fullName} is typing...
            </div>
          ) : null}
          <Messages />
          <MessageInput />
        </>
      )}
    </div>
  );
};

export default MessageContainer;

// No chat selected
const NoChatSelected = () => {
  const { authUser } = useAuthContext();
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="px-4 text-center sm:text-lg md:text-xl text-gray-200 font-semibold flex flex-col items-center gap-2">
        <p>Welcome 👋{authUser.fullName} ❄</p>
        <p>Select a chat to start messaging</p>
        <TiMessages className="text-3xl md:text-6xl text-center" />
      </div>
    </div>
  );
};
