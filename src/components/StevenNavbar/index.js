import { useAuth } from "../../hooks/AuthProvider";
import { Container, Navbar, NavDropdown } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";

const StevenNavbar = ()=>{
    var auth = useAuth();
    var navigate = useNavigate();
    var text = "Signed in as: " + auth.user?.username
    return (
        <Container>
            <Navbar className="bg-body-tertiary">
            <Container>
                <Navbar.Brand onClick={() => navigate("/dashboard")} style={{ cursor: "pointer" }}>
                <img
                    src="stevenlogo.png"
                    width="30"
                    height="30"
                    className="d-inline-block align-top"
                    alt="Steven"
                />
                </Navbar.Brand>          
                <Navbar.Toggle />
                <Navbar.Collapse className="justify-content-end">
                    <NavDropdown title={text}>
                        <NavDropdown.Item onClick={() => navigate("/account")} style={{ cursor: "pointer" }}>Account Details</NavDropdown.Item>
                        <NavDropdown.Item onClick={() => auth.logOut()}>Logout</NavDropdown.Item>
                    </NavDropdown>
                </Navbar.Collapse>
            </Container>
            </Navbar>
        </Container>
    );
}

export default StevenNavbar;