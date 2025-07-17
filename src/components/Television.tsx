import React from "react";

type TelevisionProps = {
  src: string;
  isMuted: boolean;
};

const Television: React.FC<TelevisionProps> = ({ src, isMuted }) => {

  return (
    <div className="fixed top-0 left-0 w-screen h-screen -z-10 overflow-hidden">
      <video
        src={src}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
      />
    </div>
  );
};

export default Television;
