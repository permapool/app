'use client';

import * as Player from '@livepeer/react/player';

type LiveProps = {
  playbackId: string;
  isMuted: boolean;
};

export default function Live({ playbackId, isMuted }: LiveProps) {
  const src = [
    {
      type: 'hls' as const,
      src: `https://livepeercdn.com/hls/${playbackId}/index.m3u8`,
      mime: 'application/vnd.apple.mpegurl',
    },
  ] as unknown as Parameters<typeof Player.Root>[0]['src']; // safe cast to the component’s prop type

  return (
    <Player.Root src={src} autoPlay>
      <Player.Container className="pointer-events-none w-full h-full">
        <Player.Video id="jumbotron" muted={isMuted} className="pointer-events-none w-full h-full object-contain" />
      </Player.Container>
    </Player.Root>
  );
}
