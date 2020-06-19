import React from 'react';
import {
  createMuiTheme,
  ThemeProvider,
  makeStyles,
} from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';
import Header from './components/Header';
import Examples from './components/Examples';
import Documentation from './components/Documentation';
import Home from './components/Home';

import 'typeface-lato';
import './App.scss';

const theme = createMuiTheme({
  colors: {
    primary: '#61849c',
    secondary: '#76b833',
  },
  overrides: {
    MuiTypography: {
      h1: {
        fontSize: 36,
        marginTop: 15,
        marginBottom: 15,
      },
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

const useStyles = makeStyles({
  content: {
    flexGrow: 1,
    overflowY: 'scroll',
  },
});

const App = () => {
  const classes = useStyles();

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Header />

        <div className={classes.content}>
          <Container
            maxWidth="lg"
            disableGutters
            style={{ position: 'relative', height: '100%' }}
          >
            <Route exact path="/">
              <Redirect to="/home" />
            </Route>
            <Route exact path="/examples">
              <Redirect to="/examples/map" />
            </Route>
            <Route path="/examples/:exampleKey?">
              <Examples />
            </Route>
            <Route exact path="/home">
              <Home />
            </Route>
            <Route exact path="/api">
              <Documentation />
            </Route>
          </Container>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
