const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function isWakeUpError(err: unknown): boolean {
    if (err instanceof DOMException && err.name === 'AbortError') return true;
    if (err instanceof TypeError) {
        const msg = (err.message || '').toLowerCase();
        if (msg.includes('failed to fetch') || msg.includes('network error')) return true;
    }
    return false;
}

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || response.statusText || 'API Error');
        }

        return response.json();
    } catch (err) {
        clearTimeout(timeout);
        if (isWakeUpError(err)) {
            throw new Error('The server is waking up. Please wait 30 seconds and try again.');
        }
        throw err;
    }
};
