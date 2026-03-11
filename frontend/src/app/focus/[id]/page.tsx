'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Square, CheckCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function FocusModePage() {
    const { id } = useParams();
    const router = useRouter();
    const [block, setBlock] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Timer State
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [output, setOutput] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const data = await apiFetch(`/blocks`);
                const found = data.find((b: any) => b.id === id);
                setBlock(found);
                if (found) {
                    // Calculate duration in seconds
                    const [sH, sM] = found.startTime.split(':').map(Number);
                    const [eH, eM] = found.endTime.split(':').map(Number);
                    let mins = (eH * 60 + eM) - (sH * 60 + sM);
                    if (mins <= 0) mins += 24 * 60; // handle midnight crossing
                    setTimeLeft(mins * 60);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        if (id) load();
    }, [id]);

    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(t => t - 1);
            }, 1000);
        } else if (timeLeft <= 0 && isActive) {
            setIsActive(false);
            clearInterval(interval);
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
            router.push('/schedule');
        } catch (err) {
            console.error(err);
            alert('Failed to log completion');
            setSaving(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-primary flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    if (!block) return <div className="p-12 text-center text-destructive">Block not found</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6 pt-12">
            <h1 className="text-3xl font-extrabold text-center tracking-tight text-primary">Focus Mode</h1>

            <Card className={`border-2 transition-all duration-500 shadow-xl ${isActive ? 'border-primary ring-4 ring-primary/20' : 'border-border'}`}>
                <CardHeader className="text-center bg-secondary/30 pb-6 border-b">
                    <CardTitle className="text-2xl">{block.title}</CardTitle>
                    <CardDescription className="text-lg mt-2">{block.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-10 pt-10">
                    <div className={`text-8xl md:text-9xl font-mono font-bold tracking-tighter transition-colors ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {formatTime(timeLeft)}
                    </div>

                    <div className="flex gap-4">
                        <Button size="lg" variant={isActive ? "destructive" : "default"} onClick={toggleTimer} className="w-48 h-14 text-lg font-bold">
                            {isActive ? <><Square className="w-5 h-5 mr-3" /> Stop Focus</> : <><Play className="w-5 h-5 mr-3" /> Start Focus</>}
                        </Button>
                    </div>

                    <form className="w-full space-y-4 pt-10 border-t" onSubmit={handleComplete}>
                        <div className="space-y-3">
                            <Label className="text-lg font-semibold">Execution Log (What did you output?)</Label>
                            <textarea
                                className="w-full min-h-[120px] p-4 text-sm border-2 rounded-md focus:ring-0 focus:border-primary focus:outline-none bg-background/50"
                                placeholder="e.g. Drew A* search tree and understood heuristic evaluation..."
                                value={output}
                                onChange={e => setOutput(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" disabled={saving || block.status === 'COMPLETED'} className="w-full h-12 text-md" variant="secondary">
                            {saving ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging...</>
                            ) : block.status === 'COMPLETED' ? (
                                "Already Completed"
                            ) : (
                                <><CheckCircle className="w-5 h-5 mr-2" /> Complete Block</>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
