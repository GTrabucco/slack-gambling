import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import StevenButton from "../../Common/StevenButton";
import './style.css'
import jobService from "../../../services/jobService";
import apiClient from "../../../services/apiClient";

const JobRunner = () => {
    const [result, setResult] = useState("");
    const [season, setSeason] = useState("");
    const [week, setWeek] = useState("");
    const [weekType, setWeekType] = useState("");
    const [configSaved, setConfigSaved] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await apiClient.get("/api/config");
                if (res.data) {
                    setSeason(res.data.season || "");
                    setWeek(res.data.week || "");
                    setWeekType(res.data.weekType || "");
                }
            } catch (e) {
                console.error("Failed to fetch config", e);
            }
        };
        fetchConfig();
    }, []);

    const saveConfig = async () => {
        try {
            await apiClient.post("/api/config", { season, week, weekType });
            setConfigSaved(true);
            setTimeout(() => setConfigSaved(false), 3000);
        } catch (e) {
            setResult("Error saving config: " + e.message);
        }
    };

    const validDay = async (day) => {
        const today = new Date();
        const daysOfWeek = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
        const currentDay = daysOfWeek[today.getDay()];
        if (currentDay !== day.toLowerCase()) {
            return window.confirm(`Today is ${currentDay}. Are you sure you want to proceed on ${day}?`);
        }
        return true;
    };

    const tuesdayJob = async () => {
        if (!isConfigValid) { setResult("Error: Please fill in Season, Week, and Week Type before running."); return; }
        if (!window.confirm("Are you sure you want to run the Tuesday Job?")) return;
        try {
            if (await validDay("tuesday")) {
                const res = await jobService.runTuesdayJob({ season, week, weekType });
                setResult(res.data.result);
            }
        } catch (error) {
            setResult("Error: " + error.message);
        }
    };

    const refreshJob = async () => {
        if (!window.confirm("Are you sure you want to run the Refresh Job?")) return;
        try {
            const res = await jobService.runRefreshJob();
            setResult(res.data.result);
        } catch (error) {
            setResult("Error: " + error.message);
        }
    };

    const sundayReminderJob = async () => {
        if (!window.confirm("Are you sure you want to run the Sunday Reminder Job?")) return;
        try {
            const res = await jobService.runSundayReminderJob();
            setResult(res.data.output);
        } catch (error) {
            setResult("Error: " + error.message);
        }
    };

    const processLivePicks = async () => {
        if (!window.confirm("Score all picks for completed games now?")) return;
        try {
            const res = await jobService.runProcessLivePicks();
            setResult(res.data.message);
        } catch (error) {
            setResult("Error: " + error.message);
        }
    };

    const isConfigValid = season.toString().trim() && week.toString().trim() && weekType.toString().trim();

    return (
        <Box sx={{ mt: 4, p: 4, border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "background.paper" }}>
            <Stack spacing={3}>
                <Typography variant="subtitle1" fontWeight="bold">Season Config</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <TextField
                            label="Season"
                            type="number"
                            value={season}
                            onChange={(e) => setSeason(e.target.value)}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            label="Week (next week to be played)"
                            type="number"
                            value={week}
                            onChange={(e) => setWeek(e.target.value)}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            label="Week Type (1=Pre, 2=Regular, 3=Playoffs)"
                            type="number"
                            value={weekType}
                            onChange={(e) => setWeekType(e.target.value)}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                </Grid>
                <Box>
                    <StevenButton onClick={saveConfig} disabled={!isConfigValid}>
                        Save Config
                    </StevenButton>
                    {configSaved && <Typography component="span" color="success.main" sx={{ ml: 2 }}>Saved!</Typography>}
                </Box>

                <Divider />

                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <StevenButton onClick={tuesdayJob} fullWidth>
                            Run Tuesday Job
                        </StevenButton>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <StevenButton onClick={refreshJob} fullWidth>
                            Run Refresh Job
                        </StevenButton>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <StevenButton onClick={sundayReminderJob} fullWidth>
                            Run Sunday Reminder
                        </StevenButton>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <StevenButton onClick={processLivePicks} fullWidth>
                            Process Live Picks
                        </StevenButton>
                    </Grid>
                </Grid>

                {result && (
                    <Typography color="success.main">{result}</Typography>
                )}
            </Stack>
        </Box>
    );
};

export default JobRunner;
