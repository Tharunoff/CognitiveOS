'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Clock, CheckCircle2, Trash2, Pencil } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DURATIONS = [30, 60, 90, 120];

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };
const gentleSpring = { type: 'spring' as const, stiffness: 200, damping: 25 };

const blockVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.95 },
    visible: (i: number) => ({
        opacity: 1, y: 0, scale: 1,
        transition: { delay: i * 0.04, ...gentleSpring }
    }),
    exit: { opacity: 0, scale: 0.9, x: -20, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } }
};

const formVariants = {
    hidden: { opacity: 0, height: 0, y: -20 },
    visible: { opacity: 1, height: 'auto', y: 0, transition: { ...gentleSpring, opacity: { duration: 0.3 } } },
    exit: { opacity: 0, height: 0, y: -20, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } }
};

export default function SchedulePage() {
    const [blocks, setBlocks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingBlock, setEditingBlock] = useState<any | null>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [day, setDay] = useState('Monday');
    const [startTime, setStartTime] = useState('09:00');
    const [duration, setDuration] = useState(60);
    const [reminderTime, setReminderTime] = useState(15);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchBlocks(); }, []);

    const fetchBlocks = async () => {
        try { const data = await apiFetch('/blocks'); setBlocks(data); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const resetForm = () => { setTitle(''); setDescription(''); setDay('Monday'); setStartTime('09:00'); setDuration(60); setReminderTime(15); };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        const [hrs, mins] = startTime.split(':').map(Number);
        const endMins = mins + duration;
        const endHrs = hrs + Math.floor(endMins / 60);
        const endTime = `${String(endHrs % 24).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;
        try {
            await apiFetch('/blocks', { method: 'POST', body: JSON.stringify({ title, description, day, startTime, endTime, reminderTime }) });
            setIsAdding(false); resetForm(); fetchBlocks();
        } catch (err) { console.error(err); alert('Failed to schedule block.'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!confirm('Delete this block?')) return;
        try { await apiFetch(`/blocks/${id}`, { method: 'DELETE' }); setBlocks(blocks.filter(b => b.id !== id)); }
        catch (err) { console.error(err); alert('Failed to delete block.'); }
    };

    const startEditing = (block: any, e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        setEditingBlock(block); setTitle(block.title); setDescription(block.description || '');
        setDay(block.day); setStartTime(block.startTime); setReminderTime(block.reminderTime);
        const [sh, sm] = block.startTime.split(':').map(Number);
        const [eh, em] = block.endTime.split(':').map(Number);
        setDuration((eh * 60 + em) - (sh * 60 + sm)); setIsAdding(false);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault(); if (!editingBlock) return; setSaving(true);
        const [hrs, mins] = startTime.split(':').map(Number);
        const endMins = mins + duration;
        const endHrs = hrs + Math.floor(endMins / 60);
        const endTime = `${String(endHrs % 24).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;
        try {
            await apiFetch(`/blocks/${editingBlock.id}`, { method: 'PUT', body: JSON.stringify({ title, description, day, startTime, endTime, reminderTime }) });
            setEditingBlock(null); resetForm(); fetchBlocks();
        } catch (err) { console.error(err); alert('Failed to update block.'); }
        finally { setSaving(false); }
    };

    const cancelEditing = () => { setEditingBlock(null); resetForm(); };

    if (loading) return <div className="p-12 flex justify-center text-primary"><Loader2 className="animate-spin w-8 h-8" /></div>;

    return (
        <motion.div
            className="max-w-6xl mx-auto space-y-6 pt-4"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            <div className="flex justify-between items-center">
                <motion.h1 className="text-3xl font-bold tracking-tight" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ ...gentleSpring, delay: 0.1 }}>
                    Weekly Execution
                </motion.h1>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }} transition={spring}>
                    <Button onClick={() => { setIsAdding(!isAdding); setEditingBlock(null); resetForm(); }}>
                        <motion.div animate={{ rotate: isAdding ? 45 : 0 }} transition={spring}>
                            <Plus className="w-4 h-4 mr-2" />
                        </motion.div>
                        New Block
                    </Button>
                </motion.div>
            </div>

            <AnimatePresence>
                {(isAdding || editingBlock) && (
                    <motion.div variants={formVariants} initial="hidden" animate="visible" exit="exit">
                        <Card className="border-primary/50 shadow-lg shadow-primary/5">
                            <CardHeader><CardTitle>{editingBlock ? '✏️ Edit Block' : '📅 Schedule Focus Block'}</CardTitle></CardHeader>
                            <CardContent>
                                <form onSubmit={editingBlock ? handleSaveEdit : handleCreate} className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2"><Label>Title</Label><Input required value={title} onChange={(e: any) => setTitle(e.target.value)} placeholder="e.g. Deep Work on API" /></div>
                                    <div className="space-y-2">
                                        <Label>Day</Label>
                                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={day} onChange={(e: any) => setDay(e.target.value)}>
                                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2"><Label>Start Time</Label><Input type="time" required value={startTime} onChange={(e: any) => setStartTime(e.target.value)} /></div>
                                    <div className="space-y-2">
                                        <Label>Duration (Minutes)</Label>
                                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={duration} onChange={(e: any) => setDuration(Number(e.target.value))}>
                                            {DURATIONS.map(d => <option key={d} value={d}>{d} mins</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2"><Label>Reminder (Minutes before start)</Label><Input type="number" required value={reminderTime} onChange={(e: any) => setReminderTime(Number(e.target.value))} /></div>
                                    <div className="space-y-2 md:col-span-2"><Label>Goal / Description</Label><Input value={description} onChange={(e: any) => setDescription(e.target.value)} placeholder="What will you accomplish?" /></div>
                                    <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                                        <motion.div whileTap={{ scale: 0.93 }} transition={spring}>
                                            <Button variant="ghost" type="button" onClick={() => { setIsAdding(false); cancelEditing(); }}>Cancel</Button>
                                        </motion.div>
                                        <motion.div whileTap={{ scale: 0.93 }} transition={spring}>
                                            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingBlock ? 'Update Block' : 'Save Block'}</Button>
                                        </motion.div>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {DAYS.map((d, dayIndex) => (
                    <motion.div
                        key={d}
                        className="flex flex-col space-y-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: dayIndex * 0.05, ...gentleSpring }}
                    >
                        <h3 className="font-semibold text-center border-b pb-2">{d}</h3>
                        <div className="flex flex-col gap-3">
                            <AnimatePresence>
                                {blocks.filter(b => b.day === d).map((block, i) => (
                                    <motion.div
                                        key={block.id}
                                        custom={i}
                                        variants={blockVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        className="group relative"
                                    >
                                        <motion.div whileHover={{ y: -3, scale: 1.02 }} transition={{ ...spring, stiffness: 400 }}>
                                            <Link href={`/focus/${block.id}`}>
                                                <div className={`p-3 rounded-md border cursor-pointer transition-colors shadow-sm
                                                    ${block.status === 'COMPLETED' ? 'bg-secondary/40 border-secondary' : 'bg-card hover:border-primary hover:shadow-md'}
                                                `}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-medium text-muted-foreground flex items-center">
                                                            <Clock className="w-3 h-3 mr-1" /> {block.startTime}
                                                        </span>
                                                        {block.status === 'COMPLETED' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                                    </div>
                                                    <p className="font-medium text-sm leading-tight mb-1">{block.title}</p>
                                                    <p className="text-xs text-muted-foreground line-clamp-2">{block.description}</p>
                                                </div>
                                            </Link>
                                        </motion.div>
                                        <div className="absolute top-1 right-1 flex gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                                            <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }} transition={spring}
                                                className="p-1 rounded hover:bg-accent" onClick={(e) => startEditing(block, e)} title="Edit">
                                                <Pencil className="w-3 h-3" />
                                            </motion.button>
                                            <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }} transition={spring}
                                                className="p-1 rounded hover:bg-destructive/10 text-destructive" onClick={(e) => handleDelete(block.id, e)} title="Delete">
                                                <Trash2 className="w-3 h-3" />
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {blocks.filter(b => b.day === d).length === 0 && (
                                <div className="text-center p-4 border border-dashed rounded-md text-muted-foreground text-xs">Empty</div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
