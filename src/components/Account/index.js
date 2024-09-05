import { useAuth } from "../../hooks/AuthProvider";
import { Container, Row, Col } from 'react-bootstrap';

const Account = ()=>{
    const auth = useAuth();
    return (
        <Container>
            <Row>
                <Col>Username:</Col>
                <Col>{auth.user?.username}</Col>
            </Row>

            <Row>
                <Col>Password:</Col>
                <Col>{auth.user?.password}</Col>
            </Row>
        </Container>       
    );
}

export default Account;