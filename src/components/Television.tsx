import React from "react";

type TelevisionProps = {
  src: string;
  isMuted: boolean;
};

const Television: React.FC<TelevisionProps> = ({ src, isMuted }) => {

  return (
    <div className="fixed top-0 left-0 w-screen h-screen -z-10 overflow-hidden">
      <img
        src="/CRT_Filter.gif"
        alt="CRT Filter"
        className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none z-0"
        draggable={false}
      />
      <video
        src={src}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        className="absolute z-10 pointer-events-none object-contain"
        style={{ top: '5%', left: '5%', width: '90%', height: '90%' }}
      />
    </div>
  );
};

export default Television;
