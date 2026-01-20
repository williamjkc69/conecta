import React, { useRef, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MessageSquare as MessageSquareText } from 'lucide-react';
import { motion } from 'framer-motion';

const TranscriptionPanel = ({ transcript }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <Accordion type="single" collapsible className="w-full text-slate-100 bg-slate-800/50 rounded-lg px-4 border border-slate-700">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <div className='flex items-center gap-2'>
            <MessageSquareText size={16} />
            <span>Transcripción en Vivo</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div ref={scrollRef} className="h-40 overflow-y-auto p-2 space-y-3 bg-slate-900/50 rounded-md">
            {transcript.length === 0 && (
              <p className="text-slate-400 text-center py-10">Esperando a que el usuario hable...</p>
            )}
            {transcript.map((entry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex gap-3"
              >
                <span className="font-mono text-xs text-cyan-400 mt-1">{entry.timestamp}</span>
                <p className="text-slate-200 flex-1">{entry.text}</p>
              </motion.div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default TranscriptionPanel;