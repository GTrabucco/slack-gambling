import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "./style.css";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  FormControl,
  Select,
  MenuItem
} from "@mui/material";
import userService from "../../../services/userService";
import pickService from "../../../services/pickService";

const TeamsBet = () => {
  const { user, isLoading } = useAuth0();
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [teamCounts, setTeamCounts] = useState({});
  const [teamRecords, setTeamRecords] = useState({});

  const TEAM_NAMES = [
    "Arizona Cardinals","Atlanta Falcons","Baltimore Ravens","Buffalo Bills",
    "Carolina Panthers","Chicago Bears","Cincinnati Bengals","Cleveland Browns",
    "Dallas Cowboys","Denver Broncos","Detroit Lions","Green Bay Packers",
    "Houston Texans","Indianapolis Colts","Jacksonville Jaguars","Kansas City Chiefs",
    "Las Vegas Raiders","Los Angeles Chargers","Los Angeles Rams","Miami Dolphins",
    "Minnesota Vikings","New England Patriots","New Orleans Saints","New York Giants",
    "New York Jets","Philadelphia Eagles","Pittsburgh Steelers","San Francisco 49ers",
    "Seattle Seahawks","Tampa Bay Buccaneers","Tennessee Titans","Washington Commanders"
  ];

  useEffect(() => {
    if (!isLoading && user?.name) {
      setSelectedPlayer(user.name);
      getUsers();
      fetchPickHistory(user.name);
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
    } catch {
      setError("Error fetching users");
    }
  };

  const fetchPickHistory = async (username) => {
    try {
      const response = await pickService.getPickHistory(username)
      processPicks(response.data);
    } catch {
      setError("Error fetching picks");
    }
  };

  const processPicks = (data) => {
    const counts = {};
    const records = {};

    const addTeam = (team, result) => {
      counts[team] = (counts[team] || 0) + 1;
      records[team] ||= { wins: 0, losses: 0, pushes: 0 };

      if (result === 1) records[team].wins++;
      else if (result === -1) records[team].losses++;
      else records[team].pushes++;
    };

    data.forEach(({ type, text, result }) => {
      const parts = text.trim().split(" ");
      if (parts[0] === "Did") {
        addTeam(text, -1)
        return;
      }

      if (type === "favorite" || type === "dog") {
        addTeam(parts.slice(0, -1).join(" "), result);
        return;
      }

      if (type === "over" || type === "under") {
        parts.pop();
        parts.pop();

        const try2 = parts.slice(0, 2).join(" ");
        const splitIndex = TEAM_NAMES.includes(try2) ? 2 : 3;

        const team1 = parts.slice(0, splitIndex).join(" ");
        const team2 = parts.slice(splitIndex).join(" ");

        addTeam(team1, result);
        addTeam(team2, result);
      }
    });

    setTeamCounts(counts);
    setTeamRecords(records);
  };

  const getPct = (team) => {
    const r = teamRecords[team];
    if (!r || r.wins + r.losses === 0) return "0.0%";
    return ((r.wins / (r.wins + r.losses)) * 100).toFixed(1) + "%";
  };

  const sortedTeams = Object.entries(teamCounts).sort((a, b) => b[1] - a[1]);

  return (
    <TableContainer component={Paper} sx={{ maxWidth: 600, margin: "auto", mt: 3 }}>
      <Typography variant="h5" sx={{ p: 2, fontWeight: "bold" }}>
        Team Bet History
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

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell><b>Team</b></TableCell>
            <TableCell align="right"><b>Count</b></TableCell>
            <TableCell align="right"><b>Record</b></TableCell>
            <TableCell align="right"><b>Pct</b></TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {sortedTeams.map(([team, count]) => {
            const r = teamRecords[team] || { wins: 0, losses: 0, pushes: 0 };
            return (
              <TableRow key={team}>
                <TableCell>{team}</TableCell>
                <TableCell align="right">{count}</TableCell>
                <TableCell align="right">
                  {r.wins}-{r.losses}-{r.pushes}
                </TableCell>
                <TableCell align="right">
                  {getPct(team)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TeamsBet;
