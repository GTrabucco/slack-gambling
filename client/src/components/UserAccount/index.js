import { useEffect, useState } from "react";
import { Container, Form, Row, Col } from 'react-bootstrap';
import { useAuth0 } from "@auth0/auth0-react";
import StevenNotification from "../StevenNotification";
import './style.css'
import StevenButton from "../Common/StevenButton";
import userService from "../../services/userService";

const UserAccount = () => {
    const { user } = useAuth0();
    const [message, setMessage] = useState();
    const [displayName, setDisplayName] = useState("");
    const [receiveSundayReminderChecked, setReceiveSundayReminderChecked] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const response = await userService.getByUsername(user.name);
                const details = response.data[0];
                if (!details) {
                    setDisplayName(user.name);
                    setReceiveSundayReminderChecked(false);
                    setPhoneNumber("");
                    return;
                }

                setReceiveSundayReminderChecked(!!details.receiveSundayReminder);
                setDisplayName(details.displayName || user.name);
                setPhoneNumber(details.phoneNumber || "");
            } catch (error) {
                setMessage('Error fetching user details');
            }
        };

        fetchUserDetails();
    }, [user.name]);

    const updateUserDetails = async () => {
        try {
            const username = user.name;
            await userService.updateUserDetails({
                username: username,
                displayName: displayName?.trim() ? displayName.trim() : user.name,
                receiveSundayReminder: receiveSundayReminderChecked,
                phoneNumber: phoneNumber
            });
            setMessage('Updated User Details');
        } catch (error) {
            setMessage('Error updating user details');
        }
    };

    return (
        <Container className="ua-page mt-4">
            <Row>
                <StevenNotification message={message} setMessage={setMessage} />
            </Row>

            <Row className="mt-3 justify-content-center">
                <Col md={8} lg={7}>
                    <Form
                        className="ua-panel"
                        onSubmit={(e) => {
                            e.preventDefault();
                            updateUserDetails();
                        }}
                    >
                        <div className="ua-header">
                            <h4>Account Settings</h4>
                            <p>Manage your display name and reminder preferences.</p>
                        </div>

                        <Form.Group controlId="displayName" className="ua-section">
                            <Form.Label>Display Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder={user.name}
                            />
                            <div className="ua-help">This is shown on standings and pick history.</div>
                        </Form.Group>

                        <div className="ua-section">
                            <Form.Label>Email</Form.Label>
                            <div className="ua-readonly">{user.email}</div>
                        </div>

                        <div className="ua-section">
                            <Form.Check
                                checked={receiveSundayReminderChecked}
                                onChange={() => setReceiveSundayReminderChecked(!receiveSundayReminderChecked)}
                                label="Receive Sunday 9:00 AM ET reminder"
                            />
                            {receiveSundayReminderChecked && (
                                <Form.Group controlId="formPhoneNumber" className="mt-3">
                                    <Form.Label>Phone Number</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        placeholder="e.g. 123-456-7890"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                    />
                                </Form.Group>
                            )}
                        </div>

                        <div className="ua-actions">
                            <StevenButton type="submit">
                                Save Changes
                            </StevenButton>
                        </div>
                    </Form>
                </Col>
            </Row>
        </Container>


    );
};

export default UserAccount;
