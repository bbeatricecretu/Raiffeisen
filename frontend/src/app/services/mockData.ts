// ─── DTOs ──────────────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  category: 'Groceries' | 'Food' | 'Fuel' | 'Entertainment' | 'Subscriptions' | 'Shopping' | 'Transport' | 'Health' | 'Utilities';
  iban: string;
  county: string;
  lat: number;
  lon: number;
  totalAtMerchant: number;
  visitCount: number;
  lastVisit: string;
  avgSpend: number;
  status: 'completed' | 'pending';
}

export interface County {
  id: string;
  name: string;
  lat: number;
  lon: number;
  spending: number;
  txCount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  career: string;
  isOnline: boolean;
  location: string;
  connectedAt?: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  members: number;
  category: string;
  cover: string;
  isJoined: boolean;
  teamCode: string;
}

export interface FeedPost {
  id: string;
  author: User;
  title: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  time: string;
  isLiked: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  time: string;
  data?: 'transactions' | 'chart' | 'suggestions';
}

// ─── TRANSACTIONS ────────────────────────────────────────────────────────────

export const transactions: Transaction[] = [
  { id: 'tx1', merchant: 'Lidl Berceni', amount: 125.50, date: '2026-02-28', category: 'Groceries', iban: 'RO49AAAA1B31007593840000', county: 'B', lat: 44.39, lon: 26.10, totalAtMerchant: 2340, visitCount: 18, lastVisit: '2026-02-21', avgSpend: 130, status: 'completed' },
  { id: 'tx2', merchant: 'Petrom Pipera', amount: 280.00, date: '2026-02-27', category: 'Fuel', iban: 'RO49BBBB1B31007593840001', county: 'B', lat: 44.49, lon: 26.09, totalAtMerchant: 4200, visitCount: 15, lastVisit: '2026-02-14', avgSpend: 280, status: 'completed' },
  { id: 'tx3', merchant: 'Netflix', amount: 52.99, date: '2026-02-25', category: 'Subscriptions', iban: 'RO49CCCC1B31007593840002', county: 'B', lat: 44.43, lon: 26.10, totalAtMerchant: 636, visitCount: 12, lastVisit: '2026-01-25', avgSpend: 53, status: 'completed' },
  { id: 'tx4', merchant: 'Kaufland Cluj', amount: 89.30, date: '2026-02-24', category: 'Groceries', iban: 'RO49DDDD1B31007593840003', county: 'CJ', lat: 46.75, lon: 23.55, totalAtMerchant: 1560, visitCount: 17, lastVisit: '2026-02-17', avgSpend: 92, status: 'completed' },
  { id: 'tx5', merchant: 'Cora Timisoara', amount: 143.20, date: '2026-02-23', category: 'Groceries', iban: 'RO49EEEE1B31007593840004', county: 'TM', lat: 45.76, lon: 21.20, totalAtMerchant: 2100, visitCount: 14, lastVisit: '2026-02-16', avgSpend: 150, status: 'completed' },
  { id: 'tx6', merchant: 'Spotify', amount: 34.99, date: '2026-02-22', category: 'Subscriptions', iban: 'RO49FFFF1B31007593840005', county: 'B', lat: 44.43, lon: 26.10, totalAtMerchant: 420, visitCount: 12, lastVisit: '2026-01-22', avgSpend: 35, status: 'completed' },
  { id: 'tx7', merchant: 'McDonalds Iasi', amount: 67.50, date: '2026-02-21', category: 'Food', iban: 'RO49GGGG1B31007593840006', county: 'IS', lat: 47.15, lon: 27.58, totalAtMerchant: 540, visitCount: 8, lastVisit: '2026-02-07', avgSpend: 68, status: 'completed' },
  { id: 'tx8', merchant: 'Mega Image Floreasca', amount: 56.80, date: '2026-02-20', category: 'Groceries', iban: 'RO49HHHH1B31007593840007', county: 'B', lat: 44.45, lon: 26.09, totalAtMerchant: 1120, visitCount: 20, lastVisit: '2026-02-13', avgSpend: 56, status: 'completed' },
  { id: 'tx9', merchant: 'DIGI Mobile', amount: 18.00, date: '2026-02-19', category: 'Utilities', iban: 'RO49IIII1B31007593840008', county: 'B', lat: 44.43, lon: 26.10, totalAtMerchant: 216, visitCount: 12, lastVisit: '2026-01-19', avgSpend: 18, status: 'completed' },
  { id: 'tx10', merchant: 'Starbucks Victoriei', amount: 42.00, date: '2026-02-18', category: 'Food', iban: 'RO49JJJJ1B31007593840009', county: 'B', lat: 44.45, lon: 26.07, totalAtMerchant: 380, visitCount: 9, lastVisit: '2026-02-10', avgSpend: 42, status: 'completed' },
  { id: 'tx11', merchant: 'Emag.ro', amount: 349.00, date: '2026-02-17', category: 'Shopping', iban: 'RO49KKKK1B31007593840010', county: 'B', lat: 44.43, lon: 26.10, totalAtMerchant: 2100, visitCount: 6, lastVisit: '2026-01-10', avgSpend: 350, status: 'completed' },
  { id: 'tx12', merchant: 'Constanta Shell', amount: 220.00, date: '2026-02-16', category: 'Fuel', iban: 'RO49LLLL1B31007593840011', county: 'CT', lat: 44.17, lon: 28.62, totalAtMerchant: 880, visitCount: 4, lastVisit: '2026-01-15', avgSpend: 220, status: 'completed' },
  { id: 'tx13', merchant: 'Iulius Mall Cluj', amount: 178.50, date: '2026-02-15', category: 'Shopping', iban: 'RO49MMMM1B31007593840012', county: 'CJ', lat: 46.77, lon: 23.60, totalAtMerchant: 1240, visitCount: 7, lastVisit: '2026-01-20', avgSpend: 177, status: 'completed' },
  { id: 'tx14', merchant: 'Gym Membership', amount: 120.00, date: '2026-02-14', category: 'Health', iban: 'RO49NNNN1B31007593840013', county: 'B', lat: 44.43, lon: 26.11, totalAtMerchant: 1440, visitCount: 12, lastVisit: '2026-01-14', avgSpend: 120, status: 'completed' },
  { id: 'tx15', merchant: 'Uber Romania', amount: 38.50, date: '2026-02-13', category: 'Transport', iban: 'RO49OOOO1B31007593840014', county: 'B', lat: 44.42, lon: 26.08, totalAtMerchant: 690, visitCount: 18, lastVisit: '2026-02-11', avgSpend: 38, status: 'pending' },
];

export const pendingTransaction: Transaction = {
  id: 'ptx1', merchant: 'Carrefour Baneasa', amount: 312.75, date: '2026-03-03', category: 'Groceries',
  iban: 'RO49BBBB1B31007593840099', county: 'B', lat: 44.50, lon: 26.07, totalAtMerchant: 3450,
  visitCount: 22, lastVisit: '2026-02-24', avgSpend: 156, status: 'pending'
};

// ─── COUNTIES ────────────────────────────────────────────────────────────────

export const counties: County[] = [
  { id: 'B',  name: 'Bucharest', lat: 44.43, lon: 26.10, spending: 15420, txCount: 47 },
  { id: 'CJ', name: 'Cluj',      lat: 46.77, lon: 23.60, spending: 8730,  txCount: 28 },
  { id: 'TM', name: 'Timis',     lat: 45.76, lon: 21.23, spending: 6520,  txCount: 21 },
  { id: 'IS', name: 'Iasi',      lat: 47.16, lon: 27.59, spending: 5890,  txCount: 19 },
  { id: 'CT', name: 'Constanta', lat: 44.18, lon: 28.65, spending: 4210,  txCount: 14 },
  { id: 'BV', name: 'Brasov',    lat: 45.65, lon: 25.61, spending: 3870,  txCount: 13 },
  { id: 'PH', name: 'Prahova',   lat: 45.10, lon: 25.79, spending: 2940,  txCount: 10 },
  { id: 'BC', name: 'Bacau',     lat: 46.57, lon: 26.91, spending: 2180,  txCount:  8 },
  { id: 'SB', name: 'Sibiu',     lat: 45.80, lon: 24.15, spending: 2310,  txCount:  8 },
  { id: 'MS', name: 'Mures',     lat: 46.55, lon: 24.56, spending: 1950,  txCount:  7 },
  { id: 'DJ', name: 'Dolj',      lat: 44.30, lon: 23.81, spending: 1820,  txCount:  7 },
  { id: 'AG', name: 'Arges',     lat: 44.85, lon: 24.87, spending: 1640,  txCount:  6 },
  { id: 'SV', name: 'Suceava',   lat: 47.65, lon: 26.25, spending: 1420,  txCount:  5 },
  { id: 'GL', name: 'Galati',    lat: 45.43, lon: 28.05, spending: 1280,  txCount:  5 },
  { id: 'BH', name: 'Bihor',     lat: 47.05, lon: 22.00, spending: 1150,  txCount:  4 },
  { id: 'AR', name: 'Arad',      lat: 46.18, lon: 21.31, spending:  980,  txCount:  4 },
  { id: 'HD', name: 'Hunedoara', lat: 45.88, lon: 22.91, spending:  870,  txCount:  3 },
  { id: 'VL', name: 'Valcea',    lat: 45.10, lon: 24.37, spending:  760,  txCount:  3 },
  { id: 'MM', name: 'Maramures', lat: 47.66, lon: 24.13, spending:  680,  txCount:  2 },
  { id: 'BT', name: 'Botosani',  lat: 47.75, lon: 26.67, spending:  540,  txCount:  2 },
];

// ─── USERS ───────────────────────────────────────────────────────────────────

export const platformUsers: User[] = [
  { id: 'u1', name: 'Andrei Popescu', email: 'andrei.popescu@email.com', avatar: 'https://images.unsplash.com/photo-1723537742563-15c3d351dbf2?w=80&h=80&fit=crop&crop=face', career: 'Software Engineer', isOnline: true, location: 'Bucharest' },
  { id: 'u2', name: 'Maria Ionescu', email: 'maria.ionescu@email.com', avatar: 'https://images.unsplash.com/photo-1762522921456-cdfe882d36c3?w=80&h=80&fit=crop&crop=face', career: 'Product Manager', isOnline: true, location: 'Cluj-Napoca' },
  { id: 'u3', name: 'Radu Constantin', email: 'radu.c@email.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face', career: 'Financial Analyst', isOnline: false, location: 'Timisoara' },
  { id: 'u4', name: 'Elena Stancu', email: 'elena.s@email.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face', career: 'UX Designer', isOnline: true, location: 'Brasov' },
  { id: 'u5', name: 'Mihai Dumitrescu', email: 'mihai.d@email.com', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face', career: 'Entrepreneur', isOnline: false, location: 'Iasi' },
  { id: 'u6', name: 'Ioana Muresan', email: 'ioana.m@email.com', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face', career: 'Marketing Specialist', isOnline: true, location: 'Constanta' },
  { id: 'u7', name: 'Bogdan Popa', email: 'bogdan.p@email.com', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face', career: 'Business Developer', isOnline: false, location: 'Sibiu' },
  { id: 'u8', name: 'Cristina Luca', email: 'cristina.l@email.com', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face', career: 'Investment Advisor', isOnline: true, location: 'Bucharest' },
];

export const currentUser: User = {
  id: 'me', name: 'Alexandru Petrescu', email: 'alex.petrescu@email.com',
  avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face',
  career: 'Software Engineer', isOnline: true, location: 'Bucharest'
};

// ─── COMMUNITIES ──────────────────────────────────────────────────────────────

export const communities: Community[] = [
  { id: 'c1', name: 'Tech Founders Romania', description: 'Connect with tech entrepreneurs across Romania. Share knowledge, resources and grow together.', members: 1247, category: 'Technology', cover: 'https://images.unsplash.com/photo-1737573744382-73c017a9ab25?w=400&h=200&fit=crop', isJoined: true, teamCode: 'TECH2024' },
  { id: 'c2', name: 'Investment Circle Bucharest', description: 'A premium network for investors and financial professionals. Discuss markets, deals and strategies.', members: 832, category: 'Finance', cover: 'https://images.unsplash.com/photo-1559067096-49ebca3406aa?w=400&h=200&fit=crop', isJoined: false, teamCode: 'INVEST24' },
  { id: 'c3', name: 'Cluj Startup Hub', description: 'The heartbeat of the Cluj startup ecosystem. Founders, developers, designers and investors united.', members: 2104, category: 'Startup', cover: 'https://images.unsplash.com/photo-1759752394757-323a0adc0d62?w=400&h=200&fit=crop', isJoined: false, teamCode: 'CLUJHUB' },
  { id: 'c4', name: 'SME Banking Network', description: 'Banking solutions, credit tips and financial tools curated for small and medium enterprises.', members: 562, category: 'Banking', cover: 'https://images.unsplash.com/photo-1642055509518-adafcad1d22e?w=400&h=200&fit=crop', isJoined: false, teamCode: 'SMENET' },
  { id: 'c5', name: 'Women in Finance RO', description: 'Empowering women in the Romanian financial sector through mentorship, networking and advocacy.', members: 389, category: 'Finance', cover: 'https://images.unsplash.com/photo-1559067096-49ebca3406aa?w=400&h=200&fit=crop', isJoined: false, teamCode: 'WIFRO24' },
  { id: 'c6', name: 'Digital Payments Forum', description: 'Discussing the future of payments, open banking, CBDC and fintech regulation in Romania and EU.', members: 718, category: 'Fintech', cover: 'https://images.unsplash.com/photo-1737573744382-73c017a9ab25?w=400&h=200&fit=crop', isJoined: false, teamCode: 'DIGPAY' },
];

// ─── FEED POSTS ──────────────────────────────────────────────────────────────

export const feedPosts: FeedPost[] = [
  {
    id: 'fp1',
    author: platformUsers[0],
    title: 'How I reduced my monthly subscriptions by 40% using Smart Chat',
    content: 'After using the AI spending analysis, I discovered I had 11 active subscriptions I barely used. The Smart Chat helped me visualize exactly what I was paying and why. Here\'s what I cut and how much I saved...',
    image: 'https://images.unsplash.com/photo-1642055509518-adafcad1d22e?w=600&h=300&fit=crop',
    likes: 47, comments: 12, shares: 8, time: '2h ago', isLiked: false
  },
  {
    id: 'fp2',
    author: platformUsers[1],
    title: 'Q1 2026 Investment Outlook for Romanian SMEs',
    content: 'With interest rates stabilizing and EU funds flowing in, Q1 2026 presents unique opportunities for Romanian small businesses. I\'ve been tracking three key sectors that show promise: green energy, agritech, and digital health.',
    likes: 89, comments: 23, shares: 31, time: '5h ago', isLiked: true
  },
  {
    id: 'fp3',
    author: platformUsers[3],
    title: 'Our community just reached 1,000 members! 🎉',
    content: 'When we started Tech Founders Romania two years ago, we had 12 people in a small Bucharest co-working space. Today we\'re a community of 1,247 tech entrepreneurs from across the country. Thank you all for being part of this journey!',
    likes: 214, comments: 67, shares: 45, time: '1d ago', isLiked: false
  },
  {
    id: 'fp4',
    author: platformUsers[2],
    title: 'Smart budgeting frameworks for freelancers',
    content: 'As a freelancer, cash flow predictability is everything. After 5 years of trial and error, here are the exact budgeting rules I use to maintain financial stability even when income varies month to month...',
    likes: 63, comments: 18, shares: 14, time: '2d ago', isLiked: true
  },
];

// ─── CHAT MESSAGES ───────────────────────────────────────────────────────────

export const initialChatMessages: ChatMessage[] = [
  { id: 'cm1', role: 'ai', content: 'Hello! I\'m your Connect & Grow AI Assistant. I can analyze your spending, find patterns, and give you smart financial insights. What would you like to know?', time: '09:00' },
  { id: 'cm2', role: 'user', content: 'How much did I spend last month?', time: '09:01' },
  { id: 'cm3', role: 'ai', content: 'In February 2026, your total spending was **RON 2,816.28** across 15 transactions. This is 8.3% less than January. Your top category was Groceries (RON 414.80), followed by Shopping (RON 527.50) and Fuel (RON 500.00).', time: '09:01', data: 'chart' },
  { id: 'cm4', role: 'user', content: 'What did I pay at Lidl?', time: '09:03' },
  { id: 'cm5', role: 'ai', content: 'You\'ve made **18 visits** to Lidl with a total of **RON 2,340** spent. Your last visit was February 28 for RON 125.50. Your average transaction is around RON 130.', time: '09:03', data: 'transactions' },
  { id: 'cm6', role: 'user', content: 'Show me my subscriptions', time: '09:05' },
  { id: 'cm7', role: 'ai', content: 'You have **2 active subscriptions** totaling RON 87.98/month. Here\'s the breakdown:', time: '09:05', data: 'suggestions' },
];

// ─── SPENDING CHART DATA ──────────────────────────────────────────────────────

export const spendingByCategory = [
  { name: 'Groceries', amount: 414.80, fill: '#FFD100' },
  { name: 'Shopping',  amount: 527.50, fill: '#FF8C00' },
  { name: 'Fuel',      amount: 500.00, fill: '#1B2B4B' },
  { name: 'Subs',      amount: 87.98,  fill: '#3B82F6' },
  { name: 'Food',      amount: 109.50, fill: '#10B981' },
  { name: 'Transport', amount: 38.50,  fill: '#8B5CF6' },
  { name: 'Health',    amount: 120.00, fill: '#F472B6' },
  { name: 'Utilities', amount: 18.00,  fill: '#06B6D4' },
];

export const monthlySpending = [
  { month: 'Sep', amount: 2340 },
  { month: 'Oct', amount: 2890 },
  { month: 'Nov', amount: 3120 },
  { month: 'Dec', amount: 4200 },
  { month: 'Jan', amount: 3072 },
  { month: 'Feb', amount: 2816 },
];
