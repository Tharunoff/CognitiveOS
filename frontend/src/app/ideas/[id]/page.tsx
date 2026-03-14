'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Edit2, Check, X, Link2, AlertTriangle, Clock, ChevronDown, Skull } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };
const gentleSpring = { type: 'spring' as const, stiffness: 200, damping: 25 };

function EditableSection({ section, ideaId, onUpdate, index }: { section: any, ideaId: string, onUpdate: () => void, index: number }) {
    const [editing, setEditing] = useState(false);
    const [content, setContent] = useState(section.content);
    const [loading, setLoading] = useState(false);

    const isArray = content.startsWith('[');
    let parsedContent = content;
    try { if (isArray) parsedContent = JSON.parse(content); } catch (e) { }

    const handleSave = async () => {
        setLoading(true);
        try {
            let finalContent = content;
            if (isArray && Array.isArray(parsedContent)) finalContent = JSON.stringify(parsedContent);
            await apiFetch(`/ideas/sections/${section.id}`, { method: 'PUT', body: JSON.stringify({ content: finalContent }) });
            setEditing(false); onUpdate();
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, ...gentleSpring }}
        >
            <motion.div whileHover={{ y: -2 }} transition={{ ...spring, stiffness: 400 }}>
                <Card className="mb-3 border-white/10 bg-white/[0.02] hover:border-white/15 transition-colors duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                        <CardTitle className="text-base text-white/80">{section.sectionName}</CardTitle>
                        <AnimatePresence mode="wait">
                            {!editing ? (
                                <motion.div key="edit-btn" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={spring}>
                                    <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} transition={spring}>
                                        <Button variant="ghost" size="icon" onClick={() => setEditing(true)} className="text-white/20 hover:text-white/60">
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                    </motion.div>
                                </motion.div>
                            ) : (
                                <motion.div key="save-btns" className="flex gap-2" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={spring}>
                                    <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} transition={spring}>
                                        <Button variant="ghost" size="icon" onClick={handleSave} disabled={loading} className="text-white/60 hover:text-white"><Check className="w-4 h-4" /></Button>
                                    </motion.div>
                                    <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} transition={spring}>
                                        <Button variant="ghost" size="icon" onClick={() => { setEditing(false); setContent(section.content); }} disabled={loading} className="text-white/30 hover:text-white/60"><X className="w-4 h-4" /></Button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardHeader>
                    <CardContent>
                        <AnimatePresence mode="wait">
                            {editing ? (
                                <motion.div key="editing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={gentleSpring}>
                                    {isArray ? (
                                        <div className="space-y-2">
                                            {Array.isArray(parsedContent) && parsedContent.map((item: string, i: number) => (
                                                <motion.div key={i} className="flex gap-2 items-center" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04, ...spring }}>
                                                    <Input value={item} onChange={(e: any) => { const newArr = [...parsedContent]; newArr[i] = e.target.value; setContent(JSON.stringify(newArr)); }} className="flex-1 bg-white/[0.02] border-white/10 text-white" />
                                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.85 }} transition={spring}>
                                                        <Button variant="outline" size="icon" onClick={() => { const newArr = parsedContent.filter((_: any, index: number) => index !== i); setContent(JSON.stringify(newArr)); }} className="border-white/10 text-white/40 hover:text-white"><X className="w-3 h-3" /></Button>
                                                    </motion.div>
                                                </motion.div>
                                            ))}
                                            <motion.div whileTap={{ scale: 0.95 }} transition={spring}>
                                                <Button variant="ghost" size="sm" onClick={() => { const newArr = Array.isArray(parsedContent) ? [...parsedContent, ""] : [""]; setContent(JSON.stringify(newArr)); }} className="mt-2 text-xs text-white/40 hover:text-white">+ Add Item</Button>
                                            </motion.div>
                                        </div>
                                    ) : (
                                        <textarea className="w-full min-h-[100px] p-3 text-sm border border-white/10 rounded-lg bg-white/[0.02] text-white focus:outline-none focus:border-white/30 transition-colors" value={content} onChange={(e: any) => setContent(e.target.value)} />
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div key="viewing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={gentleSpring}>
                                    {isArray ? (
                                        <ul className="list-disc pl-5 space-y-1 text-sm text-white/50">
                                            {Array.isArray(parsedContent) ? parsedContent.map((item: string, i: number) => (
                                                <motion.li key={i} className="leading-relaxed" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03, ...gentleSpring }}>
                                                    {item}
                                                </motion.li>
                                            )) : <li>{content}</li>}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-white/50 whitespace-pre-wrap leading-relaxed border-l-2 pl-3 border-white/10">{content}</p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}

export default function IdeaCanvasPage() {
    const { id } = useParams();
    const [idea, setIdea] = useState<any>(null);
    const [aiInstructions, setAiInstructions] = useState('');
    const [editingAi, setEditingAi] = useState(false);
    const [premortem, setPremortem] = useState<any>(null);
    const [loadingPremortem, setLoadingPremortem] = useState(false);
    const [contradictions, setContradictions] = useState<any[]>([]);
    const [showRevisions, setShowRevisions] = useState(false);

    const fetchIdea = async () => {
        try { const data = await apiFetch(`/ideas/${id}`); setIdea(data); }
        catch (err) { console.error(err); }
    };

    useEffect(() => { if (id) fetchIdea(); }, [id]);

    const handleAiEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiInstructions.trim()) return;
        setEditingAi(true);
        try {
            await apiFetch(`/ideas/${id}/ai-edit`, { method: 'PUT', body: JSON.stringify({ instructions: aiInstructions }) });
            setAiInstructions(''); await fetchIdea();
        } catch (err) { console.error(err); alert("Failed to edit idea."); }
        finally { setEditingAi(false); }
    };

    const loadPremortem = async () => {
        setLoadingPremortem(true);
        try {
            const data = await apiFetch(`/ideas/${id}/premortem`);
            setPremortem(data);
        } catch (err) { console.error(err); }
        finally { setLoadingPremortem(false); }
    };

    const loadContradictions = async () => {
        try {
            const data = await apiFetch(`/ideas/${id}/contradictions`);
            setContradictions(data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (idea) { loadContradictions(); }
    }, [idea?.id]);

    if (!idea) return (
        <div className="p-12 flex justify-center">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full"
            />
        </div>
    );

    const allConnections = [
        ...(idea.sourceLinks || []).map((l: any) => ({ ...l, direction: 'to', linkedIdea: l.target })),
        ...(idea.targetLinks || []).map((l: any) => ({ ...l, direction: 'from', linkedIdea: l.source })),
    ];

    return (
        <motion.div
            className="max-w-4xl mx-auto space-y-6 pt-6 pb-16"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...gentleSpring, delay: 0.1 }}>
                <div className="flex items-center justify-between gap-4 mb-4">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">{idea.title}</h1>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {idea.subType && (
                            <span className="text-xs px-2 py-1 rounded-md bg-white/5 text-white/30">{idea.subType}</span>
                        )}
                        <span className={`text-xs px-2.5 py-1 font-medium rounded-full ${idea.type === 'Personal' ? 'bg-white/10 text-white/60' : 'bg-white/5 text-white/40'}`}>
                            {idea.type || 'Work'}
                        </span>
                    </div>
                </div>
                <motion.div
                    className="bg-white/[0.03] p-4 rounded-lg border-l-2 border-white/20"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...gentleSpring, delay: 0.2 }}
                >
                    <p className="text-white/50 italic">{idea.problem}</p>
                </motion.div>

                {/* Tags */}
                {idea.tags?.length > 0 && (
                    <motion.div className="flex gap-2 mt-3 flex-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
                        {idea.tags.map((tag: any) => (
                            <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/30">#{tag.name}</span>
                        ))}
                    </motion.div>
                )}
            </motion.div>

            {/* Contradictions Alert */}
            <AnimatePresence>
                {contradictions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={gentleSpring}
                    >
                        <Card className="border-white/20 bg-white/[0.03]">
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-white/50" />
                                    <span className="text-sm font-medium text-white/70">Contradictions Detected</span>
                                </div>
                                {contradictions.map((c, i) => (
                                    <motion.div
                                        key={i}
                                        className="p-3 rounded-lg border border-white/5 bg-white/[0.02]"
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.08, ...spring }}
                                    >
                                        <p className="text-sm text-white/60">{c.explanation}</p>
                                        <p className="text-xs text-white/30 mt-1">
                                            Conflicts with: <span className="text-white/50">&quot;{c.existing_idea_title}&quot;</span>
                                            <span className="ml-2 text-white/20">({c.contradiction_type?.replace(/_/g, ' ')})</span>
                                        </p>
                                        {c.suggested_resolution && (
                                            <p className="text-xs text-white/30 mt-2 border-t border-white/5 pt-2">💡 {c.suggested_resolution}</p>
                                        )}
                                    </motion.div>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Connections */}
            {allConnections.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...gentleSpring, delay: 0.25 }}
                >
                    <Card className="border-white/10 bg-white/[0.02]">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm text-white/60 flex items-center gap-2">
                                <Link2 className="w-4 h-4" />
                                Connections ({allConnections.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {allConnections.map((conn: any, i: number) => (
                                <motion.div
                                    key={conn.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05, ...spring }}
                                >
                                    <Link href={`/ideas/${conn.linkedIdea?.id}`}>
                                        <div className="flex items-center gap-3 p-2.5 rounded-lg border border-white/5 hover:border-white/15 transition-colors cursor-pointer group">
                                            <span className="text-xs text-white/20 w-20 flex-shrink-0">{conn.linkType?.replace(/_/g, ' ')}</span>
                                            <span className="text-sm text-white/50 group-hover:text-white/80 transition-colors truncate">{conn.linkedIdea?.title}</span>
                                            {conn.reason && <span className="text-xs text-white/20 truncate hidden sm:block">— {conn.reason}</span>}
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* AI Edit */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...gentleSpring, delay: 0.25 }}
            >
                <Card className="border-white/15 bg-white/[0.03]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-white/70 flex items-center gap-2">✨ Edit with AI</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAiEdit} className="flex gap-2">
                            <Input
                                value={aiInstructions}
                                onChange={(e: any) => setAiInstructions(e.target.value)}
                                placeholder="e.g. Focus entirely on mobile-first approach..."
                                disabled={editingAi}
                                className="flex-1 bg-white/[0.02] border-white/10 text-white placeholder-white/20"
                            />
                            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} transition={spring}>
                                <Button type="submit" disabled={editingAi || !aiInstructions.trim()} className="bg-white text-black hover:bg-white/90">
                                    {editingAi ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Apply
                                </Button>
                            </motion.div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Sections */}
            <div className="space-y-3">
                {idea.sections.map((section: any, i: number) => (
                    <EditableSection key={section.id} section={section} ideaId={idea.id} onUpdate={fetchIdea} index={i} />
                ))}
            </div>

            {/* Actions Bar */}
            <motion.div
                className="flex gap-2 flex-wrap"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...gentleSpring, delay: 0.5 }}
            >
                <motion.div whileTap={{ scale: 0.95 }} transition={spring}>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadPremortem}
                        disabled={loadingPremortem}
                        className="border-white/10 text-white/50 hover:text-white hover:border-white/20"
                    >
                        {loadingPremortem ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Skull className="w-3 h-3 mr-2" />}
                        Pre-Mortem
                    </Button>
                </motion.div>
                {idea.revisions?.length > 0 && (
                    <motion.div whileTap={{ scale: 0.95 }} transition={spring}>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowRevisions(!showRevisions)}
                            className="border-white/10 text-white/50 hover:text-white hover:border-white/20"
                        >
                            <Clock className="w-3 h-3 mr-2" />
                            History ({idea.revisions.length})
                            <motion.div animate={{ rotate: showRevisions ? 180 : 0 }} transition={spring} className="ml-1">
                                <ChevronDown className="w-3 h-3" />
                            </motion.div>
                        </Button>
                    </motion.div>
                )}
            </motion.div>

            {/* Pre-mortem Results */}
            <AnimatePresence>
                {premortem && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={gentleSpring}
                    >
                        <Card className="border-white/15 bg-white/[0.03]">
                            <CardHeader>
                                <CardTitle className="text-base text-white flex items-center gap-2">
                                    <Skull className="w-4 h-4 text-white/50" />
                                    Pre-Mortem Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {premortem.failure_reasons?.map((r: any, i: number) => (
                                    <motion.div
                                        key={i}
                                        className="p-3 rounded-lg border border-white/5 bg-white/[0.02]"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.08, ...spring }}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-sm text-white/70">{r.reason}</p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full
                                                ${r.probability === 'high' ? 'bg-white/10 text-white/60' : 'bg-white/5 text-white/30'}`}>
                                                {r.probability}
                                            </span>
                                        </div>
                                        <p className="text-xs text-white/30">Mitigation: {r.mitigation}</p>
                                    </motion.div>
                                ))}
                                {premortem.biggest_assumption && (
                                    <div className="p-3 rounded-lg border border-white/10 bg-white/[0.03]">
                                        <p className="text-xs text-white/40 mb-1">Biggest assumption at risk:</p>
                                        <p className="text-sm text-white/60">{premortem.biggest_assumption}</p>
                                    </div>
                                )}
                                {premortem.validate_this_week?.length > 0 && (
                                    <div>
                                        <p className="text-xs text-white/40 mb-2">Validate this week:</p>
                                        <ul className="space-y-1">
                                            {premortem.validate_this_week.map((v: string, i: number) => (
                                                <li key={i} className="text-sm text-white/50 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-white/30 flex-shrink-0" />
                                                    {v}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Revision History */}
            <AnimatePresence>
                {showRevisions && idea.revisions?.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={gentleSpring}
                    >
                        <Card className="border-white/10 bg-white/[0.02]">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm text-white/60 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Thought Evolution
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 relative before:absolute before:left-3 before:top-0 before:bottom-0 before:w-px before:bg-white/10">
                                    {idea.revisions.map((rev: any, i: number) => (
                                        <motion.div
                                            key={rev.id}
                                            className="pl-8 relative"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.06, ...spring }}
                                        >
                                            <div className="absolute left-[9px] top-2 w-2 h-2 rounded-full bg-white/30" />
                                            <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                                                <p className="text-xs text-white/30">{new Date(rev.createdAt).toLocaleDateString()} — {new Date(rev.createdAt).toLocaleTimeString()}</p>
                                                <p className="text-sm text-white/50 mt-1">{rev.editNote || 'Revision saved'}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
