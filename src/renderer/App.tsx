import { MemoryRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import React, { Component } from 'react';

import Settings from 'pages/Settings';
import icon from '../../assets/icon.svg';
import './App.css';

const Hello = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="Hello">
        <img width="200" alt="icon" src={icon} />
      </div>
      <h1>Willkommen bei EzScreen</h1>
      <div className="Hello">
        <button type="button" onClick={() => window.electron.ipcRenderer.sendMessage('screenshot_create')}>
          Foto
        </button>
        <button type="button" onClick={() => navigate("/Settings")}>
          Einstellungen
        </button>
      </div>
    </div>
  );
};

class App extends Component {
  constructor(props) {
    super(props);
    window.home = this;

    console.log(this.props);

    this.navigation = this.props.navigation;
  }

  componentDidMount(): void {
    window.electron.ipcRenderer.on('navigate', (arg) => {
      console.log('navigate');
      this.navigation.navigate(arg);
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
          <Route path="/" element={<Hello />} />
          <Route path="/Settings" element={<Settings />} />
        </Routes>
        <p>Version: 0.1.5</p>
      </Router>
    );
  }
}

export default App;
