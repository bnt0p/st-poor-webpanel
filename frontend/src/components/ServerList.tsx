import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface ServerData {
  name: string;
  map: string;
  players: string;
  maxPlayers: number;
  currentPlayers: number;
  ping: number;
  region: string;
  status: string;
  ip: string;
}

interface ServerCategories {
  Surf: ServerData[];
  HNS: ServerData[];
  Bhop: ServerData[];
  KZ: ServerData[];
}

const getPingColor = (ping: number) => {
  if (ping <= 30) return "text-green-400";
  if (ping <= 50) return "text-yellow-400";
  return "text-red-400";
};


const ServerList = () => {
  const { t } = useTranslation();
  const [serverCategories, setServerCategories] = useState<ServerCategories>({
    Surf: [],
    HNS: [],
    Bhop: [],
    KZ: []
  });
  const [isConnected, setIsConnected] = useState(false);
  const fetchServerData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/servers/list`, {
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.servers && Array.isArray(data.servers)) {
        const surfServers = data.servers
          .filter((server: any) => server.ok)
          .map((server: any) => ({
            name: server.serverName || 'Unknown Server',
            map: server.map || 'Unknown Map',
            players: `${server.playersConnected || 0}/${server.totalPlayers || 32}`,
            maxPlayers: server.totalPlayers || 32,
            currentPlayers: server.playersConnected || 0,
            ping: Math.floor(Math.random() * 50) + 10, // Random ping since not provided
            region: 'EU West',
            status: 'online',
            ip: `${server.host}:${server.port}`
          }));
        
        
        setServerCategories(prev => ({
          ...prev,
          Surf: surfServers
        }));
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error fetching server data:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchServerData();
    
    // Set up interval to fetch every 30 seconds
    const interval = setInterval(fetchServerData, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleJoinServer = (server: ServerData, category: string) => {
    window.open(`steam://connect/${server.ip}`, "_blank");
  };

  const getMapImageUrl = (mapName: string) => {
    return `https://raw.githubusercontent.com/bnt0p/MapPictures/refs/heads/main/pics/${mapName}.jpg`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t("serverbrowser.title")}</h2>
          <p className="text-muted-foreground">{t("serverbrowser.subtitle")}</p>
        </div>
        <Badge variant="outline" className={`border-green-500/50 bg-green-500/10 animate-pulse ${isConnected ? 'text-green-400' : 'text-yellow-400'}`}>
          {isConnected ? '🟢' : '🟡'} {Object.values(serverCategories).flat().length} Servers {isConnected ? 'Online' : 'Connecting...'}
        </Badge>
      </div>

      <Tabs defaultValue="Surf" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gaming-surface border border-primary/20">
          <TabsTrigger value="Surf" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            🏄‍♂️ Surf
          </TabsTrigger>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="HNS" disabled className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground opacity-50 cursor-not-allowed">
                🕵️ HNS
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Soon</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="Bhop" disabled className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground opacity-50 cursor-not-allowed">
                🐰 Bhop
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Soon</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="KZ" disabled className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground opacity-50 cursor-not-allowed">
                🧗‍♂️ KZ
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Soon</p>
            </TooltipContent>
          </Tooltip>
        </TabsList>

        {Object.entries(serverCategories).map(([category, servers]) => (
          <TabsContent key={category} value={category} className="space-y-4 animate-fade-in">
            <Card className="bg-gradient-card border-primary/20 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  {category === "HNS" && "🕵️"} 
                  {category === "Surf" && "🏄‍♂️"} 
                  {category === "Bhop" && "🐰"} 
                  {category === "KZ" && "🧗‍♂️"} 
                  {category} Servers
                  <Badge variant="outline" className="border-secondary/50 text-secondary bg-secondary/10">
                    {servers.length} Available
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {servers.map((server, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-4 bg-gaming-surface rounded-lg border border-primary/10 hover:border-primary/30 transition-all duration-200 hover-scale group"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        <div className="w-16 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          <img 
                            src={getMapImageUrl(server.map)} 
                            alt={`${server.map} preview`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder.svg';
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-foreground">{server.name}</p>
                            <Badge variant="outline" className="border-muted/50 text-muted-foreground text-xs">
                              🇧🇷 - Brasil
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {server.map}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {server.players}
                          </p>
                        </div>
                        
                        <Button 
                          onClick={() => handleJoinServer(server, category)}
                          size="sm" 
                          className="bg-primary hover:bg-primary/90 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          Join
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ServerList;
