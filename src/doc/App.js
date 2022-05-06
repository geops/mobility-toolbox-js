import React from 'react';
import { ThemeProvider, makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import { Outlet, Routes, Route, Navigate, Link } from 'react-router-dom';
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
    component: Link,
    to: '/home',
  },
  {
    label: 'API',
    component: Link,
    to: '/api',
  },
  {
    label: 'Examples',
    component: Link,
    to: '/examples',
  },
  {
    label: 'Code',
    href: 'https://github.com/geops/mobility-toolbox-js',
  },
];

function Main() {
  return (
    <ThemeProvider theme={geopsTheme}>
      <Header title="mobility-toolbox-js" tabs={tabs} />
      <Outlet />
      <Footer />
    </ThemeProvider>
  );
}

function App() {
  const classes = useStyles();

  return (
    <Routes>
      <Route path="/" element={<Main />}>
        <Route index element={<Navigate to="/home" />} />
        <Route
          index
          path="/home"
          element={
            <Container className={classes.content}>
              <Home />
            </Container>
          }
        />
        <Route
          path="/examples"
          element={
            <Container className={classes.content}>
              <Examples />
            </Container>
          }
        />
        <Route
          path="/example/:exampleKey"
          element={
            <Container className={classes.content} maxWidth={false}>
              <Example />
            </Container>
          }
        />
        <Route path="/api">
          <Route
            index
            element={
              <Container className={classes.documentation} maxWidth={false}>
                <Documentation />
              </Container>
            }
          />
          <Route
            path="*"
            element={
              <Container className={classes.documentation} maxWidth={false}>
                <Documentation />
              </Container>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
