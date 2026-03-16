import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreVertical, Trash2, Edit2, Check, X, Loader2, Sparkles, Folder } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog } from './ui';
import { 
    getDomains, createDomain, updateDomain, deleteDomain, 
    getDomainNotes, createDomainNote, updateNote, deleteNote, polishNote 
} from '@/services/notes';

const PRESET_COLORS = [
    { name: 'indigo', code: '#6366f1' },
    { name: 'emerald', code: '#10b981' },
    { name: 'amber', code: '#f59e0b' },
    { name: 'rose', code: '#f43f5e' },
    { name: 'sky', code: '#0ea5e9' },
    { name: 'violet', code: '#8b5cf6' },
];

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };
const gentleSpring = { type: 'spring' as const, stiffness: 200, damping: 25 };

interface Domain {
    id: string;
    name: string;
    color: string;
    _count?: { notes: number };
}

interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: string;
}

export function DomainNotesTab() {
    const [domains, setDomains] = useState<Domain[]>([]);
    const [loadingDomains, setLoadingDomains] = useState(true);
    const [activeDomain, setActiveDomain] = useState<Domain | null>(null);

    // Domain Modals
    const [createDomainModalOpen, setCreateDomainModalOpen] = useState(false);
    const [newDomainName, setNewDomainName] = useState('');
    const [newDomainColor, setNewDomainColor] = useState(PRESET_COLORS[0].code);
    const [savingDomain, setSavingDomain] = useState(false);

    // Notes
    const [notes, setNotes] = useState<Note[]>([]);
    const [loadingNotes, setLoadingNotes] = useState(false);

    // Note Modals
    const [createNoteModalOpen, setCreateNoteModalOpen] = useState(false);
    const [newNoteTitle, setNewNoteTitle] = useState('');
    const [savingNote, setSavingNote] = useState(false);

    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [editModeParams, setEditModeParams] = useState({ title: '', content: '' });
    const [polishing, setPolishing] = useState(false);
    const [polishMessage, setPolishMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        getDomains().then(data => {
            setDomains(data);
            if (data.length > 0) handleSelectDomain(data[0]);
        }).catch(console.error).finally(() => setLoadingDomains(false));
    }, []);

    const handleSelectDomain = async (domain: Domain) => {
        setActiveDomain(domain);
        setLoadingNotes(true);
        try {
            const data = await getDomainNotes(domain.id);
            setNotes(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingNotes(false);
        }
    };

    const handleCreateDomain = async () => {
        if (!newDomainName.trim()) return;
        setSavingDomain(true);
        try {
            const newDomain = await createDomain(newDomainName, newDomainColor);
            setDomains([newDomain, ...domains]);
            setCreateDomainModalOpen(false);
            setNewDomainName('');
            handleSelectDomain(newDomain);
        } catch (err: any) {
            alert(err?.message || 'Failed to create domain');
        } finally {
            setSavingDomain(false);
        }
    };

    const handleDeleteDomain = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Delete this domain? Notes will become normal notes.')) return;
        try {
            await deleteDomain(id);
            setDomains(domains.filter(d => d.id !== id));
            if (activeDomain?.id === id) setActiveDomain(null);
        } catch (err: any) {
            alert(err?.message || 'Failed to delete domain');
        }
    };

    const handleCreateNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeDomain || !newNoteTitle.trim()) return;
        setSavingNote(true);
        try {
            const note = await createDomainNote(activeDomain.id, newNoteTitle, '');
            setNotes([note, ...notes]);
            setNewNoteTitle('');
            handleOpenNoteModal(note);
        } catch (err: any) {
            alert(err?.message || 'Failed to add note');
        } finally {
            setSavingNote(false);
        }
    };

    const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await deleteNote(id);
            setNotes(notes.filter(n => n.id !== id));
        } catch (err: any) {
            alert(err?.message || 'Failed to delete note');
        }
    };

    const handleOpenNoteModal = (note: Note) => {
        setEditingNote(note);
        setEditModeParams({ title: note.title, content: note.content || '' });
        setPolishMessage(null);
    };

    const handleSaveNote = async () => {
        if (!editingNote || !editModeParams.title.trim()) return;
        setSavingNote(true);
        try {
            const updated = await updateNote(editingNote.id, editModeParams.title, editModeParams.content);
            setNotes(notes.map(n => (n.id === updated.id ? updated : n)));
            setEditingNote(null);
        } catch (err: any) {
            alert(err?.message || 'Failed to save note');
        } finally {
            setSavingNote(false);
        }
    };

    const handlePolish = async () => {
        if (!editModeParams.content.trim()) return;
        setPolishing(true);
        setPolishMessage(null);
        const originalContent = editModeParams.content;
        try {
            const res = await polishNote(editModeParams.content);
            setEditModeParams({ ...editModeParams, content: res.polished });
            setPolishMessage({ type: 'success', text: 'Note polished' });
            setTimeout(() => setPolishMessage(null), 2000);
        } catch (err) {
            setPolishMessage({ type: 'error', text: 'Polish failed. Try again.' });
            setEditModeParams({ ...editModeParams, content: originalContent });
        } finally {
            setPolishing(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[70vh] min-h-[500px]">
            {/* Sidebar */}
            <div className="w-full md:w-64 shrink-0 flex flex-col gap-4 border border-white/10 p-4 rounded-xl bg-white/[0.01]">
                <div className="font-semibold text-white/50 text-sm uppercase tracking-wider mb-2">Domains</div>
                <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                    {loadingDomains ? (
                        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>
                    ) : domains.length === 0 ? (
                        <div className="text-white/30 text-sm italic text-center py-10">No domains yet.</div>
                    ) : (
                        domains.map(d => (
                            <button
                                key={d.id}
                                onClick={() => handleSelectDomain(d)}
                                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between group transition-colors ${
                                    activeDomain?.id === d.id ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                    <span className="truncate pr-2">{d.name}</span>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 flex items-center bg-black/50 p-1 rounded backdrop-blur-md">
                                    <MoreVertical className="w-3 h-3 text-white/50" />
                                </div>
                            </button>
                        ))
                    )}
                </div>
                <Button 
                    variant="outline" 
                    className="w-full shrink-0 border-white/10 text-white hover:bg-white/10"
                    onClick={() => setCreateDomainModalOpen(true)}
                >
                    <Plus className="w-4 h-4 mr-2" /> New Domain
                </Button>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white/[0.01] border border-white/10 rounded-xl p-4 md:p-6 overflow-hidden">
                {!activeDomain ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-white/40">
                        <Folder className="w-12 h-12 mb-4 opacity-20" />
                        <p>Select a domain or create one to organize your notes.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: activeDomain.color }} />
                            <h2 className="text-2xl font-bold text-white truncate">{activeDomain.name}</h2>
                            <div className="ml-auto flex shrink-0 gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    onClick={(e) => handleDeleteDomain(activeDomain.id, e)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Top Add Note input in Domain */}
                        <form onSubmit={handleCreateNote} className="flex gap-3 mb-6">
                            <Input
                                className="flex-1 bg-white/[0.02] border-white/10 text-white placeholder-white/30"
                                placeholder={`Add note to ${activeDomain.name}...`}
                                value={newNoteTitle}
                                onChange={(e) => setNewNoteTitle(e.target.value)}
                                disabled={savingNote}
                            />
                            <Button type="submit" className="bg-white text-black hover:bg-white/90" disabled={savingNote || !newNoteTitle.trim()}>
                                {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                            </Button>
                        </form>

                        {/* Domain Notes Grid */}
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {loadingNotes ? (
                                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-white/30" /></div>
                            ) : notes.length === 0 ? (
                                <div className="text-center py-20 text-white/30 border border-dashed border-white/10 rounded-xl">
                                    No notes in this domain yet.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    {notes.map(note => (
                                        <Card key={note.id} className="h-[130px] flex flex-col bg-white/[0.02] border-white/10 hover:border-white/20 transition-all overflow-hidden relative cursor-pointer group" onClick={() => handleOpenNoteModal(note)}>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 z-10 transition-opacity">
                                                <button
                                                    onClick={(e) => handleDeleteNote(note.id, e)}
                                                    className="p-1.5 bg-black/60 text-white/40 hover:text-red-400 rounded-md backdrop-blur-md"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <CardContent className="p-4 flex flex-col h-full pointer-events-none">
                                                <h3 className="text-base font-semibold text-white/90 truncate pr-8">{note.title}</h3>
                                                <p className="text-xs text-white/50 mt-1 line-clamp-2 flex-1 leading-relaxed">
                                                    {note.content ? note.content.slice(0, 100) + (note.content.length > 100 ? '...' : '') : 'Empty note'}
                                                </p>
                                                <div className="text-[10px] text-white/30 mt-auto uppercase tracking-wider">
                                                    {new Date(note.createdAt).toLocaleDateString()}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Create Domain Modal */}
            <Dialog open={createDomainModalOpen} onOpenChange={setCreateDomainModalOpen} title="New Domain">
                <div className="space-y-6">
                    <div>
                        <label className="text-sm text-white/50 mb-2 block">Domain Name</label>
                        <Input
                            value={newDomainName}
                            onChange={(e) => setNewDomainName(e.target.value)}
                            className="bg-transparent border-white/10 text-white"
                            placeholder="e.g. Work, Personal, Finances"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-sm text-white/50 mb-2 block">Color</label>
                        <div className="flex items-center gap-3">
                            {PRESET_COLORS.map(color => (
                                <button
                                    key={color.code}
                                    onClick={() => setNewDomainColor(color.code)}
                                    className={`w-8 h-8 rounded-full transition-transform ${newDomainColor === color.code ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a]' : 'hover:scale-110'}`}
                                    style={{ backgroundColor: color.code }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button 
                            onClick={handleCreateDomain}
                            disabled={savingDomain || !newDomainName.trim()}
                            className="bg-white text-black hover:bg-white/90"
                        >
                            {savingDomain ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Domain'}
                        </Button>
                    </div>
                </div>
            </Dialog>

            {/* Note Edit Modal (Identical to NormalNotesTab) */}
            <Dialog open={!!editingNote} onOpenChange={(open) => !open && setEditingNote(null)} title="Edit Domain Note">
                <div className="space-y-4 flex flex-col min-h-[50vh]">
                    <Input
                        value={editModeParams.title}
                        onChange={(e) => setEditModeParams({...editModeParams, title: e.target.value})}
                        placeholder="Title..."
                        className="text-lg font-semibold bg-transparent border-white/10 hover:border-white/20 focus:border-white/40 text-white"
                    />
                    <textarea
                        value={editModeParams.content}
                        onChange={(e) => setEditModeParams({...editModeParams, content: e.target.value})}
                        placeholder="Start typing..."
                        className="flex-1 w-full bg-transparent border border-white/10 hover:border-white/20 focus:border-white/40 rounded-md p-4 text-white placeholder-white/30 focus:outline-none resize-none custom-scrollbar"
                        style={{ minHeight: '300px' }}
                    />
                    <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-3">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handlePolish}
                                    disabled={polishing || !editModeParams.content.trim()}
                                    className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors"
                                >
                                    {polishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2 text-indigo-400" />}
                                    ✨ Polish with AI
                                </Button>
                                {polishMessage && (
                                    <span className={`text-sm ${polishMessage.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {polishMessage.text}
                                    </span>
                                )}
                            </div>
                        <Button 
                            onClick={handleSaveNote}
                            disabled={savingNote || !editModeParams.title.trim()}
                            className="bg-white text-black hover:bg-white/90"
                        >
                            {savingNote ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Note'}
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
