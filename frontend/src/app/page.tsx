'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };
const gentleSpring = { type: 'spring' as const, stiffness: 200, damping: 25 };

export default function DashboardPage() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [ideasRes, blocksRes] = await Promise.all([
          apiFetch('/ideas'),
          apiFetch('/blocks')
        ]);
        setIdeas(ideasRes.slice(0, 5));
        setBlocks(blocksRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return (
    <div className="p-8 flex justify-center text-muted-foreground">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-6 h-6 border-2 border-current border-t-transparent rounded-full" />
    </div>
  );

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaysBlocks = blocks.filter(b => b.day === todayStr);
  const completedBlocks = blocks.filter(b => b.status === 'COMPLETED').length;
  const totalBlocks = blocks.length;
  const completionRate = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;
  const deepWorkHours = completedBlocks;

  const stats = [
    { label: 'Blocks Scheduled', value: totalBlocks },
    { label: 'Blocks Completed', value: completedBlocks },
    { label: 'Completion Rate', value: `${completionRate}%` },
    { label: 'Deep Work Hours', value: `${deepWorkHours}h` },
  ];

  return (
    <motion.div
      className="space-y-6 transform-gpu will-change-transform"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
    >
      <motion.h1
        className="text-2xl sm:text-3xl font-bold transform-gpu will-change-transform"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...gentleSpring, delay: 0.1 }}
      >
        Dashboard
      </motion.h1>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.08, ...gentleSpring }}
          >
            <motion.div whileHover={{ y: -2 }} transition={{ ...spring, stiffness: 400 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
                  <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...gentleSpring }}
        >
          <Card className="h-full">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Today&apos;s Focus Blocks ({todayStr})</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              {todaysBlocks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No blocks scheduled for today.</p>
              ) : (
                <ul className="space-y-2">
                  {todaysBlocks.map((block, i) => (
                    <motion.li
                      key={block.id}
                      className="flex justify-between items-center p-3 border rounded-md gap-3 overflow-hidden"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.05, ...spring }}
                    >
                      <span className="font-medium text-sm truncate min-w-0 flex-1">{block.startTime} - {block.title}</span>
                      <span className={`text-xs px-2 py-1 flex-shrink-0 rounded-full whitespace-nowrap ${block.status === 'COMPLETED' ? 'bg-primary/20 text-primary' : 'bg-secondary'}`}>
                        {block.status}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              )}
              <div className="mt-4">
                <Link href="/schedule">
                  <motion.div whileTap={{ scale: 0.95 }} transition={spring}>
                    <Button variant="outline" size="sm">Manage Schedule</Button>
                  </motion.div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, ...gentleSpring }}
        >
          <Card className="h-full">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Recent Brain Dumps</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              {ideas.length === 0 ? (
                <p className="text-muted-foreground text-sm">No ideas formatted yet.</p>
              ) : (
                <ul className="space-y-2">
                  {ideas.map((idea, i) => (
                    <motion.li
                      key={idea.id}
                      className="p-3 border rounded-md space-y-1 overflow-hidden"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.05, ...spring }}
                    >
                      <Link href={`/ideas/${idea.id}`} className="hover:underline font-semibold block text-sm truncate">
                        {idea.title}
                      </Link>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{idea.problem}</p>
                    </motion.li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex gap-2">
                <Link href="/dump">
                  <motion.div whileTap={{ scale: 0.95 }} transition={spring}>
                    <Button size="sm">New Brain Dump</Button>
                  </motion.div>
                </Link>
                <Link href="/ideas">
                  <motion.div whileTap={{ scale: 0.95 }} transition={spring}>
                    <Button variant="outline" size="sm">View Vault</Button>
                  </motion.div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
