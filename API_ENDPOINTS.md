## /surf/top-points

Returns top 10 points from your server as a json response:

```json
{
  "count": 10,
  "players": [
    {             
      "SteamID": "99999999999999999",
      "PlayerName": "example",
      "GlobalPoints": 12345
    }
  ]
}
```
## /surf/latest

Returns the latest 20 records from your server as a json response:

```json
{
  "count": 20,
  "records": [
    {
      "MapName": "surf_bonkers_v2_bonus2",
      "SteamID": "99999999999999999",
      "PlayerName": "example",
      "TimerTicks": 1098,
      "FormattedTime": "0:17.156",
      "UnixStamp": 1759504975,
      "TimesFinished": 11,
      "LastFinished": 1759504975,
      "Style": 0,
      "Mode": "Standard"
    },
  ]
}
```

## /surf/stats

Return total players that exists on the database and total runs registered.
```json
{
  "player_count": 305,
  "total_runs": 4591
}
```

## /surf/search
Parameters: q=(name or steamid)
```
https://api.domain.com/surf/search?q=bnt0p
```

Returns the player data that has the regex of the query
```json
{
  "count": 1,
  "matches": [
    {
      "SteamID": "76561198390265131",
      "PlayerName": "bnt0p",
      "LastSeen": 1759353846,
      "GlobalPoints": 17560
    }
  ]
}
```

## /surf/top-map/{map_name}
Parameters: bonus = (bonus ID or blank), mode = "Standard, 85t"  or blank, steamid = steamID or blank. Example:
```
https://api.domain.com/surf/top-map/surf_boreas
https://api.domain.com/surf/top-map/surf_aura?bonus=1
```

Returns the player data that has the regex of the query
```json
{
  "count": 10,
  "records": [
    {
      "MapName": "surf_aura_bonus1",
      "SteamID": "99999999999999999",
      "PlayerName": "example",
      "TimerTicks": 748,
      "FormattedTime": "0:11.688",
      "UnixStamp": 1759359075,
      "TimesFinished": 488,
      "LastFinished": 1759417571,
      "Style": 0,
      "Mode": "Standard"
    }
  ]
}
```

## /servers/list

Returns a json with the server data that was configured on .env:

```json
{
  "ts": 852197880,
  "servers": [
    {
      "ok": true,
      "host": "181.215.45.226",
      "port": 27015,
      "serverName": "[RAGE.SURF] Servidor competitivo (Tier 1) (RANK GLOBAL ATIVO)",
      "map": "surf_ace",
      "playersConnected": 2,
      "totalPlayers": 15
    }
  ]
}
```

## /surf/maps/list

Returns a json with the map list from backend/maps.txt

```json
{
  "count": 114,
  "maps": [
    {
      "name": "surf_utopia_njv",
      "tier": "1",
      "bonus": 0,
      "style": "Linear"
    }
  ]
}
```

## /avatar/{steamid}
Returns the image URL for the user:
```json
{
  "steamid": "76561198390265131",
  "avatar_url": "https://avatars.steamstatic.com/0668099a0600deed4b66c6342cdd251e99ef5bfe_full.jpg",
  "cached": true,
  "stale": false
}
```

## /profile/{steamid}
Returns a json with data of the user to show on website/profile/:

```json
{
  "steamid": "76561198390265131",
  "playername": "bnt0p",
  "global_points": 17560,
  "rank": 4,
  "total_runs": 132,
  "recent_maps": [
    {
      "MapName": "surf_grandad_bonus1",
      "Mode": "Standard",
      "TimerTicks": 1187,
      "FormattedTime": "0:18.547",
      "LastFinished": 1759353846,
      "Position": 6
    }
  ],
  "records_top": [
    {
      "MapName": "surf_race_bonus3",
      "Mode": "Standard",
      "TimerTicks": 532,
      "FormattedTime": "0:08.313",
      "LastFinished": 1757166041,
      "Position": 1
    }
  ]
}
```

## /surf/top-external/{map_name}
This API endpoint connects to the [SharpTimer global api](https://st-global.net/apply). You must have a key. It may be removed once the api finally accepts bonuses right on their website.

> _it does not have pictures because there it saves a random user id not the steamid_

Parameters: bonus = (bonus ID or blank), mode = "Standard, 85t"  or blank, steamid = steamID or blank. Example:

```
https://api.domain.com/surf/top-external/surf_boreas
https://api.domain.com/surf/top-external/surf_aura?bonus=1
```

Returns the player data that has the regex of the query
```json
{
  "message": "Sort successful",
  "data": [
    {
      "record_id": 9910,
      "player_name": "HARİBO",
      "player_id": 92095,
      "time": 11.469,
      "replay": true
    },
    {
      "record_id": 11456,
      "player_name": "GMZ",
      "player_id": 97084,
      "time": 11.688,
      "replay": true
    }
  ]
}
```