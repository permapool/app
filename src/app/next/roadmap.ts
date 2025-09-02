export type Status =
  | "Backlog"
  | "Pilot"
  | "Scheduled"
  | "In Production"
  | "Now Airing"
  | "On Hold";

export type RoadmapItem = {
  date: string;
  description: string;
  status: Status;
};

export type RoadmapPhase = {
  phase: string;
  items: RoadmapItem[];
};

export const roadmap: RoadmapPhase[] = [
  {
    phase: "User Interface",
    items: [
      {
        date: "AUG 21 2025",
        description: "Refine font hierarchy for better readability",
        status: "In Production",
      },
      {
        date: "AUG 21 2025",
        description:
          "Improve nav bar behavior: repopulate on click, drag to top 30%, timed hide (3s) with reappear on mouse move; mobile = tap/scroll",
        status: "Scheduled",
      },
      {
        date: "AUG 21 2025",
        description: "Move Clicker to bottom; hover to reveal",
        status: "Scheduled",
      },
      {
        date: "AUG 21 2025",
        description: "Clicker channel up/down as “CH” (channel) control",
        status: "Now Airing",
      },
      {
        date: "AUG 21 2025",
        description: "Clicker rename pop-out tab from ‘…’ to Clicker",
        status: "Now Airing",
      },
      {
        date: "AUG 21 2025",
        description:
          "Adjust navigation — replace permapool/manifesto stacking with singular window system",
        status: "Now Airing",
      },
      {
        date: "AUG 21 2025",
        description: "Add channel animation between frames",
        status: "Backlog",
      },
      {
        date: "AUG 21 2025",
        description: "Add channel marker in top right corner (optional)",
        status: "Backlog",
      },
      {
        date: "AUG 21 2025",
        description: "Add fade in/out animation for navigation disappearing",
        status: "Backlog",
      },
      {
        date: "AUG 30 2025",
        description: "Toast notifications",
        status: "Backlog",
      },
      {
        date: "AUG 30 2025",
        description: "Donation confirmation receipt",
        status: "Now Airing",
      },
      {
        date: "SEP 02 2025",
        description: "Ticker notifications, ticker announcments, ticker information",
        status: "Backlog",
      },
    ],
  },
  {
    phase: "Streamer & Viewer Features",
    items: [
      {
        date: "AUG 21 2025",
        description:
          "Write roadmap doc for global chat, tipping streamers, and paid viewing",
        status: "Pilot",
      },
      {
        date: "AUG 21 2025",
        description:
          "Add streamer benefit mechanic: ‘a buy for higher is a buy for the creator streaming’",
        status: "Pilot",
      },
      {
        date: "AUG 21 2025",
        description:
          "Explore volume bot viewers: tiny $0.01 txns rewarded in $HIGHER for watching (dexscreener-style parabolic txns)",
        status: "Pilot",
      },
      {
        date: "AUG 30 2025",
        description: "token tipping in chat",
        status: "Backlog",
      },
      {
        date: "AUG 30 2025",
        description: "airdrops to live viewers",
        status: "Backlog",
      },
    ],
  },
  {
    phase: "Community & Rewards",
    items: [
      {
        date: "AUG 30 2025",
        description:
          'HZ MISSIONS page that shows all active higher rewards opportunities',
        status: "Backlog",
      },
      {
        date: "AUG 30 2025",
        description:
          "Record how HIGHER has been used over time on some page somewhere",
        status: "Backlog",
      },
    ],
  },
  {
    phase: "Merch & Store",
    items: [
      {
        date: "AUG 30 2025",
        description:
          "HZ SHOP page (HZ and HZ x collab merch + more)",
        status: "Backlog",
      },
    ],
  },
  {
    phase: "Integrations",
    items: [
      {
        date: "AUG 21 2025",
        description:
          "Pull in YouTube metadata (title, description, thumbnail) for livestreams",
        status: "Scheduled",
      },
      {
        date: "AUG 21 2025",
        description:
          "Add Trenches button that links directly to livestream + chat",
        status: "Scheduled",
      },
    ],
  },
];
