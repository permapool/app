import React from "react";

const Television: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 w-screen h-screen -z-10 overflow-hidden">
      <video
        src="/water-drop-loop.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
      />
    </div>
  );
};

export default Television;