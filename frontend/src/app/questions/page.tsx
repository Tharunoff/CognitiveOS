'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, Check, X, HelpCircle } from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };
const gentleSpring = { type: 'spring' as const, stiffness: 200, damping: 25 };

interface Question {
    id: string;
    text: string;
    createdAt: string;
}

export default function QuestionsPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [newText, setNewText] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    useEffect(() => {
        apiFetch('/questions')
            .then(setQuestions)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newText.trim()) return;
        setSaving(true);
        try {
            const question = await apiFetch('/questions', {
                method: 'POST',
                body: JSON.stringify({ text: newText.trim() }),
            });
            setQuestions([question, ...questions]);
            setNewText('');
        } catch (err: any) {
            alert(err?.message || 'Failed to save question.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await apiFetch(`/questions/${id}`, { method: 'DELETE' });
            setQuestions(questions.filter(q => q.id !== id));
        } catch (err: any) {
            alert(err?.message || 'Failed to delete question.');
        }
    };

    const handleEditStart = (q: Question) => {
        setEditingId(q.id);
        setEditText(q.text);
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditText('');
    };

    const handleEditSave = async (id: string) => {
        if (!editText.trim()) return;
        try {
            const updated = await apiFetch(`/questions/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ text: editText.trim() }),
            });
            setQuestions(questions.map(q => q.id === id ? updated : q));
            setEditingId(null);
            setEditText('');
        } catch (err: any) {
            alert(err?.message || 'Failed to update question.');
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full"
                />
                <motion.p
                    className="text-sm text-white/40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    Loading questions...
                </motion.p>
            </div>
        );
    }

    return (
        <motion.div
            className="max-w-3xl mx-auto space-y-6 pt-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...gentleSpring, delay: 0.1 }}
            >
                <h1 className="text-3xl font-bold tracking-tight text-white">Questions</h1>
                <p className="text-white/40">Save questions you want to think about later. No AI — just a clean list.</p>
            </motion.div>

            {/* Add question form */}
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...gentleSpring, delay: 0.2 }}
            >
                <Card className="border-white/10 bg-white/[0.02] hover:border-white/15 transition-colors duration-500">
                    <CardHeader>
                        <CardTitle className="text-white">Add a Question</CardTitle>
                        <CardDescription className="text-white/40">
                            What&apos;s on your mind? Save it here and come back to it later.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAdd} className="flex gap-3">
                            <Input
                                className="flex-1 h-12 text-lg px-4 bg-white/[0.02] border-white/10 text-white placeholder-white/20"
                                placeholder="E.g., What would I do if I had unlimited funding?"
                                value={newText}
                                onChange={(e: any) => setNewText(e.target.value)}
                                disabled={saving}
                            />
                            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.94 }} transition={spring}>
                                <Button
                                    type="submit"
                                    disabled={saving || !newText.trim()}
                                    className="w-28 h-12 font-semibold bg-white text-black hover:bg-white/90 disabled:bg-white/10 disabled:text-white/30"
                                >
                                    {saving ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                                        />
                                    ) : 'Save'}
                                </Button>
                            </motion.div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Questions list */}
            <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...gentleSpring, delay: 0.3 }}
            >
                <AnimatePresence>
                    {questions.length === 0 ? (
                        <motion.div
                            className="text-center py-16"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={gentleSpring}
                        >
                            <HelpCircle className="w-10 h-10 text-white/10 mx-auto mb-4" />
                            <p className="text-white/30 text-sm mb-1">No questions saved yet.</p>
                            <p className="text-white/20 text-xs">Start by adding one above.</p>
                        </motion.div>
                    ) : (
                        questions.map((q, i) => (
                            <motion.div
                                key={q.id}
                                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                                transition={{ delay: i * 0.03, ...gentleSpring }}
                            >
                                <motion.div
                                    whileHover={{ y: -1 }}
                                    transition={{ ...spring, stiffness: 400 }}
                                >
                                    <Card className="border-white/10 bg-white/[0.02] hover:border-white/15 transition-colors duration-500">
                                        <CardContent className="p-4">
                                            {editingId === q.id ? (
                                                <div className="flex gap-2 items-center">
                                                    <Input
                                                        className="flex-1 h-10 bg-white/[0.02] border-white/10 text-white text-sm"
                                                        value={editText}
                                                        onChange={(e: any) => setEditText(e.target.value)}
                                                        onKeyDown={(e: any) => {
                                                            if (e.key === 'Enter') handleEditSave(q.id);
                                                            if (e.key === 'Escape') handleEditCancel();
                                                        }}
                                                        autoFocus
                                                    />
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        className="p-2 rounded-md hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors"
                                                        onClick={() => handleEditSave(q.id)}
                                                        title="Save"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        className="p-2 rounded-md hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors"
                                                        onClick={handleEditCancel}
                                                        title="Cancel"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </motion.button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-white">{q.text}</p>
                                                        <p className="text-xs text-white/20 mt-1">
                                                            {new Date(q.createdAt).toLocaleDateString('en-US', {
                                                                month: 'short', day: 'numeric', year: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-1 flex-shrink-0">
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="p-2 rounded-md hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
                                                            onClick={() => handleEditStart(q)}
                                                            title="Edit"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="p-2 rounded-md hover:bg-white/5 text-white/30 hover:text-red-400/60 transition-colors"
                                                            onClick={() => handleDelete(q.id)}
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
