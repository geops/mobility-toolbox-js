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
    paddingBottom: 115,
    margin: 'auto',
    marginTop: 30,
  },
  documentation: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: 0,
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
        <Route exact path="/">
          <Container className={classes.content}>
            <Redirect to="/home" />
          </Container>
        </Route>
        <Route exact path="/examples">
          <Container className={classes.content}>
            <Examples />
          </Container>
        </Route>
        <Route path="/example/:exampleKey">
          <Container className={classes.content}>
            <Example />
          </Container>
        </Route>
        <Route exact path="/home">
          <Container className={classes.content}>
            <Home />
          </Container>
        </Route>
        <Route path="/api/:path*">
          <Container className={classes.documentation} maxWidth={false}>
            <Documentation />
          </Container>
        </Route>
        <Footer />
      </Router>
    </ThemeProvider>
  );
};

export default App;
