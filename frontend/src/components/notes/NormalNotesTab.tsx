import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Wand2, Loader2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog } from './ui';
import { getNotes, createNote, updateNote, deleteNote, polishNote } from '@/services/notes';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };
const gentleSpring = { type: 'spring' as const, stiffness: 200, damping: 25 };

interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: string;
}

export function NormalNotesTab() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTitle, setNewTitle] = useState('');
    const [creating, setCreating] = useState(false);

    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    const [polishing, setPolishing] = useState(false);
    const [polishMessage, setPolishMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        getNotes().then(setNotes).catch(console.error).finally(() => setLoading(false));
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        setCreating(true);
        try {
            const note = await createNote(newTitle, '');
            setNotes([note, ...notes]);
            setNewTitle('');
            handleOpenModal(note);
        } catch (err: any) {
            alert(err?.message || 'Failed to create note');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await deleteNote(id);
            setNotes(notes.filter(n => n.id !== id));
        } catch (err: any) {
            alert(err?.message || 'Failed to delete note');
        }
    };

    const handleOpenModal = (note: Note) => {
        setEditingNote(note);
        setEditTitle(note.title);
        setEditContent(note.content || '');
        setModalOpen(true);
        setPolishMessage(null);
    };

    const handleSave = async () => {
        if (!editingNote || !editTitle.trim()) return;
        setSaving(true);
        try {
            const updated = await updateNote(editingNote.id, editTitle, editContent);
            setNotes(notes.map(n => (n.id === updated.id ? updated : n)));
            setModalOpen(false);
            setEditingNote(null);
        } catch (err: any) {
            alert(err?.message || 'Failed to save note');
        } finally {
            setSaving(false);
        }
    };

    const handlePolish = async () => {
        if (!editContent.trim()) return;
        setPolishing(true);
        setPolishMessage(null);
        const originalContent = editContent;
        try {
            const res = await polishNote(editContent);
            setEditContent(res.polished);
            setPolishMessage({ type: 'success', text: 'Note polished' });
            setTimeout(() => setPolishMessage(null), 2000);
        } catch (err) {
            setPolishMessage({ type: 'error', text: 'Polish failed. Try again.' });
            setEditContent(originalContent);
        } finally {
            setPolishing(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Create Bar */}
            <motion.form 
                onSubmit={handleCreate} 
                className="flex gap-3 h-12"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...gentleSpring, delay: 0.1 }}
            >
                <Input
                    className="flex-1 h-full text-base bg-white/[0.02] border-white/10 text-white placeholder-white/40"
                    placeholder="Note title..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    disabled={creating}
                />
                <Button 
                    type="submit" 
                    className="h-full px-5 bg-white text-black hover:bg-white/90 disabled:opacity-50"
                    disabled={creating || !newTitle.trim()}
                >
                    {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5 mr-1" /> Add Note</>}
                </Button>
            </motion.form>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-white/30" />
                </div>
            ) : notes.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                    className="text-center py-20 text-white/40 border border-dashed border-white/10 rounded-xl"
                >
                    No notes yet. Create your first note above.
                </motion.div>
            ) : (
                <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...gentleSpring, delay: 0.2 }}
                >
                    <AnimatePresence>
                        {notes.map((note) => (
                            <motion.div
                                key={note.id}
                                layoutId={`note-${note.id}`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={gentleSpring}
                                onClick={() => handleOpenModal(note)}
                                className="group cursor-pointer relative"
                            >
                                <Card className="h-[140px] flex flex-col bg-white/[0.02] border-white/10 hover:border-white/20 transition-all overflow-hidden relative">
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleDelete(note.id, e)}
                                            className="p-2 bg-black/40 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-md backdrop-blur-sm transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <CardContent className="p-5 flex flex-col h-full pointer-events-none">
                                        <h3 className="text-lg font-semibold text-white/90 truncate pr-8">{note.title}</h3>
                                        <p className="text-sm text-white/50 mt-2 line-clamp-2 leading-relaxed flex-1">
                                            {note.content ? note.content.slice(0, 100) + (note.content.length > 100 ? '...' : '') : 'Empty note'}
                                        </p>
                                        <div className="text-xs text-white/30 mt-auto pt-2">
                                            {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Edit Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen} title="Edit Note">
                <div className="space-y-4 flex flex-col min-h-[50vh]">
                    <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Title..."
                        className="text-lg font-semibold bg-transparent border-white/10 hover:border-white/20 focus:border-white/40 text-white"
                    />
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
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
                                disabled={polishing || !editContent.trim()}
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
                            onClick={handleSave}
                            disabled={saving || !editTitle.trim()}
                            className="bg-white text-black hover:bg-white/90"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Note'}
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
