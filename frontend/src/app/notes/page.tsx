'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { Tabs } from '@/components/notes/ui';
import { NormalNotesTab } from '@/components/notes/NormalNotesTab';
import { DomainNotesTab } from '@/components/notes/DomainNotesTab';

const gentleSpring = { type: 'spring' as const, stiffness: 200, damping: 25 };

export default function NotesPage() {
    const [activeTab, setActiveTab] = useState('normal');

    return (
        <motion.div
            className="max-w-5xl mx-auto space-y-6 pt-4 h-full flex flex-col"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            <motion.div
                className="space-y-2 shrink-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...gentleSpring, delay: 0.1 }}
            >
                <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-white/50" />
                    <h1 className="text-3xl font-bold tracking-tight text-white">Notes</h1>
                </div>
                <p className="text-white/40">Capture thoughts quickly, or organize them into specific domains.</p>
            </motion.div>

            <motion.div
                className="flex-1 w-full flex flex-col min-h-0 pt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...gentleSpring, delay: 0.2 }}
            >
                <Tabs 
                    activeTab={activeTab} 
                    onChange={setActiveTab}
                    tabs={[
                        { id: 'normal', label: 'Normal Notes', content: <NormalNotesTab /> },
                        { id: 'domains', label: 'Domain Notes', content: <DomainNotesTab /> }
                    ]}
                />
            </motion.div>
        </motion.div>
    );
}
