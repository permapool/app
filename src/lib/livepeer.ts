export type LiveStatus = {
    isActive: boolean;
    playbackUrl: string | null;
  };
  
  const BASE = 'https://livepeer.studio/api';
  
  const headers = () => ({
    Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}`,
    'Content-Type': 'application/json',
  });
  
  export async function fetchLiveStatus(): Promise<LiveStatus> {
    const streamId = process.env.LIVEPEER_STREAM_ID;
    const playbackId = process.env.LIVEPEER_PLAYBACK_ID;
  
    if (!streamId || !playbackId) {
      return { isActive: false, playbackUrl: null };
    }
  
    const res = await fetch(`${BASE}/stream/${streamId}`, {
      method: 'GET',
      headers: headers(),
      cache: 'no-store',
    });
  
    if (!res.ok) return { isActive: false, playbackUrl: null };
  
    const data = await res.json();
    const isActive = Boolean(data?.isActive);
    const playbackUrl = isActive
      ? `https://livepeercdn.com/hls/${playbackId}/index.m3u8`
      : null;
  
    return { isActive, playbackUrl };
  }
  