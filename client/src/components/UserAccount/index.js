import React from "react";
import { Container, Table } from 'react-bootstrap';
import { useAuth0 } from "@auth0/auth0-react";

const UserAccount = ()=>{
    const {user} = useAuth0();
    return (
            <Container>
                <Table>
                    <tr>
                        <td>Username</td>
                        <td>{user.name}</td>
                    </tr>
                    <tr>
                        <td>Email</td>
                        <td>{user.email}</td>
                    </tr>
                    
                </Table>
            </Container>               
    );
}

export default UserAccount;