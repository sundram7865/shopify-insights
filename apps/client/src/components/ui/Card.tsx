import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("rounded-xl border border-gray-100 bg-white text-gray-900 shadow-sm hover:shadow-md transition-shadow duration-200", className)}
  >
    {children}
  </motion.div>
);