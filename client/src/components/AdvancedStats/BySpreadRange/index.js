import { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Form } from "react-bootstrap";
import { Typography } from "@mui/material";
import userService from "../../../services/userService";
import pickService from "../../../services/pickService";
import StevenSelect from "../../Common/StevenSelect";
import {
  StevenTableContainer,
  StevenTable,
  StevenTableHead,
  StevenTableBody,
  StevenTableRow,
  StevenTableCell,
} from "../../Common/StevenTable";

const SPREAD_BUCKETS = [
  { id: "0to2_5", label: "PK to 2.5", min: 0, max: 2.5 },
  { id: "3to6_5", label: "3.0 to 6.5", min: 3, max: 6.5 },
  { id: "7plus", label: "7+", min: 7, max: Number.POSITIVE_INFINITY },
];

const BySpreadRange = () => {
  const { user, isLoading } = useAuth0();
  const [users, setUsers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState("All");
  const [selectedSeason, setSelectedSeason] = useState("All");
  const [seasonOptions, setSeasonOptions] = useState(["All"]);
  const [picks, setPicks] = useState([]);

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

  const filteredPicks = useMemo(() => {
    return (selectedSeason === "All"
      ? picks
      : picks.filter((p) => String(p.season) === String(selectedSeason))
    ).filter((p) => ["favorite", "dog"].includes(p.type) && !Number.isNaN(Number(p.value)));
  }, [picks, selectedSeason]);

  const statsByBucket = useMemo(() => {
    const base = {};
    SPREAD_BUCKETS.forEach((bucket) => {
      base[bucket.id] = {
        favorite: { wins: 0, losses: 0, pushes: 0 },
        dog: { wins: 0, losses: 0, pushes: 0 },
      };
    });

    filteredPicks.forEach((pick) => {
      const absSpread = Math.abs(Number(pick.value));
      const bucket = SPREAD_BUCKETS.find((b) => absSpread >= b.min && absSpread <= b.max);
      if (!bucket) return;

      const result = Number(pick.result);
      const slot = base[bucket.id][pick.type];
      if (result === 1) slot.wins += 1;
      else if (result === -1) slot.losses += 1;
      else slot.pushes += 1;
    });

    return base;
  }, [filteredPicks]);

  const formatRecord = (record) => {
    const total = record.wins + record.losses + record.pushes;
    const pct = record.wins + record.losses > 0
      ? `${((record.wins / (record.wins + record.losses)) * 100).toFixed(1)}%`
      : "-";
    return `${record.wins}-${record.losses}-${record.pushes} (${pct}, ${total})`;
  };

  return (
    <StevenTableContainer sx={{ maxWidth: 1000, margin: "auto", mt: 3 }}>
      <Typography variant="h5" sx={{ p: 2, fontWeight: "bold", textAlign: "center" }}>
        By Spread Range
      </Typography>

      <Form.Group controlId="playerSelect" style={{ padding: "0 16px 16px 16px" }}>
        <Form.Label>Player</Form.Label>
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
      </Form.Group>

      <Form.Group controlId="seasonSelect" style={{ padding: "0 16px 16px 16px" }}>
        <Form.Label>Season</Form.Label>
        <StevenSelect
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(e.target.value)}
          options={seasonOptions.map((season) => ({ value: season, label: season }))}
        />
      </Form.Group>

      <StevenTableContainer sx={{ margin: "0 16px 16px 16px" }}>
        <StevenTable>
          <StevenTableHead>
            <StevenTableRow>
              <StevenTableCell sx={{ fontWeight: 700 }}>Spread Bucket</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>Favorites</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>Dogs</StevenTableCell>
            </StevenTableRow>
          </StevenTableHead>
          <StevenTableBody>
            {SPREAD_BUCKETS.map((bucket) => (
              <StevenTableRow key={bucket.id}>
                <StevenTableCell>{bucket.label}</StevenTableCell>
                <StevenTableCell>{formatRecord(statsByBucket[bucket.id].favorite)}</StevenTableCell>
                <StevenTableCell>{formatRecord(statsByBucket[bucket.id].dog)}</StevenTableCell>
              </StevenTableRow>
            ))}
          </StevenTableBody>
        </StevenTable>
      </StevenTableContainer>
    </StevenTableContainer>
  );
};

export default BySpreadRange;
