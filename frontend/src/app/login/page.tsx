'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit } from 'lucide-react';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAppStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const response = await apiFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            login(response.user, response.token);
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <div className="flex items-center gap-2 mb-8">
                <BrainCircuit className="h-10 w-10 text-primary" />
                <h1 className="text-3xl font-bold">CognitiveOS</h1>
            </div>

            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{isLogin ? 'Welcome back' : 'Create an account'}</CardTitle>
                    <CardDescription>
                        {isLogin
                            ? 'Enter your credentials to access your workspace.'
                            : 'Sign up to start structuring your thoughts.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e: any) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e: any) => setPassword(e.target.value)}
                                required border-none
                            />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <Button type="submit" className="w-full">
                            {isLogin ? 'Sign In' : 'Sign Up'}
                        </Button>

                        <div className="text-center text-sm pt-4">
                            <button
                                type="button"
                                className="text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                                onClick={() => setIsLogin(!isLogin)}
                            >
                                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
