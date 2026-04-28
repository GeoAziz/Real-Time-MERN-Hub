import { useEffect, useRef, useState } from 'react';
import { BsSend, BsPaperclip } from 'react-icons/bs';
import useSendMessage from '../../hooks/useSendMessage';
import { useSocketContext } from '../../context/SocketContext';
import useConversation from '../../zustand/useConversation';

const MessageInput = () => {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const { loading, sendMessage } = useSendMessage();
  const { socket } = useSocketContext();
  const { selectedConversation } = useConversation();
  const typingTimerRef = useRef(null);
  const inactivityTimerRef = useRef(null);

  const stopTyping = () => {
    if (socket && selectedConversation?._id) {
      socket.emit('typing_stop', { conversationId: selectedConversation._id });
    }
  };

  const handleTyping = () => {
    if (!socket || !selectedConversation?._id) return;

    socket.emit('typing_start', { conversationId: selectedConversation._id });

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      stopTyping();
    }, 500);

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  useEffect(() => {
    return () => {
      stopTyping();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [socket, selectedConversation?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message && !file) return;
    await sendMessage({ message, file });
    setMessage('');
    setFile(null);
    stopTyping();
  };

  return (
    <form className="px-4 my-3" onSubmit={handleSubmit}>
      <div className="w-full relative">
        <input
          type="text"
          className="border text-sm rounded-lg block w-full p-2.5  bg-gray-700 border-gray-600 text-white"
          placeholder="Send a message"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onBlur={stopTyping}
        />
        <input
          type="file"
          className="hidden"
          id="chat-upload"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <label
          htmlFor="chat-upload"
          className="absolute inset-y-0 left-0 flex items-center pl-3 cursor-pointer text-slate-300"
        >
          <BsPaperclip />
        </label>
        <button
          type="submit"
          className="absolute inset-y-0 end-0 flex items-center pe-3"
        >
          {loading ? (
            <div className="loading loading-spinner"></div>
          ) : (
            <BsSend />
          )}
        </button>
      </div>
    </form>
  );
};
export default MessageInput;
