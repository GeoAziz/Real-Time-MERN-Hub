import { useCallback, useEffect, useState } from 'react';
import useConversation from '../zustand/useConversation';
import toast from 'react-hot-toast';

const PAGE_SIZE = 20;

const useGetMessages = () => {
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const { messages, setMessages, selectedConversation } = useConversation();

  const getMessages = useCallback(
    async (cursor = null, isLoadMore = false) => {
      if (!selectedConversation?._id) return;

      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
        params.set('type', selectedConversation?.type || 'direct');
        if (cursor) params.set('cursor', cursor);

        const res = await fetch(
          `/api/messages/${selectedConversation._id}?${params.toString()}`
        );
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setNextCursor(data.nextCursor || null);
        setHasMore(Boolean(data.hasMore));

        if (isLoadMore) {
          setMessages((prev) => [...data.messages, ...prev]);
        } else {
          setMessages(data.messages || []);
        }
      } catch (error) {
        toast.error(error.message);
      } finally {
        if (isLoadMore) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [selectedConversation?._id, selectedConversation?.type, setMessages]
  );

  const loadOlder = useCallback(async () => {
    if (!nextCursor || loadingMore || !hasMore) return;
    await getMessages(nextCursor, true);
  }, [nextCursor, loadingMore, hasMore, getMessages]);

  useEffect(() => {
    setMessages([]);
    setNextCursor(null);
    setHasMore(false);

    if (selectedConversation?._id) {
      getMessages();
    }
  }, [selectedConversation?._id, setMessages, getMessages]);

  return { messages, loading, loadingMore, hasMore, loadOlder };
};

export default useGetMessages;
