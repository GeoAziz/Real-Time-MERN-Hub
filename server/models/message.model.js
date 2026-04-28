import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file'],
      default: 'text',
    },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, _id: -1 });
messageSchema.index({ message: 'text' });

const Message = mongoose.model('Message', messageSchema);

export default Message;
