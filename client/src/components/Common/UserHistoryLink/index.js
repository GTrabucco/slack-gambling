import { Link as RouterLink } from "react-router-dom";
import MuiLink from "@mui/material/Link";

// Player name that links to that player's pick history.
const UserHistoryLink = ({ username, children, sx }) => {
    if (!username) return children;
    return (
        <MuiLink
            component={RouterLink}
            to={`/pickhistory?user=${encodeURIComponent(username)}`}
            color="inherit"
            underline="hover"
            sx={{ fontWeight: "inherit", ...sx }}
        >
            {children}
        </MuiLink>
    );
};

export default UserHistoryLink;
