'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };
const gentleSpring = { type: 'spring' as const, stiffness: 200, damping: 25 };

export default function BrainDumpPage() {
    const [text, setText] = useState('');
    const [type, setType] = useState('Work');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        setLoading(true);
        try {
            const idea = await apiFetch('/ideas/dump', {
                method: 'POST',
                body: JSON.stringify({ text, type })
            });
            router.push(`/ideas/${idea.id}`);
        } catch (err) {
            console.error(err);
            alert("Failed to structure idea. Check backend connection.");
            setLoading(false);
        }
    };

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
                <h1 className="text-3xl font-bold tracking-tight">Brain Dump</h1>
                <p className="text-muted-foreground">Offload your raw thoughts. AI will organize them.</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...gentleSpring, delay: 0.2 }}
            >
                <Card className="hover:shadow-lg transition-shadow duration-500">
                    <CardHeader>
                        <CardTitle>Capture Raw Thoughts</CardTitle>
                        <CardDescription>Don&apos;t worry about formatting. Just write down what&apos;s on your mind.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <motion.div
                                className="space-y-2"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ ...gentleSpring, delay: 0.3 }}
                            >
                                <Label>Idea Type</Label>
                                <div className="flex gap-4">
                                    {['Work', 'Personal'].map(t => (
                                        <motion.label
                                            key={t}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors
                                                ${type === t ? 'border-primary bg-primary/10 text-primary' : 'border-input hover:border-muted-foreground/50'}`}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.96 }}
                                            transition={spring}
                                        >
                                            <input type="radio" name="type" value={t} checked={type === t} onChange={() => setType(t)} className="hidden" />
                                            <motion.div
                                                className={`w-3 h-3 rounded-full border-2 ${type === t ? 'border-primary bg-primary' : 'border-muted-foreground'}`}
                                                animate={{ scale: type === t ? 1 : 0.8 }}
                                                transition={spring}
                                            />
                                            {t}
                                        </motion.label>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div
                                className="space-y-2"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ ...gentleSpring, delay: 0.4 }}
                            >
                                <Label htmlFor="dump">Unstructured Thought Details</Label>
                                <textarea
                                    id="dump"
                                    required
                                    className="w-full min-h-[300px] p-4 rounded-md border bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary transition-shadow duration-300 hover:shadow-sm"
                                    placeholder="Type anything... e.g., an AI system that detects garbage in lakes using drones. Maybe municipalities could use it. Needs a subscription model..."
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    disabled={loading}
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ ...gentleSpring, delay: 0.5 }}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold">
                                    {loading ? (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex items-center gap-2"
                                        >
                                            <motion.div
                                                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            />
                                            AI is processing and structuring your thought...
                                        </motion.span>
                                    ) : 'Submit & Structure'}
                                </Button>
                            </motion.div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
