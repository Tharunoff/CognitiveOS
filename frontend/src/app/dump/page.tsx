'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };
const gentleSpring = { type: 'spring' as const, stiffness: 200, damping: 25 };

export default function BrainDumpPage() {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [stage, setStage] = useState<'idle' | 'routing' | 'structuring'>('idle');
    const [detectedType, setDetectedType] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        setLoading(true);
        setStage('routing');

        try {
            // AI auto-routes and structures in one call
            const idea = await apiFetch('/ideas/dump', {
                method: 'POST',
                body: JSON.stringify({ text })
            });

            setDetectedType(idea.routing?.type || idea.type);
            setStage('structuring');

            // Brief pause to show the detection animation
            await new Promise(resolve => setTimeout(resolve, 600));

            router.push(`/ideas/${idea.id}`);
        } catch (err: any) {
            console.error(err);
            alert(err?.message || 'Failed to structure thought. Check backend connection.');
            setLoading(false);
            setStage('idle');
        }
    };

    const charCount = text.length;
    const minChars = 20;

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
                <h1 className="text-3xl font-bold tracking-tight text-white">Brain Dump</h1>
                <p className="text-white/40">Offload your raw thoughts. AI will classify, route, and organize them automatically.</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...gentleSpring, delay: 0.2 }}
            >
                <Card className="border-white/10 bg-white/[0.02] hover:border-white/15 transition-colors duration-500">
                    <CardHeader>
                        <CardTitle className="text-white">Capture Raw Thoughts</CardTitle>
                        <CardDescription className="text-white/40">
                            Don&apos;t worry about formatting or categories. Write anything — work ideas, personal goals, random thoughts.
                            AI will figure out the rest.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <motion.div
                                className="space-y-2"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ ...gentleSpring, delay: 0.3 }}
                            >
                                <textarea
                                    id="dump"
                                    required
                                    className="w-full min-h-[300px] p-4 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm resize-y focus:outline-none focus:border-white/30 transition-all duration-300 placeholder-white/20"
                                    placeholder="Type anything...&#10;&#10;Examples:&#10;• An AI system that detects garbage in lakes using drones. Maybe municipalities could use it. Needs a subscription model...&#10;• I need to call Mom more often. Maybe set up a weekly Sunday call ritual...&#10;• I've been skipping workouts. Need to figure out why and fix it..."
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    disabled={loading}
                                />
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs transition-colors ${charCount >= minChars ? 'text-white/30' : 'text-white/20'}`}>
                                        {charCount} characters
                                    </span>
                                    <span className="text-xs text-white/20">
                                        AI will auto-detect Work vs Personal
                                    </span>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ ...gentleSpring, delay: 0.4 }}
                            >
                                <motion.div whileHover={!loading ? { scale: 1.01 } : {}} whileTap={!loading ? { scale: 0.98 } : {}}>
                                    <Button
                                        type="submit"
                                        disabled={loading || charCount < minChars}
                                        className="w-full h-12 text-base font-semibold bg-white text-black hover:bg-white/90 disabled:bg-white/10 disabled:text-white/30"
                                    >
                                        <AnimatePresence mode="wait">
                                            {stage === 'idle' && (
                                                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                    Submit & Structure
                                                </motion.span>
                                            )}
                                            {stage === 'routing' && (
                                                <motion.span key="routing" className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                    <motion.div
                                                        className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    />
                                                    AI is classifying your thought...
                                                </motion.span>
                                            )}
                                            {stage === 'structuring' && (
                                                <motion.span key="structuring" className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                    <motion.div
                                                        className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    />
                                                    Detected as {detectedType} — Structuring...
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </Button>
                                </motion.div>
                            </motion.div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Subtle info section */}
            <motion.div
                className="grid grid-cols-2 gap-3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...gentleSpring, delay: 0.5 }}
            >
                <div className="p-4 rounded-lg border border-white/5 bg-white/[0.01]">
                    <p className="text-xs text-white/30 font-medium mb-1">Work thoughts</p>
                    <p className="text-xs text-white/20">Startup ideas, product features, technical projects, career moves</p>
                </div>
                <div className="p-4 rounded-lg border border-white/5 bg-white/[0.01]">
                    <p className="text-xs text-white/30 font-medium mb-1">Personal thoughts</p>
                    <p className="text-xs text-white/20">Relationships, health, habits, goals, milestones, reflections</p>
                </div>
            </motion.div>
        </motion.div>
    );
}
