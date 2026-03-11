'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Pencil, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };
const gentleSpring = { type: 'spring' as const, stiffness: 200, damping: 25 };

const cardVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.96 },
    visible: (i: number) => ({
        opacity: 1, y: 0, scale: 1,
        transition: { delay: i * 0.06, ...gentleSpring }
    }),
    exit: { opacity: 0, scale: 0.92, y: -10, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } }
};

const pageVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } }
};

export default function IdeaVaultPage() {
    const [ideas, setIdeas] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'All' | 'Work' | 'Personal'>('All');
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editProblem, setEditProblem] = useState('');

    useEffect(() => { fetchIdeas(); }, []);

    const fetchIdeas = async () => {
        try { const data = await apiFetch('/ideas'); setIdeas(data); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!confirm('Are you sure you want to delete this idea?')) return;
        try { await apiFetch(`/ideas/${id}`, { method: 'DELETE' }); setIdeas(ideas.filter(i => i.id !== id)); }
        catch (err) { console.error(err); alert('Failed to delete idea.'); }
    };

    const startEditing = (idea: any, e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        setEditingId(idea.id); setEditTitle(idea.title); setEditProblem(idea.problem);
    };

    const cancelEditing = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation(); setEditingId(null);
    };

    const handleSaveEdit = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        try {
            await apiFetch(`/ideas/${id}`, { method: 'PUT', body: JSON.stringify({ title: editTitle, problem: editProblem }) });
            setIdeas(ideas.map(i => i.id === id ? { ...i, title: editTitle, problem: editProblem } : i));
            setEditingId(null);
        } catch (err) { console.error(err); alert('Failed to update idea.'); }
    };

    const filteredIdeas = ideas.filter(i => {
        const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase()) || i.problem.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === 'All' || i.type === typeFilter;
        return matchesSearch && matchesType;
    });

    return (
        <motion.div className="space-y-6 pt-4" variants={pageVariants} initial="hidden" animate="visible">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ ...gentleSpring, delay: 0.1 }}>
                    <h1 className="text-3xl font-bold tracking-tight">Idea Vault</h1>
                    <p className="text-muted-foreground">All your structured startup ideas.</p>
                </motion.div>
                <motion.div className="w-full sm:w-72" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ ...gentleSpring, delay: 0.2 }}>
                    <Input placeholder="Search ideas..." value={search} onChange={(e: any) => setSearch(e.target.value)} />
                </motion.div>
            </div>

            <motion.div className="flex gap-2 border-b pb-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...gentleSpring, delay: 0.25 }}>
                {(['All', 'Work', 'Personal'] as const).map((t, i) => (
                    <motion.div key={t} whileTap={{ scale: 0.93 }} transition={spring}>
                        <Button variant={typeFilter === t ? 'default' : 'ghost'} size="sm" onClick={() => setTypeFilter(t)}>{t}</Button>
                    </motion.div>
                ))}
            </motion.div>

            {loading ? (
                <motion.div className="flex justify-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Loader2 className="animate-spin text-muted-foreground" />
                </motion.div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence>
                        {filteredIdeas.map((idea, i) => (
                            <motion.div
                                key={idea.id}
                                custom={i}
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="relative group"
                            >
                                <AnimatePresence mode="wait">
                                    {editingId === idea.id ? (
                                        <motion.div
                                            key="edit"
                                            initial={{ opacity: 0, rotateY: -8, scale: 0.96 }}
                                            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                                            exit={{ opacity: 0, rotateY: 8, scale: 0.96 }}
                                            transition={gentleSpring}
                                        >
                                            <Card className="border-primary h-full flex flex-col shadow-lg shadow-primary/10">
                                                <CardHeader>
                                                    <Input value={editTitle} onChange={(e: any) => setEditTitle(e.target.value)} className="font-semibold text-lg" placeholder="Title" onClick={(e: any) => e.stopPropagation()} />
                                                </CardHeader>
                                                <CardContent className="flex-1 space-y-3">
                                                    <Input value={editProblem} onChange={(e: any) => setEditProblem(e.target.value)} placeholder="Problem" onClick={(e: any) => e.stopPropagation()} />
                                                    <div className="flex gap-2 justify-end">
                                                        <motion.div whileTap={{ scale: 0.9 }} transition={spring}>
                                                            <Button size="sm" variant="ghost" onClick={cancelEditing}><X className="w-4 h-4 mr-1" /> Cancel</Button>
                                                        </motion.div>
                                                        <motion.div whileTap={{ scale: 0.9 }} transition={spring}>
                                                            <Button size="sm" onClick={(e) => handleSaveEdit(idea.id, e)}><Check className="w-4 h-4 mr-1" /> Save</Button>
                                                        </motion.div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="view"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            whileHover={{ y: -4, transition: { ...spring, stiffness: 400 } }}
                                        >
                                            <Link href={`/ideas/${idea.id}`}>
                                                <Card className="hover:border-primary transition-colors cursor-pointer h-full flex flex-col hover:shadow-lg hover:shadow-primary/5">
                                                    <CardHeader>
                                                        <div className="flex justify-between items-start gap-2">
                                                            <CardTitle className="line-clamp-2 text-lg">{idea.title}</CardTitle>
                                                            <motion.span
                                                                className={`text-xs px-2 py-1 rounded-full shrink-0 ${idea.type === 'Personal' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}
                                                                whileHover={{ scale: 1.08 }} transition={spring}
                                                            >
                                                                {idea.type || 'Work'}
                                                            </motion.span>
                                                        </div>
                                                        <CardDescription>{new Date(idea.createdAt).toLocaleDateString()}</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="flex-1">
                                                        <p className="text-sm text-muted-foreground line-clamp-3">{idea.problem}</p>
                                                    </CardContent>
                                                    <div className="flex gap-1 justify-end p-3 pt-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                                                        <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} transition={spring}>
                                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => startEditing(idea, e)}>
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                        </motion.div>
                                                        <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} transition={spring}>
                                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={(e) => handleDelete(idea.id, e)}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </motion.div>
                                                    </div>
                                                </Card>
                                            </Link>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <AnimatePresence>
                {!loading && filteredIdeas.length === 0 && (
                    <motion.div
                        className="text-center p-12 border rounded-lg text-muted-foreground"
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        transition={gentleSpring}
                    >
                        No ideas found.
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
