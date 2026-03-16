import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

// --- Tabs Configuration ---
export function Tabs({ 
    tabs, 
    activeTab, 
    onChange 
}: { 
    tabs: { id: string; label: string; content: React.ReactNode }[]; 
    activeTab: string; 
    onChange: (id: string) => void;
}) {
    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg w-full max-w-sm mb-6">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onChange(tab.id)}
                            className={`relative flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                isActive ? 'text-black' : 'text-white/50 hover:text-white/80'
                            }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="notes-tab-indicator"
                                    className="absolute inset-0 bg-white rounded-md"
                                    initial={false}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    );
                })}
            </div>
            
            <div className="flex-1 w-full h-full">
                <AnimatePresence mode="wait">
                    {tabs.map(tab => tab.id === activeTab && (
                        <motion.div
                            key={tab.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {tab.content}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

// --- Simplified Dialog for Notes ---
export function Dialog({ 
    open, 
    onOpenChange, 
    title, 
    children 
}: { 
    open: boolean; 
    onOpenChange: (open: boolean) => void; 
    title: string; 
    children: React.ReactNode;
}) {
    return (
        <AnimatePresence>
            {open && (
                <div className="absolute inset-0 z-50 flex items-center justify-center -m-4 sm:m-0 px-4 mt-10">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => onOpenChange(false)}
                    />
                    
                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={spring}
                        className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col max-h-[90%]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
                            <h2 className="text-xl font-semibold text-white truncate pr-4">{title}</h2>
                            <button 
                                onClick={() => onOpenChange(false)}
                                className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
