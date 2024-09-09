import React, { useState, useEffect } from "react";
import { useAuth } from "../../../hooks/AuthProvider";
import { Container, Row, Col, Table, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

const ViewReports = () => {
    const [error, setError] = useState("");
    const [reports, setReports] = useState([]);
    const auth = useAuth();

    const fetchReports = async () => {
        try {
            const response = await axios.get(`${auth.apiBaseUrl}/api/get-reports`);
            if (response.data) {
                setReports(response.data);
                setError("");
            } else {
                setError("No reports found.");
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
            setError('Error fetching reports');
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleClose = async (id) => {
        try {
            await closeReport(id);
            await fetchReports();
        } catch (error) {
            console.error('Error in handleClose:', error);
        }
    }

    const closeReport = async (id) => {
        try {
            await axios.post(`${auth.apiBaseUrl}/api/close-report`, { id });
        } catch (error) {
            console.error('Error closing report:', error);
            setError('Error closing report');
        }
    };

    return (
        <Container>
            <Row>
                <h2>Reports</h2>
            </Row>
            <Row>
                <Col>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Created At</th>
                                <th>User</th>
                                <th>Description</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.length > 0 ? (
                                reports
                                    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                                    .map((report) => (
                                        <tr key={report._id}>
                                            <td>{new Date(report.createdAt).toLocaleString()}</td>
                                            <td>{report.username}</td>
                                            <td>{report.description}</td>
                                            <td>
                                                <Button variant="danger" onClick={() => handleClose(report._id)}>Close Report</Button>
                                            </td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan="4">No reports available.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Col>                
            </Row>
        </Container>
    );
}

export default ViewReports;
