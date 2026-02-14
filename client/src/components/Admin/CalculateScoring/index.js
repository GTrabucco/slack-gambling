import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form } from 'react-bootstrap';
import StevenButton from "../../Common/StevenButton";
import pickService from "../../../services/pickService";
import {
    StevenTableContainer,
    StevenTable,
    StevenTableHead,
    StevenTableBody,
    StevenTableRow,
    StevenTableCell
} from "../../Common/StevenTable";

const CalculateScoring = () => {
    const [picks, setPicks] = useState([]);
    const [filteredPicks, setFilteredPicks] = useState([]);
    const [betFilter, setBetFilter] = useState("");
    const [weekFilter, setWeekFilter] = useState("");
    const [userFilter, setUserFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("")
    const options = {
        year: "numeric",
        month: "numeric",
        day: "numeric",
    };

    useEffect(() => {
        const fetchPickHistory = async () => {
            try {
                const response = await pickService.getPickHistory("All", null);
                if (response.data != null) {  
                    const sortedPicks = response.data.sort((a, b) => 
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    );

                    setPicks(sortedPicks);
                    setFilteredPicks(sortedPicks);
                }
            } catch (error) {
                console.error('Error fetching picks:', error);
            }
        };

        fetchPickHistory();
    }, []);

    const handleResultChange = (event, pick) => {
        const value = event.target.value;
        if (!isNaN(value)) {
            setFilteredPicks((prevPicks) =>
                prevPicks.map((p) =>
                    p._id === pick["_id"]
                    ? { ...p, result: value }
                    : p
                )
            );
        }
    };

    const handleUpdateResult = async (id, updatedResult) => {
        try {
          await pickService.updatePickHistory(id, updatedResult);
        } catch (error) {
          console.error('Error updating result:', error);
        }
    };

    useEffect(() => {
        if (betFilter) {
            const filtered = picks.filter(pick =>
                pick.text.toLowerCase().includes(betFilter.toLowerCase())
            );
            setFilteredPicks(filtered);
        } else {
            setFilteredPicks(picks);
        }
    }, [betFilter, picks]);

    useEffect(() => {
        if (userFilter) {
            const filtered = picks.filter(pick =>
                pick.username.toLowerCase().includes(userFilter.toLowerCase())
            );
            setFilteredPicks(filtered);
        } else {
            setFilteredPicks(picks);
        }
    }, [userFilter, picks]);

     useEffect(() => {
        if (weekFilter) {
            const filtered = picks.filter(pick =>
                pick.week.toLowerCase().includes(weekFilter.toLowerCase())
            );
            setFilteredPicks(filtered);
        } else {
            setFilteredPicks(picks);
        }
    }, [weekFilter, picks]);

    useEffect(() => {
        if (dateFilter) {
            const filtered = picks.filter(pick => 
                new Date(pick.createdAt).toLocaleString().includes(dateFilter)
            );
            setFilteredPicks(filtered);
        } else {
            setFilteredPicks(picks);
        }
    }, [dateFilter, picks]);

    return (
        <Container>
            <Row>
                <h2>Calculate Scoring</h2>
            </Row>
            <Row>
              <Col>
                <StevenTableContainer>
                    <StevenTable>
                        <StevenTableHead>
                            <StevenTableRow>
                                <StevenTableCell>
                                Created At
                                <br />
                                <input
                                    type="text"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                />
                                </StevenTableCell>
                                <StevenTableCell>
                                Week
                                <br />
                                <input
                                    type="text"
                                    value={weekFilter}
                                    onChange={(e) => setWeekFilter(e.target.value)}
                                />
                                </StevenTableCell>
                                <StevenTableCell>
                                User
                                <br />
                                <input
                                    type="text"
                                    value={userFilter}
                                    onChange={(e) => setUserFilter(e.target.value)}
                                />
                                </StevenTableCell>
                                <StevenTableCell>
                                Bet
                                <br/>
                                <input
                                    type="text"
                                    value={betFilter}
                                    onChange={(e) =>
                                        setBetFilter(e.target.value )
                                    }
                                />
                                </StevenTableCell>
                                <StevenTableCell>Result</StevenTableCell>
                                <StevenTableCell></StevenTableCell>
                            </StevenTableRow>
                        </StevenTableHead>
                        <StevenTableBody>
                        {filteredPicks
                            .map((pick) => {
                                let text = pick["text"];
                                let user = pick["username"];
                                let result = pick["result"];
                                let week = pick["week"];
                                let createdAt = pick["createdAt"];
                                return (
                                    <StevenTableRow key={pick["_id"]}>
                                        <StevenTableCell>{new Date(createdAt).toLocaleDateString(undefined, options)}</StevenTableCell>
                                        <StevenTableCell>{week}</StevenTableCell>
                                        <StevenTableCell>{user.split("@")[0]}</StevenTableCell>
                                        <StevenTableCell>{text}</StevenTableCell>
                                        <StevenTableCell>
                                            <Form.Control
                                                type="number"
                                                min="-1"
                                                max="1"
                                                step="1"
                                                value={result}
                                                onChange={(e) => handleResultChange(e, pick)}
                                            />
                                        </StevenTableCell>
                                        <StevenTableCell className="cs5-cell">
                                            <StevenButton onClick={() => handleUpdateResult(pick["_id"], result)}>
                                                Update
                                            </StevenButton>
                                        </StevenTableCell>
                                    </StevenTableRow>
                                );
                            }
                        )}
                        </StevenTableBody>
                    </StevenTable>
                </StevenTableContainer>       
              </Col>
            </Row>
        </Container>       
    );
};

export default CalculateScoring;
