import { useState } from "react";
import { Container, Row, Col, Form } from 'react-bootstrap';
import StevenButton from "../../Common/StevenButton";
import axios from 'axios';
import './style.css'

const JobRunner = () => {
    const [result, setResult] = useState("");
    const [season, setSeason] = useState("2025");
    const [week, setWeek] = useState("");
    const [weekType, setWeekType] = useState("");
    const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

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
            if (validDay("tuesday")) {
                const res = await axios.post(`${apiBaseUrl}/api/tuesday-job`, { season, week, weekType });
                setResult(res.data.output); 
            } 
        } catch (error) {
            setResult("Error: " + error.message);
        }
    };

    const fridayJob = async () => {
        if (!window.confirm("Are you sure you want to run the Friday Job?")) return;
        try {
            if (validDay("friday")) {
                const res = await axios.post(`${apiBaseUrl}/api/friday-job`, { season, week, weekType });
                setResult(res.data.output); 
            } 
        } catch (error) {
            setResult("Error: " + error.message);
        }
    };

    const sundayReminderJob = async () => {
        if (!window.confirm("Are you sure you want to run the Sunday Reminder Job?")) return;
        try {
            const res = await axios.post(`${apiBaseUrl}/api/sunday-reminder-job`);
            setResult(res.data.output);
        } catch (error) {
            setResult("Error: " + error.message);
        }
    };

    const isJobDisabled = !season.trim() || !week.trim() || !weekType.trim();

    return (
        <Container className="mt-4 p-4 border rounded bg-light">
            <Form>
                <Row className="mb-3">
                    <Col md={4}>
                        <Form.Group controlId="formSeason">
                            <Form.Label>Season</Form.Label>
                            <Form.Control
                                type="number"
                                value={season}
                                onChange={(e) => setSeason(e.target.value)}
                                required
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group controlId="formWeek">
                            <Form.Label>Week</Form.Label>
                            <Form.Control
                                type="number"
                                value={week}
                                onChange={(e) => setWeek(e.target.value)}
                                required
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group controlId="formWeekType">
                            <Form.Label>Week Type (Preseason = 1, Regular = 2, Playoffs = 3)</Form.Label>
                            <Form.Control
                                type="number"
                                value={weekType}
                                onChange={(e) => setWeekType(e.target.value)}
                                required
                            />
                        </Form.Group>
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col className="d-grid">
                        <StevenButton
                            onClick={tuesdayJob}
                            disabled={isJobDisabled}
                        >
                            Run Tuesday Job
                        </StevenButton>
                    </Col>
                    <Col className="d-grid">
                        <StevenButton
                            onClick={fridayJob}
                            disabled={isJobDisabled}
                        >
                            Run Friday Job
                        </StevenButton>
                    </Col>
                    <Col className="d-grid">
                        <StevenButton
                            onClick={sundayReminderJob}
                        >
                            Run Sunday Reminder
                        </StevenButton>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Form.Text className="text-success">{result}</Form.Text>
                    </Col>
                </Row>
            </Form>
        </Container>
    );
};

export default JobRunner;
