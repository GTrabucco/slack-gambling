import React, { useEffect, useState } from "react";
import { Container, Table, Form, Row, Button } from 'react-bootstrap';
import { useAuth0 } from "@auth0/auth0-react";
import axios from 'axios';
import StevenNotification from "../StevenNotification";
import './style.css'

const UserAccount = () => {
    const { user } = useAuth0();
    const [message, setMessage] = useState();
    const [displayName, setDisplayName] = useState(null);
    const [receiveSundayReminderChecked, setReceiveSundayReminderChecked] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const response = await axios.get(`${apiBaseUrl}/api/userdetails`, {
                    params: {
                        username: user.name
                    }
                });

                const details = response.data[0];
                if (!details) {
                    updateUserDetails();
                }

                setReceiveSundayReminderChecked(details.receiveSundayReminder);
                setDisplayName(details.displayName)
                setPhoneNumber(details.phoneNumber)
            } catch (error) {
                setMessage('Error fetching user details');
            }
        };

        fetchUserDetails();
    }, [user.name, apiBaseUrl]);

    const updateUserDetails = async (e) => {
        try {
            const username = user.name;
            await axios.post(`${apiBaseUrl}/api/update-userdetails`, {
                username: username,
                displayName: displayName,
                receiveSundayReminder: receiveSundayReminderChecked,
                phoneNumber: phoneNumber
            });
            setMessage('Updated User Details');
        } catch (error) {
            setMessage('Error updating user details');
        }
    };

    return (
        <Container className="mt-4">
            <Row>
                <StevenNotification message={message} setMessage={setMessage} />
            </Row>

            <Row className="mt-3">
                <Table striped bordered responsive>
                    <tbody>
                        <tr>
                            <td><b>Display Name</b></td>
                            <td onClick={() => setIsEditing(true)} className="ua-cell" style={{ cursor: "pointer" }}>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={displayName}
                                        autoFocus
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        onBlur={() => setIsEditing(false)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') setIsEditing(false);
                                        }}
                                    />
                                ) : (
                                    <>
                                        {displayName || user.name}
                                        <span style={{ color: "blue", paddingLeft: "10px" }}>(edit)</span>
                                    </>
                                )}
                            </td>
                        </tr>
                        <tr>
                            <td><b>Email</b></td>
                            <td>{user.email}</td>
                        </tr>
                        <tr>
                            <td><b>Receive Sunday Morning (9am Eastern) Reminders</b></td>
                            <td>
                                <Form>
                                    <Form.Check
                                        checked={receiveSundayReminderChecked}
                                        onChange={() => setReceiveSundayReminderChecked(!receiveSundayReminderChecked)}
                                        label="Yes, send me reminders"
                                    />
                                    {receiveSundayReminderChecked && (
                                        <Form.Group controlId="formPhoneNumber" className="mt-2">
                                            <Form.Label>Phone Number</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                placeholder="e.g. 123-456-7890"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                            />
                                        </Form.Group>
                                    )}
                                </Form>
                            </td>
                        </tr>
                        <tr>
                            <td></td>
                            <td>
                                <Button variant="primary" className="account-btn" onClick={updateUserDetails}>
                                    Save Changes
                                </Button>
                            </td>
                        </tr>
                    </tbody>
                </Table>
            </Row>
        </Container>


    );
};

export default UserAccount;
