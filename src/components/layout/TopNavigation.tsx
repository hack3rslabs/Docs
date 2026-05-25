import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopNavigationProps {
  onMenuClick: () => void;
}

const TopNavigation = ({ onMenuClick }: TopNavigationProps) => {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-zinc-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-50">
      
      {/* Left: Mobile Menu & Logo */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-zinc-600 hover:bg-zinc-100 transition-colors" 
          onClick={onMenuClick}
        >
          <Menu className="w-6 h-6" />
        </Button>
        
        <div className="flex items-center">
          <img
            src="/Techwell.png"
            alt="Techwell Logo"
            className="h-7 w-auto object-contain brightness-0"
          />
        </div>
      </div>

      {/* Right Section: User Profile */}
      <div className="flex items-center gap-3 bg-zinc-50 px-3 py-1.5 rounded-full border border-zinc-200 shadow-sm">
        <div className="hidden sm:block text-right">
          <p className="text-xs font-bold text-zinc-900 leading-tight">Uttam</p>
          <p className="text-[10px] text-zinc-500 font-medium">Administrator</p>
        </div>
        <Avatar className="w-8 h-8 border-2 border-white shadow-sm">
          <AvatarImage src="" alt="User" />
          <AvatarFallback className="bg-blue-600 text-white text-[10px] font-black">
            UT
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};

export default TopNavigation;
