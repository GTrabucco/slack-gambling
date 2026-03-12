import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Divider from "@mui/material/Divider";
import { useNavigate, useLocation } from "react-router-dom";
import { LogoutButton } from "../Common/logout.button";
import { useAuth0 } from "@auth0/auth0-react";
import {
    BsClockHistory, BsBug, BsCalculator, BsCardChecklist, BsList,
    BsPersonCircle, BsHouseDoor
} from "react-icons/bs";
import { IoLogOutOutline, IoPodiumOutline } from "react-icons/io5";
import { ImStatsDots } from "react-icons/im";
import { GiRunningNinja } from "react-icons/gi";
import StevenButton from "../Common/StevenButton";
import "./style.css";

const StevenNavbar = () => {
    const { user } = useAuth0();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const isAdmin = user.email.toLowerCase() === "giulian.trabucco@gmail.com";

    const handleNavigate = (path) => {
        navigate(path);
        setDrawerOpen(false);
    };

    const menuLinks = [
        { path: "/dashboard", label: "Home", icon: <BsHouseDoor /> },
        { path: "/standings", label: "Standings", icon: <IoPodiumOutline /> },
        { path: "/pickhistory", label: "History", icon: <BsClockHistory /> },
        { path: "/advancedStats", label: "Advanced Stats", icon: <ImStatsDots /> },
        { path: "/reportissue", label: "Report Issue", icon: <BsBug /> },
        ...(isAdmin ? [
            { path: "/calculatescoring", label: "Calculate Scoring", icon: <BsCalculator /> },
            { path: "/viewReports", label: "Issues", icon: <BsCardChecklist /> },
            { path: "/jobrunner", label: "Job Runner", icon: <GiRunningNinja /> },
        ] : []),
        { path: "/account", label: "Account", icon: <BsPersonCircle /> },
    ];

    return (
        <>
            <Dialog open={showRules} onClose={() => setShowRules(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Slack Gambling Rules</DialogTitle>
                <DialogContent dividers>
                    {[
                        <><b>1.</b> Games update on <b>Tuesdays</b> and <b>Fridays</b>. You'll see games from <b>Tue-Thu</b> during the week, and <b>Fri-Mon</b> over the weekend.</>,
                        <><b>2.</b> Pick a Favorite, Underdog, Over and Under each week</>,
                        <><b>3.</b> Submit picks using the button at the bottom of the page</>,
                        <><b>4.</b> Picks can be changed until the game starts</>,
                        <><b>5.</b> Scoring: +1 for correct, -1 for incorrect, 0 for push</>,
                        <><b>6.</b> Earn 1 share in the Perfect Week Pool by going 4/4 in a week. The pool payout is split among all shareholders at season's end</>,
                        <><b>7.</b> Enable text reminders and edit your display name on the Account page</>,
                        <><b>8.</b> Submit questions or issues via the Report Issue page</>,
                    ].map((rule, i) => (
                        <Typography key={i} gutterBottom>{rule}</Typography>
                    ))}
                </DialogContent>
                <DialogActions>
                    <StevenButton onClick={() => setShowRules(false)}>Close</StevenButton>
                </DialogActions>
            </Dialog>

            <AppBar position="static" color="default" elevation={1}>
                <Toolbar sx={{ gap: 1 }}>
                    <IconButton
                        aria-label="Toggle navigation menu"
                        onClick={() => setDrawerOpen(true)}
                        edge="start"
                    >
                        <BsList size={26} />
                    </IconButton>
                    <Box
                        component="a"
                        href="/"
                        sx={{ display: "flex", alignItems: "center", gap: 1, textDecoration: "none", color: "inherit", flexGrow: 1 }}
                    >
                        <img alt="" width="45" height="45" src="/stevenlogo.png" />
                        <Typography sx={{ fontWeight: 400, fontSize: 18 }}>Slack Gambling</Typography>
                    </Box>
                    <Typography
                        onClick={() => setShowRules(true)}
                        sx={{ fontSize: "0.85rem", textDecoration: "underline", cursor: "pointer", color: "text.secondary" }}
                    >
                        Rules
                    </Typography>
                </Toolbar>
            </AppBar>

            <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <Box sx={{ width: 210 }} role="presentation">
                    <List>
                        {menuLinks.map((link) => {
                            const isActive = location.pathname === link.path;
                            return (
                                <ListItem key={link.path} disablePadding>
                                    <ListItemButton
                                        onClick={() => handleNavigate(link.path)}
                                        selected={isActive}
                                        sx={{
                                            "&.Mui-selected": {
                                                backgroundColor: "#e8f0fe",
                                                borderLeft: "3px solid #1a73e8",
                                                "& .MuiListItemText-primary": { color: "#1a73e8", fontWeight: 700 },
                                                "& .MuiListItemIcon-root": { color: "#1a73e8" },
                                            },
                                            "&.Mui-selected:hover": { backgroundColor: "#dce8fd" },
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 36, fontSize: 18 }}>{link.icon}</ListItemIcon>
                                        <ListItemText primary={link.label} primaryTypographyProps={{ fontFamily: "Segoe UI", fontWeight: 500, fontSize: 15 }} />
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                        <Divider />
                        <ListItem disablePadding>
                            <ListItemButton>
                                <ListItemIcon sx={{ minWidth: 36, fontSize: 18 }}><IoLogOutOutline /></ListItemIcon>
                                <ListItemText primary={<LogoutButton />} />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Box>
            </Drawer>
        </>
    );
};

export default StevenNavbar;
