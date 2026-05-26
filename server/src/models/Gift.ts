import { Schema, model } from 'mongoose';

const giftSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  cost: {
    type: Number,
    required: true,
  },
  icon: {
    type: String, // String identifier or emojis (e.g. '💎', '👑', '🚀', '❤️')
    required: true,
  },
  effectClass: {
    type: String, // visual style to load in the client (e.g. 'crown-glow', 'cyber-rain')
    default: 'glow-fade',
  }
}, {
  timestamps: true,
});

export const Gift = model('Gift', giftSchema);
export default Gift;
