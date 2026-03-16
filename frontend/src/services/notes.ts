import { apiFetch } from '../lib/api';

export const getNotes = () => apiFetch('/notes');
export const createNote = (title: string, content: string) => apiFetch('/notes', {
    method: 'POST',
    body: JSON.stringify({ title, content }),
});
export const updateNote = (id: string, title?: string, content?: string) => apiFetch(`/notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title, content }),
});
export const deleteNote = (id: string) => apiFetch(`/notes/${id}`, { method: 'DELETE' });

export const getDomains = () => apiFetch('/domains');
export const createDomain = (name: string, color: string) => apiFetch('/domains', {
    method: 'POST',
    body: JSON.stringify({ name, color }),
});
export const updateDomain = (id: string, name?: string, color?: string) => apiFetch(`/domains/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name, color }),
});
export const deleteDomain = (id: string) => apiFetch(`/domains/${id}`, { method: 'DELETE' });

export const getDomainNotes = (domainId: string) => apiFetch(`/domains/${domainId}/notes`);
export const createDomainNote = (domainId: string, title: string, content: string) => apiFetch(`/domains/${domainId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ title, content }),
});

export const polishNote = (content: string): Promise<{ polished: string }> => apiFetch('/notes/polish', {
    method: 'POST',
    body: JSON.stringify({ content }),
});
