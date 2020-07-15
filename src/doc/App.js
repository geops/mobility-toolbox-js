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
import Example from './components/Example';
import Documentation from './components/Documentation';
import Footer from './components/Footer';
import Home from './components/Home';

import 'typeface-lato';
import './App.scss';

const colors = {
  primary: '#6987a1',
  secondary: '#76b833',
  secondaryHover: '#4f7c1c',
};

const theme = createMuiTheme({
  colors,
  props: {
    MuiButtonBase: {
      disableRipple: true,
    },
  },
  typography: {
    fontFamily: ['Lato', 'Arial'],
  },
  palette: {
    text: {
      primary: '#4b4b4b',
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
      colorPrimary: {
        color: '#353535',
      },
    },
    MuiCard: {
      root: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
      },
    },
    MuiCardMedia: {
      root: {
        paddingTop: '56.25%',
      },
    },
    MuiCardActions: {
      root: {
        justifyContent: 'flex-end',
        paddingBottom: 0,
        paddingRight: 0,
      },
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
    MuiTab: {
      root: {
        textTransform: 'unset',
        '@media (min-width: 600px)': {
          minWidth: 'unset',
        },
        width: 100,
        fontFamily: 'Lato, Arial, sans-serif',
      },
    },
    MuiIconButton: {
      root: {
        color: '#6987a1',
      },
    },
    MuiButton: {
      root: {
        padding: '10px, 25px',
        backgroundColor: colors.secondary,
        color: 'white',
        textTransform: 'none',

        '&:hover': {
          transition: '0.3s ease',
          backgroundColor: colors.secondaryHover,
        },
      },
    },
  },
});

const useStyles = makeStyles({
  content: {
    flexGrow: 1,
    overflowY: 'auto',
    marginTop: 30,
    paddingBottom: 200,
  },
});

const App = () => {
  const classes = useStyles();

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Header />
        <Container maxWidth="lg" className={classes.content}>
          <Route exact path="/">
            <Redirect to="/home" />
          </Route>
          <Route exact path="/examples">
            <Examples />
          </Route>
          <Route path="/example/:exampleKey">
            <Example />
          </Route>
          <Route exact path="/home">
            <Home />
          </Route>
          <Route path="/api/:path*">
            <Documentation />
          </Route>
        </Container>
        <Footer />
      </Router>
    </ThemeProvider>
  );
};

export default App;
