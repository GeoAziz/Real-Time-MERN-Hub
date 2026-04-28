const ConversationSkeleton = () => {
  return (
    <div className="w-full p-2 flex items-center gap-3">
      <div className="skeleton w-12 h-12 rounded-full shrink-0" />
      <div className="flex-1">
        <div className="skeleton h-4 w-24 mb-2" />
        <div className="skeleton h-3 w-40" />
      </div>
    </div>
  );
};

export default ConversationSkeleton;
