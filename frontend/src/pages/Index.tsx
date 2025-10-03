import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import HeroSection from "@/components/HeroSection";
import ServerList from "@/components/ServerList";
import LanguageToggle from "@/components/LanguageToggle";
import { useTranslation } from "@/hooks/useTranslation";
const Index = () => {
  const {
    t
  } = useTranslation();
  return <div className="min-h-screen bg-gradient-hero">
      {/* Navigation Header */}
      <header className="border-b border-primary/20 bg-gaming-surface/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hover:scale-105 transition-transform">
                🏄‍♂️ {t("index.title")}
              </Link>
              <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-500/10 animate-pulse">
                🟢 {t("common.online")}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <Link to="/leaderboards">
                <Button variant="outline" size="sm" className="border-secondary/50 hover:bg-secondary/10">
                  🏆 {t("common.leaderboards")}
                </Button>
              </Link>
              <Link to="/maps">
                <Button variant="outline" size="sm" className="border-secondary/50 hover:bg-secondary/10">
                  🗺️ {t("maps.title")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection />

      {/* Server Browser Section */}
      <section id="server-browser" className="max-w-7xl mx-auto px-6 py-16 scroll-mt-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("index.sectionTitle")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("index.sectionDesc")}
          </p>
        </div>
        
        <ServerList />
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("index.featuresTitle")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("index.featuresDesc")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="bg-gradient-card border-primary/20 shadow-card hover:shadow-glow transition-all duration-300 animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                🏆 {t("index.competitiveTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("index.realTimeDesc")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-primary/20 shadow-card hover:shadow-glow transition-all duration-300 animate-scale-in [animation-delay:100ms]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                🚀 {t("index.performanceTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("index.performanceDesc")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-primary/20 shadow-card hover:shadow-glow transition-all duration-300 animate-scale-in [animation-delay:200ms]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                👥 {t("index.communityTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("index.communityDesc")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-primary/20 shadow-card hover:shadow-glow transition-all duration-300 animate-scale-in [animation-delay:300ms]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                📊 {t("index.statsTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("index.comprehensiveDesc")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-primary/20 shadow-card hover:shadow-glow transition-all duration-300 animate-scale-in [animation-delay:400ms]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                🗺️ {t("index.mapsTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("index.mapsDesc")}
              </p>
            </CardContent>
          </Card>

        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <div className="bg-gradient-card border border-primary/20 rounded-lg p-8 shadow-card">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("index.ctaTitle")}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t("index.ctaDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/leaderboards">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                🏆 {t("index.viewLeaderboards")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

    <footer className="border-t border-primary/20 bg-gaming-surface/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">
            © 2025 poor-webpanel by bnt0p. OpenSource app Built for the surfing community. <br></br>Check the repo! <a href="https://github.com/bnt0p/st-poor-webpanel" target="_blank">https://github.com/bnt0p/st-poor-webpanel</a>
          </p>
        </div>
      </div>
    </footer>
    </div>;
};
export default Index;
