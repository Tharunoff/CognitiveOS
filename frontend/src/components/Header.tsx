'use client';

import Link from 'next/link';
import { BrainCircuit, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };
const gentleSpring = { type: 'spring' as const, stiffness: 200, damping: 25 };

const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/dump', label: 'Brain Dump' },
    { href: '/ideas', label: 'Vault' },
    { href: '/learn', label: 'Learn' },
    { href: '/schedule', label: 'Schedule' },
];

export function Header() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (pathname === '/login') return null;

    return (
        <>
            <motion.header
                className="border-b border-white/10 bg-[#000000]/80 backdrop-blur-md sticky top-0 z-50"
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring' as const, stiffness: 200, damping: 28 }}
            >
                <div className="container mx-auto flex h-14 items-center px-4 md:px-6">
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={spring}>
                        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white">
                            <motion.div animate={{ rotate: [0, 0, 360] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 8, ease: "easeInOut" }}>
                                <BrainCircuit className="h-5 w-5 text-white" />
                            </motion.div>
                            <span>CognitiveOS</span>
                        </Link>
                    </motion.div>

                    {/* Desktop nav */}
                    <nav className="ml-auto hidden md:flex items-center gap-1 sm:gap-2 text-sm font-medium">
                        {navItems.map((item, i) => {
                            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                            return (
                                <motion.div
                                    key={item.href}
                                    initial={{ opacity: 0, y: -12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.05, ...spring }}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.92 }}
                                >
                                    <Link
                                        href={item.href}
                                        className={`px-3 py-1.5 rounded-md transition-colors relative ${isActive
                                                ? 'bg-white/10 text-white'
                                                : 'text-white/40 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </nav>

                    {/* Mobile hamburger */}
                    <motion.button
                        className="ml-auto md:hidden p-2 rounded-md hover:bg-white/5 text-white/70"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        whileTap={{ scale: 0.9 }}
                        transition={spring}
                        aria-label="Toggle menu"
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            {mobileMenuOpen ? (
                                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={spring}>
                                    <X className="h-5 w-5" />
                                </motion.div>
                            ) : (
                                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={spring}>
                                    <Menu className="h-5 w-5" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>
            </motion.header>

            {/* Mobile menu overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        className="fixed inset-0 z-40 md:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Backdrop */}
                        <motion.div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setMobileMenuOpen(false)}
                        />

                        {/* Menu panel */}
                        <motion.nav
                            className="absolute top-14 left-0 right-0 bg-[#0a0a0a] border-b border-white/10 shadow-2xl"
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
                        >
                            <div className="flex flex-col p-4 space-y-1">
                                {navItems.map((item, i) => {
                                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                                    return (
                                        <motion.div
                                            key={item.href}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05, ...spring }}
                                        >
                                            <Link
                                                href={item.href}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive
                                                        ? 'bg-white/10 text-white'
                                                        : 'text-white/40 hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                {item.label}
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
