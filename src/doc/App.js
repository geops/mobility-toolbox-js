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
import Footer from './components/Footer';
import Home from './components/Home';

import 'typeface-lato';
import './App.scss';

const theme = createMuiTheme({
  colors: {
    primary: '#6987a1',
    secondary: '#76b833',
  },
  props: {
    MuiButtonBase: {
      disableRipple: true,
    },
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
        borderBottom: '2px solid #6987a1',
      },
      colorPrimary: {},
    },
    MuiTabs: {
      root: {
        height: '100%',
      },
      flexContainer: {
        height: '100%',
      },
      indicator: {
        backgroundColor: '#76b833',
      },
    },
    MuiIconButton: {
      root: {
        color: '#6987a1',
      },
    },
  },
});

const useStyles = makeStyles({
  content: {
    flexGrow: 1,
    overflowY: 'auto',
    marginBottom: 80,
  },
  container: {
    position: 'relative',
    height: '100%',
  },
});

const App = () => {
  const classes = useStyles();

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Header />
        <div className={classes.content}>
          <Route exact path="/">
            <Redirect to="/home" />
          </Route>
          <Route exact path="/examples">
            <Redirect to="/examples/ol-map" />
          </Route>
          <Route path="/examples/:exampleKey?">
            <Container
              maxWidth="lg"
              disableGutters
              className={classes.container}
            >
              <Examples />
            </Container>
          </Route>
          <Route exact path="/home">
            <Container
              maxWidth="lg"
              disableGutters
              className={classes.container}
            >
              <Home />
            </Container>
          </Route>
          <Route exact path="/api">
            <Container
              maxWidth="lg"
              disableGutters
              className={classes.container}
            >
              <Documentation />
            </Container>
          </Route>
        </div>
        <Footer />
      </Router>
    </ThemeProvider>
  );
};

export default App;
