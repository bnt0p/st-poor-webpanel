import asyncio
import json
import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.responses import JSONResponse
import a2s
from typing import Dict, List, Optional, Any
import pymysql
import requests
import os
import os, json, httpx
from httpx import Timeout

SERVERS = json.loads(os.environ['SERVER_LIST'])
API_ENDPOINT = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/"
MAPS_URL = "https://stglobal-webpanel.vercel.app/api/maps"
SORT_URL = "https://stglobalapi.azurewebsites.net/api/Records/Sort"

TTL_SECONDS = int(os.environ.get("AVATAR_CACHE_TTL_SECONDS", "86400"))  # 24h
STEAM_API_KEY = os.getenv("STEAM_API_KEY")
MAPS_BODY = {"tier": 0, "limit": 999999}
token = os.getenv("TOKEN")
POLL_MS = 10_000
TIMEOUT_S = 3.0

app = FastAPI()
connections: List[WebSocket] = []

def parse_hostport(hp: str):
    host, port = hp.split(":")
    return host, int(port)

async def query_server(hp: str) -> Dict[str, Any]:
    host, port = parse_hostport(hp)
    try:
        info = await asyncio.wait_for(asyncio.to_thread(a2s.info, (host, port)), timeout=TIMEOUT_S)
        name = getattr(info, "server_name", None) or getattr(info, "name", None) or f"{host}:{port}"
        map_name = getattr(info, "map_name", None) or getattr(info, "map", None) or "unknown"
        players = getattr(info, "player_count", None) or getattr(info, "players", None) or 0
        total = getattr(info, "max_players", None) or getattr(info, "maxPlayers", None) or 0
        return dict(ok=True, host=host, port=port, serverName=name, map=map_name, playersConnected=players, totalPlayers=total-5)
    except Exception as e:
        return dict(ok=False, host=host, port=port, serverName=f"{host}:{port}", map="unreachable",
                    playersConnected=0, totalPlayers=0, error=str(e))

async def snapshot() -> Dict[str, Any]:
    results = await asyncio.gather(*[query_server(s) for s in SERVERS])
    return {"ts": int(asyncio.get_event_loop().time() * 1000), "servers": results}

def _db():
    return pymysql.connect(
        host=os.getenv("DB_HOST_STEAM"),
        port=int(os.getenv("DB_PORT_STEAM")),
        user=os.getenv("DB_USER_STEAM"),
        password=os.getenv("DB_PASSWORD_STEAM"),
        database=os.getenv("DB_NAME_STEAM"),
        autocommit=True,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )

def _db_surf():
    return pymysql.connect(
        host=os.getenv("DB_HOST_SURF"),
        port=int(os.getenv("DB_PORT_SURF")),
        user=os.getenv("DB_USER_SURF"),
        password=os.getenv("DB_PASSWORD_SURF"),
        database=os.getenv("DB_NAME_SURF"),
        autocommit=True,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )

def _load_cached(steamid: str) -> Optional[Dict[str, int]]:
    with _db() as conn, conn.cursor() as cur:
        cur.execute("SELECT url, updated_at FROM avatars WHERE steamid = %s", (steamid,))
        row = cur.fetchone()
        return row if row else None

def _save_cache(entries: Dict[str, str]) -> None:
    if not entries:
        return
    now = int(time.time())
    sql = (
        "INSERT INTO avatars (steamid, url, updated_at) VALUES (%s, %s, %s) "
        "ON DUPLICATE KEY UPDATE url = VALUES(url), updated_at = VALUES(updated_at)"
    )
    rows = [(int(sid), url, now) for sid, url in entries.items()]
    with _db() as conn, conn.cursor() as cur:
        cur.executemany(sql, rows)

def _fetch_avatars_from_api(api_key: str, steamids: List[str]) -> Dict[str, str]:
    if not api_key:
        raise HTTPException(status_code=500, detail="STEAM_API_KEY is not configured on the server.")
    params = {"key": api_key, "steamids": ",".join(steamids)}
    try:
        r = requests.get(API_ENDPOINT, params=params, timeout=10)
        r.raise_for_status()
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Steam API request failed: {e}")
    data = r.json()
    players = data.get("response", {}).get("players", [])
    out: Dict[str, str] = {}
    for p in players:
        sid = p.get("steamid")
        url = p.get("avatarfull") or p.get("avatarmedium") or p.get("avatar")
        if sid and url:
            out[sid] = url
    return out

@app.get("/surf/latest")
def get_latest_records(limit: int = 20):
    sql = "SELECT * FROM PlayerRecords ORDER BY UnixStamp DESC LIMIT %s"
    try:
        with _db_surf() as conn, conn.cursor() as cur:
            cur.execute(sql, (limit,))
            rows = cur.fetchall()
            return {"count": len(rows), "records": rows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Surf DB query failed: {e}")


@app.get("/surf/top-points")
def get_top_points(limit: int = Query(10, ge=1)):
    sql = """
        SELECT SteamID, PlayerName, GlobalPoints
        FROM PlayerStats
        ORDER BY GlobalPoints DESC
        LIMIT %s;
    """

    try:
        with _db_surf() as conn, conn.cursor() as cur:
            cur.execute(sql, (limit,))
            rows = cur.fetchall()

        return {"count": len(rows), "players": rows}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Surf DB query failed: {e}")

@app.get("/surf/stats")
def get_surf_stats():
    try:
        with _db_surf() as conn, conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS player_count FROM PlayerStats;")
            row = cur.fetchone() or {}
            player_count = int(row.get("player_count") or 0)

            cur.execute("SELECT COALESCE(SUM(TimesFinished), 0) AS total_runs FROM PlayerRecords;")
            row = cur.fetchone() or {}
            total_runs = int(row.get("total_runs") or 0)

            return {
                "player_count": player_count,
                "total_runs": total_runs,
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Surf DB stats query failed: {e}")

@app.get("/surf/search")
def search_users(
    q: str = Query(..., min_length=1, max_length=64, description="Regex or text to match PlayerName/SteamID"),
    use_regex: bool = True,
    limit: int = Query(25, ge=1, le=200),
):
    try:
        with _db_surf() as conn, conn.cursor() as cur:
            # WHERE clause (regex vs LIKE)
            if use_regex:
                where = "(PlayerName REGEXP %s OR SteamID REGEXP %s)"
                params = [q, q]
            else:
                like = f"%{q}%"
                where = "(PlayerName LIKE %s OR SteamID LIKE %s)"
                params = [like, like]

            sub_sql = f"""
                SELECT SteamID, MAX(CAST(UnixStamp AS UNSIGNED)) AS LastSeen
                FROM PlayerRecords
                WHERE {where}
                GROUP BY SteamID
            """
            sql = f"""
                SELECT
                    pr.SteamID,
                    pr.PlayerName,
                    CAST(x.LastSeen AS UNSIGNED) AS LastSeen,
                    COALESCE(ps.GlobalPoints, 0) AS GlobalPoints
                FROM ({sub_sql}) AS x
                JOIN PlayerRecords pr
                  ON pr.SteamID = x.SteamID
                 AND CAST(pr.UnixStamp AS UNSIGNED) = x.LastSeen
                LEFT JOIN PlayerStats ps
                  ON ps.SteamID = x.SteamID
                ORDER BY x.LastSeen DESC
                LIMIT %s;
            """

            cur.execute(sql, params + [limit])
            rows = cur.fetchall() or []
            return {"count": len(rows), "matches": rows}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {e}")


@app.get("/surf/top-map/{mapy}")
def get_map_records(
    mapy: str,
    limit: int = Query(10, ge=1, le=100),
    bonus: int = 0,
    mode: str = "Standard",
    steamid: int = 0,
):
    map_query = f"{mapy}_bonus{bonus}" if bonus > 0 else mapy
    sql = """
        SELECT *
        FROM PlayerRecords
        WHERE MapName = %s
    """
    params = [map_query]

    if steamid > 0:
        sql += " AND SteamID = %s "
        params.append(str(steamid))

    sql += " ORDER BY TimerTicks ASC LIMIT %s"
    params.append(limit)

    try:
        with _db_surf() as conn, conn.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall() or []

            result = {"count": len(rows), "records": rows}
            if steamid > 0:
                cur.execute(
                    """
                    SELECT MIN(TimerTicks) AS BestTicks
                    FROM PlayerRecords
                    WHERE MapName = %s AND SteamID = %s;
                    """,
                    (map_query, str(steamid)),
                )
                best_row = cur.fetchone() or {}
                best_ticks = best_row.get("BestTicks")
                if best_ticks is not None:
                    cur.execute(
                        """
                        SELECT
                          1 + COUNT(*) AS Position
                        FROM (
                          SELECT MIN(TimerTicks) AS BestTicks
                          FROM PlayerRecords
                          WHERE MapName = %s
                          GROUP BY SteamID
                        ) AS lb
                        WHERE lb.BestTicks < %s;
                        """,
                        (map_query, int(best_ticks)),
                    )
                    pos_row = cur.fetchone() or {}
                    position = int(pos_row.get("Position") or 0)
                    cur.execute(
                        """
                        SELECT FormattedTime
                        FROM PlayerRecords
                        WHERE MapName = %s AND SteamID = %s AND TimerTicks = %s
                        ORDER BY CAST(UnixStamp AS UNSIGNED) DESC
                        LIMIT 1;
                        """,
                        (map_query, str(steamid), int(best_ticks)),
                    )
                    fmt_row = cur.fetchone() or {}
                    best_formatted = fmt_row.get("FormattedTime")

                    result.update({
                        "position": position,
                        "best_ticks": int(best_ticks),
                        "best_formatted": best_formatted,
                    })
                else:
                    result.update({
                        "position": None,
                        "best_ticks": None,
                        "best_formatted": None,
                    })

            return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Surf DB query failed: {e}")



@app.get("/servers/list")
async def api_servers():
    return JSONResponse(await snapshot())

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    connections.append(ws)
    try:
        await ws.send_text(json.dumps(await snapshot()))
        while True:
            await asyncio.sleep(60)
            await ws.send_text(json.dumps({"type": "ping"}))
    except WebSocketDisconnect:
        pass
    finally:
        if ws in connections:
            connections.remove(ws)


@app.get("/surf/maps/list")
def get_maps_from_file():
    path = os.getenv("MAPS_FILE", "maps.txt")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"{path} not found")

    maps = []
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                s = line.strip()
                if not s or s.startswith("#"):
                    continue
                parts = s.split(":")
                if len(parts) < 5:
                    continue

                name = parts[0].strip()
                tier = parts[2].strip()
                bonus_raw = parts[3].strip()
                style_raw = parts[4].strip().lower()

                try:
                    bonus = int(bonus_raw)
                except ValueError:
                    bonus = 0

                # Capitalized style
                if "linear" in style_raw:
                    style = "Linear"
                elif "stage" in style_raw:
                    style = "Staged"
                else:
                    style = style_raw.capitalize() if style_raw else "Staged"

                maps.append({
                    "name": name,
                    "tier": tier,
                    "bonus": bonus,
                    "style": style,
                })

        return {"count": len(maps), "maps": maps}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read {path}: {e}")



@app.get("/avatar/{steamid}")
def get_avatar(steamid: str, force: bool = Query(False, description="Force refresh and ignore TTL")):
    now = int(time.time())
    if not force:
        cached = _load_cached(steamid)
        if cached and (now - cached["updated_at"] <= TTL_SECONDS):
            return {"steamid": steamid, "avatar_url": cached["url"], "cached": True, "stale": False}

    fresh = _fetch_avatars_from_api(STEAM_API_KEY, [steamid])
    if steamid in fresh:
        _save_cache({steamid: fresh[steamid]})
        return {"steamid": steamid, "avatar_url": fresh[steamid], "cached": False, "stale": False}

    cached = _load_cached(steamid)
    if cached:
        return {"steamid": steamid, "avatar_url": cached["url"], "cached": True, "stale": True}

    raise HTTPException(status_code=404, detail="Avatar not found (private or invalid SteamID).")


async def broadcaster():
    while True:
        data = json.dumps(await snapshot())
        for ws in list(connections):
            try:
                await ws.send_text(data)
            except Exception:
                try:
                    await ws.close()
                except Exception:
                    pass
                if ws in connections:
                    connections.remove(ws)
        await asyncio.sleep(POLL_MS / 1000)

@app.get("/profile/{steamid}")
def get_user_profile(
    steamid: str,
    mode: str = "Standard",
    recent_limit: int = 20,
    records_limit: int = 20,
):

    try:
        with _db_surf() as conn, conn.cursor() as cur:
            cur.execute(
                """
                SELECT PlayerName
                FROM PlayerRecords
                WHERE SteamID = %s
                ORDER BY CAST(UnixStamp AS UNSIGNED) DESC
                LIMIT 1;
                """,
                (steamid,),
            )
            row = cur.fetchone()
            playername = (row or {}).get("PlayerName")

            cur.execute(
                "SELECT GlobalPoints FROM PlayerStats WHERE SteamID = %s LIMIT 1;",
                (steamid,),
            )
            row = cur.fetchone()
            if row is not None:
                global_points = int(row.get("GlobalPoints") or 0)
                cur.execute(
                    "SELECT 1 + COUNT(*) AS rnk FROM PlayerStats WHERE GlobalPoints > %s;",
                    (global_points,),
                )
                r = cur.fetchone()
                rank = int((r or {}).get("rnk") or 0)
            else:
                global_points = 0
                rank = 0

            cur.execute(
                "SELECT COALESCE(SUM(TimesFinished),0) AS total_runs FROM PlayerRecords WHERE SteamID = %s;",
                (steamid,),
            )
            row = cur.fetchone()
            total_runs = int((row or {}).get("total_runs") or 0)
            cur.execute(
                """
                WITH player_last_finish AS (
                  SELECT
                    pr.MapName,
                    pr.SteamID,
                    MAX(CAST(pr.UnixStamp AS UNSIGNED)) AS LastFinished
                  FROM PlayerRecords pr
                  WHERE pr.SteamID = %s
                  GROUP BY pr.MapName, pr.SteamID
                ),
                player_recent_rows AS (
                  SELECT
                    pr.MapName,
                    pr.SteamID,
                    pr.TimerTicks,
                    pr.FormattedTime,
                    CAST(pr.UnixStamp AS UNSIGNED) AS LastFinished
                  FROM PlayerRecords pr
                  JOIN player_last_finish lf
                    ON lf.MapName = pr.MapName
                   AND lf.SteamID = pr.SteamID
                   AND CAST(pr.UnixStamp AS UNSIGNED) = lf.LastFinished
                ),
                leaderboard_best AS (
                  SELECT
                    MapName,
                    SteamID,
                    MIN(TimerTicks) AS BestTicks
                  FROM PlayerRecords
                  GROUP BY MapName, SteamID
                ),
                ranked AS (
                  SELECT
                    lb.*,
                    DENSE_RANK() OVER (PARTITION BY lb.MapName ORDER BY lb.BestTicks ASC) AS pos
                  FROM leaderboard_best lb
                )
                SELECT
                  prr.MapName,
                  prr.TimerTicks,
                  prr.FormattedTime,
                  prr.LastFinished,
                  r.pos AS Position
                FROM player_recent_rows prr
                LEFT JOIN ranked r
                  ON r.MapName = prr.MapName
                 AND r.SteamID = prr.SteamID
                ORDER BY prr.LastFinished DESC
                LIMIT %s;
                """,
                (steamid, recent_limit),
            )
            recent_maps = cur.fetchall() or []
            cur.execute(
                """
                WITH player_best AS (
                  SELECT
                    MapName,
                    SteamID,
                    MIN(TimerTicks) AS BestTicks,
                    MAX(CAST(UnixStamp AS UNSIGNED)) AS LastFinished
                  FROM PlayerRecords
                  WHERE SteamID = %s
                  GROUP BY MapName, SteamID
                ),
                leaderboard_best AS (
                  SELECT
                    MapName,
                    SteamID,
                    MIN(TimerTicks) AS BestTicks
                  FROM PlayerRecords
                  GROUP BY MapName, SteamID
                ),
                ranked AS (
                  SELECT
                    lb.*,
                    DENSE_RANK() OVER (PARTITION BY lb.MapName ORDER BY lb.BestTicks ASC) AS pos
                  FROM leaderboard_best lb
                )
                SELECT
                  pb.MapName,
                  pb.BestTicks AS TimerTicks,
                  (
                    SELECT pr3.FormattedTime
                    FROM PlayerRecords pr3
                    WHERE pr3.MapName = pb.MapName
                      AND pr3.SteamID = pb.SteamID
                      AND pr3.TimerTicks = pb.BestTicks
                    ORDER BY CAST(pr3.UnixStamp AS UNSIGNED) DESC
                    LIMIT 1
                  ) AS FormattedTime,
                  pb.LastFinished,
                  r.pos AS Position
                FROM player_best pb
                JOIN ranked r
                  ON r.MapName = pb.MapName
                 AND r.SteamID = pb.SteamID
                WHERE r.pos <= 10
                ORDER BY r.pos ASC, pb.BestTicks ASC, pb.MapName ASC
                LIMIT %s;
                """,
                (steamid, records_limit),
            )
            records_top = cur.fetchall() or []

        return {
            "steamid": steamid,
            "playername": playername,
            "global_points": global_points,
            "rank": rank,
            "total_runs": total_runs,
            "recent_maps": recent_maps,
            "records_top": records_top,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile build failed: {e}")

@app.get("/surf/top-external/{map_name}")
async def get_external_top_for_map(
    map_name: str,
    mode: str = Query("Standard"),
    style: str = Query("Normal"),
    bonus: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
):
    if not token:
        raise HTTPException(status_code=401, detail="Missing x-secret-key header (or STGLOBAL_SECRET env).")

    timeout = Timeout(connect=10.0, read=20.0, write=10.0, pool=5.0)

    maps = None
    last_err = None
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        for attempt in range(3):
            try:
                r = await client.post(MAPS_URL, json=MAPS_BODY, headers={"accept": "application/json"})
                if r.status_code != 200:
                    last_err = {"phase": "fetch_maps", "status": r.status_code, "body": r.text[:500]}
                else:
                    js = r.json()
                    maps = js.get("data", [])
                    break
            except Exception as e:
                last_err = {"phase": "fetch_maps", "error": str(e)}
        if maps is None:
            raise HTTPException(status_code=502, detail=last_err or {"phase": "fetch_maps", "error": "unknown"})

    target = map_name.strip().lower()
    map_obj = next((m for m in maps if str(m.get("name", "")).lower() == target), None)
    if not map_obj:
        partials = [m for m in maps if target in str(m.get("name", "")).lower()]
        map_obj = partials[0] if partials else None
    if not map_obj or "id" not in map_obj:
        suggestions = []
        if 'partials' in locals():
            suggestions = [m.get("name") for m in partials][:5]
        raise HTTPException(status_code=404, detail={"error": f"Map '{map_name}' not found", "suggestions": suggestions})

    map_id = map_obj["id"]

    sort_body = {"map_id": map_id, "style": style, "bonus": bonus, "limit": limit}
    headers = {"x-secret-key": token, "content-type": "application/json", "accept": "application/json"}

    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        try:
            r = await client.post(SORT_URL, headers=headers, json=sort_body)
        except Exception as e:
            raise HTTPException(status_code=502, detail={"phase": "sort_records", "error": str(e)})

        if r.status_code != 200:
            # Bubble up remote error body
            try:
                body = r.json()
            except Exception:
                body = r.text
            raise HTTPException(status_code=502, detail={"phase": "sort_records", "status": r.status_code, "body": body})

        return r.json()

@app.on_event("startup")
async def on_start():
    asyncio.create_task(broadcaster())

