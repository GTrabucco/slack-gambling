import { useEffect, useMemo, useState } from "react";
import {
  Box,
  FormControlLabel,
  FormLabel,
  Switch,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
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

// Green = more bettors won this bet than lost it, red = more lost than won.
const dotColor = (netBettors) => {
  if (netBettors > 0) return "#0f766e";
  if (netBettors < 0) return "#b91c1c";
  return "#9ca3af";
};

const CustomTooltip = ({ active, payload, lossesOnly }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <Box sx={{ bgcolor: "background.paper", border: "1px solid #ccc", p: 1.5, borderRadius: 1, maxWidth: 260 }}>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        Wk {row.week} ({row.season}) — {row.label}
      </Typography>
      <Typography variant="body2">Points off: {row.pointsOff}</Typography>
      <Typography variant="body2">
        Record: {row.wins}-{row.losses}-{row.pushes}
      </Typography>
      {!lossesOnly && (
        <Typography variant="body2">Net bettors: {row.netBettors > 0 ? "+" : ""}{row.netBettors}</Typography>
      )}
    </Box>
  );
};

// Module-level cache keyed by season — persists for the tab's lifetime so switching
// seasons or navigating away and back doesn't refetch/recompute data already seen.
const worstBeatsCache = new Map();

const WorstBeats = () => {
  const [rows, setRows] = useState([]);
  const [seasonOptions, setSeasonOptions] = useState(["All"]);
  const [selectedSeason, setSelectedSeason] = useState("All");
  const [lossesOnly, setLossesOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeason]);

  const fetchData = async () => {
    const cacheKey = selectedSeason;
    if (worstBeatsCache.has(cacheKey)) {
      const data = worstBeatsCache.get(cacheKey);
      setRows(data);
      if (selectedSeason === "All") {
        const seasons = [...new Set(data.map((d) => String(d.season)).filter(Boolean))].sort((a, b) => b - a);
        setSeasonOptions(["All", ...seasons]);
      }
      return;
    }

    setLoading(true);
    try {
      const response = await pickService.getWorstBeatsReport(
        selectedSeason === "All" ? undefined : selectedSeason
      );
      const data = response.data || [];
      worstBeatsCache.set(cacheKey, data);
      setRows(data);
      if (selectedSeason === "All") {
        const seasons = [...new Set(data.map((d) => String(d.season)).filter(Boolean))].sort((a, b) => b - a);
        setSeasonOptions(["All", ...seasons]);
      }
    } catch (error) {
      console.error("Error fetching worst beats report:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    return rows.map((r) => ({
      ...r,
      x: r.pointsOff,
      y: lossesOnly ? r.losses : r.netBettors,
    }));
  }, [rows, lossesOnly]);

  const worstBeats = useMemo(() => {
    return [...rows]
      .filter((r) => (lossesOnly ? r.losses > 0 : r.netBettors < 0))
      .sort((a, b) => {
        const aScore = lossesOnly ? -a.losses : a.netBettors;
        const bScore = lossesOnly ? -b.losses : b.netBettors;
        if (aScore !== bScore) return aScore - bScore;
        return a.pointsOff - b.pointsOff;
      })
      .slice(0, 15);
  }, [rows, lossesOnly]);

  return (
    <StevenTableContainer sx={{ maxWidth: 1100, margin: "auto", mt: 3 }}>
      <Typography variant="h5" sx={{ p: 2, fontWeight: "bold", textAlign: "center" }}>
        Worst Beats
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 1, textAlign: "center" }}>
        Every graded bet, plotted by how many points it missed/covered by (closer to 0 = further left)
        against how many bettors it swung. The worst beats sit far left and deep red.
      </Typography>

      <Box sx={{ px: 2, pb: 2, display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" }}>
        <Box sx={{ minWidth: 160 }}>
          <FormLabel>Season</FormLabel>
          <StevenSelect
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            options={seasonOptions.map((s) => ({ value: s, label: s }))}
          />
        </Box>
        <FormControlLabel
          control={<Switch checked={lossesOnly} onChange={(e) => setLossesOnly(e.target.checked)} />}
          label="Losses only (instead of net won/lost)"
        />
      </Box>

      <Box
        sx={{
          px: { xs: 0.5, sm: 2 },
          pb: 2,
          overflowX: isMobile ? "auto" : "visible",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Box sx={{ width: isMobile ? 700 : "100%", height: isMobile ? 380 : 500 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name="Points off"
              label={{ value: "Points off (closer to 0 = closer bet)", position: "insideBottom", offset: -10 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={lossesOnly ? "Bettors who lost" : "Net bettors (won - lost)"}
              domain={[
                (dataMin) => dataMin - Math.max(1, Math.ceil(Math.abs(dataMin) * 0.1)),
                (dataMax) => dataMax + Math.max(1, Math.ceil(dataMax * 0.1)),
              ]}
              label={{
                value: lossesOnly ? "Bettors who lost" : "Net bettors (won - lost)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <ZAxis type="number" dataKey="totalBettors" range={[40, 400]} name="Total bettors" />
            {!lossesOnly && <ReferenceLine y={0} stroke="#666" />}
            <Tooltip
              content={<CustomTooltip lossesOnly={lossesOnly} />}
              cursor={{ strokeDasharray: "3 3" }}
              trigger="click"
              wrapperStyle={{ pointerEvents: "auto", zIndex: 10 }}
            />
            <Scatter
              data={chartData}
              fill="#8884d8"
              shape={(props) => {
                const { cx, cy, payload } = props;
                const baseRadius = lossesOnly ? 8 : Math.max(6, Math.min(14, 4 + payload.totalBettors));
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={baseRadius}
                    fill={lossesOnly ? "#b91c1c" : dotColor(payload.netBettors)}
                    fillOpacity={0.75}
                    stroke="#333"
                    strokeWidth={0.5}
                  />
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
        </Box>
      </Box>

      {isMobile && rows.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", px: 2, pb: 1, textAlign: "center" }}>
          Scroll the chart horizontally to see the full range →
        </Typography>
      )}

      {!loading && rows.length === 0 && (
        <Typography sx={{ px: 2, pb: 2, textAlign: "center", color: "text.secondary" }}>
          No graded bets found.
        </Typography>
      )}

      <Typography variant="h6" sx={{ px: 2, fontWeight: 700 }}>
        Top {worstBeats.length} Worst Beats
      </Typography>
      <StevenTableContainer sx={{ margin: "8px 16px 16px 16px" }}>
        <StevenTable>
          <StevenTableHead>
            <StevenTableRow>
              <StevenTableCell sx={{ fontWeight: 700 }}>Wk</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>Bet</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>Points Off</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>Record (W-L-P)</StevenTableCell>
              <StevenTableCell sx={{ fontWeight: 700 }}>
                {lossesOnly ? "Losses" : "Net Bettors"}
              </StevenTableCell>
            </StevenTableRow>
          </StevenTableHead>
          <StevenTableBody>
            {worstBeats.length === 0 ? (
              <StevenTableRow>
                <StevenTableCell colSpan={5} sx={{ textAlign: "center", color: "text.secondary" }}>
                  No qualifying beats found.
                </StevenTableCell>
              </StevenTableRow>
            ) : (
              worstBeats.map((row, i) => (
                <StevenTableRow key={i}>
                  <StevenTableCell>{row.week}</StevenTableCell>
                  <StevenTableCell>{row.label}</StevenTableCell>
                  <StevenTableCell>{row.pointsOff}</StevenTableCell>
                  <StevenTableCell>
                    {row.wins}-{row.losses}-{row.pushes}
                  </StevenTableCell>
                  <StevenTableCell>
                    {lossesOnly ? row.losses : `${row.netBettors > 0 ? "+" : ""}${row.netBettors}`}
                  </StevenTableCell>
                </StevenTableRow>
              ))
            )}
          </StevenTableBody>
        </StevenTable>
      </StevenTableContainer>
    </StevenTableContainer>
  );
};

export default WorstBeats;
