const API_BASE_URL = 'http://localhost:8000/api';

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

  register: async (data: { name: string, password: string, email?: string, phone?: string }) => {
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

  getSpendingMap: async (userId: string) => {
    const res = await fetch(`${API_BASE_URL}/spending/map?user_id=${userId}`);
    return res.json();
  },

  getTransactions: async (userId: string) => {
    const res = await fetch(`${API_BASE_URL}/transactions?user_id=${userId}`);
    return res.json();
  },

  // --- Teams & Network ---

  getUser: async (userId: string) => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`);
    if (!res.ok) throw new Error('User not found');
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

  createTeam: async (name: string, userId: string, imageUrl?: string) => {
    const res = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, created_by: userId, image_url: imageUrl }),
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

  getTeamPosts: async (teamId: string) => {
    const res = await fetch(`${API_BASE_URL}/teams/${teamId}/posts`);
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

  confirmTransaction: async (data: { user_id: string, merchant: string, amount: number, category: string, county?: string, city?: string }) => {
    const res = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }
};
