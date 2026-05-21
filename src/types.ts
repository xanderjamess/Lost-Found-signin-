export type ItemStatus = 'pending' | 'lost' | 'found' | 'claimed' | 'under-review' | 'declined';

export interface Comment {
  id: string;
  itemId: string;
  userId: string;
  userName: string;
  userRole: 'student' | 'admin';
  content: string;
  date: string;
  isDeleted?: boolean;
  isFlagged?: boolean;
  isHidden?: boolean;
  parentId?: string;
  replies?: Comment[];
}

export interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  status: ItemStatus;
  type: 'lost' | 'found';
  imageUrl?: string;
  reporterId: string;
  currentPossession?: 'reporter' | 'csc-office';
  claimedAt?: string;
  claimedBy?: string;
  approvedBy?: string;
  isArchived?: boolean;
  createdAt?: string;
  comments?: Comment[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  avatar?: string;
  studentId?: string;
  schoolEmail?: string;
  course?: string;
  yearLevel?: string;
  createdAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'match' | 'status-update' | 'system';
  date: string;
  read: boolean;
  itemId?: string;
}

export interface Claim {
  id: string;
  itemId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  message: string;
  proofImageUrl?: string;
  verificationId: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  itemId: string;
  content: string;
  date: string;
  read: boolean;
}
