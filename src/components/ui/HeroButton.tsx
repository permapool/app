interface HeroButtonProps extends React.ButtonHTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    isLoading?: boolean;
  }
  
  export function HeroButton({
    children,
    isLoading = false,
    ...props
  }: HeroButtonProps) {
    return (
      <div
      className="w-full max-w-xs mx-auto block bg-[orange] text-white py-2 px-6 rounded-[50px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#7C65C1] hover:bg-[#6952A3] m-2 text-xs"
        {...props}
      >
        {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            </div>
          ) : (
            children
          )}
      </div>
    );
  }