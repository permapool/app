import { ConnectKitButton } from "connectkit";

export const StyledConnectKitButton = () => {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, truncatedAddress, ensName }) => {
        return (
          <button
            type="button"
            className="w-full max-w-xs mx-auto block bg-[var(--lghtgrey)] text-black py-2 px-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#7C65C1] hover:bg-[green] hover:text-white mx-2 text-xs uppercase"
            onClick={show}
          >
            {/* Button text or loading spinner */}
            <span className="relative z-20 bg-gradient-to-b from-[#252424] to-[#3C3C3C] bg-clip-text text-transparent hover:text-white">
              {isConnected ? ensName ?? truncatedAddress : "LOGIN"}
            </span>
          </button>
        );
      }}
    </ConnectKitButton.Custom>
  );
};
