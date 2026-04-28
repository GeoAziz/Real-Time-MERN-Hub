import Conversations from './Conversations.jsx';
import LogoutButton from './LogoutButton.jsx';
import SearchInput from './SearchInput.jsx';
import useGetConversations from '../../hooks/useGetConversations';
import useConversation from '../../zustand/useConversation';
import toast from 'react-hot-toast';

const Sidebar = () => {
  const { conversations, loading, refetch } = useGetConversations();
  const { setSelectedConversation } = useConversation();

  const createDirectChat = async () => {
    const username = window.prompt('Enter the username to start a chat');
    if (!username) return;

    const res = await fetch('/api/conversations/direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    if (data.error) {
      toast.error(data.error);
      return;
    }

    setSelectedConversation(data);
    refetch();
  };

  const createGroupChat = async () => {
    const name = window.prompt('Group name');
    const usernames = window.prompt('Comma-separated usernames to add to the group');
    if (!name || !usernames) return;

    const res = await fetch('/api/conversations/group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        memberUsernames: usernames.split(',').map((value) => value.trim()),
      }),
    });
    const data = await res.json();
    if (data.error) {
      toast.error(data.error);
      return;
    }

    setSelectedConversation(data);
    refetch();
  };

  return (
    <div className="border-r border-slate-500 p-4 flex flex-col">
      <SearchInput />
      <div className="flex gap-2 my-3">
        <button type="button" className="btn btn-xs btn-outline" onClick={createDirectChat}>
          New Chat
        </button>
        <button type="button" className="btn btn-xs btn-outline" onClick={createGroupChat}>
          New Group
        </button>
      </div>
      <div className="divider px-3"></div>
      <Conversations conversations={conversations} loading={loading} />
      <LogoutButton />
    </div>
  );
};

export default Sidebar;
