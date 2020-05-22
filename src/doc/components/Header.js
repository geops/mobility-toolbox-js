import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import { makeStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import Logo from '../img/logo.svg';

const useStyles = makeStyles((theme) => ({
  appBar: {
    padding: '0 70px',
  },
  logo: {
    width: 145,
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
  },
}));

const Header = () => {
  const classes = useStyles();
  return (
    <>
      <AppBar position="static" className={classes.appBar} color="transparent">
        <img className={classes.logo} src={Logo} />
        <div className={classes.links}>
          <Link to="/api">API</Link>
          <Link to="/examples">Examples</Link>
        </div>
      </AppBar>
    </>
  );
};

export default Header;
