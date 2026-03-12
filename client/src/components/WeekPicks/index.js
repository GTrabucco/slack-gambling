import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import './style.css'
import pickService from "../../services/pickService";
import {
    StevenTableContainer,
    StevenTable,
    StevenTableHead,
    StevenTableBody,
    StevenTableRow,
    StevenTableCell
} from "../Common/StevenTable";

const WeekPicks = (props) => {
    const [picks, setPicks] = useState([])

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

        fetchPickHistory();
    }, [])

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>Week Picks</Typography>
            <StevenTableContainer>
                <StevenTable className="wp-table">
                    <StevenTableHead>
                        <StevenTableRow>
                            <StevenTableCell>Submitted</StevenTableCell>
                            <StevenTableCell>User</StevenTableCell>
                            <StevenTableCell>Pick</StevenTableCell>
                        </StevenTableRow>
                    </StevenTableHead>
                    <StevenTableBody>
                    {picks.map((item) => (
                        <StevenTableRow key={item._id} className="wp-row">
                            <StevenTableCell className="wp-cell">{new Date(item.createdAt).toLocaleString()}</StevenTableCell>
                            <StevenTableCell className="wp-cell">{item.username}</StevenTableCell>
                            <StevenTableCell className="wp-cell">{item.text}</StevenTableCell>
                        </StevenTableRow>
                    ))}
                    </StevenTableBody>
                </StevenTable>
            </StevenTableContainer>
        </Box>
    );
}

export default WeekPicks;
