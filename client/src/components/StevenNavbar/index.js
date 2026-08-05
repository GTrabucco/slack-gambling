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
import Collapse from "@mui/material/Collapse";
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
    BsPersonCircle, BsHouseDoor, BsTerminal, BsController, BsCardList,
    BsPeopleFill, BsChevronDown, BsChevronRight, BsShieldLock
} from "react-icons/bs";
import { IoLogOutOutline, IoPodiumOutline } from "react-icons/io5";
import { ImStatsDots } from "react-icons/im";
import { GiRunningNinja } from "react-icons/gi";
import StevenButton from "../Common/StevenButton";
import "./style.css";

const ADMIN_PATHS = [
    "/calculatescoring", "/viewReports", "/viewlogs",
    "/managegames", "/managepicks", "/manageaccounts", "/jobrunner", "/manageteamids", "/manageteamrecords",
];

const StevenNavbar = () => {
    const { user } = useAuth0();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const [adminOpen, setAdminOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const isAdmin = user.email.toLowerCase() === "giulian.trabucco@gmail.com";

    const handleNavigate = (path) => {
        navigate(path);
        setDrawerOpen(false);
    };

    const regularLinks = [
        { path: "/dashboard", label: "Home", icon: <BsHouseDoor /> },
        { path: "/standings", label: "Standings", icon: <IoPodiumOutline /> },
        { path: "/pickhistory", label: "History", icon: <BsClockHistory /> },
        { path: "/advancedStats", label: "Advanced Stats", icon: <ImStatsDots /> },
        { path: "/reportissue", label: "Report Issue", icon: <BsBug /> },
        { path: "/account", label: "Account", icon: <BsPersonCircle /> },
    ];

    const adminLinks = [
        { path: "/calculatescoring", label: "Calculate Scoring", icon: <BsCalculator /> },
        { path: "/viewReports", label: "Issues", icon: <BsCardChecklist /> },
        { path: "/viewlogs", label: "Logs", icon: <BsTerminal /> },
        { path: "/managegames", label: "Manage Games", icon: <BsController /> },
        { path: "/managepicks", label: "Manage Picks", icon: <BsCardList /> },
        { path: "/manageaccounts", label: "Manage Accounts", icon: <BsPeopleFill /> },
        { path: "/manageteamids", label: "Team IDs", icon: <BsCardList /> },
        { path: "/manageteamrecords", label: "Team Records", icon: <BsCardList /> },
        { path: "/jobrunner", label: "Job Runner", icon: <GiRunningNinja /> },
    ];

    const isAdminActive = ADMIN_PATHS.includes(location.pathname);

    const navItemSx = (isActive) => ({
        "&.Mui-selected": {
            backgroundColor: "rgba(144, 202, 249, 0.12)",
            borderLeft: "3px solid #90caf9",
            "& .MuiListItemText-primary": { color: "#90caf9", fontWeight: 700 },
            "& .MuiListItemIcon-root": { color: "#90caf9" },
        },
        "&.Mui-selected:hover": { backgroundColor: "rgba(144, 202, 249, 0.2)" },
    });

    return (
        <>
            <Dialog open={showRules} onClose={() => setShowRules(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Slack Gambling Rules</DialogTitle>
                <DialogContent dividers>
                    {[
                        <><b>1.</b> Games for the full week are posted every <b>Tuesday</b>. Lines update daily. Your locked-in pick value never changes even if the line moves.</>,
                        <><b>2.</b> Each week, pick one <b>Favorite</b>, one <b>Underdog</b>, one <b>Over</b>, one <b>Under</b>, and one pick (spread or total) on the <b>Game of the Week</b>.</>,
                        <><b>3.</b> Picks can be changed any time before the game kicks off. Once the game starts, your pick is locked.</>,
                        <><b>4.</b> <b>Scoring:</b> +1 correct, -1 incorrect, 0 push. Missing a pick type counts as -1.</>,
                        <><b>5.</b> Go <b>5/5</b> in a week (Favorite, Underdog, Over, Under, and Game of the Week) to earn a share of the <b>Perfect Week Pool</b>, paid out at season's end.</>,
                        <><b>6.</b> Set up text reminders and your display name on the <b>Account</b> page.</>,
                        <><b>7.</b> Questions or problems? Use the <b>Report Issue</b> page.</>,
                    ].map((rule, i) => (
                        <Typography key={i} gutterBottom>{rule}</Typography>
                    ))}
                </DialogContent>
                <DialogActions>
                    <StevenButton onClick={() => setShowRules(false)} sx={{ backgroundColor: "white", color: "black", "&:hover": { backgroundColor: "#f0f0f0" } }}>Close</StevenButton>
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
                    <StevenButton
                        onClick={() => setShowRules(true)}
                        variant="outlined"
                        size="small"
                        sx={{ color: "red", borderColor: "red", "&:hover": { borderColor: "darkred", color: "darkred" } }}
                    >
                        Rules
                    </StevenButton>
                </Toolbar>
            </AppBar>

            <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <Box sx={{ width: 210 }} role="presentation">
                    <List>
                        {regularLinks.map((link) => {
                            const isActive = location.pathname === link.path;
                            return (
                                <ListItem key={link.path} disablePadding>
                                    <ListItemButton onClick={() => handleNavigate(link.path)} selected={isActive} sx={navItemSx(isActive)}>
                                        <ListItemIcon sx={{ minWidth: 36, fontSize: 18 }}>{link.icon}</ListItemIcon>
                                        <ListItemText primary={link.label} primaryTypographyProps={{ fontFamily: "Segoe UI", fontWeight: 500, fontSize: 15 }} />
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}

                        {isAdmin && (
                            <>
                                <Divider />
                                <ListItem disablePadding>
                                    <ListItemButton
                                        onClick={() => setAdminOpen((o) => !o)}
                                        selected={isAdminActive && !adminOpen}
                                        sx={{
                                            ...navItemSx(isAdminActive),
                                            ...(isAdminActive ? { borderLeft: "3px solid #90caf9" } : {}),
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 36, fontSize: 18, color: isAdminActive ? "#90caf9" : "inherit" }}>
                                            <BsShieldLock />
                                        </ListItemIcon>
                                        <ListItemText primary="Admin" primaryTypographyProps={{ fontFamily: "Segoe UI", fontWeight: 600, fontSize: 15, color: isAdminActive ? "#90caf9" : "inherit" }} />
                                        <Box sx={{ fontSize: 13, color: "text.secondary" }}>
                                            {adminOpen ? <BsChevronDown /> : <BsChevronRight />}
                                        </Box>
                                    </ListItemButton>
                                </ListItem>
                                <Collapse in={adminOpen} timeout="auto" unmountOnExit>
                                    <List disablePadding>
                                        {adminLinks.map((link) => {
                                            const isActive = location.pathname === link.path;
                                            return (
                                                <ListItem key={link.path} disablePadding>
                                                    <ListItemButton onClick={() => handleNavigate(link.path)} selected={isActive} sx={{ pl: 4, ...navItemSx(isActive) }}>
                                                        <ListItemIcon sx={{ minWidth: 36, fontSize: 16 }}>{link.icon}</ListItemIcon>
                                                        <ListItemText primary={link.label} primaryTypographyProps={{ fontFamily: "Segoe UI", fontWeight: 500, fontSize: 14 }} />
                                                    </ListItemButton>
                                                </ListItem>
                                            );
                                        })}
                                    </List>
                                </Collapse>
                            </>
                        )}

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
