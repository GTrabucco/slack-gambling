import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import StevenButton from "../../Common/StevenButton";
import './style.css'
import jobService from "../../../services/jobService";

const JobRunner = () => {
    const [result, setResult] = useState("");
    const [season, setSeason] = useState("2025");
    const [week, setWeek] = useState("");
    const [weekType, setWeekType] = useState("");

    const validDay = async (day) => {
        if (!day) return false;

        const today = new Date();
        const daysOfWeek = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday"
        ];
        const currentDay = daysOfWeek[today.getDay()]; 

        if (currentDay !== day.toLowerCase()) {
            const proceed = window.confirm(
            `Today is ${currentDay}. Are you sure you want to proceed on ${day}?`);
            return proceed;
        }

        return true; 
    };

    const tuesdayJob = async () => {
        if (!window.confirm("Are you sure you want to run the Tuesday Job?")) return;
        try {
            if (await validDay("tuesday")) {
                const res = await jobService.runTuesdayJob(season, week, weekType);
                setResult(res.data.output); 
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

    const isJobDisabled = !season.trim() || !week.trim() || !weekType.trim();

    return (
        <Box sx={{ mt: 4, p: 4, border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "background.paper" }}>
            <Stack spacing={3}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <TextField
                            label="Season"
                            type="number"
                            value={season}
                            onChange={(e) => setSeason(e.target.value)}
                            required
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            label="Week"
                            type="number"
                            value={week}
                            onChange={(e) => setWeek(e.target.value)}
                            required
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            label="Week Type (Preseason=1, Regular=2, Playoffs=3)"
                            type="number"
                            value={weekType}
                            onChange={(e) => setWeekType(e.target.value)}
                            required
                            fullWidth
                            size="small"
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <StevenButton onClick={tuesdayJob} disabled={isJobDisabled} fullWidth>
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
                </Grid>

                {result && (
                    <Typography color="success.main">{result}</Typography>
                )}
            </Stack>
        </Box>
    );
};

export default JobRunner;
