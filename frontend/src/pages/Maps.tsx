import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import LanguageToggle from "@/components/LanguageToggle";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MapData {
  name: string;
  tier: string;
  bonus: number;
  style: string;
}

const MAPS_PER_PAGE = 12;

const fetchMaps = async (): Promise<MapData[]> => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/surf/maps/list`);
  if (!response.ok) throw new Error("Failed to fetch maps");
  const data = await response.json();
  return data.maps;
};

const Maps = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: maps = [], isLoading, error } = useQuery({
    queryKey: ["maps"],
    queryFn: fetchMaps,
  });

  const filteredMaps = maps.filter((map) =>
    map.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredMaps.length / MAPS_PER_PAGE);
  const startIndex = (currentPage - 1) * MAPS_PER_PAGE;
  const endIndex = startIndex + MAPS_PER_PAGE;
  const currentMaps = filteredMaps.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const getMapImageUrl = (mapName: string) => {
    return `https://raw.githubusercontent.com/bnt0p/MapPictures/refs/heads/main/pics/${mapName}.jpg`;
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation Header */}
      <header className="border-b border-primary/20 bg-gaming-surface/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hover:scale-105 transition-transform">
                🏄‍♂️ {t("index.title")}
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <Link to="/">
                <Button variant="outline" size="sm" className="border-primary/50 hover:bg-primary/10">
                  🏠 {t("common.home")}
                </Button>
              </Link>
              <Link to="/leaderboards">
                <Button variant="outline" size="sm" className="border-secondary/50 hover:bg-secondary/10">
                  🏆 {t("common.leaderboards")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            🗺️ {t("maps.title")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("maps.subtitle")}
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <Input
            placeholder={t("maps.searchMaps")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Maps Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="bg-gradient-card border-primary/20">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">{t("common.error")}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentMaps.map((map) => (
                <Card key={map.name} className="bg-gradient-card border-primary/20 shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105 overflow-hidden">
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={getMapImageUrl(map.name)}
                      alt={map.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-foreground flex items-center gap-2 text-sm">
                      🗺️ {map.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        Tier: {map.tier}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {map.style}
                      </Badge>
                      {map.bonus > 0 && (
                        <Badge variant="outline" className="text-xs text-green-400">
                          {map.bonus} bonus
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Link to={`/maps/${encodeURIComponent(map.name)}`}>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        {t("maps.viewRecords")}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({filteredMaps.length} maps total)
                  </span>
                </div>

                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    <footer className="border-t border-primary/20 bg-gaming-surface/50 backdrop-blur-sm">
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="text-center">
        <p className="text-muted-foreground">
          © 2025 poor-webpanel by bnt0p. OpenSource app Built for the surfing community. <br></br>Check the repo :)<a href="https://github.com/bnt0p/st-poor-webpanel" target="_blank">https://github.com/bnt0p/st-poor-webpanel</a>
        </p>
      </div>
    </div>
  </footer>
    </div>
  );
};

export default Maps;
