import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import userService from "../../../services/userService";
import {
  Typography,
  FormLabel,
  Box,
} from "@mui/material";
import pickService from "../../../services/pickService";
import StevenSelect from "../../Common/StevenSelect";
import {
  StevenTableContainer,
  StevenTable,
  StevenTableBody,
  StevenTableRow,
  StevenTableCell,
} from "../../Common/StevenTable";

const Statistics = () => {
  const { user, isLoading } = useAuth0();
  const [users, setUsers] = useState([]);
  const [picks, setPicks] = useState([]);
  const [seasonOptions, setSeasonOptions] = useState(["All"]);
  const [selectedPlayer, setSelectedPlayer] = useState("All");
  const [selectedSeason, setSelectedSeason] = useState("All");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && user?.name) {
      setSelectedPlayer(user.name);
      getUsers();
      fetchPickHistory(user.name);
    }
  }, [isLoading, user]);

  const fetchPickHistory = async (username) => {
    try {
      const response = await pickService.getPickHistory(username)
      const pickData = response.data || [];
      setPicks(pickData);

      const seasons = Array.from(
        new Set(pickData.map((i) => String(i.season)).filter(Boolean))
      ).sort((a, b) => Number(b) - Number(a));

      setSeasonOptions(["All", ...seasons]);
      setSelectedSeason((currentSeason) =>
        currentSeason === "All" || seasons.includes(currentSeason) ? currentSeason : "All"
      );
    } catch {
      setError("Error fetching picks");
    }
  };

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
    } catch {
      setError("Error fetching users");
    }
  };

  const getRecord = (data, type) => {
    const wins = data.filter(i => i.type === type && i.result === 1).length;
    const losses = data.filter(i => i.type === type && i.result === -1).length;
    const pushes = data.filter(i => i.type === type && i.result === 0).length;
    const pct = wins + losses > 0
      ? ((wins / (wins + losses)) * 100).toFixed(1)
      : "0.0";

    return `${wins} - ${losses} - ${pushes} (${pct}%)`;
  };

  const getWeekSums = (data, groupByUser) => {
    const keyFn = groupByUser
      ? i => `${i.username}-${i.season}-${i.week}`
      : i => `${i.season}-${i.week}`;

    return Object.values(
      Object.groupBy(data, keyFn)
    ).map(week => week.reduce((sum, i) => sum + i.result, 0));
  };

  const getPerfectWeeks = (data) => {
    const sums = getWeekSums(data, selectedPlayer === "All");
    return sums.filter(s => s === 4).length;
  };

  const getNegativeWeeks = (data) => {
    const sums = getWeekSums(data, selectedPlayer === "All");
    return sums.filter(s => s === -4).length;
  };

  const getPlusWeeks = (data) => {
    const sums = getWeekSums(data, selectedPlayer === "All");
    return sums.filter(s => s > 0).length;
  };

  const getMinusWeeks = (data) => {
    const sums = getWeekSums(data, selectedPlayer === "All");
    return sums.filter(s => s < 0).length;
  };

  const getOverallRecord = (data) => {
    const wins = data.filter(i => i.result === 1).length;
    const losses = data.filter(i => i.result === -1).length;
    const pushes = data.filter(i => i.result === 0).length;

    const pct = wins + losses > 0
      ? ((wins / (wins + losses)) * 100).toFixed(1)
      : "0.0";

    return `${wins} - ${losses} - ${pushes} (${pct}%)`;
  };

  const filteredPicks = selectedSeason === "All"
    ? picks
    : picks.filter((pick) => String(pick.season) === String(selectedSeason));

  return (
    <>
      <StevenTableContainer sx={{ maxWidth: 600, margin: "auto", mt: 3 }}>

        <Typography variant="h5" sx={{ p: 2, fontWeight: "bold", textAlign: "center" }}>
          Statistics
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

        <StevenTableContainer sx={{ maxWidth: 600, margin: "auto", mb: 3 }}>
          <StevenTable>
            <StevenTableBody>
              <StevenTableRow>
                <StevenTableCell>Overall</StevenTableCell>
                <StevenTableCell>{getOverallRecord(filteredPicks)}</StevenTableCell>
              </StevenTableRow>
              <StevenTableRow><StevenTableCell>Favorites</StevenTableCell><StevenTableCell>{getRecord(filteredPicks, "favorite")}</StevenTableCell></StevenTableRow>
              <StevenTableRow><StevenTableCell>Underdogs</StevenTableCell><StevenTableCell>{getRecord(filteredPicks, "dog")}</StevenTableCell></StevenTableRow>
              <StevenTableRow><StevenTableCell>Overs</StevenTableCell><StevenTableCell>{getRecord(filteredPicks, "over")}</StevenTableCell></StevenTableRow>
              <StevenTableRow><StevenTableCell>Unders</StevenTableCell><StevenTableCell>{getRecord(filteredPicks, "under")}</StevenTableCell></StevenTableRow>
              <StevenTableRow><StevenTableCell>4/4 Weeks</StevenTableCell><StevenTableCell>{getPerfectWeeks(filteredPicks)}</StevenTableCell></StevenTableRow>
              <StevenTableRow><StevenTableCell>0/4 Weeks</StevenTableCell><StevenTableCell>{getNegativeWeeks(filteredPicks)}</StevenTableCell></StevenTableRow>
              <StevenTableRow><StevenTableCell>Positive Weeks</StevenTableCell><StevenTableCell>{getPlusWeeks(filteredPicks)}</StevenTableCell></StevenTableRow>
              <StevenTableRow><StevenTableCell>Negative Weeks</StevenTableCell><StevenTableCell>{getMinusWeeks(filteredPicks)}</StevenTableCell></StevenTableRow>
            </StevenTableBody>
          </StevenTable>
        </StevenTableContainer>
      </StevenTableContainer>
    </>
  );
};

export default Statistics;
