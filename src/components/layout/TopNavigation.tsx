import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const TopNavigation = () => {
  return (
    <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6">
      
      {/* Logo */}
      <div className="flex items-center space-x-4">
        <img
          src="/Techwell.png"
          alt="Techwell Logo"
          className="h-8 w-auto object-contain brightness-0"
        />
      </div>

      {/* Right Section - Only Avatar */}
      <div className="flex items-center space-x-3">
        <Avatar className="w-8 h-8 border border-zinc-200">
          <AvatarImage src="" alt="User" />
          <AvatarFallback className="bg-black text-white text-xs font-bold">
            UT
          </AvatarFallback>
        </Avatar>
        <div className="hidden md:block">
          <p className="text-sm font-semibold text-black">Utham</p>
        </div>
      </div>
    </header>
  );
};

export default TopNavigation;
