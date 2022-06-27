import 'react-app-polyfill/stable';
import React, { useEffect, useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@material-ui/core';
import { geopsTheme, Header, Footer } from '@geops/geops-ui';

import 'typeface-lato';
import '../styles/App.scss';
import '../styles/identifiers.css';
import '../styles/search.css';
import '../styles/style.css';

function MyApp(props) {
  const { Component, pageProps } = props;

  const tabs = useMemo(() => {
    return [
      {
        label: 'Home',
        href: '/home',
      },
      {
        label: 'API',
        href: '/api',
      },
      {
        label: 'Examples',
        href: '/examples',
      },
      {
        label: 'Code',
        href: 'https://github.com/geops/mobility-toolbox-js',
      },
    ];
  }, []);

  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  return (
    <ThemeProvider theme={geopsTheme}>
      <Header title="mobility-toolbox-js" tabs={tabs} />
      {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
      {/* Doens't seems very useful this CssBaseline */}
      {/* <CssBaseline /> */}
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Component {...pageProps} />
      <Footer />
    </ThemeProvider>
  );
}

export default MyApp;
