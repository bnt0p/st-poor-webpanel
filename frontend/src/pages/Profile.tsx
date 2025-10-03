import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Link, useParams } from "react-router-dom";
import LoadingPage from "@/components/LoadingPage";
import LanguageToggle from "@/components/LanguageToggle";
import { useTranslation } from "@/hooks/useTranslation";
import { Search, Loader2 } from "lucide-react";

interface ProfileData {
  steamid: string;
  playername: string;
  global_points: number;
  rank: number;
  total_runs: number;
  recent_maps: Array<{
    MapName: string;
    Mode: string;
    TimerTicks: number;
    FormattedTime: string;
    LastFinished: number;
    Position: number;
  }>;
  records_top: Array<{
    MapName: string;
    Mode: string;
    TimerTicks: number;
    FormattedTime: string;
    LastFinished: number;
    Position: number;
  }>;
}

interface AvatarData {
  steamid: string;
  avatar_url: string;
  cached: boolean;
  stale: boolean;
}

interface MapSearchResult {
  MapName: string;
  SteamID: string;
  PlayerName: string;
  TimerTicks: number;
  FormattedTime: string;
  UnixStamp: number;
  TimesFinished: number;
  LastFinished: number;
  Style: number;
  Mode: string;
}

interface MapSearchResponse {
  count: number;
  records: MapSearchResult[];
  position?: number;
  best_ticks?: number;
  best_formatted?: string;
}

const Profile = () => {
  const { t } = useTranslation();
  const { steamId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [avatarData, setAvatarData] = useState<AvatarData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Map search states
  const [selectedMap, setSelectedMap] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("0");
  const [selectedMode, setSelectedMode] = useState("Standard");
  const [selectedStyle, setSelectedStyle] = useState("0");
  const [mapSearchResults, setMapSearchResults] = useState<MapSearchResult[]>([]);
  const [mapSearchResponse, setMapSearchResponse] = useState<MapSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!steamId) return;
      
      try {
        setIsLoading(true);
        setError(null);

        // Fetch profile data
        const profileResponse = await fetch(`${import.meta.env.VITE_API_URL}/profile/${steamId}`);
        if (!profileResponse.ok) {
          throw new Error('Failed to fetch profile data');
        }
        const profile = await profileResponse.json();
        setProfileData(profile);

        // Fetch avatar data
        const avatarResponse = await fetch(`${import.meta.env.VITE_API_URL}/avatar/${steamId}`);
        if (!avatarResponse.ok) {
          throw new Error('Failed to fetch avatar data');
        }
        const avatar = await avatarResponse.json();
        setAvatarData(avatar);

      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [steamId]);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="bg-gradient-card border-destructive/20 shadow-card max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">😔</div>
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'The requested profile could not be loaded.'}
            </p>
            <Link to="/leaderboards">
              <Button>
                🏆 {t("leaderboards.backToLeaderboard")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const filterMaps = (maps: any[]) => {
    if (!searchQuery) return maps;
    return maps.filter(map => 
      map.MapName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      map.Mode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const searchMapLeaderboard = async () => {
    if (!selectedMap.trim() || !steamId) return;
    
    setIsSearching(true);
    try {
      // Build the API URL
      let url = `${import.meta.env.VITE_API_URL}/surf/top-map/${selectedMap.trim()}?steamid=${steamId}`;
      
      // Add bonus parameter if not main track
      if (selectedTrack !== "0") {
        url += `&bonus=${selectedTrack}`;
      }
      
      // Add mode parameter if not Standard
      if (selectedMode !== "Standard") {
        url += `&mode=${selectedMode}`;
      }

      if (selectedStyle !== "0") {
        url += `&style=${selectedStyle}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch map records');
      }
      
      const data = await response.json();
      // Store the full response to access position data
      setMapSearchResponse(data);
      setMapSearchResults(data.records || []);
    } catch (err) {
      console.error('Error searching map records:', err);
      setMapSearchResponse(null);
      setMapSearchResults([]);
    } finally {
      setIsSearching(false);
    }
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
                <Button variant="outline" size="sm" className="border-primary/50 hover:bg-primary/10">
                  🏆 {t("common.leaderboards")}
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" size="sm" className="border-primary/50 hover:bg-primary/10">
                  🏠 {t("common.home")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Profile Header */}
        <div className="mb-8">
          <Card className="bg-gradient-card border-primary/20 shadow-card">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar className="w-32 h-32 border-4 border-primary/50">
                  <AvatarImage src={avatarData?.avatar_url} alt={profileData.playername} />
                  <AvatarFallback className="bg-primary/20 text-primary text-4xl">
                    {profileData.playername.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left flex-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground">{profileData.playername}</h1>
                    <div className="flex gap-2">
                      <Badge className="bg-primary/20 text-primary border-primary/50">
                        #{profileData.rank}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t("profile.totalRuns")}:</span>
                      <p className="font-medium text-foreground">{profileData.total_runs}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("profile.globalPoints")}:</span>
                      <p className="font-medium text-primary">{profileData.global_points.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("profile.records")}:</span>
                      <p className="font-medium text-secondary">{profileData.records_top.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats Tabs */}
        <Tabs defaultValue="recent" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px] mx-auto bg-gaming-surface border border-primary/20">
            <TabsTrigger value="recent" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              🗺️ {t("profile.recentMaps")}
            </TabsTrigger>
            <TabsTrigger value="records" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              🏆 {t("profile.topRecords")}
            </TabsTrigger>
            <TabsTrigger value="search" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              🔍 {t("profile.searchByMap")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="animate-fade-in">
            <Card className="bg-gradient-card border-primary/20 shadow-card">
              <CardHeader>
                <CardTitle className="text-foreground">{t("profile.recentMapPerformances")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filterMaps(profileData.recent_maps).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {searchQuery ? 'No maps found matching your search' : 'No recent maps found'}
                      </p>
                    </div>
                  ) : (
                    filterMaps(profileData.recent_maps).map((map, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gaming-surface rounded-lg border border-primary/10 hover:border-primary/30 transition-all duration-200 hover-scale">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            map.Position === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                            map.Position === 2 ? 'bg-gray-500/20 text-gray-300' :
                            map.Position === 3 ? 'bg-orange-500/20 text-orange-400' :
                            'bg-primary/10 text-primary'
                          }`}>
                            {map.Position === 1 ? '🥇' : map.Position === 2 ? '🥈' : map.Position === 3 ? '🥉' : `#${map.Position}`}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{map.MapName}</p>
                            <p className="text-sm text-muted-foreground">{map.Mode} • Style: {map.Style} • {formatDate(map.LastFinished)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary text-lg">{map.FormattedTime}</p>
                          <p className="text-sm text-muted-foreground">#{map.Position}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records" className="animate-fade-in">
            <Card className="bg-gradient-card border-secondary/20 shadow-card">
              <CardHeader>
                <CardTitle className="text-foreground">Top Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filterMaps(profileData.records_top).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {searchQuery ? 'No records found matching your search' : 'No records found'}
                      </p>
                    </div>
                  ) : (
                    filterMaps(profileData.records_top).map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gaming-surface rounded-lg border border-secondary/10 hover:border-secondary/30 transition-all duration-200 hover-scale">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            record.Position === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                            record.Position === 2 ? 'bg-gray-500/20 text-gray-300' :
                            record.Position === 3 ? 'bg-orange-500/20 text-orange-400' :
                            'bg-secondary/10 text-secondary'
                          }`}>
                            {record.Position === 1 ? '🥇' : record.Position === 2 ? '🥈' : record.Position === 3 ? '🥉' : `#${record.Position}`}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{record.MapName}</p>
                            <p className="text-sm text-muted-foreground">{record.Mode} • Style: {record.Style} • {formatDate(record.LastFinished)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-secondary text-lg">{record.FormattedTime}</p>
                          <p className="text-sm text-muted-foreground">#{record.Position}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="animate-fade-in">
            <Card className="bg-gradient-card border-accent/20 shadow-card">
              <CardHeader>
                <CardTitle className="text-foreground">Search Player Records by Map</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Search Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gaming-surface rounded-lg border border-primary/10">
                  <div className="space-y-2">
                    <Label htmlFor="map-input" className="text-sm font-medium text-foreground">{t("profile.mapName")}</Label>
                    <Input
                      id="map-input"
                      placeholder="e.g. surf_beginner"
                      value={selectedMap}
                      onChange={(e) => setSelectedMap(e.target.value)}
                      className="bg-background border-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="track-select" className="text-sm font-medium text-foreground">{t("profile.track")}</Label>
                    <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                      <SelectTrigger id="track-select" className="bg-background border-primary/20">
                        <SelectValue placeholder="Select track" />
                      </SelectTrigger>
                      <SelectContent className="bg-gaming-surface border-primary/20">
                        <SelectItem value="0">{t("profile.mainTrack")}</SelectItem>
                        <SelectItem value="1">{t("leaderboards.bonus")} 1</SelectItem>
                        <SelectItem value="2">Bonus 2</SelectItem>
                        <SelectItem value="3">Bonus 3</SelectItem>
                        <SelectItem value="4">Bonus 4</SelectItem>
                        <SelectItem value="5">Bonus 5</SelectItem>
                        <SelectItem value="6">Bonus 6</SelectItem>
                        <SelectItem value="7">Bonus 7</SelectItem>
                        <SelectItem value="8">Bonus 8</SelectItem>
                        <SelectItem value="9">Bonus 9</SelectItem>
                        <SelectItem value="10">Bonus 10</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mode-select" className="text-sm font-medium text-foreground">Mode</Label>
                    <Select value={selectedMode} onValueChange={setSelectedMode}>
                      <SelectTrigger id="mode-select" className="bg-background border-primary/20">
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent className="bg-gaming-surface border-primary/20">
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="85t">85 Tick</SelectItem>
                        <SelectItem value="102t">102 Tick</SelectItem>
                        <SelectItem value="128t">128 Tick</SelectItem>
                        <SelectItem value="Source">Source</SelectItem>
                        <SelectItem value="Bhop">Bhop</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="style-select" className="text-sm font-medium text-foreground">{t("leaderboards.selectStyle")}</Label>
                    <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                      <SelectTrigger id="style-select" className="bg-background border-primary/20">
                        <SelectValue placeholder={t("leaderboards.selectStyle")} />
                      </SelectTrigger>
                      <SelectContent className="bg-gaming-surface border-primary/20">
                        <SelectItem value="0">Normal</SelectItem>
                        <SelectItem value="1">Low gravity</SelectItem>
                        <SelectItem value="2">Sideways</SelectItem>
                        <SelectItem value="3">Only W</SelectItem>
                        <SelectItem value="4">400 Vel</SelectItem>
                        <SelectItem value="5">High Gravity</SelectItem>
                        <SelectItem value="6">Only A</SelectItem>
                        <SelectItem value="7">Only D</SelectItem>
                        <SelectItem value="8">Only S</SelectItem>
                        <SelectItem value="9">Half Sideways</SelectItem>
                        <SelectItem value="10">Fast Forward</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-center mb-6">
                  <Button 
                    onClick={searchMapLeaderboard}
                    disabled={isSearching || !selectedMap.trim()}
                    className="bg-accent hover:bg-accent/80 text-accent-foreground"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Search Records
                      </>
                    )}
                  </Button>
                </div>

                {/* Search Results */}
                <div className="space-y-4">
                  {mapSearchResponse && mapSearchResponse.position && (
                    <div className="p-4 bg-accent/10 rounded-lg border border-accent/20 mb-4">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-accent">
                          Position: #{mapSearchResponse.position}
                        </p>
                        {mapSearchResponse.best_formatted && (
                          <p className="text-sm text-muted-foreground">
                            Best Time: {mapSearchResponse.best_formatted}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {mapSearchResults.length === 0 && !isSearching ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {selectedMap ? 'No records found for this player on the specified map' : 'Enter a map name and click search to see records'}
                      </p>
                    </div>
                  ) : (
                    mapSearchResults.map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gaming-surface rounded-lg border border-accent/10 hover:border-accent/30 transition-all duration-200 hover-scale">
                         <div className="flex items-center gap-4">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                             mapSearchResponse?.position === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                             mapSearchResponse?.position === 2 ? 'bg-gray-500/20 text-gray-300' :
                             mapSearchResponse?.position === 3 ? 'bg-orange-500/20 text-orange-400' :
                             'bg-accent/10 text-accent'
                           }`}>
                             {mapSearchResponse?.position === 1 ? '🥇' : 
                              mapSearchResponse?.position === 2 ? '🥈' : 
                              mapSearchResponse?.position === 3 ? '🥉' : 
                              `#${mapSearchResponse?.position || index + 1}`}
                           </div>
                          <div>
                            <p className="font-medium text-foreground">{record.MapName}</p>
                            <p className="text-sm text-muted-foreground">{record.Mode} • {formatDate(record.LastFinished)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-accent text-lg">{record.FormattedTime}</p>
                          <p className="text-sm text-muted-foreground">Times Finished: {record.TimesFinished}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;