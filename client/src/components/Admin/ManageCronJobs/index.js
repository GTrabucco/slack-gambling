import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Switch from "@mui/material/Switch";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import {
    StevenTableContainer,
    StevenTable,
    StevenTableHead,
    StevenTableBody,
    StevenTableRow,
    StevenTableCell,
} from "../../Common/StevenTable";
import cronJobService from "../../../services/cronJobService";

const ManageCronJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState({});

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await cronJobService.getCronJobs();
                setJobs(res.data || []);
            } catch (e) {
                setError("Failed to load cron jobs.");
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    const handleToggle = async (job) => {
        const { jobKey } = job;
        const newValue = !job.enabled;

        setJobs((prev) =>
            prev.map((j) => (j.jobKey === jobKey ? { ...j, enabled: newValue } : j))
        );
        setSaving((prev) => ({ ...prev, [jobKey]: true }));

        try {
            await cronJobService.setCronJobEnabled(jobKey, newValue);
        } catch (e) {
            setError(`Failed to update ${job.label}.`);
            // Revert on error
            setJobs((prev) =>
                prev.map((j) => (j.jobKey === jobKey ? { ...j, enabled: !newValue } : j))
            );
        } finally {
            setSaving((prev) => ({ ...prev, [jobKey]: false }));
        }
    };

    return (
        <Box>
            <Stack spacing={2}>
                <Typography variant="h5">Manage Cron Jobs</Typography>
                <Typography variant="body2" color="text.secondary">
                    Enable or disable scheduled jobs. Disabled jobs will be skipped the next time they are due to run.
                </Typography>
                {error && <Alert severity="error">{error}</Alert>}
                {loading ? (
                    <CircularProgress />
                ) : (
                    <StevenTableContainer>
                        <StevenTable>
                            <StevenTableHead>
                                <StevenTableRow>
                                    <StevenTableCell>Job</StevenTableCell>
                                    <StevenTableCell>Schedule</StevenTableCell>
                                    <StevenTableCell>Enabled</StevenTableCell>
                                </StevenTableRow>
                            </StevenTableHead>
                            <StevenTableBody>
                                {jobs.length > 0 ? (
                                    jobs.map((job) => (
                                        <StevenTableRow key={job.jobKey}>
                                            <StevenTableCell>{job.label}</StevenTableCell>
                                            <StevenTableCell>{job.schedule}</StevenTableCell>
                                            <StevenTableCell>
                                                <Switch
                                                    checked={!!job.enabled}
                                                    onChange={() => handleToggle(job)}
                                                    disabled={!!saving[job.jobKey]}
                                                    color="primary"
                                                />
                                            </StevenTableCell>
                                        </StevenTableRow>
                                    ))
                                ) : (
                                    <StevenTableRow>
                                        <StevenTableCell colSpan={3}>No cron jobs found.</StevenTableCell>
                                    </StevenTableRow>
                                )}
                            </StevenTableBody>
                        </StevenTable>
                    </StevenTableContainer>
                )}
            </Stack>
        </Box>
    );
};

export default ManageCronJobs;
