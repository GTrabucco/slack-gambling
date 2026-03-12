import { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Box, FormLabel, Typography } from "@mui/material";
import userService from "../../../services/userService";
import pickService from "../../../services/pickService";
import gameService from "../../../services/gameService";
import StevenSelect from "../../Common/StevenSelect";
import {
  StevenTableContainer,
  StevenTable,
  StevenTableHead,
  StevenTableBody,
  StevenTableRow,
  StevenTableCell,
} from "../../Common/StevenTable";

const BUCKETS = [
  { id: "m1", label: "1 minute", minHours: 0, maxHours: 1 / 60 },
  { id: "m5", label: "5 minutes", minHours: 1 / 60, maxHours: 5 / 60 },
  { id: "m10", label: "10 minutes", minHours: 5 / 60, maxHours: 10 / 60 },
  { id: "m30", label: "30 minutes", minHours: 10 / 60, maxHours: 30 / 60 },
  { id: "h1", label: "1 hour", minHours: 30 / 60, maxHours: 1 },
  { id: "h6", label: "6 hours", minHours: 1, maxHours: 6 },
  { id: "h6to24", label: "6-24 hours", minHours: 6, maxHours: 24 },
  { id: "d1to3", label: "1-3 days", minHours: 24, maxHours: 72 },
  { id: "d3to7", label: "3-7 days", minHours: 72, maxHours: 168 },
];

const PickTiming = () => {
  const { user, isLoading } = useAuth0();
  const [users, setUsers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState("All");
  const [selectedSeason, setSelectedSeason] = useState("All");
  const [seasonOptions, setSeasonOptions] = useState(["All"]);
  const [picks, setPicks] = useState([]);
  const [games, setGames] = useState([]);

  useEffect(() => {
    if (!isLoading && user?.name) {
      setSelectedPlayer(user.name);
      getUsers();
      fetchPickHistory(user.name);
      fetchGames();
    }
  }, [isLoading, user]);

  const getUsers = async () => {
    try {
      const response = await userService.getAllUsers();
      const sorted = [...response.data].sort((a, b) => {
        const aName = (a.displayName || a.username).toLowerCase();
        const bName = (b.displayName || b.username).toLowerCase();
        return aName.localeCompare(bName);
      });

      sorted.unshift({ username: "All", displayName: "All" });
      setUsers(sorted);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchPickHistory = async (username) => {
    try {
      const response = await pickService.getPickHistory(username);
      const pickData = response.data || [];
      setPicks(pickData);

      const seasons = Array.from(
        new Set(pickData.map((i) => String(i.season)).filter(Boolean))
      ).sort((a, b) => Number(b) - Number(a));

      setSeasonOptions(["All", ...seasons]);
      setSelectedSeason((currentSeason) =>
        currentSeason === "All" || seasons.includes(currentSeason) ? currentSeason : "All"
      );
    } catch (error) {
      console.error("Error fetching picks:", error);
    }
  };

  const fetchGames = async () => {
    try {
      const historyGamesResponse = await gameService.getGamesHistory();
      setGames(historyGamesResponse.data || []);
    } catch (error) {
      console.error("Error fetching games:", error);
    }
  };

  const normalizeId = (value) => {
    if (!value) return null;
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "object") {
      if (value.$oid) return String(value.$oid);
      if (typeof value.toHexString === "function") return value.toHexString();
      if (typeof value.toString === "function") {
        const str = value.toString();
        return str && str !== "[object Object]" ? str : null;
      }
    }
    return null;
  };

  const gameTimeById = useMemo(() => {
    const map = {};
    games.forEach((game) => {
      const primaryId = normalizeId(game?._id);
      const secondaryId = normalizeId(game?.gameId);
      if (primaryId && game?.commence_time) {
        map[primaryId] = game.commence_time;
      }
      if (secondaryId && game?.commence_time) {
        map[secondaryId] = game.commence_time;
      }
    });
    return map;
  }, [games]);

  const filteredPicks = useMemo(() => {
    return (selectedSeason === "All"
      ? picks
      : picks.filter((pick) => String(pick.season) === String(selectedSeason))
    ).filter((pick) => {
      const pickGameId = normalizeId(pick.gameId);
      return pick.createdAt && pickGameId && gameTimeById[pickGameId];
    });
  }, [picks, selectedSeason, gameTimeById]);

  const bucketStats = useMemo(() => {
    const base = {};
    BUCKETS.forEach((bucket) => {
      base[bucket.id] = { wins: 0, losses: 0, pushes: 0, total: 0 };
    });

    filteredPicks.forEach((pick) => {
      const createdAt = new Date(pick.createdAt).getTime();
      const pickGameId = normalizeId(pick.gameId);
      const kickoffRaw = pickGameId ? gameTimeById[pickGameId] : null;
      const kickoff = kickoffRaw ? new Date(kickoffRaw).getTime() : NaN;

      if (Number.isNaN(createdAt) || Number.isNaN(kickoff) || kickoff <= createdAt) {
        return;
      }

      const hoursBeforeKick = (kickoff - createdAt) / (1000 * 60 * 60);
      const bucket = BUCKETS.find(
        (item) => hoursBeforeKick >= item.minHours && hoursBeforeKick < item.maxHours
      );


      if (!bucket) return;

      const stats = base[bucket.id];
      stats.total += 1;
      const result = Number(pick.result);
      if (result === 1) stats.wins += 1;
      else if (result === -1) stats.losses += 1;
      else stats.pushes += 1;
    });

    return base;
  }, [filteredPicks, gameTimeById]);

  const formatPct = (wins, losses) => {
    if (wins + losses === 0) return "-";
    return `${((wins / (wins + losses)) * 100).toFixed(1)}%`;
  };

  return (
    <StevenTableContainer sx={{ maxWidth: 900, margin: "auto", mt: 3 }}>
      <Typography variant="h5" sx={{ p: 2, fontWeight: "bold", textAlign: "center" }}>
        Pick Timing
      </Typography>
      <Typography sx={{ px: 2, pb: 1, color: "text.secondary", fontSize: 14 }}>
        Buckets are based on time between pick submission and game kickoff.
      </Typography>

      <Box sx={{ px: 2, pb: 2 }}>
        <FormLabel>Player</FormLabel>
        <StevenSelect
          value={selectedPlayer}
          onChange={(e) => {
            setSelectedPlayer(e.target.value);
            fetchPickHistory(e.target.value);
          }}
          options={users.map((u) => ({
            value: u.username,
            label: u.displayName || u.username.split("@")[0],
          }))}
        />
      </Box>

      <Box sx={{ px: 2, pb: 2 }}>
        <FormLabel>Season</FormLabel>
        <StevenSelect
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(e.target.value)}
          options={seasonOptions.map((season) => ({
            value: season,
            label: season,
          }))}
        />
      </Box>

      <StevenTableContainer sx={{ margin: "0 16px 16px 16px" }}>
        <StevenTable>
          <StevenTableHead>
            <StevenTableRow>
              <StevenTableCell sx={{ fontWeight: 700 }}>Timing Bucket</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>Record (W-L-P)</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>Win %</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>Picks</StevenTableCell>
            </StevenTableRow>
          </StevenTableHead>
          <StevenTableBody>
            {BUCKETS.map((bucket) => {
              const stats = bucketStats[bucket.id];
              return (
                <StevenTableRow key={bucket.id}>
                  <StevenTableCell>{bucket.label}</StevenTableCell>
                  <StevenTableCell>{`${stats.wins}-${stats.losses}-${stats.pushes}`}</StevenTableCell>
                  <StevenTableCell>{formatPct(stats.wins, stats.losses)}</StevenTableCell>
                  <StevenTableCell>{stats.total}</StevenTableCell>
                </StevenTableRow>
              );
            })}
          </StevenTableBody>
        </StevenTable>
      </StevenTableContainer>
    </StevenTableContainer>
  );
};

export default PickTiming;
