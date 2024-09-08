import React, { useState } from "react";
import { useAuth } from "../../hooks/AuthProvider";
import { Container, Table, Form, Button } from 'react-bootstrap';
import axios from 'axios'

const UserAccount = ()=>{
    const auth = useAuth();
    const [error, setError] = useState("");
    const [newPassword, setNewPassword] = useState("")
    
    const handleNewPasswordChange = (event) => {
        setNewPassword(event.target.value);
    };

    const resetPassword = async (e)=>{
        e.preventDefault();
        var resetData = {
            username: auth.user?.username,
            newPassword: newPassword
        }
        
        try {
            const response = await axios.post(`${auth.apiBaseUrl}/api/reset-password`, resetData);
            setNewPassword("")
        } catch (error) {
            setError('Error fetching data');
        }
    }
    
    return (
            <Container>
                <Table>
                    <tr>
                        <td>Username</td>
                        <td>{auth.user?.username}</td>
                    </tr>
                    <tr>
                        <td>Password</td>
                        <td><Form.Control
                                type="text"
                                value={newPassword}
                                onChange={handleNewPasswordChange}
                                placeholder="Reset Password" />
                        </td>
                        <td><Button type="submit">Reset Password</Button></td>
                    </tr>
                    <tr>
                        <td>Receive Sunday Reminder:</td>
                        <td>{JSON.stringify(auth.user?.receiveSundayReminder)}</td>
                    </tr>
                </Table>
            </Container>               
    );
}

export default UserAccount;