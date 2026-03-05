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
  hz004: {
    title: "HZ004 · Year of the Horse Calendar",
    mission: "Create an image of a horse, higher coded.",
    rewards:
      "300,000 $HIGHER split evenly among winners. Calendar profits: 50% winners / 50% Permapool.",
    requirements: [
      "Must be an image of a horse[s], higher coded.",
      "Must be a single image, not a video or animation.",
      "FORMAT: 11” x 8.5” @ 300 DPI [.png]",
    ],
    deadline: "Thursday January 1st @ 12pm EST",
    announcement: {
      farcaster: "https://farcaster.xyz/higherzip.eth/0x124cc60a",
    },
    entries: [
      {
        user: "@saitamahunter",
        platform: "Farcaster",
        link: "https://farcaster.xyz/saitamahunter/0xeaa7f4e8",
        winner: false,
      },
      {
        user: "@jahkay",
        platform: "Farcaster",
        link: "https://farcaster.xyz/jahkay/0x385175c5",
        winner: false,
      },
      {
        user: "@ibnushop",
        platform: "Farcaster",
        link: "https://farcaster.xyz/ibnushop/0xd04daba0",
        winner: false,
      },
      {
        user: "@ibnushop",
        platform: "Farcaster",
        link: "https://farcaster.xyz/ibnushop/0x4e24aec0",
        winner: false,
      },
      {
        user: "@nfthreat.eth",
        platform: "Farcaster",
        link: "https://farcaster.xyz/nfthreat.eth/0x2ff7dcde",
        winner: true,
      },
      {
        user: "@know",
        platform: "Farcaster",
        link: "https://farcaster.xyz/know/0xab5cc52e",
        winner: false,
      },
      {
        user: "@know",
        platform: "Farcaster",
        link: "https://farcaster.xyz/know/0xf8ad7100",
        winner: false,
      },
      {
        user: "@know",
        platform: "Farcaster",
        link: "https://farcaster.xyz/know/0x3ac40489",
        winner: false,
      },
      {
        user: "@know",
        platform: "Farcaster",
        link: "https://farcaster.xyz/know/0xaa80f5e8",
        winner: true,
      },
      {
        user: "@anzeel",
        platform: "Farcaster",
        link: "https://farcaster.xyz/anzeel/0xda2d349f",
        winner: false,
      },
      {
        user: "@anzeel",
        platform: "Farcaster",
        link: "https://farcaster.xyz/anzeel/0xcc6e7b70",
        winner: false,
      },
      {
        user: "@agrimony.eth",
        platform: "Farcaster",
        link: "https://farcaster.xyz/agrimony.eth/0x9bf64559",
        winner: false,
      },
      {
        user: "@agrimony.eth",
        platform: "Farcaster",
        link: "https://farcaster.xyz/agrimony.eth/0xbc845fc8",
        winner: false,
      },
      {
        user: "@clfx.eth",
        platform: "Farcaster",
        link: "https://farcaster.xyz/clfx.eth/0x1db9681a",
        winner: false,
      },
      {
        user: "@clfx.eth",
        platform: "Farcaster",
        link: "https://farcaster.xyz/clfx.eth/0xdb2b7102",
        winner: false,
      },
      {
        user: "@clfx.eth",
        platform: "Farcaster",
        link: "https://farcaster.xyz/clfx.eth/0xe866b519",
        winner: false,
      },
      {
        user: "@khaleed26",
        platform: "Farcaster",
        link: "https://farcaster.xyz/khaleed26/0xa3eb4680",
        winner: false,
      },
      {
        user: "@aumijin",
        platform: "Farcaster",
        link: "https://farcaster.xyz/aumijin/0x641117b1",
        winner: true,
      },
      {
        user: "@edyhoky87",
        platform: "Farcaster",
        link: "https://farcaster.xyz/edyhoky87/0xb04d81de",
        winner: false,
      },
      {
        user: "@edyhoky87",
        platform: "Farcaster",
        link: "https://farcaster.xyz/edyhoky87/0xc5cca60a",
        winner: false,
      },
      {
        user: "@kyaakkk",
        platform: "Farcaster",
        link: "https://farcaster.xyz/kyaakkk/0x9bb50a5a",
        winner: false,
      },
      {
        user: "@kyaakkk",
        platform: "Farcaster",
        link: "https://farcaster.xyz/kyaakkk/0x6f4211f6",
        winner: false,
      },
      {
        user: "@kyaakkk",
        platform: "Farcaster",
        link: "https://farcaster.xyz/kyaakkk/0xaa5f8f71",
        winner: false,
      },
      {
        user: "@kyaakkk",
        platform: "Farcaster",
        link: "https://farcaster.xyz/kyaakkk/0x0e0c5dc2",
        winner: false,
      },
      {
        user: "@kyaakkk",
        platform: "Farcaster",
        link: "https://farcaster.xyz/kyaakkk/0x50375997",
        winner: false,
      },
      {
        user: "@diablo404",
        platform: "Farcaster",
        link: "https://farcaster.xyz/diablo404/0x59248f3f",
        winner: false,
      },
      {
        user: "@cactuslockwood",
        platform: "Farcaster",
        link: "https://farcaster.xyz/cactuslockwood/0xaa9dc9f5",
        winner: true,
      },
      {
        user: "@cactuslockwood",
        platform: "Farcaster",
        link: "https://farcaster.xyz/cactuslockwood/0xd4f32b91",
        winner: true,
      },
      {
        user: "@cactuslockwood",
        platform: "Farcaster",
        link: "https://farcaster.xyz/cactuslockwood/0x8d395704",
        winner: true,
      },
      {
        user: "@madlog1c.eth",
        platform: "Farcaster",
        link: "https://farcaster.xyz/madlog1c.eth/0xaed11b5f",
        winner: false,
      },
      {
        user: "@shamkangenwd",
        platform: "Farcaster",
        link: "https://farcaster.xyz/shamkangenwd/0xe6e87470",
        winner: false,
      },
      {
        user: "@speis.base.eth",
        platform: "Farcaster",
        link: "https://farcaster.xyz/speis.base.eth/0x6b4595ac",
        winner: false,
      },
      {
        user: "@kimken",
        platform: "Farcaster",
        link: "https://farcaster.xyz/kimken/0x2d34fc29",
        winner: false,
      },
      {
        user: "@h2-10",
        platform: "Farcaster",
        link: "https://farcaster.xyz/h2-10/0x1bdfe316",
        winner: false,
      },
      {
        user: "@elhazard",
        platform: "Farcaster",
        link: "https://farcaster.xyz/elhazard/0x17fcaa63",
        winner: false,
      },
      {
        user: "@siyana",
        platform: "Farcaster",
        link: "https://farcaster.xyz/siyana/0x50556a8e",
        winner: false,
      },
      {
        user: "@blankspace",
        platform: "Farcaster",
        link: "https://farcaster.xyz/blankspace/0x1d1fc699",
        winner: true,
      },
      {
        user: "@bonledok",
        platform: "Farcaster",
        link: "https://farcaster.xyz/bonledok/0x84a2dcbe",
        winner: false,
      },
      {
        user: "@catra",
        platform: "Farcaster",
        link: "https://farcaster.xyz/catra.eth/0x935dfe4f",
        winner: false,
      },
      {
        user: "@catra",
        platform: "Farcaster",
        link: "https://farcaster.xyz/catra.eth/0xbdd936fa",
        winner: false,
      },
      {
        user: "@catra",
        platform: "Farcaster",
        link: "https://farcaster.xyz/catra.eth/0x862e787f",
        winner: false,
      },
      {
        user: "@catra",
        platform: "Farcaster",
        link: "https://farcaster.xyz/catra.eth/0xf5f0a18d",
        winner: false,
      },
      {
        user: "@catra",
        platform: "Farcaster",
        link: "https://farcaster.xyz/catra.eth/0x1d09e9b0",
        winner: false,
      },
      {
        user: "@catra",
        platform: "Farcaster",
        link: "https://farcaster.xyz/catra.eth/0xe047293e",
        winner: true,
      },
      {
        user: "@catra",
        platform: "Farcaster",
        link: "https://farcaster.xyz/catra.eth/0x27b45a1e",
        winner: false,
      },
      {
        user: "@ethra",
        platform: "Farcaster",
        link: "https://farcaster.xyz/ethra/0xdcf1fc6e",
        winner: false,
      },
      {
        user: "@ethra",
        platform: "Farcaster",
        link: "https://farcaster.xyz/ethra/0x00157576",
        winner: false,
      },
      {
        user: "@infiniteorb",
        platform: "Farcaster",
        link: "https://farcaster.xyz/infiniteorb/0x2e372cfe",
        winner: true,
      },
      {
        user: "@caaty",
        platform: "Farcaster",
        link: "https://farcaster.xyz/caaty/0xb9b6a758",
        winner: false,
      },
      {
        user: "@caaty",
        platform: "Farcaster",
        link: "https://farcaster.xyz/caaty/0x6adcbfa8",
        winner: false,
      },
      {
        user: "@lonerk1d",
        platform: "Farcaster",
        link: "https://farcaster.xyz/lonerk1d/0x99eac193",
        winner: false,
      },
      {
        user: "@lonerk1d",
        platform: "Farcaster",
        link: "https://farcaster.xyz/lonerk1d/0x9e90a28c",
        winner: false,
      },
      {
        user: "@kugusha.eth",
        platform: "Farcaster",
        link: "https://farcaster.xyz/kugusha.eth/0xa046122d",
        winner: false,
      },
      {
        user: "@swim",
        platform: "Farcaster",
        link: "https://farcaster.xyz/swim/0xcab5f7c1",
        winner: false,
      },
      {
        user: "@dnznjuan",
        platform: "Farcaster",
        link: "https://farcaster.xyz/dnznjuan/0x9dcd2de8",
        winner: false,
      },
      {
        user: "@yoogio",
        platform: "Farcaster",
        link: "https://farcaster.xyz/yoogio/0xaf99abd1",
        winner: false,
      },
      {
        user: "@naminaaa",
        platform: "Farcaster",
        link: "https://farcaster.xyz/naminaaa/0x776b81dd",
        winner: false,
      },
      {
        user: "@dnznjuan",
        platform: "Farcaster",
        link: "https://farcaster.xyz/dnznjuan/0x9dcd2de8",
        winner: true,
      },
      {
        user: "@apiip",
        platform: "Farcaster",
        link: "https://farcaster.xyz/apiip/0x1f0e3e44",
        winner: false,
      },
      {
        user: "@fremondoteth",
        platform: "X",
        link: "https://x.com/freymondoteth/status/2007419844506071069?s=20",
        winner: false,
      },
      {
        user: "@0xAllenJ",
        platform: "X",
        link: "https://x.com/0xAllenJ/status/2005860163282997585?s=20",
        winner: false,
      },
      {
        user: "@0xAllenJ",
        platform: "X",
        link: "https://x.com/0xAllenJ/status/2005482431638364476?s=20",
        winner: false,
      },
      {
        user: "@ranxdeer",
        platform: "X",
        link: "https://x.com/ranxdeer/status/2009305245080228060?s=20",
        winner: true,
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
