import { Card } from "@/components/ui/card";
import welcomeHero from "@/assets/welcome-hero.png";

const WelcomeCard = () => {
  return (
    <Card className="p-6 bg-white shadow-card border-0 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="mb-2">
            <span className="text-muted-foreground text-sm">Welcome Back</span>
          </div>
          <h1 className="text-2xl font-bold text-primary mb-4">Utham</h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Unde hic non 
            repellendus debitis iure, doloremque assumenda. Autem modi, 
            corrupti, nobis ea iure fugiat, veniam non quaerat mollitia animi error 
            corporis.
          </p>
        </div>
        <div className="flex-shrink-0 ml-6">
          <img 
            src={welcomeHero.src} 
            alt="Welcome illustration showing a professional businessman at desk" 
            className="w-48 h-36 object-contain"
          />
        </div>
      </div>
    </Card>
  );
};

export default WelcomeCard;