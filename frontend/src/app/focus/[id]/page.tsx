'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Square, CheckCircle, Sparkles } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };
const gentleSpring = { type: 'spring' as const, stiffness: 200, damping: 25 };

export default function FocusModePage() {
    const { id } = useParams();
    const router = useRouter();
    const [block, setBlock] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [output, setOutput] = useState('');
    const [saving, setSaving] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const data = await apiFetch(`/blocks`);
                const found = data.find((b: any) => b.id === id);
                setBlock(found);
                if (found) {
                    const [sH, sM] = found.startTime.split(':').map(Number);
                    const [eH, eM] = found.endTime.split(':').map(Number);
                    let mins = (eH * 60 + eM) - (sH * 60 + sM);
                    if (mins <= 0) mins += 24 * 60;
                    setTimeLeft(mins * 60);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }
        if (id) load();
    }, [id]);

    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft <= 0 && isActive) {
            setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleComplete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!output.trim()) return;
        setSaving(true);
        try {
            await apiFetch(`/blocks/${id}/log`, {
                method: 'POST',
                body: JSON.stringify({ output })
            });
            // Record streak activity
            apiFetch('/dashboard/streak/record', { method: 'POST' }).catch(() => {});
            setShowCompletion(true);
        } catch (err) {
            console.error(err);
            alert('Failed to log completion');
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="p-12 flex justify-center">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full"
            />
        </div>
    );

    if (!block) return <div className="p-12 text-center text-white/40">Block not found</div>;

    // Completion ritual
    if (showCompletion) {
        return (
            <motion.div
                className="max-w-md mx-auto text-center pt-20 space-y-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={gentleSpring}
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ ...spring, delay: 0.2 }}
                >
                    <Sparkles className="w-16 h-16 text-white/60 mx-auto" />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...gentleSpring, delay: 0.3 }}
                >
                    <h2 className="text-2xl font-bold text-white">Block Complete</h2>
                    <p className="text-white/40 mt-2">&quot;{block.title}&quot;</p>
                </motion.div>
                <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <p className="text-sm text-white/30">Your output has been logged.</p>
                </motion.div>
                <motion.div
                    className="flex gap-3 justify-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...gentleSpring, delay: 0.6 }}
                >
                    <motion.div whileTap={{ scale: 0.95 }} transition={spring}>
                        <Button onClick={() => router.push('/schedule')} variant="outline" className="border-white/10 text-white/60 hover:text-white hover:border-white/20">
                            Back to Schedule
                        </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.95 }} transition={spring}>
                        <Button onClick={() => router.push('/')} className="bg-white text-black hover:bg-white/90">
                            Dashboard
                        </Button>
                    </motion.div>
                </motion.div>
            </motion.div>
        );
    }

    const progress = block ? (() => {
        const [sH, sM] = block.startTime.split(':').map(Number);
        const [eH, eM] = block.endTime.split(':').map(Number);
        let totalSecs = ((eH * 60 + eM) - (sH * 60 + sM)) * 60;
        if (totalSecs <= 0) totalSecs += 24 * 60 * 60;
        return ((totalSecs - timeLeft) / totalSecs) * 100;
    })() : 0;

    return (
        <motion.div
            className="max-w-2xl mx-auto space-y-6 pt-12"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            <motion.h1
                className="text-2xl font-bold text-center tracking-tight text-white"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...gentleSpring, delay: 0.1 }}
            >
                Focus Mode
            </motion.h1>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...gentleSpring, delay: 0.2 }}
            >
                <Card className={`border transition-all duration-500
                    ${isActive ? 'border-white/30 shadow-[0_0_40px_rgba(255,255,255,0.05)]' : 'border-white/10'}
                    bg-white/[0.02]`}>
                    <CardHeader className="text-center pb-6 border-b border-white/5">
                        <CardTitle className="text-xl text-white">{block.title}</CardTitle>
                        <CardDescription className="text-white/40 mt-1">{block.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-10 pt-10">
                        {/* Progress ring background */}
                        <div className="relative">
                            <motion.div
                                className={`text-7xl sm:text-8xl md:text-9xl font-mono font-bold tracking-tighter transition-colors ${isActive ? 'text-white' : 'text-white/80'}`}
                                animate={isActive ? { opacity: [1, 0.7, 1] } : {}}
                                transition={isActive ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
                            >
                                {formatTime(timeLeft)}
                            </motion.div>
                            {isActive && (
                                <motion.div
                                    className="absolute -bottom-3 left-0 right-0 h-0.5 bg-white/10 rounded-full overflow-hidden"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <motion.div
                                        className="h-full bg-white/50 rounded-full"
                                        style={{ width: `${progress}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </motion.div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} transition={spring}>
                                <Button
                                    size="lg"
                                    onClick={toggleTimer}
                                    className={`w-48 h-14 text-lg font-bold transition-colors
                                        ${isActive
                                            ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                                            : 'bg-white text-black hover:bg-white/90'
                                        }`}
                                >
                                    {isActive ? <><Square className="w-5 h-5 mr-3" /> Pause</> : <><Play className="w-5 h-5 mr-3" /> Start Focus</>}
                                </Button>
                            </motion.div>
                        </div>

                        <motion.form
                            className="w-full space-y-4 pt-8 border-t border-white/5"
                            onSubmit={handleComplete}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...gentleSpring, delay: 0.3 }}
                        >
                            <div className="space-y-3">
                                <Label className="text-sm font-medium text-white/60">What did you accomplish?</Label>
                                <textarea
                                    className="w-full min-h-[120px] p-4 text-sm border border-white/10 rounded-lg bg-white/[0.02] text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                                    placeholder="e.g. Completed API endpoint design and wrote tests..."
                                    value={output}
                                    onChange={e => setOutput(e.target.value)}
                                    required
                                />
                            </div>
                            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} transition={spring}>
                                <Button
                                    type="submit"
                                    disabled={saving || block.status === 'COMPLETED'}
                                    className="w-full h-12 bg-white text-black hover:bg-white/90 disabled:bg-white/10 disabled:text-white/30"
                                >
                                    {saving ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging...</>
                                    ) : block.status === 'COMPLETED' ? (
                                        "Already Completed"
                                    ) : (
                                        <><CheckCircle className="w-5 h-5 mr-2" /> Complete Block</>
                                    )}
                                </Button>
                            </motion.div>
                        </motion.form>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
