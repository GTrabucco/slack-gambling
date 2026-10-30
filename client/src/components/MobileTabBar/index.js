import Paper from "@mui/material/Paper";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import { useNavigate, useLocation } from "react-router-dom";
import { BsHouseDoor, BsClockHistory } from "react-icons/bs";
import { IoPodiumOutline } from "react-icons/io5";
import { ImStatsDots } from "react-icons/im";

export const MOBILE_TAB_BAR_HEIGHT = 56;

const TABS = [
    { path: "/dashboard", label: "Home", icon: <BsHouseDoor size={20} /> },
    { path: "/standings", label: "Standings", icon: <IoPodiumOutline size={20} /> },
    { path: "/pickhistory", label: "History", icon: <BsClockHistory size={20} /> },
    { path: "/advancedStats", label: "Stats", icon: <ImStatsDots size={18} /> },
];

// Bottom tab bar for phones/small tablets; the drawer still holds every page.
const MobileTabBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const current = TABS.find(t => t.path === location.pathname)?.path ?? false;

    return (
        <Paper
            component="nav"
            aria-label="Main"
            elevation={8}
            sx={{
                display: { xs: "block", md: "none" },
                position: "fixed",
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: (theme) => theme.zIndex.appBar,
                pb: "env(safe-area-inset-bottom)",
                borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
        >
            <BottomNavigation
                showLabels
                value={current}
                onChange={(_, path) => navigate(path)}
                sx={{ height: MOBILE_TAB_BAR_HEIGHT, bgcolor: "transparent" }}
            >
                {TABS.map(tab => (
                    <BottomNavigationAction key={tab.path} value={tab.path} label={tab.label} icon={tab.icon} />
                ))}
            </BottomNavigation>
        </Paper>
    );
};

export default MobileTabBar;
