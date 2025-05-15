const dotenv = require('dotenv');
const axios = require('axios');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '/.env') });

const ethers = require('ethers')
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});
const questionHidden = (query) => {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    let input = '';

    // Mute output
    stdin.on('data', (char) => {
      char = char.toString();
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.pause();
          break;
        default:
          stdout.clearLine(0);
          stdout.cursorTo(0);
          stdout.write(query + ' ' + '*'.repeat(input.length));
          input += char;
          break;
      }
    });

    rl.question(query + ' ', (answer) => {
      resolve(answer);
    });

    stdin.setRawMode(true);
  });
};

const getFid = async (address) => {
  // Build the URL with the address as query parameters
  const baseUrl = 'https://api.neynar.com/v2/farcaster/user/custody-address';  // Replace with the API base URL
  const url = new URL(baseUrl);

  // Append the address as query parameters to the URL
  url.searchParams.append('custody_address', address);

  // Perform the HTTPS request
  const response = await axios.get(url.toString(), {
    headers: {
      'api_key': process.env.NEYNAR_API_KEY,
      'accept': 'application/json',
    }
  });
  const user = response.data.user;
  if (!user) {
    throw new Error('No Farcaster user found with the provided custody address');
  }
  console.log('\nLoaded User', user.username)
  console.log('\nLoaded FID', user.fid)
  return user.fid;
};

(async() => {
  console.log('Loading environment variables...');
  const DOMAIN = new URL(process.env.NEXT_PUBLIC_URL).hostname;
  console.log('\nLoaded domain', DOMAIN);
  const privateKey = await questionHidden('\nPaste your custody address private key (hidden) and press enter: ');
  const wallet = new ethers.Wallet(privateKey, null);
  const custodyAddress = (await wallet.getAddress()).toLowerCase();
  console.log('\nLoaded address', custodyAddress);
  const fid = await getFid(custodyAddress);
  const header = { fid, type: 'custody', key: custodyAddress };
  const payload = { domain: DOMAIN };
  const encodedHeader = Buffer.from(JSON.stringify(header), 'utf-8').toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const signature = await wallet.signMessage(`${encodedHeader}.${encodedPayload}`);
  const encodedSignature = Buffer.from(signature, 'utf-8').toString('base64url');
  const compactJfs = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  console.log('\nSuccess! Add this to your .env file:')
  const jsonJfs = {
    header: encodedHeader,
    payload: encodedPayload,
    signature: encodedSignature
  }
  console.log(`\nWELLKNOWN_JSON='${JSON.stringify(jsonJfs)}'\n`);
})();


