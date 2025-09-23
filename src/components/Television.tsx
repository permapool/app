'use client';

import { ReactNode, useEffect, useRef } from 'react';

type TelevisionProps = {
  src?: string;     
  isMuted: boolean;
  children?: ReactNode; 
};

export default function Television({ src, isMuted, children }: TelevisionProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!children && videoRef.current && src) {
      videoRef.current.src = src;
    }
  }, [children, src]);

  return (
    <div className="fixed top-0 left-0 w-screen h-screen -z-10 overflow-hidden bg-[#111]">
      {/* <img
        src="/transparent-bg.png"
        alt="infinite background"
        className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none z-0"
        draggable={false}
      /> */}
      
      {children ? (
        <div
          className="absolute z-10 pointer-events-none object-contain"
          style={{ top: '5%', left: '0%', width: '100%', height: '90%' }}
        >
          {children}
        </div>
      ) : (
        <video
          ref={videoRef}
          src={src}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="absolute z-10 pointer-events-none object-contain"
          style={{ top: '5%', left: '0%', width: '100%', height: '90%' }}
        />
      )}
    </div>
  );
};