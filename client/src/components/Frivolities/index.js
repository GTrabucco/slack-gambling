import { useNavigate } from "react-router-dom";
import React from "react";
import { Card, CardContent, Typography, Grid, Box } from "@mui/material";
import { styled } from "@mui/material/styles";

const Frivolities = () => {
    const navigate = useNavigate();
    const cards = [
        { id: 1, title: 'Statistics', description: 'View your full betting statistics.', link: "/statistics" },
        { id: 2, title: 'Most Bet on Teams', description: 'Discover which NFL teams you bet on most often.', link: "/teamsbet" },
    ];

    const TeamCard = styled(Card)(({ theme }) => ({
        background: theme.palette.mode === "dark" ? "#000000ff" : "#f9f9f9",
        borderRadius: "16px",
        padding: theme.spacing(2),
        transition: "transform 0.2s ease",
        "&:hover": {
            transform: "scale(1.03)",
        }
    }));

    return (
        <Box sx={{ padding: 3 }}>
            <Grid container spacing={3}>
                {cards.map(({ id, title, description, link }) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={id} onClick={() => navigate(link)} style={{ cursor: 'pointer' }}>
                        <TeamCard>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 700, marginBottom: 1 }}
                                >
                                    {title}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ fontWeight: 400 }}
                                >
                                    {description}
                                </Typography>
                            </CardContent>
                        </TeamCard>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default Frivolities;
