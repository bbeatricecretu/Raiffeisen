import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from './components/layouts/AppLayout';
import { Landing } from './pages/Landing';
import { AboutUs } from './pages/AboutUs';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { SmartChat } from './pages/SmartChat';
import { SpendingMap } from './pages/SpendingMap';
import { ConfirmTransaction } from './pages/ConfirmTransaction';
import { Invite } from './pages/Invite';
import { JoinCommunity } from './pages/JoinCommunity';
import { CommunityFeed } from './pages/CommunityFeed';
import { AccountDetails } from './pages/AccountDetails';
import { Exchange } from './pages/Exchange';
import { SendMoney } from './pages/SendMoney';
import { Transactions } from './pages/Transactions';
import { MerchantDetails } from './pages/MerchantDetails';
import { Merchants } from './pages/Merchants';
import { TransactionDetails } from './pages/TransactionDetails';
import { Admin } from './pages/Admin';
import { Notifications } from './pages/Notifications';
import { SettingsPage } from './pages/SettingsPage';
import { Analytics } from './pages/Analytics';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/about',
    element: <AboutUs />,
  },
  {
    path: '/auth',
    element: <Auth />,
  },
  {
    path: '/admin',
    element: <Admin />,
  },
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'chat', element: <SmartChat /> },
      { path: 'map', element: <SpendingMap /> },
      { path: 'confirm', element: <ConfirmTransaction /> },
      { path: 'invite', element: <Invite /> },
      { path: 'join', element: <JoinCommunity /> },
      { path: 'community/:id', element: <CommunityFeed /> },
      { path: 'details', element: <AccountDetails /> },
      { path: 'exchange', element: <Exchange /> },
      { path: 'send', element: <SendMoney /> },
      { path: 'transactions', element: <Transactions /> },
      { path: 'transaction/:id', element: <TransactionDetails /> },
      { path: 'merchants', element: <Merchants /> },
      { path: 'merchant/:id', element: <MerchantDetails /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'analytics', element: <Analytics /> },
    ],
  },
]);
