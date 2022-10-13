import { MemoryRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import React, { Component } from 'react';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import 'bootstrap/dist/css/bootstrap.min.css';

import Settings from 'pages/Settings';
import Navbar from 'components/Navbar';
import icon from '../../assets/icon.svg';
import audioUploaded from '../../assets/audio/uploaded.wav';
// import './App.css';

const Hello = (props) => {
  const navigate = useNavigate();

  return (
    <Container fluid>
      <Row>
        <Col sm={3}>
          <Navbar />
        </Col>
        <Col>
          <p>Willkommen <a href="#">{props.username}</a>.</p>
        </Col>
      </Row>
    </Container>
  );
};

class App extends Component {
  constructor(props) {
    super(props);
    window.home = this;

    this.state = {
      username: '',
      version: '0',
    };

    window.electron.ipcRenderer.sendMessage('version_current');
    window.electron.ipcRenderer.sendMessage('config_username');
  }

  componentDidMount(): void {
    window.electron.ipcRenderer.on('screenshot_uploaded', (arg) => {
      console.log('screenshot uploaded');
      const audio = new Audio(audioUploaded);
      audio.play();
    });

    window.electron.ipcRenderer.on('version_current', (arg) => {
      this.setState({ version: arg });
    });

    window.electron.ipcRenderer.on('config_username', (arg) => {
      this.setState({ username: arg });
    });
  }

  createScreenshot = async () => {
    console.log('create screenshot');
    window.electron.ipcRenderer.sendMessage('screenshot_create');
  };

  render() {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<Hello username={this.state.username} />} />
          <Route path="/Settings" element={<Settings />} />
        </Routes>
        <p>Version: {this.state.version}</p>
      </Router>
    );
  }
}

export default App;
