/* eslint-disable prettier/prettier */
import React, { Component } from 'react';

import Navbar from 'components/Navbar';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

class Settings extends Component {
  constructor(props) {
    super(props);
    window.settings = this;
  }

  render() {
    return (
      <Container fluid>
      <Row>
        <Col sm={3}>
          <Navbar />
        </Col>
        <Col>
          <p>Einstellungen</p>
        </Col>
      </Row>
    </Container>
    );
  }
} 

export default Settings;
