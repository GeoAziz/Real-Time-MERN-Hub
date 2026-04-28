import { useAuthContext } from '../../context/AuthContext';
import { extractTime } from '../../utils/extractTime';
import useConversation from '../../zustand/useConversation';
import DOMPurify from 'dompurify';
import { BsCheck, BsCheckAll } from 'react-icons/bs';

const Message = ({ message }) => {
  const { authUser } = useAuthContext();
  const { selectedConversation } = useConversation();
  const fromMe = message?.senderId === authUser?._id;
  const chatClassName = fromMe ? 'chat-end' : 'chat-start';
  const formattedTime = extractTime(message.createdAt);
  const profilePic = fromMe
    ? authUser.profilePic
    : selectedConversation?.profilePic;
  const bubbleBgColor = fromMe ? 'bg-blue-500' : '';
  const shakeClass = message.shouldShake ? 'shake' : '';
  const safeMessage = DOMPurify.sanitize(message.message || '');
  const isImage = message.type === 'image';
  const isFile = message.type === 'file';
  return (
    <div className={`chat ${chatClassName}`}>
      <div className="chat-image avatar">
        <div className="w-10 rounded-full">
          <img src={profilePic} />
        </div>
      </div>
      <div
        className={`chat-bubble text-white pb-1  ${bubbleBgColor} ${shakeClass}`}
      >
        {isImage ? (
          <img
            src={message.message}
            alt="shared attachment"
            className="max-w-xs rounded-lg"
          />
        ) : isFile ? (
          <a href={message.message} target="_blank" rel="noreferrer" className="underline">
            Download file
          </a>
        ) : (
          safeMessage
        )}
      </div>
      <div className="chat-footer text-xs flex gap-1 items-center opacity-50">
        {formattedTime}
        {fromMe ? (
          <span className="ml-1 flex items-center">
            {message.status === 'read' ? (
              <BsCheckAll className="text-sky-300" />
            ) : message.status === 'delivered' ? (
              <BsCheckAll className="text-slate-200" />
            ) : (
              <BsCheck className="text-slate-200" />
            )}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default Message;
