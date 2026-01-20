import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import StatusIndicator from '@/components/interview/StatusIndicator';
import AudioLevelMeter from '@/components/interview/AudioLevelMeter';
import { Info } from 'lucide-react';

const CallStatistics = ({
  latency,
  connectionQuality,
  audioLevel,
  isMuted,
  isVideoEnabled,
}) => {
  return (
    <Accordion type="single" collapsible className="w-full text-slate-100 bg-slate-800/50 rounded-lg px-4 border border-slate-700">
      <AccordionItem value="item-1">
        <AccordionTrigger>
            <div className='flex items-center gap-2'>
                <Info size={16} />
                <span>Detalles de la Conexión</span>
            </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 p-2">
            <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Latencia de Red</span>
                <span className="font-mono font-medium text-cyan-300">{latency} ms</span>
            </div>
            <StatusIndicator label="Calidad de Conexión" status={connectionQuality} type="connection" />
            <hr className="border-slate-700" />
            <StatusIndicator label="Cámara" status={isVideoEnabled} type="device" />
            <StatusIndicator label="Micrófono" status={!isMuted} type="device" />
            <hr className="border-slate-700" />
            <AudioLevelMeter audioLevel={audioLevel} />
            <StatusIndicator label="Grabación" status={true} type="recording" />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default CallStatistics;