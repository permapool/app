import { useState, useEffect } from 'react';
import axios from 'axios';

const prettyPrintAddress = (address: string) => `${address.substr(0, 6)}...${address.substr(-4)}`;

interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  follower_count: number;
  following_count: number;
  power_badge: boolean;
  profile: {
    bio: {
      text: string;
    }
  }
}

interface NeynarUserResponse {
  [key: string]: NeynarUser[];
}

async function address2FC(address: string) {
  const response = await axios.get(
    'https://u3cey55qwrm3ndc7ymvsajjwzq0wfvrx.lambda-url.us-east-1.on.aws/?address=' + address
  );
  if (response && response.data && !response.data.code) {
    const res = response.data as NeynarUserResponse;
    const users = res[address.toLowerCase()];
    if (users) {
      return users.sort((a, b) => a.follower_count < b.follower_count ? 1 : -1)[0].username;
    }
  }
}

function Username({ address, both }: { address: string, both?: boolean }) {
  const [username, setUsername] = useState<string|null>('');

  useEffect(() => {
    if (address && address != '0x0000000000000000000000000000000000000000') {
      address2FC(address).then(u => {
        if (u) {
          setUsername(u as string);
        }
      });
    }
  }, [address]);

  let handleElt = null;
  if (username) {
    handleElt = (
      <span>
        {username}
        <img
          alt="farcaster-logo"
          src="/fc.svg"
          style={{ height: '1em', marginLeft: '.25em', cursor: 'pointer', display: 'inline-block' }}
        />
      </span>
    );
  }
  const addressElt = <span>{prettyPrintAddress(address)}</span>;
  if (both) {
    return <span>{handleElt}<span className="secondary-text">{addressElt}</span></span>
  }  else {
    return handleElt || addressElt;
  }
}

export default Username;
