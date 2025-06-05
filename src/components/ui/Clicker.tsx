import React from "react";

type ClickerProps = {
  togglePermapool: () => void;
  toggleSquad: () => void;
  toggleProposals: () => void;
};

const Clicker: React.FC<ClickerProps> = ({
  togglePermapool,
  toggleSquad,
  toggleProposals,
}) => {
  const switchChannel = () => {};
  const toggleInfo = () => {};

  return (
    <div className="flex space-x-4 p-4 fixed top-20 right-5">
      {/* Left Cluster */}
      <div className="flex flex-col space-y-4">
        <button
          onClick={togglePermapool}
          className="bg-green p-2 shadow hover:bg-yellow-200"
        >
          <span className="small-font">$$$</span>
        </button>
        <button
          onClick={toggleProposals}
          className="bg-green p-2 shadow hover:bg-yellow-200"
        >
          ¶¶¶
        </button>
        <button
          onClick={toggleSquad}
          className="bg-green p-2 shadow hover:bg-yellow-200"
        >
          ^^^
        </button>
      </div>

      {/* Right Cluster */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col">
          <button
            onClick={() => switchChannel()}
            className="bg-green p-2 shadow hover:bg-yellow-200"
          >
            <span className="small-font">↑↑↑</span>
          </button>
          <button
            onClick={() => switchChannel()}
            className="bg-green p-2 shadow hover:bg-yellow-200"
          >
            <span className="small-font">●●●</span>
          </button>
        </div>
        <button
          onClick={toggleInfo}
          className="bg-green p-2 shadow hover:bg-yellow-200"
        >
          ¿¿¿
        </button>
      </div>
    </div>
  );
};

export default Clicker;
