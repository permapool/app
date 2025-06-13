import { ConnectKitButton } from "connectkit";

export const StyledConnectKitButton = () => {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, truncatedAddress, ensName }) => {
        return (
          <button
            type="button"
            className={`
              relative mx-auto block
              text-sm text-transparent
              py-3 px-6 rounded-full transition-all
              bg-gradient-to-b from-[#D5D8D8] to-[#818C8A]
              shadow-md overflow-hidden
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            onClick={show}
          >
            {/* Glow layer */}
            <span
              className="
                absolute inset-0 rounded-full
                bg-gradient-to-r from-[#5F837D] to-[#ABC9C4]
                opacity-50 blur-md translate-y-1/3
                z-0
              "
            />
            {/* Top chrome shine */}
            <span
              className="
                absolute inset-0 rounded-full
                bg-gradient-to-b from-[#F4F4F4] via-[#565656] to-[#93B3AE]
                opacity-20 mix-blend-screen
                z-10
              "
            />
            {/* Button text or loading spinner */}
            <span className="relative z-20 bg-gradient-to-b from-[#252424] to-[#3C3C3C] bg-clip-text text-transparent font-bold">
              {isConnected ? ensName ?? truncatedAddress : "connect"}
            </span>
          </button>
        );
      }}
    </ConnectKitButton.Custom>
  );
};