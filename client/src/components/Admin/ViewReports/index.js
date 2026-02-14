import { useState, useEffect } from "react";
import { Container, Row, Col, Alert } from 'react-bootstrap';
import StevenButton from "../../Common/StevenButton";
import issueService from "../../../services/issueService";
import {
    StevenTableContainer,
    StevenTable,
    StevenTableHead,
    StevenTableBody,
    StevenTableRow,
    StevenTableCell
} from "../../Common/StevenTable";

const ViewReports = () => {
    const [error, setError] = useState("");
    const [reports, setReports] = useState([]);

    const fetchReports = async () => {
        try {
            const response = await issueService.getReports();
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
            await issueService.closeReport(id);
        } catch (error) {
            console.error('Error closing report:', error);
            setError('Error closing report');
        }
    };

    return (
        <Container>
            <Row>
                <h2>Issues</h2>
            </Row>
            <Row>
                <Col>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <StevenTableContainer>
                        <StevenTable>
                            <StevenTableHead>
                                <StevenTableRow>
                                    <StevenTableCell>Created At</StevenTableCell>
                                    <StevenTableCell>User</StevenTableCell>
                                    <StevenTableCell>Description</StevenTableCell>
                                    <StevenTableCell>Action</StevenTableCell>
                                </StevenTableRow>
                            </StevenTableHead>
                            <StevenTableBody>
                            {reports.length > 0 ? (
                                reports
                                    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                                    .map((report) => (
                                        <StevenTableRow key={report._id}>
                                            <StevenTableCell>{new Date(report.createdAt).toLocaleString()}</StevenTableCell>
                                            <StevenTableCell>{report.username}</StevenTableCell>
                                            <StevenTableCell>{report.description}</StevenTableCell>
                                            <StevenTableCell>
                                                <StevenButton onClick={() => handleClose(report._id)}>Close Report</StevenButton>
                                            </StevenTableCell>
                                        </StevenTableRow>
                                    ))
                            ) : (
                                <StevenTableRow>
                                    <StevenTableCell colSpan={4}>No reports available.</StevenTableCell>
                                </StevenTableRow>
                            )}
                            </StevenTableBody>
                        </StevenTable>
                    </StevenTableContainer>
                </Col>                
            </Row>
        </Container>
    );
}

export default ViewReports;
