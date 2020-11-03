import React from 'react';
import { ThemeProvider, makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';
import { geopsTheme, Header, Footer } from '@geops/geops-ui';
import Examples from './components/Examples';
import Example from './components/Example';
import Documentation from './components/Documentation';
import Home from './components/Home';

import 'typeface-lato';
import './App.scss';

const useStyles = makeStyles({
  content: {
    flexGrow: 1,
    overflowY: 'auto',
    marginTop: 30,
    paddingBottom: 200,
  },
});

const tabs = [
  {
    label: 'Home',
    to: '/home',
  },
  {
    label: 'API',
    to: '/api',
  },
  {
    label: 'Examples',
    to: '/examples',
  },
  {
    label: 'Code',
    href: 'https://github.com/geops/mobility-toolbox-js',
  },
];

const App = () => {
  const classes = useStyles();

  return (
    <ThemeProvider theme={geopsTheme}>
      <Router>
        <Header title="mobility-toolbox-js" tabs={tabs} />
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
