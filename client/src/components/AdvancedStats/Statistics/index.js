import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Typography,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";

const Statistics = () => {
  const { user, isLoading } = useAuth0();
  const apiBaseUrl = process.env.NODE_ENV === "production" ? "" : "http://localhost:5000";

  const [users, setUsers] = useState([]);
  const [picks, setPicks] = useState([]);
  const [pickGroups, setPickGroups] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState("All");
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
      const response = await axios.get(`${apiBaseUrl}/api/get-pick-history`, {
        params: username !== "All" ? { username } : {}
      });

      setPicks(response.data);

      const grouped = Object.values(
        Object.groupBy(response.data, i => i.season)
      ).reverse();

      setPickGroups(grouped);
    } catch {
      setError("Error fetching picks");
    }
  };

  const getUsers = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/get-users`);

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

  const getPerfectWeeks = (season) => {
    const data = season ? picks.filter(p => p.season === season) : picks;
    const sums = getWeekSums(data, selectedPlayer === "All");
    return sums.filter(s => s === 4).length;
  };

  const getNegativeWeeks = (season) => {
    const data = season ? picks.filter(p => p.season === season) : picks;
    const sums = getWeekSums(data, selectedPlayer === "All");
    return sums.filter(s => s === -4).length;
  };

  const getPlusWeeks = (season) => {
    const data = season ? picks.filter(p => p.season === season) : picks;
    const sums = getWeekSums(data, selectedPlayer === "All");
    return sums.filter(s => s > 0).length;
  };

  const getMinusWeeks = (season) => {
    const data = season ? picks.filter(p => p.season === season) : picks;
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

  return (
    <>
      <TableContainer component={Paper} sx={{ maxWidth: 600, margin: "auto", mt: 3 }}>

        <Typography variant="h5" sx={{ p: 2, fontWeight: "bold", textAlign: "center" }}>
          Statistics
        </Typography>

        <FormControl fullWidth sx={{ px: 2, pb: 2 }}>
          <Select
            value={selectedPlayer}
            onChange={(e) => {
              setSelectedPlayer(e.target.value);
              fetchPickHistory(e.target.value);
            }}
          >
            {users.map(u => (
              <MenuItem key={u.username} value={u.username}>
                {u.displayName || u.username.split("@")[0]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TableContainer component={Paper} sx={{ maxWidth: 600, margin: "auto", mb: 3 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>Overall Record</TableCell>
                <TableCell>{getOverallRecord(picks)}</TableCell>
              </TableRow>
              <TableRow><TableCell>Favorites</TableCell><TableCell>{getRecord(picks, "favorite")}</TableCell></TableRow>
              <TableRow><TableCell>Underdogs</TableCell><TableCell>{getRecord(picks, "dog")}</TableCell></TableRow>
              <TableRow><TableCell>Overs</TableCell><TableCell>{getRecord(picks, "over")}</TableCell></TableRow>
              <TableRow><TableCell>Unders</TableCell><TableCell>{getRecord(picks, "under")}</TableCell></TableRow>
              <TableRow><TableCell>4/4 Weeks</TableCell><TableCell>{getPerfectWeeks()}</TableCell></TableRow>
              <TableRow><TableCell>0/4 Weeks</TableCell><TableCell>{getNegativeWeeks()}</TableCell></TableRow>
              <TableRow><TableCell>Positive Weeks</TableCell><TableCell>{getPlusWeeks()}</TableCell></TableRow>
              <TableRow><TableCell>Negative Weeks</TableCell><TableCell>{getMinusWeeks()}</TableCell></TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {pickGroups.map(seasonData => {
          const season = seasonData[0].season;
          return (
            <TableContainer component={Paper} sx={{ maxWidth: 600, margin: "auto", mb: 3 }} key={season}>
              <Typography variant="h6" sx={{ p: 1, fontWeight: "bold", textAlign: "center" }}>
                {season} Stats
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>{season} Record</TableCell>
                    <TableCell>{getOverallRecord(seasonData)}</TableCell>
                  </TableRow>
                  <TableRow><TableCell>Favorites</TableCell><TableCell>{getRecord(seasonData, "favorite")}</TableCell></TableRow>
                  <TableRow><TableCell>Underdogs</TableCell><TableCell>{getRecord(seasonData, "dog")}</TableCell></TableRow>
                  <TableRow><TableCell>Overs</TableCell><TableCell>{getRecord(seasonData, "over")}</TableCell></TableRow>
                  <TableRow><TableCell>Unders</TableCell><TableCell>{getRecord(seasonData, "under")}</TableCell></TableRow>
                  <TableRow><TableCell>4/4 Weeks</TableCell><TableCell>{getPerfectWeeks(season)}</TableCell></TableRow>
                  <TableRow><TableCell>0/4 Weeks</TableCell><TableCell>{getNegativeWeeks(season)}</TableCell></TableRow>
                  <TableRow><TableCell>Positive Weeks</TableCell><TableCell>{getPlusWeeks(season)}</TableCell></TableRow>
                  <TableRow><TableCell>Negative Weeks</TableCell><TableCell>{getMinusWeeks(season)}</TableCell></TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          );
        })}
      </TableContainer>
    </>
  );
};

export default Statistics;
