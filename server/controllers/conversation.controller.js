import Conversation from '../models/conversation.model.js';
import User from '../models/user.model.js';

const buildConversationView = (conversation, currentUserId) => {
  const members = conversation.members?.length
    ? conversation.members
    : conversation.participants || [];
  const isGroup = conversation.type === 'group';
  const otherMember = members.find(
    (member) => member._id?.toString?.() !== currentUserId.toString()
  );

  return {
    ...conversation.toObject(),
    members,
    displayName: isGroup ? conversation.name : otherMember?.fullName || 'Chat',
    profilePic: isGroup
      ? 'https://ui-avatars.com/api/?name=' + encodeURIComponent(conversation.name || 'Group')
      : otherMember?.profilePic || '',
    onlineMemberId: isGroup ? null : otherMember?._id || null,
  };
};

export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const conversations = await Conversation.find({
      $or: [
        { members: currentUserId },
        { participants: currentUserId },
      ],
    })
      .populate('members', 'fullName username profilePic')
      .populate('participants', 'fullName username profilePic')
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations.map((conversation) => buildConversationView(conversation, currentUserId)));
  } catch (error) {
    console.log('error in getConversations controller', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createGroupConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { name, memberUsernames = [], memberIds = [] } = req.body;
    const trimmedName = String(name || '').trim();

    if (trimmedName.length < 2) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const resolvedUsers = memberIds.length
      ? await User.find({ _id: { $in: memberIds } }).select('_id')
      : await User.find({ username: { $in: memberUsernames.map((username) => String(username).trim()).filter(Boolean) } }).select('_id');

    const uniqueMemberIds = Array.from(
      new Set([
        currentUserId.toString(),
        ...resolvedUsers.map((user) => user._id.toString()),
      ])
    );

    if (uniqueMemberIds.length < 3) {
      return res.status(400).json({ error: 'Group chats require at least 2 other members' });
    }

    if (resolvedUsers.length + 1 !== uniqueMemberIds.length) {
      return res.status(400).json({ error: 'One or more members are invalid' });
    }

    const conversation = await Conversation.create({
      type: 'group',
      name: trimmedName,
      createdBy: currentUserId,
      members: uniqueMemberIds,
      participants: uniqueMemberIds,
    });

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('members', 'fullName username profilePic')
      .populate('participants', 'fullName username profilePic');

    res.status(201).json(buildConversationView(populatedConversation, currentUserId));
  } catch (error) {
    console.log('error in createGroupConversation controller', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createDirectConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { userId, username } = req.body;

    const targetUser = userId
      ? await User.findById(userId).select('_id')
      : await User.findOne({ username: String(username || '').trim() }).select('_id');

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser._id.toString() === currentUserId.toString()) {
      return res.status(400).json({ error: 'You cannot message yourself' });
    }

    let conversation = await Conversation.findOne({
      type: 'direct',
      members: { $all: [currentUserId, targetUser._id] },
    })
      .populate('members', 'fullName username profilePic')
      .populate('participants', 'fullName username profilePic');

    if (!conversation) {
      conversation = await Conversation.create({
        type: 'direct',
        createdBy: currentUserId,
        members: [currentUserId, targetUser._id],
        participants: [currentUserId, targetUser._id],
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('members', 'fullName username profilePic')
        .populate('participants', 'fullName username profilePic');
    }

    res.status(201).json(buildConversationView(conversation, currentUserId));
  } catch (error) {
    console.log('error in createDirectConversation controller', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
