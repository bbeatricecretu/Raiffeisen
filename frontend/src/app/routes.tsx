import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from './components/layouts/AppLayout';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { SmartChat } from './pages/SmartChat';
import { SpendingMap } from './pages/SpendingMap';
import { ConfirmTransaction } from './pages/ConfirmTransaction';
import { Invite } from './pages/Invite';
import { JoinCommunity } from './pages/JoinCommunity';
import { CommunityFeed } from './pages/CommunityFeed';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/auth',
    element: <Auth />,
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
    ],
  },
]);
