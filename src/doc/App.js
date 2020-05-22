import React from 'react';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Header from './components/Header';
import Examples from './components/Examples';
import Documentation from './components/Documentation';

import './App.css';

const theme = createMuiTheme({
  colors: {
    primary: '#61849c',
    secondary: '#76b833',
  },
  overrides: {
    MuiTypography: {
      h1: {
        fontSize: 36,
        marginBottom: 15,
      },
    },
    MuiGrid: {
    },
    MuiAppBar: {
      root: {
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: 'row',
        minHeight: 100,
        borderBottom: '2px solid #61849c',
      },
      colorPrimary: {},
    },
  },
});

const App = () => (
  <ThemeProvider theme={theme}>
    <Router>
      <Header />
      <Container maxWidth="lg">
        <Route path="/examples/:exampleKey?">
          <Examples />
        </Route>
        <Route exact path="/api">
          <Documentation />
        </Route>
      </Container>
    </Router>
  </ThemeProvider>
);

export default App;
