"use client";
import Link from 'next/link';
import { ConnectKitButton } from 'connectkit';

export default function Navigation() {
  return (
    <div className="flex p-4" style={{ color: 'black', alignItems: 'center' }}>
      <div className="flex-grow">
        <Link href="/" style={{ textDecoration: 'none', color: '#facb65', fontWeight: 'bold' }}>Higher</Link>
      </div>
      <div className="flex-grow" />
      <ConnectKitButton showAvatar={false} />
    </div>
  );
}
