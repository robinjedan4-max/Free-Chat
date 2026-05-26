import { Schema, model } from 'mongoose';

const messageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    default: null,
    index: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  isGift: {
    type: Boolean,
    default: false,
  },
  giftDetails: {
    giftId: { type: Schema.Types.ObjectId, ref: 'Gift' },
    name: { type: String },
    cost: { type: Number },
    icon: { type: String }
  }
}, {
  timestamps: true,
});

// Speed up fetching recent logs inside rooms or direct chats
messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

export const Message = model('Message', messageSchema);
export default Message;
