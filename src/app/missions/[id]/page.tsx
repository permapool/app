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
      { user: "@esdotge", platform: "Farcaster", link: "https://farcaster.xyz/esdotge/0x1c06cb22" },
      { user: "@willdias", platform: "Farcaster", link: "https://farcaster.xyz/willdias/0xc4cabdae" },
      { user: "@cactuslockwood", platform: "Farcaster", link: "https://farcaster.xyz/cactuslockwood/0xf70fc8d3" },
      { user: "@catra", platform: "Farcaster", link: "https://farcaster.xyz/catra/0x0aa9fc7f" },
      { user: "@anacarolina.eth", platform: "Farcaster", link: "https://farcaster.xyz/anacarolina.eth/0xe448ee31" },
      { user: "@willdias", platform: "Farcaster", link: "https://farcaster.xyz/willdias/0x201733cb" },
      { user: "@catra", platform: "Farcaster", link: "https://farcaster.xyz/catra/0x5704bfba" },
      { user: "@aumijin", platform: "Farcaster", link: "https://farcaster.xyz/aumijin/0x08f57269" },
      { user: "@asha", platform: "Farcaster", link: "https://farcaster.xyz/asha/0x520075ed" },
      { user: "@dwwmitry", platform: "Farcaster", link: "https://farcaster.xyz/dwwmitry/0x226699b7" },
      { user: "@pedrovilela", platform: "Farcaster", link: "https://farcaster.xyz/pedrovilela.eth/0x092b9060" },
      { user: "@leorex_eth", platform: "X", link: "https://x.com/leorex_eth/status/1973413880928842044" },
      { user: "@know", platform: "Farcaster", link: "https://farcaster.xyz/know/0x514b4213" },
      { user: "@genuinejack", platform: "Farcaster", link: "https://farcaster.xyz/genuinejack/0xe2468d3b" },
      { user: "@papa", platform: "Farcaster", link: "https://farcaster.xyz/papa/0x07302f80" },
      { user: "@juli", platform: "Farcaster", link: "https://farcaster.xyz/juli/0x99b54e56" },
      { user: "@denzooo", platform: "Farcaster", link: "https://farcaster.xyz/denzooo/0xe7f7185f" },
      { user: "@coinempress", platform: "Farcaster", link: "https://farcaster.xyz/coinempress/0xdd1ee984" },
      { user: "@thatweb3guy", platform: "Farcaster", link: "https://farcaster.xyz/thatweb3guy/0x0543331d" },
      { user: "@gabeeinhorn", platform: "Farcaster", link: "https://farcaster.xyz/gabeeinhorn/0xb2b5ea84" },
      { user: "@joseacabrerav", platform: "Farcaster", link: "https://farcaster.xyz/joseacabrerav/0x31a7d8a0" },
      { user: "@Jkg_eth", platform: "X", link: "https://x.com/jkg_eth/status/1971068315226550531" },
    ],
  },
  hz002: {
    title: "HZ002 · ?????????????",
    mission: "????????????????????",
    rewards: "???????????",
    requirements: ["?????????", "?????????", "?????????", "?????????"],
    deadline: "????????????????????",
    announcement: null,
    entries: [],
  },
  hz003: {
    title: "HZ003 · ????????????",
    mission: "????????????????????",
    rewards: "???????????",
    requirements: ["?????????", "?????????", "?????????", "?????????"],
    deadline: "????????????????????",
    announcement: null,
    entries: [],
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
