import { User } from '../../../types';
import { USE_MOCK, delay, getAuthHeaders, _users } from '../utils';

export const auth = {
    login: async (username: string, password: string): Promise<{ user: User; token: string }> => {
        if (USE_MOCK) {
            await delay(500);
            const cleanUsername = username.trim().toLowerCase();
            const user = _users.find(u =>
                u.username.toLowerCase() === cleanUsername &&
                u.password === password &&
                u.is_active === 'Y'
            );
            if (user) {
                const { password, ...userWithoutPass } = user;
                return { user: userWithoutPass as User, token: 'mock-token' };
            }
            throw new Error('Invalid credentials');
        }
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok) throw new Error('Login failed');
        return res.json();
    },
    verify: async (token: string): Promise<{ valid: boolean; userId?: number; username?: string }> => {
        if (USE_MOCK) {
            await delay(300);
            return { valid: true, userId: 1, username: 'admin' };
        }
        const res = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        return res.json();
    },
    // WebAuthn biometric authentication
    webauthn: {
        registerStart: async (username: string): Promise<any> => {
            if (USE_MOCK) {
                await delay(300);
                return { challenge: 'mock-challenge', rp: { name: 'Lalani ERP' } };
            }
            const res = await fetch('/api/auth/webauthn/register-start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            if (!res.ok) throw new Error('Failed to start registration');
            return res.json();
        },
        registerFinish: async (username: string, credential: any): Promise<any> => {
            if (USE_MOCK) {
                await delay(300);
                return { success: true, message: 'Biometric registration successful' };
            }
            const res = await fetch('/api/auth/webauthn/register-finish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, credential })
            });
            if (!res.ok) throw new Error('Failed to complete registration');
            return res.json();
        },
        loginStart: async (username: string): Promise<any> => {
            if (USE_MOCK) {
                await delay(300);
                return { challenge: 'mock-challenge', allowCredentials: [] };
            }
            const res = await fetch('/api/auth/webauthn/login-start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            if (!res.ok) throw new Error('Failed to start authentication');
            return res.json();
        },
        loginFinish: async (username: string, credential: any): Promise<{ user: User; token: string }> => {
            if (USE_MOCK) {
                await delay(300);
                const user = _users.find(u => u.username === username);
                if (user) {
                    const { password, ...userWithoutPass } = user;
                    return { user: userWithoutPass as User, token: 'mock-token' };
                }
                throw new Error('Authentication failed');
            }
            const res = await fetch('/api/auth/webauthn/login-finish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, credential })
            });
            if (!res.ok) throw new Error('Authentication failed');
            return res.json();
        },
        getCredentials: async (): Promise<any[]> => {
            if (USE_MOCK) {
                await delay(300);
                return [];
            }
            const res = await fetch('/api/auth/webauthn/credentials', {
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch credentials');
            return res.json();
        },
        deleteCredential: async (id: string): Promise<void> => {
            if (USE_MOCK) {
                await delay(300);
                return;
            }
            const res = await fetch(`/api/auth/webauthn/credentials/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error('Failed to delete credential');
        }
    }
};