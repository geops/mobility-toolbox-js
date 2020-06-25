import React from 'react';
import {
  createMuiTheme,
  ThemeProvider,
  makeStyles,
} from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Examples from './components/Examples';
import Documentation from './components/Documentation';

import 'typeface-lato';
import './App.css';

const theme = createMuiTheme({
  colors: {
    primary: '#6987a1',
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
    overflowY: 'scroll',
  },
});

const App = () => {
  const classes = useStyles();

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Header />
        <Route exact path="/">
          <Redirect to="/examples/map" />
        </Route>
        <Route path="/examples/:exampleKey?">
          <div className={classes.content}>
            <Container maxWidth="lg">
              <Examples />
            </Container>
          </div>
        </Route>
        <Route exact path="/api">
          <Documentation />
        </Route>
        <Footer />
      </Router>
    </ThemeProvider>
  );
};

export default App;
