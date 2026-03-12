'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };
const gentleSpring = { type: 'spring' as const, stiffness: 200, damping: 25 };

const CodeBlock = ({ className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const [copied, setCopied] = useState(false);
    const codeString = String(children).replace(/\n$/, '');

    const handleCopy = () => {
        navigator.clipboard.writeText(codeString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (match) {
        return (
            <div className="relative group my-4 rounded-md overflow-hidden border border-border">
                <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 text-xs">
                    <span className="font-mono text-muted-foreground">{match[1]}</span>
                    <button
                        onClick={handleCopy}
                        className="p-1.5 hover:bg-secondary rounded-md transition-colors flex items-center gap-1.5"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3.5 h-3.5 text-green-500" />
                                <span className="text-green-500">Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
                                <span className="text-muted-foreground group-hover:text-foreground">Copy Code</span>
                            </>
                        )}
                    </button>
                </div>
                <SyntaxHighlighter
                    style={vscDarkPlus as any}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{ margin: 0, borderRadius: 0, background: '#1e1e1e' }}
                    {...props}
                >
                    {codeString}
                </SyntaxHighlighter>
            </div>
        );
    }
    return (
        <code className="bg-muted px-1.5 py-0.5 rounded-md font-mono text-sm break-all" {...props}>
            {children}
        </code>
    );
};

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
                                className="p-4 bg-background/50 rounded-md border shadow-inner text-base leading-relaxed"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                            >
                                <div className="space-y-4 max-w-none break-words">
                                    <ReactMarkdown
                                        components={{
                                            code: CodeBlock,
                                            p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                                            ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2 marker:text-muted-foreground" {...props} />,
                                            ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2 marker:text-muted-foreground" {...props} />,
                                            li: ({node, ...props}) => <li {...props} />,
                                            h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 mt-6" {...props} />,
                                            h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-3 mt-5" {...props} />,
                                            h3: ({node, ...props}) => <h3 className="text-lg font-bold mb-2 mt-4" {...props} />,
                                            strong: ({node, ...props}) => <strong className="font-semibold text-foreground/90" {...props} />,
                                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/50 pl-4 italic my-4" {...props} />
                                        }}
                                    >
                                        {contentMap[activeTab] || ''}
                                    </ReactMarkdown>
                                </div>
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
