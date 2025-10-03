import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import LoadingPage from "@/components/LoadingPage";
import LanguageToggle from "@/components/LanguageToggle";
import { useTranslation } from "@/hooks/useTranslation";
import { Search, Loader2, User, RefreshCw } from "lucide-react";

interface SurfRecord {
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

interface RecentRecordsResponse {
  count: number;
  records: SurfRecord[];
}

interface TopPointsPlayer {
  SteamID: string;
  PlayerName: string;
  GlobalPoints: number;
}

interface TopPointsResponse {
  count: number;
  players: TopPointsPlayer[];
}

interface AvatarResponse {
  steamid: string;
  avatar_url: string;
  cached: boolean;
  stale: boolean;
}

interface StatsResponse {
  player_count: number;
  total_runs: number;
}

interface SearchPlayer {
  SteamID: string;
  PlayerName: string;
  LastSeen: number;
  GlobalPoints: number;
}

interface SearchResponse {
  count: number;
  matches: SearchPlayer[];
}


const Leaderboards = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMap, setSelectedMap] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("0");
  const [selectedStyle, setSelectedStyle] = useState("0");
  const [selectedMode, setSelectedMode] = useState("Standard");
  const [playerNameFilter, setPlayerNameFilter] = useState("");
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [mapSearchResults, setMapSearchResults] = useState(null);
  const [isSearchingPlayer, setIsSearchingPlayer] = useState(false);
  const [playerSearchResult, setPlayerSearchResult] = useState(null);
  const [showPlayerPopover, setShowPlayerPopover] = useState(false);
  const [recentRecords, setRecentRecords] = useState<SurfRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [avatarUrls, setAvatarUrls] = useState<Map<string, string>>(new Map());
  const [topPointsPlayers, setTopPointsPlayers] = useState<TopPointsPlayer[]>([]);
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);
  const [stats, setStats] = useState({ player_count: 0, total_runs: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchPlayer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [globalMapLeaderboard, setGlobalMapLeaderboard] = useState(null);
  const [isSearchingGlobalMap, setIsSearchingGlobalMap] = useState(false);

  // Fetch stats from API
  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/surf/stats`);
      const data: StatsResponse = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Search for players
  const searchPlayers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/surf/search?q=${encodeURIComponent(query)}`);
      const data: SearchResponse = await response.json();
      setSearchResults(data.matches || []);
      setShowSearchResults(true);
      
      // Fetch avatars for search results
      for (const player of data.matches || []) {
        fetchAvatar(player.SteamID);
      }
    } catch (error) {
      console.error('Error searching players:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPlayers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    // Simulate 3-second loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
      fetchRecentRecords();
      fetchTopPointsPlayers();
      fetchStats();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const fetchAvatar = async (steamId: string) => {
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/avatar/${steamId}`, {
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: AvatarResponse = await response.json();
      
      const avatarUrl = data.avatar_url || "https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef9e82e517e_full.jpg";
      setAvatarUrls(prev => new Map(prev).set(steamId, avatarUrl));
      return avatarUrl;
    } catch (error) {
      console.error(`Failed to fetch avatar for ${steamId}:`, error);
      // Generate unique default avatars based on Steam ID
      const defaultAvatars = [
        "https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef9e82e517e_full.jpg",
        "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg",
        "https://avatars.steamstatic.com/c5d56249ee5d28a07db4ac9f7f60af961fab5426_full.jpg"
      ];
      const avatarIndex = parseInt(steamId.slice(-1)) % defaultAvatars.length;
      const defaultAvatar = defaultAvatars[avatarIndex];
      setAvatarUrls(prev => new Map(prev).set(steamId, defaultAvatar));
      return defaultAvatar;
    }
  };

  const fetchRecentRecords = async () => {
    setIsLoadingRecords(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/surf/latest`, {
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: RecentRecordsResponse = await response.json();
      setRecentRecords(data.records || []);
      
      // Fetch avatars for all unique Steam IDs
      const uniqueSteamIds = [...new Set((data.records || []).map(record => record.SteamID))];
      
      for (const steamId of uniqueSteamIds) {
        fetchAvatar(steamId);
      }
    } catch (error) {
      console.error("Failed to fetch recent records:", error);
      setRecentRecords([]); // Set empty array on error
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const handleMapSearch = async () => {
    if (!selectedMap) return;
    
    setIsSearchingMap(true);
    try {
      // Build URL with parameters for map leaderboard
      let url = `${import.meta.env.VITE_API_URL}/surf/top-map/${selectedMap}`;
      const params = [];
      
      if (selectedTrack !== "0") {
        params.push(`bonus=${selectedTrack}`);
      }
      
      if (selectedStyle !== "0") {
        params.push(`style=${selectedStyle}`);
      }
      
      if (params.length > 0) {
        url += "?" + params.join("&");
      }      
      const response = await fetch(url, {
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setMapSearchResults(data);
    } catch (error) {
      console.error("Failed to fetch map leaderboard:", error);
      setMapSearchResults(null);
    } finally {
      setIsSearchingMap(false);
    }
  };

  const handleGlobalMapSearch = async () => {
    if (!selectedMap) return;
    
    setIsSearchingGlobalMap(true);
    try {
      // Build URL with parameters
      let url = `${import.meta.env.VITE_API_URL}/surf/top-external/${selectedMap}`;
      const params = [];
      
      if (selectedTrack !== "0") {
        params.push(`bonus=${selectedTrack}`);
      }
      
      if (selectedStyle !== "0") {
        let styleValue;

        switch (selectedStyle) {
          case "0": styleValue = "Normal"; break;
          case "1": styleValue = "Low gravity"; break;
          case "2": styleValue = "Sideways"; break;
          case "3": styleValue = "Only W"; break;
          case "4": styleValue = "400 Vel"; break;
          case "5": styleValue = "High Gravity"; break;
          case "6": styleValue = "Only A"; break;
          case "7": styleValue = "Only D"; break;
          case "8": styleValue = "Only S"; break;
          case "9": styleValue = "Half Sideways"; break;
          case "10": styleValue = "Fast Forward"; break;
          default: styleValue = selectedStyle;
        }

        params.push(`style=${styleValue}`);
      }
      
      if (params.length > 0) {
        url += "?" + params.join("&");
      }

      
      const response = await fetch(url, {
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Store the search parameters with the results
      const resultsWithParams = {
        ...data,
        searchedMap: selectedMap,
        searchedTrack: selectedTrack,
        searchedStyle: selectedStyle,
        searchedMode: selectedMode
      };
      
      setGlobalMapLeaderboard(resultsWithParams);
    } catch (error) {
      console.error("Failed to fetch global map leaderboard:", error);
      setGlobalMapLeaderboard({
        data: [],
        searchedMap: selectedMap,
        searchedTrack: selectedTrack,
        searchedStyle: selectedStyle,
        searchedMode: selectedMode
      });
    } finally {
      setIsSearchingGlobalMap(false);
    }
  };

  // Function to format seconds to MM:SS:MS format
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const secs = Math.floor(remainingSeconds);
    const milliseconds = Math.floor((remainingSeconds - secs) * 1000);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${milliseconds.toString().padStart(3, '0')}`;
  };

  const handlePlayerSearch = async () => {
    if (!playerNameFilter.trim()) return;
    
    setIsSearchingPlayer(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock search for specific player
    const foundPlayer = {
      name: playerNameFilter,
      steamId: "76561198001234567",
      avatar: "https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef9e82e517e_full.jpg",
      points: 15420,
      level: 87,
      mapsCompleted: 156,
      country: "🇺🇸",
      joinDate: "2019-03-15",
      lastSeen: "Online"
    };
    
    if (foundPlayer) {
      setPlayerSearchResult(foundPlayer);
      setShowPlayerPopover(true);
    }
    
    setIsSearchingPlayer(false);
  };

  const fetchTopPointsPlayers = async () => {
    setIsLoadingPoints(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/surf/top-points`, {
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: TopPointsResponse = await response.json();
      setTopPointsPlayers(data.players || []);
      
      // Fetch avatars for all unique Steam IDs
      const uniqueSteamIds = [...new Set((data.players || []).map(player => player.SteamID))];
      
      for (const steamId of uniqueSteamIds) {
        fetchAvatar(steamId);
      }
    } catch (error) {
      console.error("Failed to fetch top points players:", error);
      setTopPointsPlayers([]);
    } finally {
      setIsLoadingPoints(false);
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

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
              <Link to="/maps">
                <Button variant="outline" size="sm" className="border-secondary/50 hover:bg-secondary/10">
                  🗺️ {t("maps.title")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
            🏆 {t("leaderboards.title")}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t("leaderboards.subtitle")}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-card border-primary/20 shadow-card text-center">
            <CardContent className="p-6">
              {isLoadingStats ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-20 mx-auto" />
                  <div className="text-sm text-muted-foreground">Total Players</div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-primary mb-2 animate-fade-in">{stats.player_count.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Players</div>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="bg-gradient-card border-primary/20 shadow-card text-center">
            <CardContent className="p-6">
              {isLoadingStats ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-20 mx-auto" />
                  <div className="text-sm text-muted-foreground">Total Runs</div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-primary mb-2 animate-fade-in">{stats.total_runs.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Runs</div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Player Search */}
        <div className="mb-6">
          <Card className="bg-gradient-card border-primary/20 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="player-search" className="text-sm font-medium text-foreground whitespace-nowrap">
                  {t("leaderboards.searchPlayers")}:
                </Label>
                <div className="flex-1 relative">
                  <div className="relative">
                    <Input
                      id="player-search"
                      placeholder={t("leaderboards.searchPlayers") + "..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-background border-primary/20 pr-10"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <Search className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-primary/20 rounded-md shadow-lg max-h-80 overflow-y-auto">
                      {searchResults.map((player) => (
                        <Link
                          key={player.SteamID}
                          to={`/profile/${player.SteamID}`}
                          className="block p-3 hover:bg-primary/10 transition-colors border-b border-primary/10 last:border-b-0"
                          onClick={() => {
                            setShowSearchResults(false);
                            setSearchQuery("");
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border-2 border-primary/30">
                              <AvatarImage 
                                src={avatarUrls.get(player.SteamID) || "https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef9e82e517e_full.jpg"} 
                                alt={player.PlayerName} 
                              />
                              <AvatarFallback className="bg-primary/20 text-primary">
                                {player.PlayerName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="font-medium text-foreground">{player.PlayerName}</div>
                              <div className="text-sm text-muted-foreground">
                                {player.GlobalPoints.toLocaleString()} points
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  
                  {/* No Results Message */}
                  {showSearchResults && searchQuery && searchResults.length === 0 && !isSearching && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-primary/20 rounded-md shadow-lg p-3">
                      <div className="text-center text-muted-foreground">No players found</div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard Tabs */}
        <TooltipProvider>
          <Tabs defaultValue="recent" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-[1000px] mx-auto bg-gaming-surface border border-primary/20">
              <TabsTrigger value="recent" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                📈 Recent Records
              </TabsTrigger>
              <TabsTrigger value="maps" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                🗺️ {t("leaderboards.mapLeaderboards")}
              </TabsTrigger>
              <TabsTrigger value="global-maps" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                🌍 {t("leaderboards.globalMapRank")}
              </TabsTrigger>
              <TabsTrigger value="points" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                🏆 {t("leaderboards.globalRanking")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="points" className="animate-fade-in">
              <Card className="bg-gradient-card border-primary/20 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    🏆 {t("leaderboards.globalRanking")}
                    <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10">
                      All Time
                    </Badge>
                    <Button 
                      onClick={fetchTopPointsPlayers}
                      disabled={isLoadingPoints}
                      variant="outline"
                      size="sm"
                      className="ml-auto border-primary/50 hover:bg-primary/10"
                    >
                      {isLoadingPoints ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingPoints ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2 text-muted-foreground">Loading points leaderboard...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topPointsPlayers.map((player, index) => (
                        <Link key={player.SteamID} to={`/profile/${player.SteamID}`}>
                          <div className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover-scale hover:border-primary/40 cursor-pointer ${
                            index < 3 ? 'bg-primary/5 border-primary/20' : 'bg-gaming-surface border-primary/10'
                          }`}>
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                index === 1 ? 'bg-gray-500/20 text-gray-300' :
                                index === 2 ? 'bg-orange-500/20 text-orange-400' :
                                'bg-primary/10 text-primary'
                              }`}>
                                {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                              </div>
                              <Avatar className="w-12 h-12 border-2 border-primary/30">
                                <AvatarImage 
                                  src={avatarUrls.get(player.SteamID) || "https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef9e82e517e_full.jpg"} 
                                  alt={player.PlayerName} 
                                />
                                <AvatarFallback className="bg-primary/20 text-primary">
                                  {player.PlayerName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-foreground">{player.PlayerName}</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-primary">
                                {player.GlobalPoints.toLocaleString()}
                              </div>
                              <div className="text-sm text-muted-foreground">points</div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="global-maps" className="animate-fade-in">
              <Card className="bg-gradient-card border-primary/20 shadow-card">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    🌍 {t("leaderboards.globalMapRank")}
                  </CardTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <div>
                      <Label>{t("leaderboards.selectMap")}</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="surf_aura, surf_boreas..."
                          value={selectedMap}
                          onChange={(e) => setSelectedMap(e.target.value)}
                          className="flex-1 bg-background border-primary/20"
                        />
                        <Button 
                          onClick={handleGlobalMapSearch}
                          disabled={isSearchingGlobalMap || !selectedMap}
                          size="sm"
                          className="bg-primary hover:bg-primary/80"
                        >
                          {isSearchingGlobalMap ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>{t("leaderboards.selectTrack")}</Label>
                      <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                        <SelectTrigger className="bg-background border-primary/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Main</SelectItem>
                          <SelectItem value="1">Bonus 1</SelectItem>
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
                    <div>
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
                    <div>
                      <Label>{t("leaderboards.selectMode")}</Label>
                      <Select value={selectedMode} onValueChange={setSelectedMode}>
                        <SelectTrigger className="bg-background border-primary/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Standard">Standard</SelectItem>
                          <SelectItem value="85t">85t</SelectItem>
                          <SelectItem value="102t">102t</SelectItem>
                          <SelectItem value="128t">128t</SelectItem>
                          <SelectItem value="Source">Source</SelectItem>
                          <SelectItem value="Bhop">Bhop</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {globalMapLeaderboard && globalMapLeaderboard.data && globalMapLeaderboard.data.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="outline" className="border-primary/50">
                          Map: {globalMapLeaderboard.searchedMap || selectedMap}
                        </Badge>
                        <Badge variant="outline" className="border-primary/50">
                          Track: {globalMapLeaderboard.searchedTrack === "0" ? "Main" : `Bonus ${globalMapLeaderboard.searchedTrack}`}
                        </Badge>
                        <Badge variant="outline" className="border-primary/50">
                          Style: {globalMapLeaderboard.searchedStyle === "0" ? "Normal" : `${globalMapLeaderboard.searchedStyle}`}
                        </Badge>
                        <Badge variant="outline" className="border-primary/50">
                          Mode: {globalMapLeaderboard.searchedMode}
                        </Badge>
                      </div>
                      {globalMapLeaderboard.data.slice(0, 20).map((record, index) => (
                        <div className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover-scale hover:border-primary/40 cursor-pointer ${
                          index < 3 ? 'bg-primary/5 border-primary/20' : 'bg-gaming-surface border-primary/10'
                        }`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                              index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                              index === 1 ? 'bg-gray-500/20 text-gray-300' :
                              index === 2 ? 'bg-orange-500/20 text-orange-400' :
                              'bg-primary/10 text-primary'
                            }`}>
                              {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{record.player_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {globalMapLeaderboard.searchedMap} • {globalMapLeaderboard.searchedMode} • Style: {globalMapLeaderboard.searchedStyle}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="font-mono text-lg font-bold text-primary">
                                {formatTime(record.time)}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {record.replay ? '🎬 has replay' : 'no replay'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {globalMapLeaderboard && globalMapLeaderboard.data && globalMapLeaderboard.data.length === 0 && !isSearchingGlobalMap && (
                    <div className="text-center py-8 text-muted-foreground">
                      {t("leaderboards.noRecordsFound")}
                    </div>
                  )}
                  
                  {!globalMapLeaderboard && !isSearchingGlobalMap && selectedMap && (
                    <div className="text-center py-8 text-muted-foreground">
                      Click search to view leaderboard
                    </div>
                  )}
                  
                  {!selectedMap && (
                    <div className="text-center py-8 text-muted-foreground">
                      Select a map to view leaderboard
                    </div>
                  )}
                  
                  {isSearchingGlobalMap && (
                    <div className="space-y-3">
                      {Array.from({ length: 20 }, (_, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 rounded-lg border bg-gaming-surface border-primary/10">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maps" className="animate-fade-in">
              <Card className="bg-gradient-card border-secondary/20 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    🗺️ {t("leaderboards.mapLeaderboards")}
                    <Badge variant="outline" className="border-secondary/50 text-secondary bg-secondary/10">
                      Record Times
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Map Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gaming-surface rounded-lg border border-primary/10">
                    <div className="space-y-2">
                      <Label htmlFor="map-input" className="text-sm font-medium text-foreground">{t("leaderboards.selectMap")}</Label>
                      <Input
                        id="map-input"
                        placeholder="e.g. surf_beginner"
                        value={selectedMap}
                        onChange={(e) => setSelectedMap(e.target.value)}
                        className="bg-background border-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="track-select" className="text-sm font-medium text-foreground">{t("leaderboards.selectTrack")}</Label>
                      <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                        <SelectTrigger id="track-select" className="bg-background border-primary/20">
                          <SelectValue placeholder={t("leaderboards.selectTrack")} />
                        </SelectTrigger>
                        <SelectContent className="bg-gaming-surface border-primary/20">
                          <SelectItem value="0">{t("leaderboards.mainTrack")}</SelectItem>
                          <SelectItem value="1">{t("leaderboards.bonus")} 1</SelectItem>
                          <SelectItem value="2">{t("leaderboards.bonus")} 2</SelectItem>
                          <SelectItem value="3">{t("leaderboards.bonus")} 3</SelectItem>
                          <SelectItem value="4">{t("leaderboards.bonus")} 4</SelectItem>
                          <SelectItem value="5">{t("leaderboards.bonus")} 5</SelectItem>
                          <SelectItem value="6">{t("leaderboards.bonus")} 6</SelectItem>
                          <SelectItem value="7">{t("leaderboards.bonus")} 7</SelectItem>
                          <SelectItem value="8">{t("leaderboards.bonus")} 8</SelectItem>
                          <SelectItem value="9">{t("leaderboards.bonus")} 9</SelectItem>
                          <SelectItem value="10">{t("leaderboards.bonus")} 10</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mode-select" className="text-sm font-medium text-foreground">{t("leaderboards.selectMode")}</Label>
                      <Select value={selectedMode} onValueChange={setSelectedMode}>
                        <SelectTrigger id="mode-select" className="bg-background border-primary/20">
                          <SelectValue placeholder={t("leaderboards.selectMode")} />
                        </SelectTrigger>
                        <SelectContent className="bg-gaming-surface border-primary/20">
                          <SelectItem value="Standard">{t("leaderboards.standard")}</SelectItem>
                          <SelectItem value="85t">85t</SelectItem>
                          <SelectItem value="102t">102t</SelectItem>
                          <SelectItem value="128t">128t</SelectItem>
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
                    <div className="space-y-2 flex flex-col justify-end">
                      <Button 
                        onClick={handleMapSearch}
                        disabled={isSearchingMap || !selectedMap}
                        className="bg-secondary hover:bg-secondary/90 h-10"
                      >
                        {isSearchingMap ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            {t("common.searching")}
                          </>
                        ) : (
                          <>
                            <Search className="h-4 w-4 mr-2" />
                            {t("common.searchRecords")}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Map Selection Notice */}
                  {!selectedMap && !isSearchingMap && !mapSearchResults && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Please enter a map name and click search to view leaderboard</p>
                    </div>
                  )}

                  {/* Loading State */}
                  {isSearchingMap && (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-secondary" />
                      <p className="text-muted-foreground">Searching for map records...</p>
                    </div>
                  )}

                   {/* Map Leaderboard Results */}
                   {mapSearchResults && mapSearchResults.records && mapSearchResults.records.length > 0 && selectedMap && (
                     <div className="space-y-3">
                       <div className="flex items-center gap-2 mb-4">
                         <Badge variant="outline" className="border-secondary/50">
                           Map: {selectedMap}
                         </Badge>
                         <Badge variant="outline" className="border-primary/50">
                           Track: {selectedTrack === "0" ? "Main" : `Bonus ${selectedTrack}`}
                         </Badge>
                         <Badge variant="outline" className="border-primary/50">
                           Mode: {selectedMode}
                         </Badge>
                       </div>
                       {mapSearchResults.records.slice(0, 20).map((record, index) => (
                         <Link key={record.SteamID || index} to={`/profile/${record.SteamID}`}>
                           <div className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover-scale hover:border-secondary/40 cursor-pointer ${
                             index < 3 ? 'bg-secondary/5 border-secondary/20' : 'bg-gaming-surface border-secondary/10'
                           }`}>
                             <div className="flex items-center gap-4">
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                 index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                 index === 1 ? 'bg-gray-500/20 text-gray-300' :
                                 index === 2 ? 'bg-orange-500/20 text-orange-400' :
                                 'bg-secondary/10 text-secondary'
                               }`}>
                                 {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                               </div>
                               <Avatar className="w-12 h-12 border-2 border-secondary/30">
                                 <AvatarImage 
                                   src={avatarUrls.get(record.SteamID) || "https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef9e82e517e_full.jpg"} 
                                   alt={record.PlayerName} 
                                 />
                                 <AvatarFallback className="bg-secondary/20 text-secondary">
                                   {record.PlayerName.slice(0, 2).toUpperCase()}
                                 </AvatarFallback>
                               </Avatar>
                               <div>
                                 <div className="flex items-center gap-2">
                                   <p className="font-medium text-foreground">{record.PlayerName}</p>
                                 </div>
                                 <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                   <span>Completions: {record.TimesFinished}</span>
                                   <span>{record.MapName} • {record.Mode} • Style: {record.Style}</span>
                                 </div>
                               </div>
                             </div>
                             <div className="text-right">
                               <div className="text-xl font-bold text-secondary">
                                 {record.FormattedTime}
                               </div>
                               <div className="text-sm text-muted-foreground">best time</div>
                             </div>
                           </div>
                         </Link>
                       ))}
                     </div>
                   )}
                   
                   {mapSearchResults && (!mapSearchResults.records || mapSearchResults.records.length === 0) && selectedMap && (
                     <div className="text-center py-8 text-muted-foreground">
                       No records found for this map
                     </div>
                   )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recent" className="animate-fade-in">
              <Card className="bg-gradient-card border-secondary/20 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    📈 Recent Records
                    <Badge variant="outline" className="border-secondary/50 text-secondary bg-secondary/10">
                      Latest 20 Records
                    </Badge>
                    <Button
                      onClick={fetchRecentRecords}
                      disabled={isLoadingRecords}
                      variant="outline"
                      size="sm"
                      className="ml-auto border-secondary/50 hover:bg-secondary/10"
                    >
                      {isLoadingRecords ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingRecords ? (
                    <div className="space-y-3">
                      {/* Loading Skeleton */}
                      {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-gaming-surface border-secondary/10 animate-pulse">
                          <div className="flex items-center gap-4">
                            {/* Rank number skeleton */}
                            <div className="w-10 h-10 rounded-full bg-secondary/20 animate-pulse"></div>
                            {/* Avatar skeleton */}
                            <div className="w-12 h-12 rounded-full bg-secondary/20 animate-pulse"></div>
                            <div className="space-y-2">
                              {/* Player name skeleton */}
                              <div className="h-4 w-32 bg-secondary/20 rounded animate-pulse"></div>
                              {/* Map info skeleton */}
                              <div className="h-3 w-48 bg-secondary/20 rounded animate-pulse"></div>
                              {/* Date skeleton */}
                              <div className="h-3 w-24 bg-secondary/20 rounded animate-pulse"></div>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            {/* Time skeleton */}
                            <div className="h-6 w-20 bg-secondary/20 rounded animate-pulse"></div>
                            {/* Completions skeleton */}
                            <div className="h-4 w-16 bg-secondary/20 rounded animate-pulse"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentRecords.map((record, index) => (
                        <Link key={`${record.SteamID}-${record.UnixStamp}-${index}`} to={`/profile/${record.SteamID}`}>
                          <div className="flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover-scale hover:border-secondary/40 cursor-pointer bg-gaming-surface border-secondary/10">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-secondary/10 text-secondary">
                                #{index + 1}
                              </div>
                              <Avatar className="w-12 h-12 border-2 border-secondary/30">
                                <AvatarImage 
                                  src={avatarUrls.get(record.SteamID) || "https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef9e82e517e_full.jpg"} 
                                  alt={record.PlayerName} 
                                />
                                <AvatarFallback className="bg-secondary/20 text-secondary">
                                  {record.PlayerName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">{record.PlayerName}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {record.MapName} • {record.Mode} • Style: {record.Style}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(record.UnixStamp * 1000).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="font-mono text-lg text-secondary font-bold">
                                {record.FormattedTime}
                              </div>
                              <div className="text-sm text-blue-400 flex items-center gap-1">
                                <span>Completions: {record.TimesFinished}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                      {recentRecords.length === 0 && !isLoadingRecords && (
                        <div className="text-center py-8 text-muted-foreground">
                          No recent records found
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TooltipProvider>
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

export default Leaderboards;