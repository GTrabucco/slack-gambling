import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import './style.css'
import pickService from "../../services/pickService";
import userService from "../../services/userService";
import {
    StevenTableContainer,
    StevenTable,
    StevenTableHead,
    StevenTableBody,
    StevenTableRow,
    StevenTableCell
} from "../Common/StevenTable";

const PICK_TYPE_ORDER = ["favorite", "dog", "over", "under", "gotw"];
const PICK_TYPE_LABELS = {
    favorite: "Favorite",
    dog: "Underdog",
    over: "Over",
    under: "Under",
    gotw: "GOTW",
};

const WeekPicks = (props) => {
    const [picks, setPicks] = useState([])
    const [displayNames, setDisplayNames] = useState({})

    useEffect(() => {
        const fetchPickHistory = async () => {
            try {
                const response = await pickService.getWeeklyPicks();

                if (response.data != null) {
                    setPicks(response.data);
                }
            } catch (error) {
                console.error('Error fetching picks:', error);
            }
        };

        const fetchUsers = async () => {
            try {
                const response = await userService.getAllUsers();
                const names = {};
                for (const u of response.data || []) {
                    if (u.displayName) names[u.username] = u.displayName;
                }
                setDisplayNames(names);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchPickHistory();
        fetchUsers();
    }, [])

    const nameFor = (username) => displayNames[username] || (username || "").split("@")[0];

    const groups = Object.entries(Object.groupBy(picks, ({ username }) => username))
        .map(([username, userPicks]) => ({
            username,
            name: nameFor(username),
            picks: [...userPicks].sort((a, b) =>
                PICK_TYPE_ORDER.indexOf(a.type) - PICK_TYPE_ORDER.indexOf(b.type)
            ),
        }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>Week Picks</Typography>
            <StevenTableContainer>
                <StevenTable className="wp-table">
                    <StevenTableHead>
                        <StevenTableRow>
                            <StevenTableCell>Type</StevenTableCell>
                            <StevenTableCell>Pick</StevenTableCell>
                            <StevenTableCell>Submitted</StevenTableCell>
                        </StevenTableRow>
                    </StevenTableHead>
                    <StevenTableBody>
                    {groups.map((group) => (
                        <React.Fragment key={group.username}>
                            <StevenTableRow>
                                <StevenTableCell colSpan={3} sx={{ backgroundColor: "rgba(255,255,255,0.08)", fontWeight: "bold" }}>
                                    {group.name} ({group.picks.length} of 5)
                                </StevenTableCell>
                            </StevenTableRow>
                            {group.picks.map((item) => (
                                <StevenTableRow key={item._id} className="wp-row">
                                    <StevenTableCell className="wp-cell">{PICK_TYPE_LABELS[item.type] || item.type}</StevenTableCell>
                                    <StevenTableCell className="wp-cell">{item.text}</StevenTableCell>
                                    <StevenTableCell className="wp-cell">{new Date(item.createdAt).toLocaleString()}</StevenTableCell>
                                </StevenTableRow>
                            ))}
                        </React.Fragment>
                    ))}
                    </StevenTableBody>
                </StevenTable>
            </StevenTableContainer>
        </Box>
    );
}

export default WeekPicks;
