import React, { useEffect, useState } from "react";
import { Container, Table, Form, Row } from 'react-bootstrap';
import { useAuth0 } from "@auth0/auth0-react";
import axios from 'axios';
import StevenNotification from "../StevenNotification";
import './style.css'

const UserAccount = () => {
    const { user } = useAuth0();
    const [message, setMessage] = useState();
    const [userDetails, setUserDetails] = useState();
    const [receiveSundayReminderChecked, setReceiveSundayReminderChecked] = useState(false);
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
                setUserDetails(details);
                setReceiveSundayReminderChecked(details.receiveSundayReminder);
            } catch (error) {
                setMessage('Error fetching user details');
            }
        };

        fetchUserDetails();
    }, [user.name, apiBaseUrl]);

    const updateUserDetails = async (e) => {
        const newReceiveSundayReminderChecked = e.target.checked;
        setReceiveSundayReminderChecked(newReceiveSundayReminderChecked);

        try {
            const username = user.name;
            const receiveSundayReminder = newReceiveSundayReminderChecked;
            await axios.post(`${apiBaseUrl}/api/update-userdetails`, {
                username: username,
                receiveSundayReminder: receiveSundayReminder
            });
            setMessage('Updated User Details');
        } catch (error) {
            setMessage('Error updating user details');
        }
    };

    return (
        <Container>
            <Row>
                <StevenNotification 
                    message={message}
                    setMessage={setMessage}
                />
            </Row>
            <Row>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th class="ua-cell">Username</th>
                            <th class="ua-cell">Email</th>
                            <th class="ua-cell">Receive Sunday Morning (9am Eastern) Reminders</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="ua-cell">{user.name}</td>
                            <td class="ua-cell">{user.email}</td>
                            <td class="ua-cell">
                                <Form>
                                    <Form.Check 
                                        type="switch"
                                        id="custom-switch"
                                        onChange={updateUserDetails}
                                        checked={receiveSundayReminderChecked}
                                    />
                                </Form>
                            </td>
                        </tr>
                    </tbody>
                </Table>
            </Row>
            
        </Container>
    );
};

export default UserAccount;
