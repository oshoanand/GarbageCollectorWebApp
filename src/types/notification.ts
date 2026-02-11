// export interface TokenPayload {
//   id: number | string;
//   tokenCode: string;
//   orderNumber: string;
//   mobileNumber: string;
//   status: string;
//   createdAt: string | Date;
// }

// export interface NotificationContextType {
//   notifications: TokenPayload[];
//   unreadCount: number;
//   markAllAsRead: () => void;
//   socket: any; // Or use Socket from 'socket.io-client' if strict
// }
// types/notification.ts

// Existing Token Type
export interface TokenPayload {
  type: "TOKEN"; // Discriminator
  id: number | string;
  tokenCode: string;
  orderNumber: string;
  mobileNumber: string;
  status: string;
  createdAt: string | Date;
}

// New Job Type
export interface JobPayload {
  type: "JOB"; // Discriminator
  id: number;
  description: string;
  location: string;
  cost: string;
  postedBy: string;
  createdAt: string | Date;
}

// Union Type for State
export type NotificationItem = TokenPayload | JobPayload;

export interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllAsRead: () => void;
  socket: any;
}
