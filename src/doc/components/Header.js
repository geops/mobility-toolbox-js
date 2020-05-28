import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import { makeStyles } from '@material-ui/core/styles';
import { NavLink } from 'react-router-dom';
import Logo from '../img/logo.svg';

const useStyles = makeStyles((theme) => ({
  appBar: {
    padding: '0 70px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    width: 145,
  },
  title: {
    fontSize: 22,
    fontWeight: 500,
    marginLeft: 15,
  },
  links: {
    display: 'flex',
    marginBottom: 2,
    '& a': {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      marginLeft: 10,
      marginBottom: 4,
      transition: 'all .3s ease',
    },
    '& a:hover': {
      color: theme.colors.secondary,
      borderBottom: `4px solid ${theme.colors.secondary}`,
    },
    '& .active': {
      fontWeight: 'bold',
    },
  },
}));

const Header = () => {
  const classes = useStyles();
  return (
    <>
      <AppBar position="static" className={classes.appBar} color="transparent">
        <div className={classes.brand}>
          <img className={classes.logo} src={Logo} alt="Logo" />
          <div className={classes.title}>mobility-toolbox-js</div>
        </div>

        <div className={classes.links}>
          <NavLink to="/api">API</NavLink>
          <NavLink to="/examples">Examples</NavLink>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/geops/mobility-toolbox-js"
          >
            Code
          </a>
        </div>
      </AppBar>
    </>
  );
};

export default Header;
