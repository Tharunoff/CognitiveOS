'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Brain, Clock, ChevronRight, Archive, Eye, AlertTriangle, Lightbulb, Target, Zap } from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };
const gentleSpring = { type: 'spring' as const, stiffness: 200, damping: 25 };

export default function DashboardPage() {
    const [brief, setBrief] = useState<any>(null);
    const [todayBlocks, setTodayBlocks] = useState<any[]>([]);
    const [decayingIdeas, setDecayingIdeas] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [patterns, setPatterns] = useState<any[]>([]);
    const [mission, setMission] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [briefCollapsed, setBriefCollapsed] = useState(false);
    const [weeklyReview, setWeeklyReview] = useState<any>(null);
    const [showReview, setShowReview] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const [briefRes, patternsRes, missionRes] = await Promise.allSettled([
                    apiFetch('/dashboard/brief'),
                    apiFetch('/dashboard/patterns'),
                    apiFetch('/dashboard/mission'),
                ]);

                if (briefRes.status === 'fulfilled') {
                    setBrief(briefRes.value.brief);
                    setTodayBlocks(briefRes.value.todayBlocks || []);
                    setDecayingIdeas(briefRes.value.decayingIdeas || []);
                    setStats(briefRes.value.stats || {});
                }
                if (patternsRes.status === 'fulfilled') {
                    setPatterns(patternsRes.value || []);
                }
                if (missionRes.status === 'fulfilled') {
                    setMission(missionRes.value);
                }

                // Record streak
                apiFetch('/dashboard/streak/record', { method: 'POST' }).catch(() => {});

                // Check if it's Sunday for weekly review
                if (new Date().getDay() === 0) {
                    try {
                        const review = await apiFetch('/dashboard/weekly-review');
                        setWeeklyReview(review);
                        setShowReview(true);
                    } catch {}
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleArchive = async (ideaId: string) => {
        try {
            await apiFetch(`/ideas/${ideaId}/archive`, { method: 'PUT' });
            setDecayingIdeas(prev => prev.filter(i => i.id !== ideaId));
        } catch (err) {
            console.error(err);
        }
    };

    const submitReview = async (mood: number) => {
        try {
            await apiFetch('/dashboard/weekly-review', {
                method: 'POST',
                body: JSON.stringify({ moodRating: mood, decisions: [] })
            });
            setShowReview(false);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return (
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
                Preparing your day...
            </motion.p>
        </div>
    );

    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <motion.div
            className="space-y-6 transform-gpu will-change-transform"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        >
            {/* ─── MORNING BRIEF ────────────────────────────── */}
            <AnimatePresence>
                {!briefCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={gentleSpring}
                    >
                        <Card className="border-white/10 bg-white/[0.02] overflow-hidden">
                            <CardContent className="p-6 sm:p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ ...gentleSpring, delay: 0.1 }}
                                    >
                                        <p className="text-white/40 text-sm mb-1">{todayStr}</p>
                                        <h1 className="text-2xl sm:text-3xl font-bold text-white">
                                            {brief?.greeting || 'Good morning.'}
                                        </h1>
                                    </motion.div>
                                    <motion.button
                                        onClick={() => setBriefCollapsed(true)}
                                        className="text-white/30 hover:text-white/60 text-xs transition-colors"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Collapse
                                    </motion.button>
                                </div>

                                {brief?.quote && (
                                    <motion.div
                                        className="border-l-2 border-white/10 pl-4 mb-6"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ ...gentleSpring, delay: 0.2 }}
                                    >
                                        <p className="text-white/50 italic text-sm">"{brief.quote.text}"</p>
                                        <p className="text-white/30 text-xs mt-1">— {brief.quote.author}</p>
                                    </motion.div>
                                )}

                                {brief?.primary_focus && (
                                    <motion.div
                                        className="bg-white/[0.04] border border-white/10 rounded-lg p-4 mb-4"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ ...gentleSpring, delay: 0.3 }}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target className="w-4 h-4 text-white/60" />
                                            <span className="text-xs font-medium text-white/60 uppercase tracking-wide">Today&apos;s Focus</span>
                                        </div>
                                        <p className="text-white text-sm">{brief.primary_focus}</p>
                                    </motion.div>
                                )}

                                <div className="flex flex-wrap gap-3 text-sm">
                                    {brief?.fading_alert && (
                                        <motion.div
                                            className="flex items-center gap-2 text-white/50 bg-white/[0.03] px-3 py-1.5 rounded-md"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ ...gentleSpring, delay: 0.4 }}
                                        >
                                            <AlertTriangle className="w-3 h-3" />
                                            <span className="text-xs">{brief.fading_alert}</span>
                                        </motion.div>
                                    )}
                                    {brief?.pattern_insight && (
                                        <motion.div
                                            className="flex items-center gap-2 text-white/50 bg-white/[0.03] px-3 py-1.5 rounded-md"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ ...gentleSpring, delay: 0.45 }}
                                        >
                                            <Lightbulb className="w-3 h-3" />
                                            <span className="text-xs">{brief.pattern_insight}</span>
                                        </motion.div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {briefCollapsed && (
                <motion.button
                    onClick={() => setBriefCollapsed(false)}
                    className="text-white/30 hover:text-white/50 text-xs transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    Show morning brief
                </motion.button>
            )}

            {/* ─── DECISION CARDS ──────────────────────────── */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                {[
                    { label: 'Streak', value: `${stats.streak || 0}d`, sub: `Best: ${stats.longestStreak || 0}d`, icon: Flame },
                    { label: 'Deep Work', value: `${stats.deepWorkHours || 0}h`, sub: 'This week', icon: Clock },
                    { label: 'Active Ideas', value: stats.activeIdeas || 0, sub: `${stats.decayingCount || 0} fading`, icon: Brain },
                    { label: 'Today', value: todayBlocks.length, sub: 'Focus blocks', icon: Zap },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: i * 0.06, ...gentleSpring }}
                    >
                        <motion.div whileHover={{ y: -2 }} transition={{ ...spring, stiffness: 400 }}>
                            <Card className="hover:border-white/20 transition-colors border-white/10 bg-white/[0.02]">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <stat.icon className="w-3.5 h-3.5 text-white/40" />
                                        <span className="text-xs text-white/40">{stat.label}</span>
                                    </div>
                                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                                    <div className="text-xs text-white/30 mt-1">{stat.sub}</div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>
                ))}
            </div>

            {/* ─── MAIN GRID ───────────────────────────────── */}
            <div className="grid gap-4 md:grid-cols-2 overflow-hidden min-w-0">

                {/* Today's Timeline */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, ...gentleSpring }}
                    className="overflow-hidden min-w-0"
                >
                    <Card className="h-full border-white/10 bg-white/[0.02]">
                        <CardHeader className="px-4 sm:px-6">
                            <CardTitle className="text-base sm:text-lg text-white flex items-center gap-2">
                                <Clock className="w-4 h-4 text-white/50" />
                                Today&apos;s Blocks
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6">
                            {todayBlocks.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-white/30 text-sm mb-3">No blocks scheduled for today.</p>
                                    <Link href="/schedule">
                                        <motion.div whileTap={{ scale: 0.95 }} transition={spring}>
                                            <Button variant="outline" size="sm" className="border-white/10 text-white/60 hover:text-white hover:border-white/20">
                                                Schedule a block
                                            </Button>
                                        </motion.div>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {todayBlocks.map((block, i) => (
                                        <motion.div
                                            key={block.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.35 + i * 0.05, ...spring }}
                                        >
                                            <Link href={`/focus/${block.id}`}>
                                                <motion.div
                                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer group
                                                        ${block.status === 'COMPLETED'
                                                            ? 'border-white/5 bg-white/[0.02] opacity-60'
                                                            : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                                                        }`}
                                                    whileHover={{ x: 4 }}
                                                    transition={spring}
                                                >
                                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${block.status === 'COMPLETED' ? 'bg-white/30' : 'bg-white'}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-white truncate">{block.title}</p>
                                                        <p className="text-xs text-white/30">{block.startTime} — {block.endTime}</p>
                                                    </div>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0
                                                        ${block.status === 'COMPLETED' ? 'bg-white/10 text-white/40' : 'bg-white/5 text-white/50'}`}>
                                                        {block.status === 'COMPLETED' ? 'Done' : 'Pending'}
                                                    </span>
                                                    <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/40 transition-colors" />
                                                </motion.div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                    <div className="pt-2">
                                        <Link href="/schedule">
                                            <motion.div whileTap={{ scale: 0.95 }} transition={spring}>
                                                <Button variant="ghost" size="sm" className="text-white/40 hover:text-white/60 w-full">
                                                    Manage Schedule →
                                                </Button>
                                            </motion.div>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Vault Pulse */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, ...gentleSpring }}
                    className="overflow-hidden min-w-0"
                >
                    <Card className="h-full border-white/10 bg-white/[0.02]">
                        <CardHeader className="px-4 sm:px-6">
                            <CardTitle className="text-base sm:text-lg text-white flex items-center gap-2">
                                <Brain className="w-4 h-4 text-white/50" />
                                Vault Pulse
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6">
                            {decayingIdeas.length > 0 ? (
                                <div className="space-y-3">
                                    <p className="text-xs text-white/40 uppercase tracking-wide">Needs Attention</p>
                                    {decayingIdeas.map((idea, i) => (
                                        <motion.div
                                            key={idea.id}
                                            className="flex items-center justify-between gap-2 p-3 rounded-lg border border-white/10 bg-white/[0.02]"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 + i * 0.06, ...spring }}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <Link href={`/ideas/${idea.id}`} className="hover:underline">
                                                    <p className="text-sm text-white truncate">{idea.title}</p>
                                                </Link>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
                                                        <motion.div
                                                            className="h-full rounded-full bg-white/40"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.round(idea.decayScore * 100)}%` }}
                                                            transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-white/30">{Math.round(idea.decayScore * 100)}%</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="p-1.5 rounded-md hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
                                                    onClick={() => window.location.href = `/ideas/${idea.id}`}
                                                    title="Revisit"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="p-1.5 rounded-md hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
                                                    onClick={() => handleArchive(idea.id)}
                                                    title="Archive"
                                                >
                                                    <Archive className="w-3.5 h-3.5" />
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-white/30 text-sm mb-1">All ideas are fresh.</p>
                                    <p className="text-white/20 text-xs">No entries need attention right now.</p>
                                </div>
                            )}

                            <div className="mt-4 flex gap-2">
                                <Link href="/dump" className="flex-1">
                                    <motion.div whileTap={{ scale: 0.95 }} transition={spring}>
                                        <Button size="sm" className="w-full bg-white text-black hover:bg-white/90">New Thought</Button>
                                    </motion.div>
                                </Link>
                                <Link href="/ideas" className="flex-1">
                                    <motion.div whileTap={{ scale: 0.95 }} transition={spring}>
                                        <Button variant="outline" size="sm" className="w-full border-white/10 text-white/60 hover:text-white hover:border-white/20">View Vault</Button>
                                    </motion.div>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* ─── WEEKLY MISSION ───────────────────────────── */}
            {mission && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, ...gentleSpring }}
                >
                    <Card className="border-white/10 bg-white/[0.02]">
                        <CardHeader className="px-4 sm:px-6 pb-3">
                            <CardTitle className="text-base text-white flex items-center gap-2">
                                <Target className="w-4 h-4 text-white/50" />
                                Weekly Mission
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6">
                            <div className="space-y-3">
                                {mission.primary_mission && (
                                    <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3">
                                        <span className="text-xs text-white/40 uppercase tracking-wide">Primary</span>
                                        <p className="text-sm text-white font-medium mt-1">{mission.primary_mission.title}</p>
                                        {mission.primary_mission.why && (
                                            <p className="text-xs text-white/40 mt-1">{mission.primary_mission.why}</p>
                                        )}
                                    </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {mission.secondary?.map((s: any, i: number) => (
                                        <motion.div
                                            key={i}
                                            className="p-3 rounded-lg border border-white/5 bg-white/[0.02]"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.55 + i * 0.05, ...gentleSpring }}
                                        >
                                            <span className="text-xs text-white/30">Secondary</span>
                                            <p className="text-sm text-white/70 mt-1">{s.title}</p>
                                        </motion.div>
                                    ))}
                                </div>
                                {mission.debt_payment && (
                                    <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02] flex items-center gap-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                                        <div>
                                            <span className="text-xs text-white/30">Debt Payment</span>
                                            <p className="text-sm text-white/60">{mission.debt_payment.title}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* ─── PATTERNS ────────────────────────────────── */}
            {patterns.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, ...gentleSpring }}
                >
                    <Card className="border-white/10 bg-white/[0.02]">
                        <CardHeader className="px-4 sm:px-6 pb-3">
                            <CardTitle className="text-base text-white flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-white/50" />
                                Pattern Radar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6">
                            <div className="space-y-3">
                                {patterns.slice(0, 2).map((pattern, i) => (
                                    <motion.div
                                        key={i}
                                        className="p-4 rounded-lg border border-white/5 bg-white/[0.02]"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.65 + i * 0.08, ...spring }}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                                                {pattern.type?.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-white font-medium">{pattern.title}</p>
                                        <p className="text-xs text-white/40 mt-1">{pattern.insight}</p>
                                        {pattern.suggestion && (
                                            <p className="text-xs text-white/30 mt-2 border-t border-white/5 pt-2">
                                                💡 {pattern.suggestion}
                                            </p>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* ─── WEEKLY REVIEW (Sunday only) ─────────────── */}
            <AnimatePresence>
                {showReview && weeklyReview && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.98 }}
                        transition={gentleSpring}
                    >
                        <Card className="border-white/20 bg-white/[0.04]">
                            <CardHeader className="px-4 sm:px-6">
                                <CardTitle className="text-base text-white">📋 Weekly Review</CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 sm:px-6 space-y-4">
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                                        <p className="text-xl font-bold text-white">{weeklyReview.blocksCompleted}/{weeklyReview.blocksTotal}</p>
                                        <p className="text-xs text-white/40">Blocks</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                                        <p className="text-xl font-bold text-white">{weeklyReview.ideasCreated}</p>
                                        <p className="text-xs text-white/40">New Ideas</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                                        <p className="text-xl font-bold text-white">{weeklyReview.completionRate}%</p>
                                        <p className="text-xs text-white/40">Completion</p>
                                    </div>
                                </div>

                                {weeklyReview.decayingIdeas?.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-white/40 uppercase tracking-wide">Fading Ideas</p>
                                        {weeklyReview.decayingIdeas.map((idea: any) => (
                                            <div key={idea.id} className="flex items-center justify-between p-2 rounded border border-white/5">
                                                <span className="text-sm text-white/60 truncate">{idea.title}</span>
                                                <div className="flex gap-1">
                                                    <Button size="sm" variant="ghost" className="h-7 text-xs text-white/40 hover:text-white" onClick={() => window.location.href = `/ideas/${idea.id}`}>Keep</Button>
                                                    <Button size="sm" variant="ghost" className="h-7 text-xs text-white/40 hover:text-white" onClick={() => handleArchive(idea.id)}>Archive</Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div>
                                    <p className="text-sm text-white/60 mb-3">How did this week feel?</p>
                                    <div className="flex gap-2">
                                        {[
                                            { emoji: '😤', label: 'Rough', value: 1 },
                                            { emoji: '😐', label: 'Okay', value: 2 },
                                            { emoji: '😊', label: 'Good', value: 3 },
                                            { emoji: '🔥', label: 'Great', value: 4 },
                                        ].map(mood => (
                                            <motion.button
                                                key={mood.value}
                                                onClick={() => submitReview(mood.value)}
                                                className="flex-1 p-3 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/[0.04] transition-colors text-center"
                                                whileHover={{ y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                transition={spring}
                                            >
                                                <span className="text-xl">{mood.emoji}</span>
                                                <p className="text-xs text-white/40 mt-1">{mood.label}</p>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
