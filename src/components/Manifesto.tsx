import React from "react";
import { ChromeButton } from "./ui/ChromeButton";

export default function Manifesto({ onClose }: { onClose: () => void }) {
  return (
    <div className="section-border z-102">
      <h2>Manifesto</h2>
      <p>Higher is a movement.</p>
      <p>
        It is belief in oneself. Belief in one’s work. Belief in the practice of
        aiming higher—every day.
      </p>
      <p>
        Higher moves forward—on trust, momentum, and sustainability. A network
        where ambition carries both autonomy and responsibility, and where
        creative action strengthens the whole.
      </p>
      <p>
        Higher.zip exists to accelerate this movement. To fuel creative and
        economic activity. To reward builders, creators, and contributors who
        move the network forward. To create an ecosystem where new possibilities
        emerge.
      </p>
      <p>
        This is not a passive network. It is one that grows with each person who
        chooses to aim higher.
      </p>

      <p>If that sounds like you: welcome.</p>
      <div className="flex align-left w-[25%]">
        <ChromeButton onClick={onClose}>
          ↑ Learn how Higher.zip works ↑
        </ChromeButton>
      </div>
      <br />
      <div>
        <h3>Follow Us</h3>
        <div className="flex flex-row gap-5">
          <p className="fine-print">
            <a
              href="https://x.com/higheronchain"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                width="50"
                height="50"
                viewBox="0 0 32 32"
                fill="currentColor"
              >
                <path d="M 20 5 L 20 7 L 26 7 L 26 5 L 20 5 z M 26 7 L 26 9 L 30 9 L 30 7 L 26 7 z M 20 7 L 18 7 L 18 9 L 20 9 L 20 7 z M 18 9 L 16 9 L 16 11 L 18 11 L 18 9 z M 16 11 L 9 11 L 9 13 L 16 13 L 16 11 z M 0 10 L 0 14 L 2 14 L 2 18 L 5 18 L 5 22 L 10 22 L 10 20 L 7 20 L 7 18 L 9 18 L 9 16 L 4 16 L 4 14 L 6 14 L 6 12 L 2 12 L 2 10 L 0 10 z M 10 22 L 10 24 L 12 24 L 12 22 L 10 22 z M 10 24 L 5 24 L 5 26 L 10 26 L 10 24 z M 10 26 L 10 28 L 18 28 L 18 26 L 10 26 z M 18 26 L 22 26 L 22 24 L 18 24 L 18 26 z M 22 24 L 24 24 L 24 19 L 22 19 L 22 24 z M 24 19 L 26 19 L 26 15 L 24 15 L 24 19 z M 26 15 L 28 15 L 28 11 L 26 11 L 26 15 z"></path>
              </svg>
              @HigherOnChain
            </a>
          </p>
          <p className="fine-print">
            <a
              href="https://www.youtube.com/@higherhigherhigher"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                width="50"
                height="50"
                viewBox="0 0 32 32"
                fill="currentColor"
              >
                <path d="M 7 6 L 7 8 L 25 8 L 25 6 L 7 6 z M 25 8 L 25 10 L 27 10 L 27 8 L 25 8 z M 27 10 L 27 22 L 29 22 L 29 10 L 27 10 z M 27 22 L 25 22 L 25 24 L 27 24 L 27 22 z M 25 24 L 7 24 L 7 26 L 25 26 L 25 24 z M 7 24 L 7 22 L 5 22 L 5 24 L 7 24 z M 5 22 L 5 10 L 3 10 L 3 22 L 5 22 z M 5 10 L 7 10 L 7 8 L 5 8 L 5 10 z M 13 12 L 13 20 L 15 20 L 15 19 L 17 19 L 17 18 L 19 18 L 19 17 L 21 17 L 21 15 L 19 15 L 19 14 L 17 14 L 17 13 L 15 13 L 15 12 L 13 12 z"></path>
              </svg>
              HigherHigherHigher
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
