import { Schema, model } from 'mongoose';

const seatSchema = new Schema({
  index: {
    type: Number,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
});

const roomSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  host: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['voice', 'stream'],
    required: true,
  },
  category: {
    type: String,
    default: 'Social',
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  maxSeats: {
    type: Number,
    default: 8,
  },
  seats: {
    type: [seatSchema],
    default: function() {
      // By default create seats for voice rooms
      const arr = [];
      for (let i = 0; i < 8; i++) {
        arr.push({ index: i, user: null });
      }
      return arr;
    }
  },
  viewersCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

export const Room = model('Room', roomSchema);
export default Room;
