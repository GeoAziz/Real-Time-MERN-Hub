import Conversation from './Conversation.jsx';
import useGetConversations from '../../hooks/useGetConversations';
import { getRandomEmoji } from '../../utils/emojis.js';
import ConversationSkeleton from '../skeletons/ConversationSkeleton.jsx';

const Conversations = ({ conversations: externalConversations, loading: externalLoading }) => {
  const { loading, conversations } = useGetConversations();
  const visibleConversations = externalConversations || conversations;
  const visibleLoading = typeof externalLoading === 'boolean' ? externalLoading : loading;

  return (
    <div className="py-2 flex flex-col overflow-auto">
      {visibleLoading
        ? [...Array(6)].map((_, idx) => <ConversationSkeleton key={idx} />)
        : visibleConversations.map((conversation, idx) => (
            <Conversation
              key={conversation._id}
              conversation={conversation}
              emoji={getRandomEmoji()}
              lastIdx={idx === visibleConversations.length - 1}
            />
          ))}
    </div>
  );
};

export default Conversations;
