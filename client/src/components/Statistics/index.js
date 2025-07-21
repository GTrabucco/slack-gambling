import React, { useState, useEffect } from "react";
import { Container, Row, Table, Col, Form, Button, Alert } from 'react-bootstrap';
import { useAuth0 } from "@auth0/auth0-react";
import axios from 'axios'
import './style.css'

const Statistics = () => {
  const [error, setError] = useState("");
  const { user } = useAuth0();
  const [picks, setPicks] = useState([])
  const [pickGroups, setPickGroups] = useState([])
  const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

  useEffect(() => {
    const fetchPickHistory = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/api/get-pick-history`, {
          params: {
            username: user.name
          }
        });

        if (response.data != null) {
          setPicks(response.data);
          const data = Object.groupBy(response.data, ({ season }) => season)
          var result = Object.keys(data).map((key) => data[key]).reverse();
          setPickGroups(result)
        }
      } catch (error) {
        setError('Error fetching picks');
      }
    };

    fetchPickHistory();
  }, [])

  const getPerfectWeeks = (season) => {
    let count = 0;
    let resultMap;
    if (!season) {
      Object.entries(pickGroups).map(group =>{
        resultMap = group[1].reduce((acc, { week, result }) => {
          if (!acc[week]) {
            acc[week] = 0;
          }
          acc[week] += result;
          return acc;
        }, {});

        for (const week in resultMap) {
          if (resultMap[week] === 4) {
            count++;
          }
        }
      })   
    } else {
      const data = picks.filter((item) => item.season === season)
      resultMap = data.reduce((acc, { week, result }) => {
        if (!acc[week]) {
          acc[week] = 0;
        }
        acc[week] += result;
        return acc;
      }, {});

      for (const week in resultMap) {
        if (resultMap[week] === 4) {
          count++;
        }
      }
    }
  
    return count;
  }

  const getNegativeFourWeeks = (season) => {
    let count = 0;
    let resultMap;
    if (!season) {
      Object.entries(pickGroups).map(group =>{
        resultMap = group[1].reduce((acc, { week, result }) => {
          if (!acc[week]) {
            acc[week] = 0;
          }
          acc[week] += result;
          return acc;
        }, {});

        for (const week in resultMap) {
          if (resultMap[week] === -4) {
            count++;
          }
        }
      })   
    } else {
      const data = picks.filter((item) => item.season === season)
      resultMap = data.reduce((acc, { week, result }) => {
        if (!acc[week]) {
          acc[week] = 0;
        }
        acc[week] += result;
        return acc;
      }, {});

      for (const week in resultMap) {
        if (resultMap[week] === -4) {
          count++;
        }
      }
    }
  
    return count;
  }

  return (
    <>
      <Container>
        <Row>
          <h4>Overall Record</h4>
        </Row>
        <Row className="no-gutters h-100">
          <Table striped bordered hover>
            <thead>
            </thead>
            <tbody>
              <tr className="st-row">
                <td className="st1-cell">Favorites Record</td>
                <td className="st2-cell">{picks.filter(item => item.type === "favorite" && item.result === 1).length} -
                  {picks.filter(item => item.type === "favorite" && item.result === -1).length} - 
                  {picks.filter(item => item.type === "favorite" && item.result === 0).length}</td>
              </tr>
              <tr className="st-row">
                <td className="st1-cell">Underdogs Record</td>
                <td className="st2-cell">{picks.filter(item => item.type === "dog" && item.result === 1).length} -
                  {picks.filter(item => item.type === "dog" && item.result === -1).length} - 
                  {picks.filter(item => item.type === "dog" && item.result === 0).length}</td>
              </tr>
              <tr className="st-row">
                <td className="st1-cell">Overs Record</td>
                <td className="st2-cell">{picks.filter(item => item.type === "over" && item.result === 1).length} -
                  {picks.filter(item => item.type === "over" && item.result === -1).length} - 
                  {picks.filter(item => item.type === "over" && item.result === 0).length}</td>
              </tr>
              <tr className="st-row">
                <td className="st1-cell">Unders Record</td>
                <td className="st2-cell">{picks.filter(item => item.type === "under" && item.result === 1).length} -
                  {picks.filter(item => item.type === "under" && item.result === -1).length} - 
                  {picks.filter(item => item.type === "under" && item.result === 0).length}</td>
              </tr>
              <tr className="st-row">
                <td className="st1-cell">Perfect Weeks</td>
                <td className="st2-cell">{getPerfectWeeks()}</td>
              </tr>
              <tr className="st-row">
                <td className="st1-cell">-4 Weeks</td>
                <td className="st2-cell">{getNegativeFourWeeks()}</td>
              </tr>
            </tbody>
          </Table>
        </Row>
      </Container>

      <br />

      {
        Object.entries(pickGroups).map(group => {
          const seasonData = group[1]
          const season = seasonData[0].season;
          return (
            <Container key={season}>
              <Row>
                <h4>{season} Stats</h4>
              </Row>
              <Row className="no-gutters h-100">
                <Table striped bordered hover>
                  <thead>
                  </thead>
                  <tbody>
                    <tr className="st-row">
                      <td className="st1-cell">Favorites Record</td>
                      <td className="st2-cell">{seasonData.filter(item => item.type === "favorite" && item.result === 1).length} -
                        {seasonData.filter(item => item.type === "favorite" && item.result === -1).length} - 
                        {seasonData.filter(item => item.type === "favorite" && item.result === 0).length}</td>
                    </tr>
                    <tr className="st-row">
                      <td className="st1-cell">Underdogs Record</td>
                      <td className="st2-cell">{seasonData.filter(item => item.type === "dog" && item.result === 1).length} -
                        {seasonData.filter(item => item.type === "dog" && item.result === -1).length} - 
                        {seasonData.filter(item => item.type === "dog" && item.result === 0).length}</td>
                    </tr>
                    <tr className="st-row">
                      <td className="st1-cell">Overs Record</td>
                      <td className="st2-cell">{seasonData.filter(item => item.type === "over" && item.result === 1).length} -
                        {seasonData.filter(item => item.type === "over" && item.result === -1).length} -  
                        {seasonData.filter(item => item.type === "over" && item.result === 0).length}</td>
                    </tr>
                    <tr className="st-row">
                      <td className="st1-cell">Unders Record</td>
                      <td className="st2-cell">{seasonData.filter(item => item.type === "under" && item.result === 1).length} -
                        {seasonData.filter(item => item.type === "under" && item.result === -1).length} - 
                        {seasonData.filter(item => item.type === "under" && item.result === 0).length}</td>
                    </tr>
                    <tr className="st-row">
                      <td className="st1-cell">Perfect Weeks</td>
                      <td className="st2-cell">{getPerfectWeeks(season)}</td>
                    </tr>
                    <tr className="st-row">
                      <td className="st1-cell">-4 Weeks</td>
                      <td className="st2-cell">{getNegativeFourWeeks(season)}</td>
                    </tr>
                  </tbody>
                </Table>
              </Row>
            </Container>
          )
        })
      }
    </>
  );
};

export default Statistics;
