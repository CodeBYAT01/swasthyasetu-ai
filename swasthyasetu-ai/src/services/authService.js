import { DEMO_ACCOUNTS } from '../utils/constants';

const SESSION_KEY = 'swasthyasetu.session';

export const authService = {
  async login(identifier, password) {
    const clean = String(identifier || '').trim().toLowerCase();
    const account = DEMO_ACCOUNTS.find(
      (item) => item.email.toLowerCase() === clean || item.name.toLowerCase() === clean || item.role === clean,
    );
    if (!account) throw new Error('Account not found. Select one of the demo accounts below.');
    if (password !== account.password) throw new Error('Incorrect password.');
    return { ...account, token: `demo-token-${account.role}` };
  },
  persist(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  },
  restore() {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },
  logout() {
    localStorage.removeItem(SESSION_KEY);
  },
};
