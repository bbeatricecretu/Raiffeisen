const API_BASE_URL = ((import.meta as any)?.env?.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8000/api';

export interface SearchResponse {
  status: 'success' | 'refused' | 'error';
  parsed_intent?: any;
  language?: string;
  message?: string;
  reason?: string;
  answer_text?: string;
}

export interface FormatResponse {
  answer_text: string;
  summary_stats?: any;
  suggestions?: string[];
  language?: string;
}

export const api = {
  /**
   * Health check
   */
  checkHealth: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return res.ok; 
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  /**
   * Step 1: Parse natural language query
   */
  search: async (query: string): Promise<SearchResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      return res.json();
    } catch (e) {
      console.error(e);
      return { status: 'error', message: 'Network error' };
    }
  },

  /**
   * Step 3: Format results into natural language
   */
  formatResults: async (query: string, parsedIntent: any, results: any[]): Promise<FormatResponse> => {
    const res = await fetch(`${API_BASE_URL}/ai/format-results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        parsed_intent: parsedIntent,
        results
      }),
    });
    return res.json();
  },

  /**
   * Generate summary for a merchant
   */
  getMerchantSummary: async (merchantName: string, transactionStats: any, language: string = 'en') => {
    const res = await fetch(`${API_BASE_URL}/ai/merchant-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_name: merchantName,
        transaction_stats: transactionStats,
        language
      }),
    });
    return res.json();
  },

  // --- Auth & Users ---

  register: async (data: { name: string, password: string, email?: string, phone?: string, referral_invite_id?: string }) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  login: async (data: { email: string, password: string }) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  checkContacts: async (phones: string[]) => {
    const res = await fetch(`${API_BASE_URL}/users/check-contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phones }),
    });
    return res.json();
  },
  
  // --- Bank Features ---

  getSpendingMap: async (userId: string, period: string = 'all') => {
    const res = await fetch(`${API_BASE_URL}/spending/map?user_id=${userId}&period=${period}`);
    return res.json();
  },

  getTransactions: async (userId: string, limit: number = 50) => {
    const res = await fetch(`${API_BASE_URL}/transactions?user_id=${userId}&limit=${limit}`);
    return res.json();
  },

  generateStatement: async (userId: string, startDate: string, endDate: string) => {
    // Returns a Blob (PDF)
    const res = await fetch(`${API_BASE_URL}/users/${userId}/statement?start_date=${startDate}&end_date=${endDate}`);
    if (!res.ok) throw new Error("Failed to generate statement");
    return res.blob();
  },

  exchange: async (userId: string, fromCurrency: string, toCurrency: string, amount: number) => {
    const res = await fetch(`${API_BASE_URL}/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, from_currency: fromCurrency, to_currency: toCurrency, amount }),
    });
    // Check if ok
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // --- Teams & Network ---

  getUser: async (userId: string) => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`);
    if (!res.ok) throw new Error('User not found');
    return res.json();
  },
  
  getAllUsers: async () => {
    const res = await fetch(`${API_BASE_URL}/users`);
    return res.json();
  },

  createUser: async (data: any) => {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  updateUser: async (userId: string, data: any) => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  searchUsers: async (query: string) => {
    const res = await fetch(`${API_BASE_URL}/users/search?q=${query}`);
    return res.json();
  },

  getUserTeams: async (userId: string) => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/teams`);
    return res.json();
  },

  createTeam: async (name: string, userId: string, imageUrl?: string, code?: string) => {
    const res = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, created_by: userId, image_url: imageUrl, code }),
    });
    return res.json();
  },

  joinTeam: async (userId: string, code: string) => {
    const res = await fetch(`${API_BASE_URL}/teams/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, code }),
    });
    if (!res.ok) throw new Error('Invalid code');
    return res.json();
  },

  getTeamPosts: async (teamId: string, userId: string) => {
    const res = await fetch(`${API_BASE_URL}/teams/${teamId}/posts?user_id=${userId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getCommunityFeed: async (userId: string, limit: number = 100) => {
    const res = await fetch(`${API_BASE_URL}/community/feed?user_id=${userId}&limit=${limit}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getSuggestedConnections: async (userId: string, limit: number = 24) => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/suggested-connections?limit=${limit}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  createPost: async (data: { team_id: string, user_id: string, text?: string, image_url?: string, title?: string }) => {
    const res = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  reactToPost: async (postId: string, userId: string, emoji: string) => {
    const res = await fetch(`${API_BASE_URL}/posts/${postId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, emoji }),
    });
    return res.json();
  },

  commentOnPost: async (postId: string, userId: string, text: string) => {
    const res = await fetch(`${API_BASE_URL}/posts/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, text }),
    });
    return res.json();
  },

  sendConnectionInvite: async (senderId: string, recipientId: string) => {
    const res = await fetch(`${API_BASE_URL}/connections/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_id: senderId, recipient_id: recipientId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getConnectionInvites: async (userId: string, status: 'pending' | 'accepted' | 'rejected' | '' = 'pending') => {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE_URL}/users/${userId}/connection-invites${query}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  respondConnectionInvite: async (inviteId: string, recipientId: string, status: 'accepted' | 'rejected') => {
    const res = await fetch(`${API_BASE_URL}/connections/invites/${inviteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: recipientId, status }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  createReferralInvite: async (
    inviterId: string,
    channel: 'link' | 'email',
    inviteeEmail?: string
  ) => {
    const res = await fetch(`${API_BASE_URL}/referrals/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviter_id: inviterId, channel, invitee_email: inviteeEmail || null }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getReferralStats: async (userId: string) => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/referral-stats`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  confirmTransaction: async (data: { user_id: string, merchant: string, amount: number, category: string, county?: string, city?: string, source_account?: 'current' | 'savings' }) => {
    const res = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  deleteTransaction: async (txId: string) => {
    const res = await fetch(`${API_BASE_URL}/transactions/${txId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // --- Contacts ---

  getUserContacts: async (userId: string) => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/contacts`);
    return res.json();
  },

  getUserConnections: async (userId: string) => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/connections`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  createContact: async (data: { user_id: string, name: string, iban?: string, phone?: string }) => {
    const res = await fetch(`${API_BASE_URL}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  updateContact: async (contactId: string, data: { name?: string, iban?: string, phone?: string }) => {
    const res = await fetch(`${API_BASE_URL}/contacts/${contactId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  deleteContact: async (contactId: string) => {
    const res = await fetch(`${API_BASE_URL}/contacts/${contactId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // --- Pending Confirmations ---

  getUserConfirmations: async (userId: string, status?: string) => {
    const url = status
      ? `${API_BASE_URL}/users/${userId}/confirmations?status=${status}`
      : `${API_BASE_URL}/users/${userId}/confirmations`;
    const res = await fetch(url);
    return res.json();
  },

  createConfirmation: async (data: { user_id: string, merchant: string, amount: number, currency?: string, category?: string, city?: string, county?: string }) => {
    const res = await fetch(`${API_BASE_URL}/confirmations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  updateConfirmationStatus: async (confId: string, status: 'confirmed' | 'rejected') => {
    const res = await fetch(`${API_BASE_URL}/confirmations/${confId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  deleteConfirmation: async (confId: string) => {
    const res = await fetch(`${API_BASE_URL}/confirmations/${confId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getMerchantStats: async (userId: string, merchantName: string) => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/merchant-stats/${encodeURIComponent(merchantName)}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getTransaction: async (txId: string) => {
    const res = await fetch(`${API_BASE_URL}/transactions/${txId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getMerchantDetail: async (userId: string, merchantName: string) => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/merchant-detail/${encodeURIComponent(merchantName)}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getUserMerchants: async (userId: string) => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/merchants`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // --- User Preferences ---

  getUserPreferences: async (userId: string) => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/preferences`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  updateUserPreferences: async (
    userId: string,
    data: { email_alerts: boolean; push_alerts: boolean; hide_small_amounts: boolean }
  ) => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
