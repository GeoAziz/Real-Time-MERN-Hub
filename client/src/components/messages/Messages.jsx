import { useEffect, useRef } from 'react';
import useGetMessages from '../../hooks/useGetMessages.js';
import MessageSkeleton from '../skeletons/MessageSkeleton.jsx';
import Message from './Message.jsx';
import useListenMessages from '../../hooks/useListenMessages.js';

const Messages = () => {
  const { messages, loading, loadingMore, hasMore, loadOlder } = useGetMessages();
  useListenMessages();
  const lastMessageRef = useRef();
  const containerRef = useRef();

  const handleScroll = async () => {
    if (!containerRef.current || loading || loadingMore || !hasMore) return;
    const { scrollTop, scrollHeight } = containerRef.current;

    if (scrollTop <= 60) {
      const previousHeight = scrollHeight;
      await loadOlder();
      requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const nextHeight = containerRef.current.scrollHeight;
        containerRef.current.scrollTop = nextHeight - previousHeight;
      });
    }
  };

  useEffect(() => {
    setTimeout(() => {
      lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="px-4 flex-1 overflow-auto"
    >
      {loadingMore && (
        <div className="w-full flex justify-center py-2">
          <span className="loading loading-spinner loading-sm" />
        </div>
      )}
      {!loading &&
        messages.length > 0 &&
        messages.map((message) => (
          <div key={message._id} ref={lastMessageRef}>
            <Message message={message} />
          </div>
        ))}
      {loading && [...Array(5)].map((_, idx) => <MessageSkeleton key={idx} />)}
      {!loading && messages.length === 0 && (
        <p className="text-center mt-40 font-semibold text-neutral-200">
          No chat yet! Send a message to start the conversation 💬
        </p>
      )}
    </div>
  );
};

export default Messages;
