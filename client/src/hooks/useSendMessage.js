import { useState } from 'react';
import useConversation from '../zustand/useConversation';
import toast from 'react-hot-toast';

const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const { setMessages, selectedConversation } = useConversation();

  const sendMessage = async ({ message, file } = {}) => {
    setLoading(true);
    try {
      const isMultipart = Boolean(file);
      const res = await fetch(`/api/messages/send/${selectedConversation._id}`, {
        method: 'POST',
        headers: isMultipart ? undefined : { 'Content-Type': 'application/json' },
        body: isMultipart
          ? (() => {
              const formData = new FormData();
              formData.append('message', message || '');
              formData.append('type', file?.type?.startsWith('image/') ? 'image' : 'file');
              formData.append('file', file);
              return formData;
            })()
          : JSON.stringify({ message, type: 'text' }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages((prev) => [...prev, data]);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading };
};
export default useSendMessage;
