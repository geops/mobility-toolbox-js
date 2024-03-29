import 'react-app-polyfill/stable';
import React, { useEffect } from 'react';
import { ThemeProvider, StyledEngineProvider } from '@mui/material';
import { geopsTheme, Header, Footer } from '@geops/geops-ui';

import 'typeface-lato';
import '../styles/App.scss';
import '../styles/identifiers.css';
import '../styles/search.css';
import '../styles/style.css';

const tabs = [
  {
    label: 'Home',
    href: '/',
    component: 'a',
  },
  {
    label: 'API',
    href: '/doc',
    component: 'a',
  },
  {
    label: 'Examples',
    href: '/examples',
    component: 'a',
  },
  {
    label: 'Code',
    href: 'https://github.com/geops/mobility-toolbox-js',
    component: 'a',
  },
];

function MyApp(props) {
  const { Component, pageProps } = props;

  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={geopsTheme}>
        <Header title="mobility-toolbox-js" tabs={tabs} />
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        {/* Doens't seems very useful this CssBaseline */}
        {/* <CssBaseline /> */}
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Component {...pageProps} />
        <Footer />
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default MyApp;
