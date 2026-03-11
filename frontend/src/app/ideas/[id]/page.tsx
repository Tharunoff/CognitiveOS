'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Edit2, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

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
            transition={{ delay: index * 0.08, ...gentleSpring }}
        >
            <motion.div whileHover={{ y: -2 }} transition={{ ...spring, stiffness: 400 }}>
                <Card className="mb-4 hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                        <CardTitle className="text-lg">{section.sectionName}</CardTitle>
                        <AnimatePresence mode="wait">
                            {!editing ? (
                                <motion.div key="edit-btn" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={spring}>
                                    <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} transition={spring}>
                                        <Button variant="ghost" size="icon" onClick={() => setEditing(true)}><Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" /></Button>
                                    </motion.div>
                                </motion.div>
                            ) : (
                                <motion.div key="save-btns" className="flex gap-2" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={spring}>
                                    <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} transition={spring}>
                                        <Button variant="ghost" size="icon" onClick={handleSave} disabled={loading}><Check className="w-4 h-4 text-green-500" /></Button>
                                    </motion.div>
                                    <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} transition={spring}>
                                        <Button variant="ghost" size="icon" onClick={() => { setEditing(false); setContent(section.content); }} disabled={loading}><X className="w-4 h-4 text-destructive" /></Button>
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
                                                <motion.div
                                                    key={i}
                                                    className="flex gap-2 items-center"
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05, ...spring }}
                                                >
                                                    <Input value={item} onChange={(e: any) => { const newArr = [...parsedContent]; newArr[i] = e.target.value; setContent(JSON.stringify(newArr)); }} className="flex-1" />
                                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.85 }} transition={spring}>
                                                        <Button variant="outline" size="icon" onClick={() => { const newArr = parsedContent.filter((_: any, index: number) => index !== i); setContent(JSON.stringify(newArr)); }}><X className="w-3 h-3" /></Button>
                                                    </motion.div>
                                                </motion.div>
                                            ))}
                                            <motion.div whileTap={{ scale: 0.95 }} transition={spring}>
                                                <Button variant="secondary" size="sm" onClick={() => { const newArr = Array.isArray(parsedContent) ? [...parsedContent, "New item"] : ["New item"]; setContent(JSON.stringify(newArr)); }} className="mt-2 text-xs">+ Add Item</Button>
                                            </motion.div>
                                        </div>
                                    ) : (
                                        <textarea className="w-full min-h-[100px] p-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow" value={content} onChange={(e: any) => setContent(e.target.value)} />
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div key="viewing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={gentleSpring}>
                                    {isArray ? (
                                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground marker:text-primary/50">
                                            {Array.isArray(parsedContent) ? parsedContent.map((item: string, i: number) => (
                                                <motion.li key={i} className="leading-relaxed" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04, ...gentleSpring }}>
                                                    {item}
                                                </motion.li>
                                            )) : <li>{content}</li>}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed border-l-2 pl-3 border-secondary">{content}</p>
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
        } catch (err) { console.error(err); alert("Failed to edit idea. Ensure your instructions are clear."); }
        finally { setEditingAi(false); }
    }

    if (!idea) return (
        <div className="p-12 flex justify-center text-primary">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Loader2 className="h-8 w-8" />
            </motion.div>
        </div>
    );

    return (
        <motion.div
            className="max-w-4xl mx-auto space-y-8 pt-6 pb-16"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...gentleSpring, delay: 0.1 }}>
                <div className="flex items-center justify-between gap-4 mb-4">
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">{idea.title}</h1>
                    <motion.span
                        className={`text-sm px-3 py-1 font-medium rounded-full ${idea.type === 'Personal' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}
                        whileHover={{ scale: 1.08 }}
                        transition={spring}
                    >
                        {idea.type || 'Work'} Idea
                    </motion.span>
                </div>
                <motion.div
                    className="bg-secondary/50 p-4 rounded-lg border-l-4 border-primary"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...gentleSpring, delay: 0.2 }}
                >
                    <p className="text-muted-foreground italic text-lg">{idea.problem}</p>
                </motion.div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...gentleSpring, delay: 0.25 }}
            >
                <Card className="border-primary/50 bg-primary/5 hover:shadow-lg hover:shadow-primary/5 transition-shadow duration-500">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">✨ Edit Idea with AI</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAiEdit} className="flex gap-2">
                            <Input
                                value={aiInstructions}
                                onChange={(e: any) => setAiInstructions(e.target.value)}
                                placeholder="e.g. Remove the mobile app feature and focus entirely on web dashboard..."
                                disabled={editingAi}
                                className="flex-1 bg-background"
                            />
                            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} transition={spring}>
                                <Button type="submit" disabled={editingAi || !aiInstructions.trim()}>
                                    {editingAi ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Apply Edits
                                </Button>
                            </motion.div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>

            <div className="space-y-4">
                {idea.sections.map((section: any, i: number) => (
                    <EditableSection key={section.id} section={section} ideaId={idea.id} onUpdate={fetchIdea} index={i} />
                ))}
            </div>
        </motion.div>
    );
}
