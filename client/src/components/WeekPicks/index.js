import { useState, useEffect } from "react";
import { Container, Row } from 'react-bootstrap';
import './style.css'
import pickService from "../../services/pickService";

const WeekPicks = (props) => {
    const [picks, setPicks] = useState([])

    useEffect(() => {
        const fetchPickHistory = async () => {
            try {
                const response = await pickService.getWeeklyPicks();

                if (response.data != null) {
                    setPicks(response.data);
                }
            } catch (error) {
                console.error('Error fetching picks:', error);
            }
        };

        fetchPickHistory();
    }, [])

    return (
        <Container>
            <Row>
                <h5>Week Picks</h5>
            </Row>
            <Row>
                <table striped bordered hover class="wp-table">
                    <thead>
                        <tr>
                        <th>Submitted</th>
                        <th>User</th>
                        <th>Pick</th>
                        </tr>
                    </thead>
                    <tbody>
                        {picks.map((item) => (
                            <tr key={item._id} class="wp-row">
                                <td class="wp-cell">{new Date(item.createdAt).toLocaleString()}</td>
                                <td class="wp-cell">{item.username}</td>
                                <td class="wp-cell">{item.text}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Row>
        </Container>
    );
}

export default WeekPicks;
