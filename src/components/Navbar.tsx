/* eslint-disable prettier/prettier */
import React, { Component } from 'react';
import { useNavigate } from 'react-router-dom';
import ListGroup from 'react-bootstrap/ListGroup';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <ListGroup>
      <ListGroup.Item action onClick={() => navigate("/")}>Home</ListGroup.Item>
      <ListGroup.Item action>Hochgeladen</ListGroup.Item>
      <ListGroup.Item action onClick={() => navigate("/Settings")}>Einstellungen</ListGroup.Item>
    </ListGroup>
  );
};

export default Navbar;