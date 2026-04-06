'use client';

import { useAppStore } from '@/store/useAppStore';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, checkSession } = useAppStore();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        checkSession();
        setMounted(true);
        if (!isAuthenticated && pathname !== '/login') {
            router.push('/login');
        }
        if (isAuthenticated && pathname === '/login') {
            router.push('/');
        }
    }, [isAuthenticated, pathname, router, checkSession]);

    if (!mounted) return null;

    if (!isAuthenticated && pathname !== '/login') return null;

    return <>{children}</>;
}
