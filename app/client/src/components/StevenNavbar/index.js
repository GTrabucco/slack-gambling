import { useAuth } from "../../hooks/AuthProvider";
import { Container, Navbar, NavDropdown, Nav, NavbarCollapse } from 'react-bootstrap';
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
                <Navbar.Collapse>
                    <Nav>
                        <Nav.Link onClick={() => navigate("/dashboard")} style={{ cursor: "pointer" }}>Dashboard</Nav.Link>
                        <Nav.Link onClick={() => navigate("/standings")} style={{ cursor: "pointer" }}>Standings</Nav.Link>       
                        <Nav.Link onClick={() => navigate("/pickhistory")} style={{ cursor: "pointer" }}>Pick History</Nav.Link>    
                        <Nav.Link onClick={() => navigate("/calculatescoring")} style={{ cursor: "pointer" }}>Calculate Scoring (Private)</Nav.Link>                                                         
                        <Nav.Link onClick={() => navigate("/report")} style={{ cursor: "pointer" }}>Report A Bug</Nav.Link>    
                    </Nav>
                </Navbar.Collapse>
                <NavbarCollapse  className="justify-content-end">
                    <NavDropdown title={text}>
                        <NavDropdown.Item onClick={() => navigate("/account")} style={{ cursor: "pointer" }}>Account Details</NavDropdown.Item>
                        <NavDropdown.Item onClick={() => auth.logOut()}>Logout</NavDropdown.Item>
                    </NavDropdown>
                </NavbarCollapse>
            </Container>
            </Navbar>
        </Container>
    );
}

export default StevenNavbar;