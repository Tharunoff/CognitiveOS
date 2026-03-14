'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };
const gentleSpring = { type: 'spring' as const, stiffness: 200, damping: 25 };

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAppStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const response = await apiFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            login(response.user, response.token);
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            className="flex flex-col items-center justify-center min-h-[80vh]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={gentleSpring}
        >
            <motion.div
                className="flex items-center gap-3 mb-10"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...gentleSpring, delay: 0.1 }}
            >
                <motion.div
                    animate={{ rotate: [0, 0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 8, ease: "easeInOut" }}
                >
                    <BrainCircuit className="h-8 w-8 text-white" />
                </motion.div>
                <h1 className="text-3xl font-bold text-white tracking-tight">CognitiveOS</h1>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...gentleSpring, delay: 0.2 }}
            >
                <Card className="w-full max-w-md border-white/10 bg-white/[0.02]">
                    <CardHeader>
                        <CardTitle className="text-white">{isLogin ? 'Welcome back' : 'Create an account'}</CardTitle>
                        <CardDescription className="text-white/40">
                            {isLogin
                                ? 'Enter your credentials to access your workspace.'
                                : 'Sign up to start structuring your thoughts.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-white/60">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e: any) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="bg-white/[0.02] border-white/10 text-white placeholder-white/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-white/60">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e: any) => setPassword(e.target.value)}
                                    required
                                    className="bg-white/[0.02] border-white/10 text-white"
                                />
                            </div>
                            {error && (
                                <motion.p
                                    className="text-sm text-white/60 bg-white/5 px-3 py-2 rounded-md border border-white/10"
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={spring}
                                >
                                    {error}
                                </motion.p>
                            )}

                            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} transition={spring}>
                                <Button type="submit" className="w-full relative overflow-hidden h-11 bg-white text-black hover:bg-white/90 font-semibold" disabled={loading}>
                                    <motion.div 
                                        initial={false} 
                                        animate={{ y: loading ? "-150%" : "0%", opacity: loading ? 0 : 1 }} 
                                        transition={spring}
                                        className="absolute inset-0 flex items-center justify-center"
                                    >
                                        {isLogin ? 'Sign In' : 'Sign Up'}
                                    </motion.div>
                                    <motion.div 
                                        initial={false} 
                                        animate={{ y: loading ? "0%" : "150%", opacity: loading ? 1 : 0 }} 
                                        transition={spring}
                                        className="absolute inset-0 flex items-center justify-center"
                                    >
                                        <Loader2 className="w-5 h-5 animate-spin text-black" />
                                    </motion.div>
                                </Button>
                            </motion.div>

                            <div className="text-center text-sm pt-4">
                                <button
                                    type="button"
                                    className="text-white/40 hover:text-white transition-colors underline-offset-4 hover:underline"
                                    onClick={() => setIsLogin(!isLogin)}
                                >
                                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
