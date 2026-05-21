import type { Item, User } from './types.ts';

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Tashi Mallari',
  email: 'tm2023-7508-36748@bicol-u.edu.ph',
  role: 'student',
  avatar: 'https://picsum.photos/seed/tashi/100/100'
};

export const MOCK_ADMIN: User = {
  id: 'a1',
  name: 'Admin Sarah',
  email: 'as2024-1234-56789@bicol-u.edu.ph',
  role: 'admin',
  avatar: 'https://picsum.photos/seed/sarah/100/100'
};

export const MOCK_USERS: User[] = [
  MOCK_USER, 
  MOCK_ADMIN,
  {
    id: 'u2',
    name: 'Jordan Smith',
    email: 'js2025-8888-99999@bicol-u.edu.ph',
    role: 'student',
    avatar: 'https://picsum.photos/seed/jordan/100/100'
  },
  {
    id: 'u3',
    name: 'Casey Miller',
    email: 'cm2026-4444-55555@bicol-u.edu.ph',
    role: 'student',
    avatar: 'https://picsum.photos/seed/casey/100/100'
  },
  {
    id: 'u4',
    name: 'Riley Brown',
    email: 'rb2023-2222-33333@bicol-u.edu.ph',
    role: 'student',
    avatar: 'https://picsum.photos/seed/riley/100/100'
  },
  {
    id: 'u5',
    name: 'Taylor Garcia',
    email: 'tg2024-6666-77777@bicol-u.edu.ph',
    role: 'student',
    avatar: 'https://picsum.photos/seed/taylor/100/100'
  },
  {
    id: 'u6',
    name: 'Carla Jane S. Canada',
    email: 'cjsc2023-5656-98767@bicol-u.edu.ph',
    role: 'student',
    avatar: 'https://picsum.photos/seed/carla/100/100'
  }
];

export const MOCK_ITEMS: Item[] = [
  {
    id: 'i1',
    title: 'Blue Water Bottle',
    description: 'Hydro Flask, 32oz, blue color with a small dent at the bottom.',
    category: 'Personal Items',
    location: 'Main Library, 2nd Floor',
    date: '2026-03-24',
    status: 'found',
    type: 'found',
    imageUrl: 'http://elcyda.com/wp-content/uploads/2017/11/Geneva_SS_Water_Bottle_32oz_Blue_MC0139_BL.jpg',
    reporterId: 'u2',
    currentPossession: 'reporter'
  },
  {
    id: 'i2',
    title: 'Silver MacBook Air',
    description: '13-inch model, has a sticker of a rocket on the lid.',
    category: 'Electronics',
    location: 'Student Union Cafe',
    date: '2026-03-23',
    status: 'lost',
    type: 'lost',
    imageUrl: 'https://media.lunaroyster.com/2022/02/986eb7f1-2i1a0994-768x512.jpg',
    reporterId: 'u1'
  },
  {
    id: 'i3',
    title: 'Keys with Red Keychain',
    description: 'Set of 3 keys, red leather keychain with "Home" written on it.',
    category: 'Accessories',
    location: 'Gym Entrance',
    date: '2026-03-25',
    status: 'found',
    type: 'found',
    imageUrl: 'https://tse1.mm.bing.net/th/id/OIP.fP9Exv5HrsvR5WOahmqI4AHaE8?pid=Api&P=0&h=180',
    reporterId: 'u3',
    currentPossession: 'csc-office'
  },
  {
    id: 'i4',
    title: 'Calculus Textbook',
    description: 'Stewart Calculus, 8th Edition. Name "Sarah" written on the inside cover.',
    category: 'Books',
    location: 'Science Building, Room 402',
    date: '2026-03-22',
    status: 'lost',
    type: 'lost',
    imageUrl: 'https://media.karousell.com/media/photos/products/2022/9/2/calculus_textbook_1662079838_1130e3b0.jpg',
    reporterId: 'u4'
  },
  {
    id: 'i5',
    title: 'Black Hoodie',
    description: 'University branded hoodie, size Large, slightly faded.',
    category: 'Clothing',
    location: 'Outdoor Track',
    date: '2026-03-21',
    status: 'found',
    type: 'found',
    imageUrl: 'https://static.vecteezy.com/system/resources/thumbnails/027/155/806/small_2x/unisex-black-pullover-hoodie-front-and-back-png.png',
    reporterId: 'u5',
    currentPossession: 'reporter'
  },
  {
    id: 'i6',
    title: 'Wireless Earbuds',
    description: 'White Apple AirPods Pro in a protective silicone case.',
    category: 'Electronics',
    location: 'Main Library, Study Area',
    date: '2026-03-20',
    status: 'claimed',
    type: 'found',
    imageUrl: 'https://images.unsplash.com/photo-1588423770574-f199baae61fe?q=80&w=300&h=300&auto=format&fit=crop',
    reporterId: 'u3',
    claimedAt: '2026-03-25T10:30:00Z',
    claimedBy: 'u1',
    approvedBy: 'a1'
  }
];
