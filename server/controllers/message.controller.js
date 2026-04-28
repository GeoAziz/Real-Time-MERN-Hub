import Conversation from '../models/conversation.model.js';
import Message from '../models/message.model.js';
import { getReceiverSocketId, io } from '../socket/socket.js';
import validator from 'validator';
import xss from 'xss';
import cloudinary from '../utils/cloudinary.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

const getConversationMembers = (conversation) =>
  conversation.members?.length ? conversation.members : conversation.participants || [];

const uploadToCloudinary = (fileBuffer, resourceType = 'image') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    stream.end(fileBuffer);
  });

export const sendMessage = async (req, res) => {
  try {
    const rawMessage = String(req.body.message || '');
    const { id: conversationId } = req.params;
    const senderId = req.user._id;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const members = getConversationMembers(conversation).map((member) => member.toString());
    if (!members.includes(senderId.toString())) {
      return res.status(403).json({ error: 'You are not a member of this conversation' });
    }

    const senderSocketId = getReceiverSocketId(senderId.toString());

    let messageBody = validator.trim(xss(rawMessage));
    let messageType = String(req.body.type || 'text');

    if (req.file) {
      const resourceType = req.file.mimetype.startsWith('image/') ? 'image' : 'raw';
      const uploaded = await uploadToCloudinary(req.file.buffer, resourceType);
      messageBody = uploaded.secure_url;
      messageType = resourceType === 'image' ? 'image' : 'file';
    }

    if (!validator.isLength(messageBody, { min: 1, max: 2000 })) {
      return res.status(400).json({ error: 'Message must be between 1 and 2000 characters' });
    }

    const receiverId = conversation.type === 'group'
      ? null
      : members.find((memberId) => memberId !== senderId.toString()) || null;

    if (conversation.type === 'direct' && !receiverId) {
      return res.status(400).json({ error: 'Direct conversation requires two members' });
    }

    const newMessage = new Message({
      conversationId: conversation._id,
      senderId: senderId,
      receiverId: receiverId,
      message: messageBody,
      type: messageType,
    });
    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    const hasAnyRecipientOnline = members.some((memberId) => {
      if (memberId === senderId.toString()) return false;
      return Boolean(getReceiverSocketId(memberId));
    });

    newMessage.status = hasAnyRecipientOnline ? 'delivered' : 'sent';

    await Promise.all([conversation.save(), newMessage.save()]);

    if (senderSocketId) {
      io.to(conversation._id.toString()).except(senderSocketId).emit('newMessage', newMessage);
    } else {
      io.to(conversation._id.toString()).emit('newMessage', newMessage);
    }
    io.to(conversation._id.toString()).emit('message_status', {
      messageId: newMessage._id,
      conversationId: conversation._id,
      status: newMessage.status,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.log('error in sendMessage controller', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
export const getMessages = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const senderId = req.user._id;
    const cursor = req.query.cursor;
    const requestedLimit = Number(req.query.limit || DEFAULT_PAGE_SIZE);
    const limit = Math.min(Math.max(requestedLimit, 1), MAX_PAGE_SIZE);
    const conversationType = String(req.query.type || 'direct');

    if (cursor && !validator.isMongoId(String(cursor))) {
      return res.status(400).json({ error: 'Invalid cursor' });
    }

    const conversation = conversationType === 'group'
      ? await Conversation.findOne({ _id: conversationId, type: 'group' }).select('_id messages members participants type name')
      : await Conversation.findOne({ _id: conversationId }).select('_id messages members participants type name');

    if (!conversation) {
      return res.status(200).json({ messages: [], nextCursor: null, hasMore: false });
    }

    const members = getConversationMembers(conversation).map((member) => member.toString());
    if (!members.includes(senderId.toString())) {
      return res.status(403).json({ error: 'You are not a member of this conversation' });
    }

    // Backfill existing conversations so legacy messages become queryable by conversationId.
    if (conversation.messages?.length) {
      await Message.updateMany(
        {
          _id: { $in: conversation.messages },
          conversationId: { $exists: false },
        },
        { $set: { conversationId: conversation._id } }
      );
    }

    const query = { conversationId: conversation._id };
    if (cursor) {
      query._id = { $lt: cursor };
    }

    const messagesDesc = await Message.find(query).sort({ _id: -1 }).limit(limit + 1);
    const hasMore = messagesDesc.length > limit;
    const pageSlice = hasMore ? messagesDesc.slice(0, limit) : messagesDesc;
    const messages = pageSlice.reverse();
    const nextCursor = hasMore ? pageSlice[pageSlice.length - 1]._id : null;

    res.status(200).json({ messages, nextCursor, hasMore });
  } catch (error) {
    console.log('error in getMessages controller', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const searchMessages = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();

    if (!validator.isLength(q, { min: 3, max: 100 })) {
      return res.status(400).json({ error: 'Search query must be between 3 and 100 characters' });
    }

    const messages = await Message.find({ $text: { $search: q } })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({ messages });
  } catch (error) {
    console.log('error in searchMessages controller', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
