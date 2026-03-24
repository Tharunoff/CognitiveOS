'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Clock, CheckCircle2, Trash2, Pencil, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const reminderOptions = [
  { label: 'No reminder', value: null },
  { label: '5 minutes before', value: 5 },
  { label: '10 minutes before', value: 10 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '2 hours before', value: 120 },
];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DURATIONS = [30, 45, 60, 90, 120, 180, 240];

export default function SchedulePage() {
    const todayDate = new Date();
    const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth());
    const [blocks, setBlocks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
    
    // Form state
    const [isAdding, setIsAdding] = useState(false);
    const [editingBlock, setEditingBlock] = useState<any | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('Work');
    const [formDate, setFormDate] = useState(''); // YYYY-MM-DD local
    const [startTime, setStartTime] = useState(() => {
        // Default to current hour + 1 so it never starts at midnight
        const now = new Date();
        now.setHours(now.getHours() + 1, 0, 0, 0);
        return `${String(now.getHours()).padStart(2, '0')}:00`;
    });
    const [duration, setDuration] = useState(60);
    const [reminderMinutes, setReminderMinutes] = useState<number | null>(15);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchMonthBlocks(); }, [currentYear, currentMonth]);

    const fetchMonthBlocks = async () => {
        setLoading(true);
        // fetch window: 1 month before to 1 month after to cover overflow days
        const from = new Date(currentYear, currentMonth - 1, 1).toISOString();
        const to = new Date(currentYear, currentMonth + 2, 0).toISOString();
        try {
            const data = await apiFetch(`/blocks?from=${from}&to=${to}`);
            setBlocks(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Format a Date to a YYYY-MM-DD string using LOCAL date parts (not UTC)
    const toLocalDateString = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    // Format a stored scheduledDate for display on block cards
    const formatBlockDateTime = (scheduledDate: string) => {
        const date = new Date(scheduledDate);
        return date.toLocaleString([], {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const resetForm = (dateDefault?: Date) => {
        setTitle('');
        setDescription('');
        setType('Work');
        const base = dateDefault || new Date();
        setFormDate(toLocalDateString(base));
        // Default start time: current hour + 1
        const now = new Date();
        now.setHours(now.getHours() + 1, 0, 0, 0);
        setStartTime(`${String(now.getHours()).padStart(2, '0')}:00`);
        setDuration(60);
        setReminderMinutes(15);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const [hrs, mins] = startTime.split(':').map(Number);
        const endMins = mins + duration;
        const endHrs = hrs + Math.floor(endMins / 60);
        const endTime = `${String(endHrs % 24).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;
        const finalDesc = description ? `[${type}] ${description}` : `[${type}]`;

        // Combine LOCAL date parts + parsed time into a full ISO datetime
        const combinedDateTime = (() => {
            const [yStr, mStr, dStr] = formDate.split('-');
            const y = parseInt(yStr, 10);
            const m = parseInt(mStr, 10); // 1-based
            const d = parseInt(dStr, 10);
            const combined = new Date(y, m - 1, d, hrs, mins, 0, 0);
            console.log('[Schedule] Combined datetime:', combined.toISOString(),
                '| date parts:', y, m, d, '| time:', hrs, mins, '| startTime raw:', startTime);
            return combined.toISOString();
        })();
        
        try {
            const payload = {
                title,
                description: finalDesc,
                scheduledDate: combinedDateTime,
                startTime,
                endTime,
                reminderTime: reminderMinutes,
                reminderMinutes: reminderMinutes ? Number(reminderMinutes) : null
            };
            console.log('[Schedule] Submitting block:', payload);
            await apiFetch('/blocks', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            setIsAdding(false);
            resetForm();
            fetchMonthBlocks();
        } catch (err) {
            console.error(err);
            alert('Failed to schedule block.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBlock) return;
        setSaving(true);
        const [hrs, mins] = startTime.split(':').map(Number);
        const endMins = mins + duration;
        const endHrs = hrs + Math.floor(endMins / 60);
        const endTime = `${String(endHrs % 24).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;
        const finalDesc = description ? (description.startsWith('[') ? description : `[${type}] ${description}`) : `[${type}]`;

        // Combine LOCAL date parts + parsed time into a full ISO datetime
        const combinedDateTime = (() => {
            const [yStr, mStr, dStr] = formDate.split('-');
            const y = parseInt(yStr, 10);
            const m = parseInt(mStr, 10); // 1-based
            const d = parseInt(dStr, 10);
            const combined = new Date(y, m - 1, d, hrs, mins, 0, 0);
            console.log('[Schedule] Combined datetime (edit):', combined.toISOString(),
                '| date parts:', y, m, d, '| time:', hrs, mins, '| startTime raw:', startTime);
            return combined.toISOString();
        })();

        try {
            const payload = {
                title,
                description: finalDesc,
                scheduledDate: combinedDateTime,
                startTime,
                endTime,
                reminderTime: reminderMinutes,
                reminderMinutes: reminderMinutes ? Number(reminderMinutes) : null
            };
            console.log('[Schedule] Submitting block update:', payload);
            await apiFetch(`/blocks/${editingBlock.id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            setEditingBlock(null);
            resetForm();
            fetchMonthBlocks();
        } catch (err) {
            console.error(err);
            alert('Failed to update block.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!confirm('Delete this block?')) return;
        try {
            await apiFetch(`/blocks/${id}`, { method: 'DELETE' });
            setBlocks(blocks.filter(b => b.id !== id));
        } catch (err) {
            console.error(err);
            alert('Failed to delete block.');
        }
    };

    const startEditing = (block: any, e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        setEditingBlock(block);
        setTitle(block.title);
        
        let desc = block.description || '';
        let detectedType = 'Work';
        if (desc.startsWith('[Work]')) { detectedType = 'Work'; desc = desc.replace('[Work]', '').trim(); }
        else if (desc.startsWith('[Personal]')) { detectedType = 'Personal'; desc = desc.replace('[Personal]', '').trim(); }
        
        setType(detectedType);
        setDescription(desc);
        setFormDate(toLocalDateString(new Date(block.scheduledDate)));
        setStartTime(block.startTime);
        setReminderMinutes(block.reminderMinutes !== undefined && block.reminderMinutes !== null ? block.reminderMinutes : block.reminderTime);
        
        const [sh, sm] = block.startTime.split(':').map(Number);
        const [eh, em] = block.endTime.split(':').map(Number);
        setDuration((eh * 60 + em) - (sh * 60 + sm));
        setIsAdding(false);
    };

    const goPrevMonth = () => {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
        else { setCurrentMonth(currentMonth - 1); }
        setSelectedDate(null);
    };

    const goNextMonth = () => {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
        else { setCurrentMonth(currentMonth + 1); }
        setSelectedDate(null);
    };

    const jumpToToday = () => {
        const t = new Date();
        setCurrentYear(t.getFullYear());
        setCurrentMonth(t.getMonth());
        setSelectedDate(t);
    };

    const getCalendarDays = () => {
        const d = new Date(currentYear, currentMonth, 1);
        const days = [];
        const firstDayIndex = d.getDay();
        const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
        
        const prevLastDay = new Date(currentYear, currentMonth, 0).getDate();
        for (let i = startOffset - 1; i >= 0; i--) {
            days.push({ date: new Date(currentYear, currentMonth - 1, prevLastDay - i), isCurrentMonth: false });
        }
        
        const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
        for (let i = 1; i <= lastDay; i++) {
            days.push({ date: new Date(currentYear, currentMonth, i), isCurrentMonth: true });
        }
        
        const remainingCount = 42 - days.length;
        for (let i = 1; i <= remainingCount; i++) {
            days.push({ date: new Date(currentYear, currentMonth + 1, i), isCurrentMonth: false });
        }
        return days;
    };

    const calendarDays = getCalendarDays();

    const blocksForDate = (date: Date) => {
        return blocks.filter(b => {
             const bd = new Date(b.scheduledDate);
             return bd.getDate() === date.getDate() && bd.getMonth() === date.getMonth() && bd.getFullYear() === date.getFullYear();
        });
    };

    const selectedBlocks = selectedDate ? blocksForDate(selectedDate) : [];

    return (
        <div className="max-w-6xl mx-auto space-y-6 pt-4 pb-12 flex flex-col md:flex-row gap-6 relative">
            {/* Main Calendar View */}
            <div className={`flex-1 transition-all duration-300 ${selectedDate ? 'md:w-2/3' : 'w-full'}`}>
                {/* Header Navigation */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4 relative">
                        <Button variant="ghost" size="icon" onClick={goPrevMonth} className="text-white/60 hover:text-white"><ChevronLeft className="w-5 h-5"/></Button>
                        <div 
                            className="text-xl md:text-2xl font-bold tracking-tight text-white cursor-pointer hover:text-white/80 transition-colors"
                            onClick={() => setIsYearPickerOpen(!isYearPickerOpen)}
                        >
                            {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} {currentYear}
                        </div>
                        <Button variant="ghost" size="icon" onClick={goNextMonth} className="text-white/60 hover:text-white"><ChevronRight className="w-5 h-5"/></Button>
                        
                        {/* Year Picker Dropdown */}
                        <AnimatePresence>
                            {isYearPickerOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-12 left-1/2 -translate-x-1/2 bg-[#121212] border border-white/10 rounded-lg p-2 shadow-xl z-50 grid grid-cols-3 gap-2 w-64"
                                >
                                    {Array.from({length: 10}).map((_, i) => {
                                        const y = todayDate.getFullYear() + i;
                                        return (
                                            <Button 
                                                key={y} variant="ghost" size="sm" 
                                                className={`text-white/60 hover:text-white ${currentYear === y ? 'bg-white/10 text-white' : ''}`}
                                                onClick={() => { setCurrentYear(y); setIsYearPickerOpen(false); }}
                                            >
                                                {y}
                                            </Button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    <div className="flex gap-2">
                        <Button onClick={jumpToToday} variant="outline" className="border-white/10 bg-white/[0.02] text-white/60 hover:text-white hidden md:flex">Today</Button>
                        <Button onClick={() => { 
                            setIsAdding(true); 
                            setEditingBlock(null); 
                            setSelectedDate(selectedDate || new Date());
                            resetForm(selectedDate || new Date()); 
                        }} className="bg-white text-black hover:bg-white/90">
                            <Plus className="w-4 h-4 mr-2" /> Schedule
                        </Button>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-px bg-white/10 border border-white/10 rounded-xl overflow-hidden">
                    {/* Weekday headers */}
                    {WEEKDAYS.map(d => (
                        <div key={d} className="bg-[#0a0a0a] text-center py-2 text-xs font-medium text-white/40 uppercase tracking-widest">{d}</div>
                    ))}
                    
                    {/* Calendar cells */}
                    {calendarDays.map((item, i) => {
                        const cellBlocks = blocksForDate(item.date);
                        const isToday = item.date.toDateString() === todayDate.toDateString();
                        const isSelected = selectedDate && item.date.toDateString() === selectedDate.toDateString();
                        
                        return (
                            <div 
                                key={i}
                                onClick={() => { setSelectedDate(item.date); setIsAdding(false); setEditingBlock(null); }}
                                className={`
                                    min-h-[80px] md:min-h-[100px] bg-[#0c0c0c] p-1 md:p-2 cursor-pointer transition-colors hover:bg-white/[0.04] relative
                                    ${!item.isCurrentMonth ? 'opacity-40 bg-[#0a0a0a]' : ''}
                                    ${isSelected ? 'bg-white/[0.08]' : ''}
                                `}
                            >
                                <div className={`text-xs md:text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-white text-black' : 'text-white/60'}`}>
                                    {item.date.getDate()}
                                </div>
                                <div className="mt-1 space-y-1">
                                    {cellBlocks.slice(0, 3).map(b => (
                                        <div key={b.id} className="text-[10px] md:text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/80 truncate border border-white/5">
                                            {b.startTime} {b.title}
                                        </div>
                                    ))}
                                    {cellBlocks.length > 3 && (
                                        <div className="text-[10px] text-white/40 px-1">+ {cellBlocks.length - 3} more</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Side Panel (Selected Date / Form) */}
            <AnimatePresence>
                {(selectedDate || isAdding || editingBlock) && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                        className="w-full md:w-1/3 flex flex-col gap-4 border-l border-white/10 pl-0 md:pl-6 sticky top-24"
                    >
                        {/* Selected Date Header */}
                        {selectedDate && !isAdding && !editingBlock && (
                            <div className="bg-[#0c0c0c] rounded-xl border border-white/10 p-5">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-bold text-white">
                                        {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </h2>
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedDate(null)} className="h-6 w-6 text-white/40 hover:text-white"><X className="w-4 h-4"/></Button>
                                </div>

                                {selectedBlocks.length === 0 ? (
                                    <div className="text-center py-8 text-white/30 text-sm">No blocks scheduled for this day.</div>
                                ) : (
                                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                        {selectedBlocks.map(block => (
                                            <div key={block.id} className="group p-3 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors relative">
                                                <div className="flex justify-between items-start mb-1.5">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-xs font-medium text-white/40 flex items-center">
                                                            <Clock className="w-3 h-3 mr-1" /> {block.startTime} — {block.endTime}
                                                        </span>
                                                        <span className="text-[10px] text-emerald-400/70">
                                                            {formatBlockDateTime(block.scheduledDate)}
                                                        </span>
                                                    </div>
                                                    {block.status === 'COMPLETED' ? (
                                                        <span className="bg-white/10 text-white/50 text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider">Done</span>
                                                    ) : (
                                                        <span className="bg-blue-500/10 text-blue-400 text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider">Pending</span>
                                                    )}
                                                </div>
                                                <p className={`font-medium text-sm leading-tight text-white mb-1 ${block.status === 'COMPLETED' ? 'line-through opacity-50' : ''}`}>{block.title}</p>
                                                <p className="text-xs text-white/40 line-clamp-2">{block.description}</p>
                                                
                                                <div className="mt-3 flex gap-2">
                                                    <Link href={`/focus/${block.id}`} className="flex-1">
                                                        <Button size="sm" className="w-full text-xs h-7 bg-white/10 text-white hover:bg-white/20">Focus Mode</Button>
                                                    </Link>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-white/40 hover:text-white" onClick={(e) => startEditing(block, e)}><Pencil className="w-3.5 h-3.5"/></Button>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-white/40 hover:text-red-400" onClick={(e) => handleDelete(block.id, e)}><Trash2 className="w-3.5 h-3.5"/></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <Button className="w-full mt-4 bg-white/5 text-white hover:bg-white/10 border border-white/10 text-sm" onClick={() => { setIsAdding(true); resetForm(selectedDate); }}>
                                    <Plus className="w-4 h-4 mr-2" /> Add Block
                                </Button>
                            </div>
                        )}

                        {/* Schedule Form */}
                        {(isAdding || editingBlock) && (
                            <form onSubmit={editingBlock ? handleSaveEdit : handleCreate} className="bg-[#0c0c0c] rounded-xl border border-white/10 p-5 space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-white">{editingBlock ? 'Edit Block' : 'Schedule Focus Block'}</h3>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => { setIsAdding(false); setEditingBlock(null); }} className="h-6 w-6 text-white/40 hover:text-white"><X className="w-4 h-4"/></Button>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-white/60 text-xs">Title</Label>
                                    <Input required value={title} onChange={(e: any) => setTitle(e.target.value)} placeholder="e.g. Deep Work on API" className="bg-[#0a0a0a] border-white/10 text-white text-sm" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-white/60 text-xs">Date</Label>
                                        <Input type="date" required value={formDate} onChange={(e: any) => setFormDate(e.target.value)} className="bg-[#0a0a0a] border-white/10 text-white text-sm [color-scheme:dark]" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-white/60 text-xs">Type</Label>
                                        <select className="flex h-10 w-full rounded-md border border-white/10 bg-[#0a0a0a] text-white px-3 py-2 text-sm" value={type} onChange={(e: any) => setType(e.target.value)}>
                                            <option value="Work">Work</option>
                                            <option value="Personal">Personal</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-white/60 text-xs">Start Time</Label>
                                        <Input type="time" required value={startTime} onChange={(e: any) => setStartTime(e.target.value)} className="bg-[#0a0a0a] border-white/10 text-white text-sm [color-scheme:dark]" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-white/60 text-xs">Duration</Label>
                                        <select className="flex h-10 w-full rounded-md border border-white/10 bg-[#0a0a0a] text-white px-3 py-2 text-sm" value={duration} onChange={(e: any) => setDuration(Number(e.target.value))}>
                                            {DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-white/60 text-xs">Reminder</Label>
                                    <Select 
                                        value={reminderMinutes === null ? 'null' : String(reminderMinutes)} 
                                        onValueChange={(val) => setReminderMinutes(val === 'null' ? null : Number(val))}
                                    >
                                        <SelectTrigger className="w-full bg-[#0a0a0a] border-white/10 text-white text-sm">
                                            <SelectValue placeholder="Select a reminder" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#121212] border-white/10 text-white">
                                            {reminderOptions.map(opt => (
                                                <SelectItem key={opt.label} value={opt.value === null ? 'null' : String(opt.value)} className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-white/60 text-xs">Goal / Description</Label>
                                    <textarea 
                                        value={description} onChange={(e: any) => setDescription(e.target.value)} 
                                        placeholder="What will you accomplish?" 
                                        className="flex min-h-[60px] w-full rounded-md border border-white/10 bg-[#0a0a0a] text-white px-3 py-2 text-sm placeholder:text-white/20 custom-scrollbar" 
                                    />
                                </div>
                                <Button type="submit" disabled={saving} className="w-full bg-white text-black hover:bg-white/90">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingBlock ? 'Save Changes' : 'Schedule Block')}
                                </Button>
                            </form>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
