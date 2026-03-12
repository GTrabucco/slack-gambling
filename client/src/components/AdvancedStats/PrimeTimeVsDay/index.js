import { useCallback, useEffect, useMemo, useState } from "react";
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

const PrimeTimeVsDay = () => {
  const { user, isLoading } = useAuth0();
  const [users, setUsers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState("All");
  const [selectedSeason, setSelectedSeason] = useState("All");
  const [seasonOptions, setSeasonOptions] = useState(["All"]);
  const [picks, setPicks] = useState([]);
  const [gamesHistory, setGamesHistory] = useState([]);

  useEffect(() => {
    if (!isLoading && user?.name) {
      setSelectedPlayer(user.name);
      getUsers();
      fetchPickHistory(user.name);
      fetchGamesHistory();
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
      setSelectedSeason((current) =>
        current === "All" || seasons.includes(current) ? current : "All"
      );
    } catch (error) {
      console.error("Error fetching picks:", error);
    }
  };

  const fetchGamesHistory = async () => {
    try {
      const response = await gameService.getGamesHistory();
      setGamesHistory(response.data || []);
    } catch (error) {
      console.error("Error fetching games history:", error);
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
        const asString = value.toString();
        return asString && asString !== "[object Object]" ? asString : null;
      }
    }
    return null;
  };

  const kickoffByGameId = useMemo(() => {
    const map = {};
    gamesHistory.forEach((game) => {
      const primaryId = normalizeId(game._id);
      const secondaryId = normalizeId(game.gameId);
      if (game.commence_time && primaryId) {
        map[primaryId] = game.commence_time;
      }
      if (game.commence_time && secondaryId) {
        map[secondaryId] = game.commence_time;
      }
    });
    return map;
  }, [gamesHistory]);

  const filteredPicks = useMemo(() => {
    return (selectedSeason === "All"
      ? picks
      : picks.filter((pick) => String(pick.season) === String(selectedSeason))
    ).filter((pick) => {
      const gameId = normalizeId(pick.gameId);
      return gameId && kickoffByGameId[gameId];
    });
  }, [picks, selectedSeason, kickoffByGameId]);

  const getEasternParts = useCallback((isoDate) => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
      hour: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date(isoDate));
    const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
    return { weekday, hour };
  }, []);

  const isPrimeTime = useCallback((kickoffIso) => {
    const { weekday, hour } = getEasternParts(kickoffIso);
    if (weekday === "Thu" && hour >= 19) return true;
    if (weekday === "Sun" && hour >= 19) return true;
    if (weekday === "Mon" && hour >= 19) return true;
    return false;
  }, [getEasternParts]);

  const stats = useMemo(() => {
    const base = {
      prime: { wins: 0, losses: 0, pushes: 0 },
      day: { wins: 0, losses: 0, pushes: 0 },
    };

    filteredPicks.forEach((pick) => {
      const gameId = normalizeId(pick.gameId);
      const kickoff = kickoffByGameId[gameId];
      if (!kickoff) return;

      const bucket = isPrimeTime(kickoff) ? base.prime : base.day;
      const result = Number(pick.result);
      if (result === 1) bucket.wins += 1;
      else if (result === -1) bucket.losses += 1;
      else bucket.pushes += 1;
    });

    return base;
  }, [filteredPicks, kickoffByGameId, isPrimeTime]);

  const formatRecord = (record) => {
    const total = record.wins + record.losses + record.pushes;
    const pct = record.wins + record.losses > 0
      ? `${((record.wins / (record.wins + record.losses)) * 100).toFixed(1)}%`
      : "-";
    return `${record.wins}-${record.losses}-${record.pushes} (${pct}, ${total})`;
  };

  return (
    <StevenTableContainer sx={{ maxWidth: 900, margin: "auto", mt: 3 }}>
      <Typography variant="h5" sx={{ p: 2, fontWeight: "bold", textAlign: "center" }}>
        Prime Time vs Day
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
          options={seasonOptions.map((season) => ({ value: season, label: season }))}
        />
      </Box>

      <StevenTableContainer sx={{ margin: "0 16px 16px 16px" }}>
        <StevenTable>
          <StevenTableHead>
            <StevenTableRow>
              <StevenTableCell sx={{ fontWeight: 700 }}>Window</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>Record</StevenTableCell>
            </StevenTableRow>
          </StevenTableHead>
          <StevenTableBody>
            <StevenTableRow>
              <StevenTableCell>Prime Time (TNF/SNF/MNF)</StevenTableCell>
              <StevenTableCell>{formatRecord(stats.prime)}</StevenTableCell>
            </StevenTableRow>
            <StevenTableRow>
              <StevenTableCell>Day Games</StevenTableCell>
              <StevenTableCell>{formatRecord(stats.day)}</StevenTableCell>
            </StevenTableRow>
          </StevenTableBody>
        </StevenTable>
      </StevenTableContainer>
    </StevenTableContainer>
  );
};

export default PrimeTimeVsDay;
