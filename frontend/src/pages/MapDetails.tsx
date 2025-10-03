import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LanguageToggle from "@/components/LanguageToggle";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery } from "@tanstack/react-query";

interface MapRecord {
  SteamID: string;
  PlayerName: string;
  TimerTicks: number;
  FormattedTime: string;
  UnixStamp: number;
  Position: number;
  Mode: string;
  Style: number;
}

interface Avatar {
  avatar_url: string;
}

const fetchMapRecords = async (mapName: string, track: string, mode: string): Promise<MapRecord[]> => {
  if (!mapName || !track || !mode) return [];
  
  let apiUrl = `${import.meta.env.VITE_API_URL}/surf/top-map/${mapName}`;
  
  // Add bonus parameter if track is not main
  if (track !== "main") {
    const bonusNumber = track.replace("bonus", "");
    apiUrl += `?bonus=${bonusNumber}`;
  }
  
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch map records");
  }
  const data = await response.json();
  
  // Filter records based on mode and ensure we have proper positions
  const filteredRecords = data.records
    ? data.records
        .filter((record: any) => record.Mode === mode)
        .map((record: any, index: number) => ({
          ...record,
          Position: index + 1
        }))
        .slice(0, 10) // Ensure we get exactly 10 records
    : [];
  
  return filteredRecords;
};

const fetchAvatar = async (steamId: string): Promise<Avatar> => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/avatar/${steamId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch avatar");
  }
  return response.json();
};

const MapDetails = () => {
  const { t } = useTranslation();
  const { mapName } = useParams<{ mapName: string }>();
  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedMode, setSelectedMode] = useState("");

  const decodedMapName = mapName ? decodeURIComponent(mapName) : "";

  const { data: records = [], isLoading, error } = useQuery({
    queryKey: ["mapRecords", decodedMapName, selectedTrack, selectedMode],
    queryFn: () => fetchMapRecords(decodedMapName, selectedTrack, selectedMode),
    enabled: !!decodedMapName && !!selectedTrack && !!selectedMode,
  });

  // Set default values
  useEffect(() => {
    if (!selectedTrack) setSelectedTrack("main");
    if (!selectedMode) setSelectedMode("Standard");
  }, [selectedTrack, selectedMode]);

  const formatDate = (unixStamp: number) => {
    return new Date(unixStamp * 1000).toLocaleDateString();
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/maps">
              <Button variant="ghost" size="sm">
                ← {t("common.backToHome")}
              </Button>
            </Link>
          </div>
          
          <h1 className="text-4xl font-bold text-foreground mb-2">
            🗺️ {decodedMapName}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("mapDetails.title")}
          </p>
        </div>

        {/* Map Image */}
        <div className="mb-8">
          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-lg">
            <img
              src={getMapImageUrl(decodedMapName)}
              alt={decodedMapName}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder.svg";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4">
              <h2 className="text-2xl font-bold text-white">{decodedMapName}</h2>
            </div>
          </div>
        </div>

        {/* Selection Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Select value={selectedTrack} onValueChange={setSelectedTrack}>
              <SelectTrigger>
                <SelectValue placeholder={t("mapDetails.selectTrack")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">{t("mapDetails.mainTrack")}</SelectItem>
                <SelectItem value="bonus1">Bonus 1</SelectItem>
                <SelectItem value="bonus2">Bonus 2</SelectItem>
                <SelectItem value="bonus3">Bonus 3</SelectItem>
                <SelectItem value="bonus4">Bonus 4</SelectItem>
                <SelectItem value="bonus5">Bonus 5</SelectItem>
                <SelectItem value="bonus6">Bonus 6</SelectItem>
                <SelectItem value="bonus7">Bonus 7</SelectItem>
                <SelectItem value="bonus8">Bonus 8</SelectItem>
                <SelectItem value="bonus9">Bonus 9</SelectItem>
                <SelectItem value="bonus10">Bonus 10</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <Select value={selectedMode} onValueChange={setSelectedMode}>
              <SelectTrigger>
                <SelectValue placeholder={t("mapDetails.selectMode")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Standard">{t("mapDetails.standard")}</SelectItem>
                <SelectItem value="85t">85t</SelectItem>
                <SelectItem value="102t">102t</SelectItem>
                <SelectItem value="128t">128t</SelectItem>
                <SelectItem value="Source">Source</SelectItem>
                <SelectItem value="Bhop">Bhop</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Records Table */}
        <Card className="bg-gradient-card border-primary/20 shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">
              {t("mapDetails.title")} - {decodedMapName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">{t("common.error")}</p>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">{t("mapDetails.noRecordsFound")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("mapDetails.position")}</TableHead>
                    <TableHead>{t("mapDetails.player")}</TableHead>
                    <TableHead>{t("mapDetails.time")}</TableHead>
                    <TableHead>{t("mapDetails.date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record, index) => (
                    <TableRow key={`${record.SteamID}-${index}`} className="hover:bg-muted/50">
                      <TableCell className="font-medium">#{record.Position}</TableCell>
                      <TableCell>
                        <Link 
                          to={`/profile/${record.SteamID}`}
                          className="flex items-center gap-3 hover:text-primary transition-colors"
                        >
                          <AvatarImage steamId={record.SteamID} />
                          <span className="hover:underline">{record.PlayerName}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-primary">
                        {record.FormattedTime}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(record.UnixStamp)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
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

// Avatar component with loading state
const AvatarImage = ({ steamId }: { steamId: string }) => {
  const { data: avatar } = useQuery({
    queryKey: ["avatar", steamId],
    queryFn: () => fetchAvatar(steamId),
  });

  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
      {avatar ? (
        <img 
          src={avatar.avatar_url} 
          alt="Player avatar" 
          className="w-full h-full object-cover"
        />
      ) : (
        <Skeleton className="w-full h-full rounded-full" />
      )}
    </div>
  );
};

export default MapDetails;
