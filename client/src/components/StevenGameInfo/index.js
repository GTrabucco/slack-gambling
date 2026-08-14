import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import PageLoader from "../PageLoader";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";

import StevenButton from "../Common/StevenButton";
import gameService from "../../services/gameService";
import apiClient from "../../services/apiClient";

const INJURY_ABBR = { "IR": "IR", "Out": "O", "Doubtful": "D", "Questionable": "Q", "Probable": "P" };
const INJURY_COLOR = { "IR": "#d32f2f", "Out": "#d32f2f", "Doubtful": "#d32f2f", "Questionable": "#ed6c02", "Probable": "#2e7d32" };

const teamLogoSrc = (teamName) => {
  if (!teamName) return null;
  const last = teamName.trim().split(" ").pop();
  return `/logos/${last}.png`;
};

const rankColor = (rank) => {
  if (!rank || rank < 1 || rank > 32) return 'rgba(255,255,255,0.3)';
  const hue = Math.round((32 - rank) / 31 * 120);
  return `hsl(${hue}, 65%, 42%)`;
};

const SECTIONS = ['Offense', 'Defense'];

const StatsPanel = ({ awayTeam, homeTeam, awayStats, homeStats }) => {
  const awayMap = {};
  const homeMap = {};
  for (const s of (awayStats || [])) awayMap[`${s.section}__${s.label}`] = s;
  for (const s of (homeStats || [])) homeMap[`${s.section}__${s.label}`] = s;

  const allKeys = [...new Set([...(awayStats || []), ...(homeStats || [])].map(s => `${s.section}__${s.label}`))];

  return (
    <Box>
      <Box sx={{ display: "flex", mb: 1, px: 0.5 }}>
        <Box sx={{ flex: 1 }} />
        <Box sx={{ width: 80, textAlign: "center" }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary" }}>{awayTeam?.split(" ").pop()}</Typography>
        </Box>
        <Box sx={{ width: 80, textAlign: "center" }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary" }}>{homeTeam?.split(" ").pop()}</Typography>
        </Box>
      </Box>
      {SECTIONS.map(section => {
        const rows = allKeys.filter(k => k.startsWith(section + '__'));
        if (!rows.length) return null;
        return (
          <Box key={section} sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, mb: 0.5, px: 0.5 }}>
              {section}
            </Typography>
            {rows.map(key => {
              const label = key.split('__')[1];
              const away = awayMap[key];
              const home = homeMap[key];
              return (
                <Box key={key} sx={{ display: "flex", alignItems: "center", py: 0.5, borderBottom: "1px solid rgba(255,255,255,0.04)", px: 0.5 }}>
                  <Typography sx={{ flex: 1, fontSize: 12, color: "text.secondary" }}>{label}</Typography>
                  {[away, home].map((s, i) => (
                    <Box key={i} sx={{ width: 80, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{s?.displayValue ?? '—'}</Typography>
                      {s?.rank && (
                        <Box sx={{
                          bgcolor: rankColor(s.rank),
                          color: "#fff",
                          fontSize: 9,
                          fontWeight: 700,
                          borderRadius: "4px",
                          px: 0.4,
                          py: 0.1,
                          minWidth: 18,
                          textAlign: "center",
                          lineHeight: "14px",
                        }}>
                          {s.rank}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
};

const DepthChartList = ({ teamName, formations, injuries }) => {
  const injuryMap = {};
  for (const inj of (injuries || [])) {
    if (inj.name && INJURY_ABBR[inj.status]) injuryMap[inj.name] = inj.status;
  }

  return (
  <Box sx={{ flex: 1, minWidth: 0 }}>
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 1 }}>
      <img src={teamLogoSrc(teamName)} alt="" width={28} height={28} style={{ objectFit: "contain" }} />
      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{teamName}</Typography>
    </Box>
    {!formations?.length ? (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
        No roster available
      </Typography>
    ) : (
      formations.map((formation, fi) => (
        <Box key={fi} sx={{ mb: 1.5 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", mb: 0.5, letterSpacing: 0.5 }}>
            {formation.name}
          </Typography>
          {formation.positions.map((pos, pi) => {
            const injStatus = injuryMap[pos.player];
            const isBackup = pos.rank >= 2;
            return (
              <Box key={pi} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.4, borderBottom: "1px solid rgba(255,255,255,0.04)", opacity: isBackup ? 0.65 : 1 }}>
                <Typography sx={{ fontSize: 12, color: "text.secondary", minWidth: 40 }}>{isBackup ? "" : pos.position}</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  {injStatus && (
                    <Box sx={{
                      bgcolor: INJURY_COLOR[injStatus],
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: "50%",
                      width: 18,
                      height: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {INJURY_ABBR[injStatus]}
                    </Box>
                  )}
                  <Typography sx={{ fontSize: isBackup ? 11 : 12, fontWeight: isBackup ? 400 : 500, textAlign: "right" }}>{pos.player}</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      ))
    )}
  </Box>
  );
};

const ATS_TYPE_NAMES = {
  atsOverall: "Overall ATS",
  atsFavorite: "Favorite ATS",
  atsUnderdog: "Underdog ATS",
  atsHome: "Home ATS",
  atsAway: "Away ATS",
  atsHomeFavorite: "Home Fav ATS",
  atsHomeUnderdog: "Home Dog ATS",
  atsAwayFavorite: "Away Fav ATS",
  atsAwayUnderdog: "Away Dog ATS",
};

const formatAts = (item) => {
  if (!item) return "—";
  const { wins, losses, pushes } = item;
  return pushes ? `${wins}-${losses}-${pushes}` : `${wins}-${losses}`;
};

const getAtsKeys = (isFavorite, isHome) => {
  const keys = ["atsOverall"];
  if (isFavorite) {
    keys.push("atsFavorite");
    if (isHome) keys.push("atsHome", "atsHomeFavorite");
    else keys.push("atsAway", "atsAwayFavorite");
  } else {
    keys.push("atsUnderdog");
    if (isHome) keys.push("atsHome", "atsHomeUnderdog");
    else keys.push("atsAway", "atsAwayUnderdog");
  }
  return keys;
};

const AtsPanel = ({ awayTeam, homeTeam, awayAts, homeAts, awaySpread, homeSpread }) => {
  const homeFav = homeSpread != null && awaySpread != null && +homeSpread < +awaySpread;
  const awayFav = awaySpread != null && homeSpread != null && +awaySpread < +homeSpread;
  if (!homeAts?.length && !awayAts?.length) return null;

  const buildMap = (items) => {
    const m = {};
    for (const item of (items || [])) m[item.type?.name] = item;
    return m;
  };
  const awayMap = buildMap(awayAts);
  const homeMap = buildMap(homeAts);
  const awayKeys = getAtsKeys(awayFav, false);
  const homeKeys = getAtsKeys(homeFav, true);

  const rows = [...new Set([...awayKeys, ...homeKeys])];

  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, mb: 1, px: 0.5 }}>
        Against the Spread
      </Typography>
      <Box sx={{ display: "flex", mb: 0.5, px: 0.5 }}>
        <Box sx={{ flex: 1 }} />
        <Box sx={{ width: 80, textAlign: "center" }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary" }}>{awayTeam?.split(" ").pop()}</Typography>
        </Box>
        <Box sx={{ width: 80, textAlign: "center" }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary" }}>{homeTeam?.split(" ").pop()}</Typography>
        </Box>
      </Box>
      {rows.map(key => (
        <Box key={key} sx={{ display: "flex", alignItems: "center", py: 0.5, borderBottom: "1px solid rgba(255,255,255,0.04)", px: 0.5 }}>
          <Typography sx={{ flex: 1, fontSize: 12, color: "text.secondary" }}>{ATS_TYPE_NAMES[key] ?? key}</Typography>
          <Box sx={{ width: 80, textAlign: "center" }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{awayKeys.includes(key) ? formatAts(awayMap[key]) : ""}</Typography>
          </Box>
          <Box sx={{ width: 80, textAlign: "center" }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{homeKeys.includes(key) ? formatAts(homeMap[key]) : ""}</Typography>
          </Box>
        </Box>
      ))}
      <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.10)", mt: 2 }} />
    </Box>
  );
};

const formatMovementTime = (ts) =>
  new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

const formatSpread = (val) => { const n = parseFloat(val); return n > 0 ? `+${n}` : `${n}`; };

const LineFeed = ({ movements, loading, homeSpread, awaySpread, over }) => {
  if (loading) return <PageLoader />;
  if (!movements.length) return (
    <Typography sx={{ color: "text.secondary", textAlign: "center", pt: 4, fontSize: 13 }}>
      No line movements recorded for this game yet.
    </Typography>
  );

  // Build sorted columns (unique timestamps, oldest → newest, plus "Now" at end)
  const sorted = [...movements].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const colKeys = sorted.map(m => String(m.timestamp));
  const colKeysUniq = [...new Set(colKeys)];

  // For each column timestamp, what were the values?
  // We need to track running state per category
  const ROWS = [
    { key: "favSpread", label: "Fav Spread" },
    { key: "dogSpread", label: "Dog Spread" },
    { key: "over",      label: "Over" },
    { key: "under",     label: "Under" },
  ];

  // Build a map: colKey → { favSpread, dogSpread, over, under } with only changed values
  const cellMap = {};
  for (const col of colKeysUniq) cellMap[col] = {};

  for (const mov of sorted) {
    const col = String(mov.timestamp);
    if (mov.type === "spread") {
      const homeN = parseFloat(mov.to.home);
      const awayN = parseFloat(mov.to.away);
      const favIsHome = homeN < awayN;
      cellMap[col].favSpread = formatSpread(favIsHome ? homeN : awayN);
      cellMap[col].dogSpread = formatSpread(favIsHome ? awayN : homeN);
    } else if (mov.type === "total") {
      cellMap[col].over = String(mov.to);
      cellMap[col].under = String(mov.to);
    }
  }

  // Current live values
  const homeN = parseFloat(homeSpread);
  const awayN = parseFloat(awaySpread);
  const favIsHome = homeN < awayN;
  const nowCol = {
    favSpread: formatSpread(favIsHome ? homeN : awayN),
    dogSpread: formatSpread(favIsHome ? awayN : homeN),
    over: over != null ? String(over) : null,
    under: over != null ? String(over) : null,
  };

  const allCols = [...colKeysUniq, "now"];

  const COL_W = 90;

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box sx={{ minWidth: (allCols.length + 1) * COL_W }}>
        {/* Header row */}
        <Box sx={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.1)", pb: 0.5, mb: 0.5 }}>
          <Box sx={{ width: COL_W, flexShrink: 0 }} />
          {colKeysUniq.map(col => (
            <Box key={col} sx={{ width: COL_W, flexShrink: 0, textAlign: "center" }}>
              <Typography sx={{ fontSize: 10, color: "text.disabled", lineHeight: 1.3 }}>
                {formatMovementTime(col)}
              </Typography>
            </Box>
          ))}
          <Box sx={{ width: COL_W, flexShrink: 0, textAlign: "center" }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: "text.secondary" }}>Now</Typography>
          </Box>
        </Box>

        {/* Data rows */}
        {ROWS.map(({ key, label }) => (
          <Box key={key} sx={{ display: "flex", alignItems: "center", py: 0.75, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <Box sx={{ width: COL_W, flexShrink: 0 }}>
              <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>{label}</Typography>
            </Box>
            {colKeysUniq.map(col => {
              const val = cellMap[col][key];
              return (
                <Box key={col} sx={{ width: COL_W, flexShrink: 0, textAlign: "center" }}>
                  <Typography sx={{ fontSize: 13, color: val ? "text.primary" : "text.disabled" }}>
                    {val ?? "—"}
                  </Typography>
                </Box>
              );
            })}
            <Box sx={{ width: COL_W, flexShrink: 0, textAlign: "center" }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                {nowCol[key] ?? "—"}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const StevenGameInfo = ({ showStevenInfo, selectedGameId, setShowStevenInfo, homeTeam, awayTeam, homeSpread, awaySpread, over }) => {
  const [weatherData, setWeatherData] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [injuryLoading, setInjuryLoading] = useState(false);
  const [depthLoading, setDepthLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [atsLoading, setAtsLoading] = useState(false);
  const [injuries, setInjuries] = useState({ home: [], away: [] });
  const [depthChart, setDepthChart] = useState({ home: [], away: [] });
  const [teamStats, setTeamStats] = useState({ home: [], away: [] });
  const [atsData, setAtsData] = useState({ home: null, away: null });
  const [cityName, setCityName] = useState("");
  const [tab, setTab] = useState(0);
  const [lineMovements, setLineMovements] = useState([]);
  const [lineMovementsLoading, setLineMovementsLoading] = useState(false);

  const handleShowStevenInfo = () => {
    setShowStevenInfo(false);
  };

  const getGame = async () => {
    try {
      const response = await gameService.getGame(selectedGameId);
      const game = response.data?.[0];
      if (!game) throw new Error("Game not found");
      await populate(game.home_team, game.away_team, game.commence_time);
    } catch (error) {
      console.error("Error fetching game:", error);
      setWeatherData([]);
      setWeatherLoading(false);
    }
  };

  const getCityFromTeam = (homeTeam) => {
    if (!homeTeam) return "";
    let home_team_location = homeTeam.split(" ")[0];
    if (homeTeam.split(" ").length > 2) {
      home_team_location = homeTeam.split(" ")[0] + " " + homeTeam.split(" ")[1];
    } 

    switch (home_team_location) {
      case "New England":
        return "Foxborough";
      case "Arizona":
        return "Glendale";
      case "Carolina":
        return "Charlotte";
      case "Minnesotta":
        return "Minneapolis";
      case "Tennessee":
        return "Nashville";
      case "New York":
        return "East Rutherford";
      case "Buffalo":
        return "Orchard Park"
      case "Dallas":
        return "Arlington"
      case "San Francisco":
        return "Santa Clara"
    }

    return home_team_location;
  };

  const getTimeZone = (city) => {
    const cityTimeZones = {
      "Foxborough": "America/New_York",
      "Orchard Park": "America/New_York",   
      "Miami": "America/New_York",
      "East Rutherford": "America/New_York",
      "Philadelphia": "America/New_York",
      "Washington": "America/New_York",
      "Chicago": "America/Chicago",
      "Detroit": "America/Detroit",
      "Green Bay": "America/Chicago",
      "Minneapolis": "America/Chicago",
      "Atlanta": "America/New_York",
      "Charlotte": "America/New_York",
      "New Orleans": "America/Chicago",
      "Tampa Bay": "America/New_York",
      "Arlington": "America/Chicago",
      "Houston": "America/Chicago",
      "Indianapolis": "America/Indiana/Indianapolis",
      "Jacksonville": "America/New_York",
      "Nashville": "America/Chicago",
      "Denver": "America/Denver", 
      "Kansas City": "America/Chicago",
      "Las Vegas": "America/Los_Angeles",
      "Los Angeles": "America/Los_Angeles",
      "Santa Clara": "America/Los_Angeles",
      "Seattle": "America/Los_Angeles",
      "Glendale": "America/Phoenix",
      "Pittsburgh": "America/New_York",
      "Baltimore": "America/New_York",
      "Cincinnati": "America/New_York",
      "Cleveland": "America/New_York",
      "Carolina": "America/New_York",
      "Charlotte": "America/New_York"
    };

    return cityTimeZones[city] || "Unknown city";
  }

  const cityCoordinates = {
    "Glendale":      { latitude: 33.5277, longitude: -112.2626 },
    "Atlanta":       { latitude: 33.7490, longitude: -84.3880 },
    "Baltimore":     { latitude: 39.2904, longitude: -76.6122 },
    "Orchard Park":  { latitude: 42.7738, longitude: -78.7869 },
    "Charlotte":     { latitude: 35.2251, longitude: -80.8526 },
    "Chicago":       { latitude: 41.8781, longitude: -87.6298 },
    "Cincinnati":    { latitude: 39.1031, longitude: -84.5120 },
    "Cleveland":     { latitude: 41.4993, longitude: -81.6944 },
    "Arlington":     { latitude: 32.7473, longitude: -97.0945 },
    "Denver":        { latitude: 39.7392, longitude: -104.9903 },
    "Detroit":       { latitude: 42.3314, longitude: -83.0458 },
    "Green Bay":     { latitude: 44.5133, longitude: -88.0133 },
    "Houston":       { latitude: 29.7604, longitude: -95.3698 },
    "Indianapolis":  { latitude: 39.7684, longitude: -86.1581 },
    "Jacksonville":  { latitude: 30.3322, longitude: -81.6557 },
    "Kansas City":   { latitude: 39.0997, longitude: -94.5786 },
    "Las Vegas":     { latitude: 36.1699, longitude: -115.1398 },
    "Los Angeles":   { latitude: 34.0522, longitude: -118.2437 }, 
    "Miami":         { latitude: 25.7617, longitude: -80.1918 },
    "Minnesota":     { latitude: 44.9778, longitude: -93.2650 }, 
    "Foxborough":    { latitude: 42.0909, longitude: -71.2643 },
    "New Orleans":   { latitude: 29.9511, longitude: -90.0715 },
    "East Rutherford": { latitude: 40.8128, longitude: -74.0742 }, 
    "Philadelphia":  { latitude: 39.9526, longitude: -75.1652 },
    "Pittsburgh":    { latitude: 40.4406, longitude: -79.9959 },
    "Santa Clara":   { latitude: 37.4030, longitude: -121.9700 },
    "Seattle":       { latitude: 47.6062, longitude: -122.3321 },
    "Tampa Bay":     { latitude: 27.9506, longitude: -82.4572 },
    "Tennessee":     { latitude: 36.1627, longitude: -86.7816 },
    "Washington":    { latitude: 38.9072, longitude: -77.0369 },
  };

  function getCityLatitude(city) {
    return cityCoordinates[city]?.latitude ?? null;
  }

  function getCityLongitude(city) {
    return cityCoordinates[city]?.longitude ?? null;
  }

  const getWeather = async (city, gameDate) => {
    try {
      if (!city || !gameDate) return [];
      const cityLongitude = getCityLongitude(city);
      const cityLatitude = getCityLatitude(city);
      const timeZone = getTimeZone(city) || "UTC";
      const localDate = new Date(new Date(gameDate).toLocaleString("en-US", { timeZone }));
      const formattedDate = localDate.toISOString().split("T")[0];
      const localHour = localDate.getHours();

      const res = await apiClient.get('/api/weather', {
        params: {
          city,
          date: formattedDate,
          lat: cityLatitude,
          lon: cityLongitude,
          timezone: timeZone,
          commenceTime: gameDate,
        },
      });

      const allHours = res.data;
      if (!allHours?.length) return [];

      return allHours.slice(localHour, Math.min(localHour + 4, 24));
    } catch (error) {
      console.error("Error fetching weather:", error);
      return [];
    }
  };

  const populate = async (home, away, gameDate) => {
    try {
      setWeatherLoading(true);
      setInjuryLoading(true);
      setDepthLoading(true);
      setStatsLoading(true);
      setAtsLoading(true);
      const city = getCityFromTeam(home);
      setCityName(city);
      const [next4Hours, injuryRes, depthRes, statsRes, atsRes] = await Promise.all([
        getWeather(city, gameDate),
        apiClient.get(`/api/injuries?home=${encodeURIComponent(home)}&away=${encodeURIComponent(away)}&commenceTime=${encodeURIComponent(gameDate)}`)
          .then(r => r.data || { home: [], away: [] })
          .catch(() => ({ home: [], away: [] })),
        apiClient.get(`/api/depthchart?home=${encodeURIComponent(home)}&away=${encodeURIComponent(away)}&commenceTime=${encodeURIComponent(gameDate)}`)
          .then(r => r.data || { home: [], away: [] })
          .catch(() => ({ home: [], away: [] })),
        apiClient.get(`/api/stats?home=${encodeURIComponent(home)}&away=${encodeURIComponent(away)}`)
          .then(r => r.data || { home: [], away: [] })
          .catch(() => ({ home: [], away: [] })),
        apiClient.get(`/api/ats?home=${encodeURIComponent(home)}&away=${encodeURIComponent(away)}&homeSpread=${encodeURIComponent(homeSpread ?? '')}&awaySpread=${encodeURIComponent(awaySpread ?? '')}`)
          .then(r => r.data || { home: null, away: null })
          .catch(() => ({ home: null, away: null })),
      ]);
      setWeatherData(next4Hours);
      setInjuries(injuryRes);
      setDepthChart(depthRes);
      setTeamStats(statsRes);
      setAtsData(atsRes || { home: null, away: null });
    } catch (error) {
      console.error("Error populating game info:", error);
      setWeatherData([]);
      setInjuries({ home: [], away: [] });
      setDepthChart({ home: [], away: [] });
      setAtsData({ home: null, away: null });
    } finally {
      setWeatherLoading(false);
      setInjuryLoading(false);
      setDepthLoading(false);
      setStatsLoading(false);
      setAtsLoading(false);
    }
  };

  useEffect(() => {
    if (showStevenInfo) {
      setTab(0);
      getGame();
      setLineMovementsLoading(true);
      gameService.getLineMovements(selectedGameId)
        .then(r => setLineMovements(r.data || []))
        .catch(() => setLineMovements([]))
        .finally(() => setLineMovementsLoading(false));
    } else {
      setWeatherData([]);
      setInjuries({ home: [], away: [] });
      setDepthChart({ home: [], away: [] });
      setTeamStats({ home: [], away: [] });
      setAtsData({ home: null, away: null });
      setWeatherLoading(true);
      setLineMovements([]);
    }
  }, [showStevenInfo, selectedGameId]);

  return (
    <Dialog open={showStevenInfo} onClose={handleShowStevenInfo} maxWidth="sm" fullWidth>
      {(awayTeam || homeTeam || over != null) && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, px: 2, pt: 1.5, pb: 0.5, flexWrap: "wrap" }}>
          {(() => {
            const awayFav = awaySpread != null && homeSpread != null && +awaySpread < +homeSpread;
            const homeFav = homeSpread != null && awaySpread != null && +homeSpread < +awaySpread;
            const spreadStr = (val) => +val > 0 ? `+${val}` : `${val}`;
            return (
              <>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                  {awayTeam}{awayFav && awaySpread != null ? ` (${spreadStr(awaySpread)})` : ""}
                </Typography>
                <Typography sx={{ fontSize: 13, color: "text.secondary" }}>@</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                  {homeTeam}{homeFav && homeSpread != null ? ` (${spreadStr(homeSpread)})` : ""}
                </Typography>
                {over != null && (
                  <>
                    <Typography sx={{ fontSize: 13, color: "text.secondary" }}>·</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Total: {over}</Typography>
                  </>
                )}
              </>
            );
          })()}
        </Box>
      )}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
        <Tab label="Weather" />
        <Tab label="Depth Chart" />
        <Tab label="Stats" />
        <Tab label="Lines" />
      </Tabs>
      <DialogContent dividers>
        {tab === 0 && (
          weatherLoading ? (
            <PageLoader />
          ) : weatherData.length ? (
            <>
              <Typography variant="body2" sx={{ mb: 1 }}>Note: time displayed in local time</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>City: {cityName}</Typography>
              <Grid container spacing={2}>
                {weatherData.map((hour) => {
                  const [hh, mm] = hour.time.split("T")[1].split(":");
                  const hour12 = ((+hh + 11) % 12) + 1;
                  const ampm = +hh >= 12 ? "PM" : "AM";
                  const formattedTime = `${hour12}:${mm} ${ampm}`;
                  return (
                    <Grid item xs={12} key={hour.time}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="body2"><b>Time:</b> {formattedTime}</Typography>
                          <Typography variant="body2"><b>Temp:</b> {hour.temperature}°F</Typography>
                          <Typography variant="body2"><b>Wind:</b> {hour.wind} mph</Typography>
                          <Typography variant="body2"><b>Precipitation:</b> {hour.precipitation}%</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </>
          ) : (
            <Typography>No weather data available</Typography>
          )
        )}
        {tab === 1 && (
          depthLoading ? (
            <PageLoader />
          ) : (
            <Box sx={{ display: "flex", gap: 3 }}>
              <DepthChartList teamName={awayTeam} formations={depthChart.away} injuries={injuries.away} />
              <Box sx={{ width: "1px", bgcolor: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
              <DepthChartList teamName={homeTeam} formations={depthChart.home} injuries={injuries.home} />
            </Box>
          )
        )}
        {tab === 2 && (
          <>
            {statsLoading ? <PageLoader /> : (
              <>
                <AtsPanel
                  awayTeam={awayTeam}
                  homeTeam={homeTeam}
                  awayAts={atsData.away}
                  homeAts={atsData.home}
                  awaySpread={awaySpread}
                  homeSpread={homeSpread}
                />
                <StatsPanel awayTeam={awayTeam} homeTeam={homeTeam} awayStats={teamStats.away} homeStats={teamStats.home} />
              </>
            )}
          </>
        )}
        {tab === 3 && (
          <LineFeed movements={lineMovements} loading={lineMovementsLoading} homeSpread={homeSpread} awaySpread={awaySpread} over={over} />
        )}
      </DialogContent>
      <DialogActions>
        <StevenButton onClick={handleShowStevenInfo}>Close</StevenButton>
      </DialogActions>
    </Dialog>
  );
};

export default StevenGameInfo;
