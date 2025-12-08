import { User } from '../../../types';
import { USE_MOCK, delay, getAuthHeaders, _users, addUser, removeUser, updateUser } from '../utils';

export const users = {
    getAll: async (page: number = 1, limit: number = 8): Promise<{ data: User[], pagination: any }> => {
        if (USE_MOCK) {
            await delay(300);
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedUsers = _users.slice(startIndex, endIndex).map(({ password, ...u }) => u as User);
            return {
                data: paginatedUsers,
                pagination: {
                    page,
                    limit,
                    total: _users.length,
                    totalPages: Math.ceil(_users.length / limit)
                }
            };
        }
        const res = await fetch(`/api/users?page=${page}&limit=${limit}`, {
            headers: getAuthHeaders()
        });
        return res.json();
    },
    create: async (user: Omit<User, 'user_id'>): Promise<User> => {
        if (USE_MOCK) {
            await delay(300);
            if (_users.some(u => u.username.toLowerCase() === user.username.toLowerCase())) {
                throw new Error("Username already exists");
            }
            const newUser = { ...user, user_id: Math.max(0, ..._users.map(u => u.user_id)) + 1 };
            addUser(newUser);
            const { password, ...safeUser } = newUser;
            return safeUser as User;
        }
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(user)
        });
        if (!res.ok) throw new Error('Failed to create user');
        return res.json();
    },
    update: async (id: number, data: Partial<User>): Promise<User> => {
        if (USE_MOCK) {
            await delay(300);
            updateUser(id, data);
            const user = _users.find(u => u.user_id === id);
            if (user) {
                const { password, ...safeUser } = user;
                return safeUser as User;
            }
            throw new Error("User not found");
        }
        const res = await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(data)
        });
        return res.json();
    },
    delete: async (id: number): Promise<void> => {
        if (USE_MOCK) {
            await delay(300);
            removeUser(id);
            return;
        }
        await fetch(`/api/users/${id}`, { method: 'DELETE' });
    }
};