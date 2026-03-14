'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Pencil, X, Check, Archive, AlertTriangle, Link2, MessageSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };
const gentleSpring = { type: 'spring' as const, stiffness: 200, damping: 25 };

const cardVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.96 },
    visible: (i: number) => ({
        opacity: 1, y: 0, scale: 1,
        transition: { delay: i * 0.04, ...gentleSpring }
    }),
    exit: { opacity: 0, scale: 0.92, y: -10, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } }
};

function DecayBar({ score }: { score: number }) {
    const pct = Math.round(score * 100);
    return (
        <div className="flex items-center gap-2" title={`Freshness: ${pct}%`}>
            <div className="w-12 h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                    className={`h-full rounded-full ${pct > 70 ? 'bg-white/50' : pct > 40 ? 'bg-white/30' : 'bg-white/20'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                />
            </div>
            <span className="text-[10px] text-white/20">{pct}%</span>
        </div>
    );
}

export default function IdeaVaultPage() {
    const [ideas, setIdeas] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'All' | 'Work' | 'Personal'>('All');
    const [sortBy, setSortBy] = useState<'recent' | 'decay' | 'priority'>('recent');
    const [showArchived, setShowArchived] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editProblem, setEditProblem] = useState('');
    const [chatOpen, setChatOpen] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
    const [chatLoading, setChatLoading] = useState(false);

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

    const handleArchive = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        try {
            await apiFetch(`/ideas/${id}/archive`, { method: 'PUT' });
            setIdeas(ideas.map(i => i.id === id ? { ...i, archived: !i.archived } : i));
        } catch (err) { console.error(err); }
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

    const handleChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatMessage.trim()) return;
        const msg = chatMessage;
        setChatMessage('');
        setChatHistory(prev => [...prev, { role: 'user', content: msg }]);
        setChatLoading(true);
        try {
            const result = await apiFetch('/ideas/vault/chat', { method: 'POST', body: JSON.stringify({ message: msg }) });
            setChatHistory(prev => [...prev, { role: 'assistant', content: result.response }]);
        } catch {
            setChatHistory(prev => [...prev, { role: 'assistant', content: 'Failed to process. Try again.' }]);
        } finally {
            setChatLoading(false);
        }
    };

    const activeIdeas = ideas.filter(i => !i.archived);
    const archivedIdeas = ideas.filter(i => i.archived);
    const needsAttention = activeIdeas.filter(i => i.decayScore < 0.4).sort((a, b) => a.decayScore - b.decayScore);
    const connectedIdeas = activeIdeas.filter(i => (i.sourceLinks?.length > 0 || i.targetLinks?.length > 0));

    const displayIdeas = (showArchived ? archivedIdeas : activeIdeas)
        .filter(i => {
            const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase()) || i.problem.toLowerCase().includes(search.toLowerCase());
            const matchesType = typeFilter === 'All' || i.type === typeFilter;
            return matchesSearch && matchesType;
        })
        .sort((a, b) => {
            if (sortBy === 'decay') return a.decayScore - b.decayScore;
            if (sortBy === 'priority') return b.priority - a.priority;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

    return (
        <motion.div
            className="space-y-6 pt-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ ...gentleSpring, delay: 0.1 }}>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Idea Vault</h1>
                    <p className="text-white/40 text-sm">{activeIdeas.length} active · {archivedIdeas.length} archived · {needsAttention.length} fading</p>
                </motion.div>
                <motion.div className="flex gap-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ ...gentleSpring, delay: 0.2 }}>
                    <Input
                        placeholder="Search ideas..."
                        value={search}
                        onChange={(e: any) => setSearch(e.target.value)}
                        className="w-48 sm:w-64 bg-white/[0.02] border-white/10 text-white placeholder-white/20"
                    />
                    <motion.div whileTap={{ scale: 0.95 }} transition={spring}>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setChatOpen(!chatOpen)}
                            className={`border-white/10 ${chatOpen ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                            title="Vault Chat"
                        >
                            <MessageSquare className="w-4 h-4" />
                        </Button>
                    </motion.div>
                </motion.div>
            </div>

            {/* Filters */}
            <motion.div className="flex gap-2 flex-wrap" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...gentleSpring, delay: 0.25 }}>
                <div className="flex gap-1 border-r border-white/5 pr-3 mr-1">
                    {(['All', 'Work', 'Personal'] as const).map(t => (
                        <motion.div key={t} whileTap={{ scale: 0.93 }} transition={spring}>
                            <Button
                                variant={typeFilter === t ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setTypeFilter(t)}
                                className={typeFilter === t ? 'bg-white text-black hover:bg-white/90' : 'text-white/40 hover:text-white'}
                            >{t}</Button>
                        </motion.div>
                    ))}
                </div>
                <div className="flex gap-1 border-r border-white/5 pr-3 mr-1">
                    {([
                        { key: 'recent', label: 'Recent' },
                        { key: 'decay', label: 'Fading' },
                        { key: 'priority', label: 'Priority' }
                    ] as const).map(s => (
                        <motion.div key={s.key} whileTap={{ scale: 0.93 }} transition={spring}>
                            <Button
                                variant={sortBy === s.key ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setSortBy(s.key)}
                                className={sortBy === s.key ? 'bg-white text-black hover:bg-white/90' : 'text-white/40 hover:text-white'}
                            >{s.label}</Button>
                        </motion.div>
                    ))}
                </div>
                <motion.div whileTap={{ scale: 0.93 }} transition={spring}>
                    <Button
                        variant={showArchived ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setShowArchived(!showArchived)}
                        className={showArchived ? 'bg-white text-black hover:bg-white/90' : 'text-white/40 hover:text-white'}
                    >
                        <Archive className="w-3 h-3 mr-1" />
                        Archived
                    </Button>
                </motion.div>
            </motion.div>

            {/* Vault Chat Panel */}
            <AnimatePresence>
                {chatOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={gentleSpring}
                    >
                        <Card className="border-white/10 bg-white/[0.02]">
                            <CardHeader className="pb-3 px-4">
                                <CardTitle className="text-sm text-white flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-white/50" />
                                    Vault Chat — Ask anything about your ideas
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="max-h-64 overflow-y-auto space-y-3 mb-3">
                                    {chatHistory.length === 0 && (
                                        <p className="text-xs text-white/20 text-center py-4">Ask me about your vault. &quot;What themes keep coming up?&quot; or &quot;Summarize my health-related ideas.&quot;</p>
                                    )}
                                    {chatHistory.map((msg, i) => (
                                        <motion.div
                                            key={i}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ ...spring }}
                                        >
                                            <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm
                                                ${msg.role === 'user'
                                                    ? 'bg-white text-black'
                                                    : 'bg-white/[0.05] border border-white/10 text-white/70'
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </motion.div>
                                    ))}
                                    {chatLoading && (
                                        <motion.div className="flex justify-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <div className="bg-white/[0.05] border border-white/10 px-3 py-2 rounded-lg">
                                                <motion.div className="flex gap-1">
                                                    {[0, 1, 2].map(i => (
                                                        <motion.div
                                                            key={i}
                                                            className="w-1.5 h-1.5 rounded-full bg-white/30"
                                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                                        />
                                                    ))}
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                                <form onSubmit={handleChat} className="flex gap-2">
                                    <Input
                                        value={chatMessage}
                                        onChange={(e: any) => setChatMessage(e.target.value)}
                                        placeholder="Ask your vault..."
                                        className="flex-1 bg-white/[0.02] border-white/10 text-white placeholder-white/20"
                                        disabled={chatLoading}
                                    />
                                    <motion.div whileTap={{ scale: 0.9 }} transition={spring}>
                                        <Button type="submit" size="icon" disabled={chatLoading} className="bg-white text-black hover:bg-white/90">
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </motion.div>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Needs Attention Section */}
            {!showArchived && needsAttention.length > 0 && !search && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...gentleSpring, delay: 0.3 }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-3.5 h-3.5 text-white/40" />
                        <span className="text-xs font-medium text-white/40 uppercase tracking-wide">Needs Attention</span>
                    </div>
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                        {needsAttention.slice(0, 3).map((idea, i) => (
                            <motion.div
                                key={idea.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 + i * 0.05, ...spring }}
                            >
                                <Link href={`/ideas/${idea.id}`}>
                                    <motion.div whileHover={{ y: -2 }} transition={{ ...spring, stiffness: 400 }}>
                                        <Card className="border-white/10 bg-white/[0.02] hover:border-white/20 transition-colors cursor-pointer">
                                            <CardContent className="p-4">
                                                <p className="text-sm font-medium text-white truncate">{idea.title}</p>
                                                <p className="text-xs text-white/30 truncate mt-1">{idea.problem}</p>
                                                <div className="mt-3">
                                                    <DecayBar score={idea.decayScore} />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Connected Ideas */}
            {!showArchived && connectedIdeas.length > 0 && !search && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...gentleSpring, delay: 0.4 }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Link2 className="w-3.5 h-3.5 text-white/40" />
                        <span className="text-xs font-medium text-white/40 uppercase tracking-wide">Recently Connected</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {connectedIdeas.slice(0, 5).map((idea, i) => (
                            <motion.div
                                key={idea.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.45 + i * 0.04, ...spring }}
                                className="flex-shrink-0"
                            >
                                <Link href={`/ideas/${idea.id}`}>
                                    <div className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] hover:border-white/20 transition-colors text-sm text-white/60 hover:text-white flex items-center gap-2 whitespace-nowrap">
                                        <Link2 className="w-3 h-3 text-white/30" />
                                        {idea.title}
                                        <span className="text-xs text-white/20">
                                            {(idea.sourceLinks?.length || 0) + (idea.targetLinks?.length || 0)} links
                                        </span>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Main Ideas Grid */}
            {loading ? (
                <motion.div className="flex justify-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full"
                    />
                </motion.div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence>
                        {displayIdeas.map((idea, i) => (
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
                                            initial={{ opacity: 0, scale: 0.96 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.96 }}
                                            transition={gentleSpring}
                                        >
                                            <Card className="border-white/20 h-full flex flex-col bg-white/[0.04]">
                                                <CardHeader>
                                                    <Input value={editTitle} onChange={(e: any) => setEditTitle(e.target.value)} className="font-semibold text-lg bg-white/[0.02] border-white/10 text-white" placeholder="Title" onClick={(e: any) => e.stopPropagation()} />
                                                </CardHeader>
                                                <CardContent className="flex-1 space-y-3">
                                                    <Input value={editProblem} onChange={(e: any) => setEditProblem(e.target.value)} className="bg-white/[0.02] border-white/10 text-white" placeholder="Problem" onClick={(e: any) => e.stopPropagation()} />
                                                    <div className="flex gap-2 justify-end">
                                                        <motion.div whileTap={{ scale: 0.9 }} transition={spring}>
                                                            <Button size="sm" variant="ghost" onClick={cancelEditing} className="text-white/40 hover:text-white"><X className="w-4 h-4 mr-1" /> Cancel</Button>
                                                        </motion.div>
                                                        <motion.div whileTap={{ scale: 0.9 }} transition={spring}>
                                                            <Button size="sm" onClick={(e) => handleSaveEdit(idea.id, e)} className="bg-white text-black hover:bg-white/90"><Check className="w-4 h-4 mr-1" /> Save</Button>
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
                                                <Card className={`border-white/10 bg-white/[0.02] hover:border-white/20 transition-colors cursor-pointer h-full flex flex-col ${idea.archived ? 'opacity-50' : ''}`}>
                                                    <CardHeader>
                                                        <div className="flex justify-between items-start gap-2">
                                                            <CardTitle className="line-clamp-2 text-lg text-white">{idea.title}</CardTitle>
                                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                {idea.subType && (
                                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30">{idea.subType}</span>
                                                                )}
                                                                <span className={`text-xs px-2 py-0.5 rounded-full
                                                                    ${idea.type === 'Personal' ? 'bg-white/10 text-white/50' : 'bg-white/5 text-white/40'}`}>
                                                                    {idea.type || 'Work'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <CardDescription className="text-white/30">{new Date(idea.createdAt).toLocaleDateString()}</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="flex-1">
                                                        <p className="text-sm text-white/40 line-clamp-2">{idea.problem}</p>
                                                        <div className="mt-3 flex items-center justify-between">
                                                            <DecayBar score={idea.decayScore} />
                                                            {idea.tags?.length > 0 && (
                                                                <div className="flex gap-1">
                                                                    {idea.tags.slice(0, 2).map((tag: any) => (
                                                                        <span key={tag.id} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/25">{tag.name}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                    <div className="flex gap-1 justify-end p-3 pt-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                                                        <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} transition={spring}>
                                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/30 hover:text-white" onClick={(e) => startEditing(idea, e)}>
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                        </motion.div>
                                                        <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} transition={spring}>
                                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/30 hover:text-white" onClick={(e) => handleArchive(idea.id, e)}>
                                                                <Archive className="w-4 h-4" />
                                                            </Button>
                                                        </motion.div>
                                                        <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} transition={spring}>
                                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/30 hover:text-white/60" onClick={(e) => handleDelete(idea.id, e)}>
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
                {!loading && displayIdeas.length === 0 && (
                    <motion.div
                        className="text-center p-12 border border-white/5 rounded-lg text-white/30"
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        transition={gentleSpring}
                    >
                        {showArchived ? 'No archived ideas.' : 'No ideas found. Start a brain dump to capture your first thought.'}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
