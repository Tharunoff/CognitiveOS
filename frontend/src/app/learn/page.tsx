'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };
const gentleSpring = { type: 'spring' as const, stiffness: 200, damping: 25 };

function TopicCard({ item, index }: { item: any, index: number }) {
    const [activeTab, setActiveTab] = useState<'kid' | 'exam' | 'bullet' | 'step'>('kid');

    const contentMap = {
        kid: item.kidExplanation,
        exam: item.examAnswer,
        bullet: item.bulletNotes,
        step: item.stepExplanation
    };

    const tabs = [
        { id: 'kid', label: 'Kid Explanation' },
        { id: 'exam', label: '5-Mark Exam' },
        { id: 'bullet', label: 'Bullet Notes' },
        { id: 'step', label: 'Step-by-Step' }
    ] as const;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.1, ...gentleSpring }}
        >
            <motion.div whileHover={{ y: -3 }} transition={{ ...spring, stiffness: 400 }}>
                <Card className="border-primary/20 bg-card/50 hover:shadow-lg hover:shadow-primary/5 transition-shadow duration-500">
                    <CardHeader className="bg-secondary/30 pb-4 border-b">
                        <CardTitle className="text-xl">{item.topic}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex gap-2 overflow-x-auto mb-4 border-b pb-2">
                            {tabs.map((tab, i) => (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors relative ${activeTab === tab.id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-secondary'
                                        }`}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.94 }}
                                    transition={spring}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    // @ts-ignore
                                    transitionDelay={i * 0.04}
                                >
                                    {tab.label}
                                </motion.button>
                            ))}
                        </div>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                className="p-4 bg-background/50 rounded-md whitespace-pre-wrap leading-relaxed border font-mono text-sm shadow-inner"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                            >
                                {contentMap[activeTab]}
                            </motion.div>
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}

export default function LearningCompressorPage() {
    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => { apiFetch('/learning').then(setHistory).catch(console.error); }, []);

    const handleCompress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;
        setLoading(true);
        try {
            const result = await apiFetch('/learning/compress', { method: 'POST', body: JSON.stringify({ topic }) });
            setHistory([result, ...history]); setTopic('');
        } catch (err) { console.error(err); alert('Failed to compress learning topic.'); }
        finally { setLoading(false); }
    };

    return (
        <motion.div
            className="max-w-4xl mx-auto space-y-8 pt-6"
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
                <h1 className="text-3xl font-extrabold tracking-tight">Learning Compressor</h1>
                <p className="text-muted-foreground">Convert complex topics into structured 4-level explanations.</p>
            </motion.div>

            <motion.form
                onSubmit={handleCompress}
                className="flex gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...gentleSpring, delay: 0.2 }}
            >
                <Input
                    className="flex-1 h-12 text-lg px-4"
                    placeholder="E.g., A* search algorithm, Quantum Entanglement..."
                    value={topic}
                    onChange={(e: any) => setTopic(e.target.value)}
                    disabled={loading}
                />
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.94 }} transition={spring}>
                    <Button type="submit" disabled={loading} className="w-40 h-12 font-semibold">
                        {loading ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                <Loader2 className="w-5 h-5" />
                            </motion.div>
                        ) : 'Compress'}
                    </Button>
                </motion.div>
            </motion.form>

            <div className="space-y-8 pt-4">
                <AnimatePresence>
                    {history.map((item, i) => (
                        <TopicCard key={item.id} item={item} index={i} />
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
