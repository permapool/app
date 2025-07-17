import React from "react";
import { ChromeButton } from "./ChromeButton";
import ClickerTooltip from "./ClickerTooltip";

type ClickerProps = {
  togglePermapool: () => void;
  toggleSquad: () => void;
  toggleProposals: () => void;
  toggleManifesto: () => void;

  switchChannel: () => void;
  switchChannelDown: () => void;

  isMuted: boolean;
  toggleMute: () => void;
};

const Clicker: React.FC<ClickerProps> = ({
  togglePermapool,
  toggleSquad,
  toggleProposals,
  toggleManifesto,
  switchChannel,
  switchChannelDown,

  isMuted,
  toggleMute,
}) => {
  return (
    <div className="flex space-x-4 p-4 fixed bottom-10 right-[50%] translate-x-1/2 max-w-full w-full sm:right-0 sm:translate-x-0">
      {/* Channel Cluster */}
      <div className="flex flex-col space-y-4 ">
        <div className="flex flex-col gap-1">
          <ChromeButton onClick={switchChannel} className="h-[50%]">
            <span className="small-font">↑↑↑</span>
          </ChromeButton>
          <ChromeButton onClick={switchChannelDown} className="h-[50%]">
            <span className="flex flex-row small-font text-black">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.646 2.146a.5.5 0 0 1 .708 0c.531.532 1.804 2.064 2.946 3.903c1.13 1.82 2.2 4.05 2.2 5.951c0 1.844-.528 3.352-1.51 4.404C13.007 17.459 11.616 18 10 18c-1.615 0-3.006-.541-3.99-1.596C5.027 15.352 4.5 13.844 4.5 12c0-1.902 1.07-4.13 2.2-5.951c1.142-1.84 2.415-3.37 2.946-3.903Z" />
              </svg>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.646 2.146a.5.5 0 0 1 .708 0c.531.532 1.804 2.064 2.946 3.903c1.13 1.82 2.2 4.05 2.2 5.951c0 1.844-.528 3.352-1.51 4.404C13.007 17.459 11.616 18 10 18c-1.615 0-3.006-.541-3.99-1.596C5.027 15.352 4.5 13.844 4.5 12c0-1.902 1.07-4.13 2.2-5.951c1.142-1.84 2.415-3.37 2.946-3.903Z" />
              </svg>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.646 2.146a.5.5 0 0 1 .708 0c.531.532 1.804 2.064 2.946 3.903c1.13 1.82 2.2 4.05 2.2 5.951c0 1.844-.528 3.352-1.51 4.404C13.007 17.459 11.616 18 10 18c-1.615 0-3.006-.541-3.99-1.596C5.027 15.352 4.5 13.844 4.5 12c0-1.902 1.07-4.13 2.2-5.951c1.142-1.84 2.415-3.37 2.946-3.903Z" />
              </svg>
            </span>
          </ChromeButton>
        </div>
      </div>

      {/* Action Cluster */}
      <div className="flex flex-row space-x-4">
        <ClickerTooltip content="Permapool">
          <ChromeButton onClick={togglePermapool}>$$$</ChromeButton>
        </ClickerTooltip>
        <ClickerTooltip content="Proposals">
          <ChromeButton onClick={toggleProposals}>¶¶¶</ChromeButton>
        </ClickerTooltip>
        <ClickerTooltip content="Squad">
          <ChromeButton onClick={toggleSquad}>§§§</ChromeButton>
        </ClickerTooltip>
        <ClickerTooltip content="Manifesto">
          <ChromeButton onClick={toggleManifesto}>¿¿¿</ChromeButton>
        </ClickerTooltip>
        <ClickerTooltip content="Mute">
          <ChromeButton onClick={toggleMute} className="h-[50%]">
            {isMuted ? "≃" : "≄"}
          </ChromeButton>
        </ClickerTooltip>
      </div>
    </div>
  );
};

export default Clicker;
