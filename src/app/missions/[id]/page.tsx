import { notFound } from "next/navigation";
import MissionDetail from "../mission-detail";

const missions = {
  hz001: {
    title: "HZ001 · Higher Together",
    mission: "Create a short video bumper.",
    rewards: "300,000 $HIGHER",
    requirements: [
      "Length: 11+ seconds",
      "Format: 16:9 horizontal",
      "Must include motion",
      "Media: iPhone, animation, Blender, Midjourney… anything goes",
    ],
    deadline: "Monday, October 6 · 12PM EST",
    announcement: {
      farcaster: "https://farcaster.xyz/higherzip.eth/0x1ae950f0",
      x: "https://x.com/HIGHERzip/status/1970239480838910292",
    },
    entries: [
      {
        user: "@esdotge",
        platform: "Farcaster",
        link: "https://farcaster.xyz/esdotge/0x1c06cb22",
      },
      {
        user: "@willdias",
        platform: "Farcaster",
        link: "https://farcaster.xyz/willdias/0xc4cabdae",
      },
      {
        user: "@cactuslockwood",
        platform: "Farcaster",
        link: "https://farcaster.xyz/cactuslockwood/0xf70fc8d3",
      },
      {
        user: "@catra",
        platform: "Farcaster",
        link: "https://farcaster.xyz/catra/0x0aa9fc7f",
      },
      {
        user: "@anacarolina.eth",
        platform: "Farcaster",
        link: "https://farcaster.xyz/anacarolina.eth/0xe448ee31",
      },
      {
        user: "@willdias",
        platform: "Farcaster",
        link: "https://farcaster.xyz/willdias/0x201733cb",
      },
      {
        user: "@catra",
        platform: "Farcaster",
        link: "https://farcaster.xyz/catra/0x5704bfba",
      },
      {
        user: "@aumijin",
        platform: "Farcaster",
        link: "https://farcaster.xyz/aumijin/0x08f57269",
      },
      {
        user: "@asha",
        platform: "Farcaster",
        link: "https://farcaster.xyz/asha/0x520075ed",
      },
      {
        user: "@dwwmitry",
        platform: "Farcaster",
        link: "https://farcaster.xyz/dwwmitry/0x226699b7",
      },
      {
        user: "@pedrovilela",
        platform: "Farcaster",
        link: "https://farcaster.xyz/pedrovilela.eth/0x092b9060",
      },
      {
        user: "@leorex_eth",
        platform: "X",
        link: "https://x.com/leorex_eth/status/1973413880928842044",
      },
      {
        user: "@know",
        platform: "Farcaster",
        link: "https://farcaster.xyz/know/0x514b4213",
      },
      {
        user: "@genuinejack",
        platform: "Farcaster",
        link: "https://farcaster.xyz/genuinejack/0xe2468d3b",
      },
      {
        user: "@papa",
        platform: "Farcaster",
        link: "https://farcaster.xyz/papa/0x07302f80",
      },
      {
        user: "@juli",
        platform: "Farcaster",
        link: "https://farcaster.xyz/juli/0x99b54e56",
      },
      {
        user: "@denzooo",
        platform: "Farcaster",
        link: "https://farcaster.xyz/denzooo/0xe7f7185f",
      },
      {
        user: "@coinempress",
        platform: "Farcaster",
        link: "https://farcaster.xyz/coinempress/0xdd1ee984",
      },
      {
        user: "@thatweb3guy",
        platform: "Farcaster",
        link: "https://farcaster.xyz/thatweb3guy/0x0543331d",
      },
      {
        user: "@gabeeinhorn",
        platform: "Farcaster",
        link: "https://farcaster.xyz/gabeeinhorn/0xb2b5ea84",
      },
      {
        user: "@joseacabrerav",
        platform: "Farcaster",
        link: "https://farcaster.xyz/joseacabrerav/0x31a7d8a0",
      },
      {
        user: "@Jkg_eth",
        platform: "X",
        link: "https://x.com/jkg_eth/status/1971068315226550531",
      },
    ],
  },
  hz002: {
    title: "HZ002 · Higher Forever",
    mission: "Create a looping video.",
    rewards: "200,000 $HIGHER + @betrmint featured mint",
    requirements: [
      "Must include motion",
      "Must loop seamlessly",
      "Format: Any",
      "Media: iPhone video, animation, Midjourney, Blender… anything goes",
    ],
    deadline: "Wednesday, November 13 · 12PM EST",
    announcement: {
      farcaster: "https://farcaster.xyz/higherzip.eth/0x5f1f9d52",
    },
    entries: [
      {
        user: "@mcilroyc",
        platform: "Farcaster",
        link: "https://farcaster.xyz/mcilroyc/0x70389722",
      },
      {
        user: "@caaty",
        platform: "Farcaster",
        link: "https://farcaster.xyz/caaty/0x1e51e4ba",
      },
      {
        user: "@basement5k",
        platform: "Farcaster",
        link: "https://farcaster.xyz/basement5k/0xa97e62fd",
      },
      {
        user: "@swishh.eth",
        platform: "Farcaster",
        link: "https://farcaster.xyz/swishh.eth/0x0c9a9dfe",
      },
      {
        user: "@jamesrush",
        platform: "Farcaster",
        link: "https://farcaster.xyz/jamesrush/0x9c54d549",
      },
      {
        user: "@cactuslockwood",
        platform: "Farcaster",
        link: "https://farcaster.xyz/cactuslockwood/0x18238f8b",
      },
      {
        user: "@cactuslockwood",
        platform: "Farcaster",
        link: "https://farcaster.xyz/cactuslockwood/0x3ca439c3",
      },
      {
        user: "@kyaakkk",
        platform: "Farcaster",
        link: "https://farcaster.xyz/kyaakkk/0xace26fb8",
      },
      {
        user: "@stustustudio",
        platform: "Farcaster",
        link: "https://farcaster.xyz/stustustudio/0x9a5a88f1",
      },
      {
        user: "@madlog1c.eth",
        platform: "Farcaster",
        link: "https://farcaster.xyz/madlog1c.eth/0xc6aec45b",
      },
    ],
  },
  hz003: {
    title: "HZ003 · Higher Amplified",
    mission: "Create an audio piece.",
    rewards: "300,000 $HIGHER",
    requirements: [
      "Must be audible",
      "Any audio format",
      "Theme: Energize",
      "Media: Music, sound design, field recordings, ambient texture… anything goes",
    ],
    deadline: "Thursday, December 4 · 12PM EST",
    announcement: {
      farcaster: "https://farcaster.xyz/higherzip.eth/0x7df4072b",
    },
    entries: [
      {
        user: "@ethra",
        platform: "Farcaster",
        link: "https://farcaster.xyz/ethra/0x01166098",
      },
      {
        user: "@kyaakkk",
        platform: "Farcaster",
        link: "https://farcaster.xyz/kyaakkk/0x81b66b1b",
      },
      {
        user: "@apiip",
        platform: "Farcaster",
        link: "https://farcaster.xyz/apiip/0xfc1823f9",
      },
      {
        user: "@caaty",
        platform: "Farcaster",
        link: "https://farcaster.xyz/caaty/0xc8c308ac",
      },
      {
        user: "@jamesrush",
        platform: "Farcaster",
        link: "https://farcaster.xyz/jamesrush/0x064dc9a1",
      },
      {
        user: "@yoogio",
        platform: "Farcaster",
        link: "https://farcaster.xyz/yoogio/0x9d131383",
      },
      {
        user: "@madlog1c.eth",
        platform: "Farcaster",
        link: "https://farcaster.xyz/madlog1c.eth/0xdeed1fbf",
      },
      {
        user: "@anacarolina.eth",
        platform: "Farcaster",
        link: "https://farcaster.xyz/anacarolina.eth/0xd82e5e94",
      },
      {
        user: "@cactuslockwood",
        platform: "Farcaster",
        link: "https://farcaster.xyz/cactuslockwood/0xbb474f01",
      },
    ],
  },
};

export default async function MissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const mission = missions[id as keyof typeof missions];
  if (!mission) return notFound();

  return <MissionDetail mission={mission} />;
}
