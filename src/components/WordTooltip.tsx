'use client';

import { motion } from 'motion/react';

interface Props {
  title: string;
  description: string;
  citation: string;
}

export default function WordTooltip({ title, description, citation }: Props) {
  return (
    <motion.div
      className='absolute z-50 p-4 rounded-md bg-[#2d241e]/80 text-[#f5f0e6] border-[#c5a059]/20 shadow-lg'
      style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
    >
      <h3 className='font-bahlull text-xl text-[#c5a059]/80'>{title}</h3>
      <p className='text-sm mt-2'>{description}</p>
      <blockquote className='mt-4 text-xs italic text-[#c5a059]/60'>
        {citation}
      </blockquote>
    </motion.div>
  );
}