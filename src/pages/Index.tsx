
import React, { useEffect, useState } from 'react';
import LeadForm from '@/components/LeadForm';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const [loaded, setLoaded] = useState(false);
  const isMobile = useIsMobile();

  // Simple animation on load
  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-trenergia-blue/10 to-trenergia-blue/30 px-4 py-8 md:py-12">
      <div
        className={`form-container bg-white shadow-xl w-full ${isMobile ? 'max-w-[95%] p-4' : 'max-w-md p-8'
          } ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
      >
        <LeadForm />
      </div>
    </div>
  );
};

export default Index;
