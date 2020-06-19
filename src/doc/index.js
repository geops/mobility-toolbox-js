import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';
import React from 'react';
import { render } from 'react-dom';
import App from './App';

render(<App />, document.getElementById('root'));
