import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import axios from 'axios';
import './style.css'

const JobRunner = () => {
    const [result, setResult] = useState("");
    const [season, setSeason] = useState("");
    const [week, setWeek] = useState("");
    const [weekType, setWeekType] = useState("");
    const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

    const tuesdayJob = async () => {
        if (!window.confirm("Are you sure you want to run the Tuesday Job?")) return;
        try {
            const res = await axios.post(`${apiBaseUrl}/api/tuesday-job`, { season, week, weekType });
            setResult(res.data.output);
        } catch (error) {
            setResult("Error: " + error.message);
        }
    };

    const fridayJob = async () => {
        if (!window.confirm("Are you sure you want to run the Friday Job?")) return;
        try {
            const res = await axios.post(`${apiBaseUrl}/api/friday-job`);
            setResult(res.data.output);
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

    const isJobDisabled = !season.trim() || !week.trim();

    return (
        <Container className="mt-4 p-4 border rounded bg-light">
            <Form>
                <Row className="mb-3">
                    <Col md={4}>
                        <Form.Group controlId="formSeason">
                            <Form.Label>Season</Form.Label>
                            <Form.Control
                                type="text"
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
                                type="text"
                                value={week}
                                onChange={(e) => setWeek(e.target.value)}
                                required
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group controlId="formWeek">
                            <Form.Label>Week Type</Form.Label>
                            <Form.Control
                                type="text"
                                value={weekType}
                                onChange={(e) => setWeekType(e.target.value)}
                                required
                            />
                        </Form.Group>
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col className="d-grid">
                        <Button
                            className="jobrunner-btn"
                            variant="primary"
                            onClick={tuesdayJob}
                            disabled={isJobDisabled}
                        >
                            Run Tuesday Job
                        </Button>
                    </Col>
                    <Col className="d-grid">
                        <Button
                            className="jobrunner-btn"
                            variant="secondary"
                            onClick={fridayJob}
                            disabled={isJobDisabled}
                        >
                            Run Friday Job
                        </Button>
                    </Col>
                    <Col className="d-grid">
                        <Button
                            className="jobrunner-btn"
                            variant="secondary"
                            onClick={sundayReminderJob}
                        >
                            Run Sunday Reminder
                        </Button>
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
