import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

const HeroSection = () => {
  const { t } = useTranslation();
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--gaming-glow)_0%,_transparent_50%)] opacity-20"></div>
      <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_50%_50%,_var(--gaming-blue)_0deg,_var(--gaming-orange)_180deg,_var(--gaming-blue)_360deg)] opacity-10"></div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent animate-float">
          {t("hero.title")}
        </h1>
        
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-8 text-foreground/90">
          {t("hero.subtitle")}
        </h2>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
          {t("hero.description")}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/leaderboards">
            <Button 
              size="lg" 
              className="px-8 py-6 text-lg font-semibold bg-gradient-primary hover:shadow-glow transition-all duration-300 hover:scale-105"
            >
              🏆 {t("hero.viewLeaderboards")}
            </Button>
          </Link>
          
          <Button 
            onClick={() => {
              const element = document.getElementById('server-browser');
              if (element) {
                element.scrollIntoView({ 
                  behavior: 'smooth',
                  block: 'start'
                });
              }
            }}
            variant="outline" 
            size="lg" 
            className="px-8 py-6 text-lg font-semibold border-secondary/50 hover:bg-secondary/10 hover:border-secondary transition-all duration-300 hover:scale-105 group"
          >
            🖥️ {t("hero.browseServers")}
            <span className="ml-2 group-hover:translate-y-[-2px] transition-transform duration-200">↓</span>
          </Button>
          
        </div>
        
      </div>
    </section>
  );
};

export default HeroSection;
