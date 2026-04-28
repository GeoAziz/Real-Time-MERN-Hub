import { useState } from 'react';
import { IoSearchSharp } from 'react-icons/io5';
import useConversation from '../../zustand/useConversation';
import toast from 'react-hot-toast';
import useGetConversations from '../../hooks/useGetConversations';
const SearchInput = () => {
  const [search, setSearch] = useState('');
  const { setSelectedConversation } = useConversation();
  const { conversations } = useGetConversations();
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!search) return;
    if (search.length < 3) {
      toast.error('Search term must be at least 3 characters long');
      return;
    }

    try {
      const res = await fetch(`/api/messages/search?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const firstMessage = data.messages?.[0];
      if (!firstMessage) {
        toast.error('No matching messages found');
        return;
      }

      const conversation = conversations.find(
        (c) => c._id === String(firstMessage.conversationId)
      );

      if (conversation) {
        setSelectedConversation(conversation);
        setSearch('');
      } else {
        toast.error('Conversation not found in sidebar');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };
  return (
    <form className="flex items-center gap-2" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Search…"
        className="input input-bordered rounded-full"
        onChange={(e) => setSearch(e.target.value)}
      />
      <button type="submit" className="btn btn-circle bg-sky-500 text-white">
        <IoSearchSharp className="w-6 h-6 outline-none" />
      </button>
    </form>
  );
};

export default SearchInput;
