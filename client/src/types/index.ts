export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  vipLevel: 'none' | 'VIP' | 'SVIP';
  avatar: string;
  bio: string;
  diamonds: number;
  followers: string[];
  following: string[];
  friends: string[] | User[];
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Seat {
  _id: string;
  index: number;
  user: User | null;
}

export interface Room {
  _id: string;
  title: string;
  description?: string;
  host: User;
  type: 'voice' | 'stream';
  category: string;
  isActive: boolean;
  maxSeats: number;
  seats: Seat[];
  viewersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  sender: User;
  recipient?: User | null;
  roomId?: string | null;
  content: string;
  isGift: boolean;
  giftDetails?: {
    giftId: string;
    name: string;
    cost: number;
    icon: string;
  };
  createdAt: string;
}

export interface Gift {
  _id: string;
  name: string;
  cost: number;
  icon: string;
  effectClass: string;
}
