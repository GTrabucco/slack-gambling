import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import useInjuryScoreAccess from "../Common/useInjuryScoreAccess";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import StevenButton from "../Common/StevenButton";
import {
    StevenTableContainer,
    StevenTable,
    StevenTableHead,
    StevenTableBody,
    StevenTableRow,
    StevenTableCell,
} from "../Common/StevenTable";
import injuryScoreService, { DEFAULT_INJURY_SCORE_SETTINGS } from "../../services/injuryScoreService";

// Edit values as strings so partial input like "2." isn't clobbered while typing.
const toDraft = (settings) => ({
    positionWeight: Object.fromEntries(Object.entries(settings.positionWeight).map(([pos, ranks]) =>
        [pos, Object.fromEntries(Object.entries(ranks).map(([r, v]) => [r, String(v)]))])),
    statusFactor: Object.fromEntries(Object.entries(settings.statusFactor).map(([s, v]) => [s, String(v)])),
});

const isValid = (v) => v.trim() !== "" && Number.isFinite(Number(v)) && Number(v) >= 0;

const ManageInjuryScore = () => {
    const { user } = useAuth0();
    const { loading: accessLoading, canUse } = useInjuryScoreAccess();
    const [draft, setDraft] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!canUse) return;
        injuryScoreService.invalidateCache(user.name);
        injuryScoreService.getSettings(user.name).then((s) => setDraft(toDraft(s)));
    }, [canUse, user.name]);

    const setPositionWeight = (pos, rank, value) => {
        setDraft((d) => ({
            ...d,
            positionWeight: { ...d.positionWeight, [pos]: { ...d.positionWeight[pos], [rank]: value } },
        }));
        setSuccess("");
    };

    const setStatusFactor = (status, value) => {
        setDraft((d) => ({ ...d, statusFactor: { ...d.statusFactor, [status]: value } }));
        setSuccess("");
    };

    const handleSave = async () => {
        setError("");
        setSuccess("");
        const payload = { positionWeight: {}, statusFactor: {} };
        for (const [pos, ranks] of Object.entries(draft.positionWeight)) {
            payload.positionWeight[pos] = {};
            for (const [rank, v] of Object.entries(ranks)) {
                if (!isValid(v)) {
                    setError(`${pos} rank ${rank} must be a non-negative number`);
                    return;
                }
                payload.positionWeight[pos][rank] = Number(v);
            }
        }
        for (const [status, v] of Object.entries(draft.statusFactor)) {
            if (!isValid(v)) {
                setError(`${status} must be a non-negative number`);
                return;
            }
            payload.statusFactor[status] = Number(v);
        }
        setSaving(true);
        try {
            await injuryScoreService.updateSettings(user.name, payload);
            injuryScoreService.invalidateCache(user.name);
            setSuccess("Saved. Game cards pick up the new weights on next page load.");
        } catch (e) {
            setError(e?.response?.data?.error || "Error saving settings");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setDraft(toDraft(DEFAULT_INJURY_SCORE_SETTINGS));
        setSuccess("");
        setError("");
    };

    if (accessLoading) return null;
    if (!canUse) return <Navigate to="/dashboard" replace />;
    if (!draft) return null;

    const rows = Object.entries(draft.positionWeight).flatMap(([pos, ranks]) =>
        Object.entries(ranks).map(([rank, value]) => ({ pos, rank, value })));

    return (
        <Box sx={{ pb: 4 }}>
            <Typography variant="h5" sx={{ mb: 1 }}>Injury Score Weights</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Each injured depth-chart player adds their position/rank weight × their status factor to
                their team's injury score, shown on every game card. These weights are yours alone. Rank 1
                is the starter, 2 the backup. "Reset to defaults" only fills the form; press Save to apply it.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <StevenTableContainer sx={{ mb: 3 }}>
                <StevenTable>
                    <StevenTableHead>
                        <StevenTableRow>
                            <StevenTableCell>Position</StevenTableCell>
                            <StevenTableCell>Rank</StevenTableCell>
                            <StevenTableCell>Weight</StevenTableCell>
                        </StevenTableRow>
                    </StevenTableHead>
                    <StevenTableBody>
                        {rows.map(({ pos, rank, value }) => (
                            <StevenTableRow key={`${pos}-${rank}`}>
                                <StevenTableCell>{pos}</StevenTableCell>
                                <StevenTableCell>{rank}</StevenTableCell>
                                <StevenTableCell>
                                    <TextField
                                        value={value}
                                        onChange={(e) => setPositionWeight(pos, rank, e.target.value)}
                                        size="small"
                                        type="number"
                                        inputProps={{ min: 0, step: "any" }}
                                        sx={{ width: 100 }}
                                    />
                                </StevenTableCell>
                            </StevenTableRow>
                        ))}
                    </StevenTableBody>
                </StevenTable>
            </StevenTableContainer>

            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Injury status factors</Typography>
            <Typography variant="caption" color="text.secondary">
                Multiplier applied to the weight. 1 = definitely out, 0 = healthy.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 1.5, mb: 3 }}>
                {Object.entries(draft.statusFactor).map(([status, value]) => (
                    <TextField
                        key={status}
                        label={status}
                        value={value}
                        onChange={(e) => setStatusFactor(status, e.target.value)}
                        size="small"
                        type="number"
                        inputProps={{ min: 0, step: "any" }}
                        sx={{ width: 110 }}
                    />
                ))}
            </Box>

            <Box sx={{ display: "flex", gap: 1.5 }}>
                <StevenButton onClick={handleSave} disabled={saving}>Save</StevenButton>
                <StevenButton onClick={handleReset} variant="outlined">Reset to defaults</StevenButton>
            </Box>
        </Box>
    );
};

export default ManageInjuryScore;
