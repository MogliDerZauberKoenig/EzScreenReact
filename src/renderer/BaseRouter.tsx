/* eslint-disable prettier/prettier */
import { BrowserRouter as Router, Route } from 'react-router-dom';

import App from './App';
import Area from './Area';

const BaseRouter = () => {
  console.log(window.location.href);
  let splitter = '#\\';
  
  if (window.location.href.includes('%23/')) splitter = '%23/';

  const view = window.location.href.split(splitter)[window.location.href.split(splitter).length - 1];

  if (view === 'Main') {
    return (
      <App />
    );
  } else {
    return (
      <Area />
    );
  }
};

export default BaseRouter;
