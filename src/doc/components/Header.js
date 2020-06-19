import React, { useState } from 'react';
import AppBar from '@material-ui/core/AppBar';
import { Menu, MenuItem } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import { makeStyles } from '@material-ui/core/styles';
import { NavLink } from 'react-router-dom';
import Logo from '../img/logo.svg';

const useStyles = makeStyles((theme) => ({
  appBar: {
    [theme.breakpoints.down('sm')]: {
      padding: '0 20px',
    },
    display: 'flex',
    alignItems: 'center',
    padding: '0 70px',
  },
  brand: {
    [theme.breakpoints.down('xs')]: {
      display: 'block',
    },
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    [theme.breakpoints.down('xs')]: {
      width: 120,
    },
    width: 145,
  },
  title: {
    [theme.breakpoints.down('xs')]: {
      fontSize: 18,
      marginLeft: 0,
    },
    fontSize: 22,
    fontWeight: 500,
    marginLeft: 15,
  },
  links: {
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
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
  buttonCollapse: {
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
    boxShadow: 'none',
  },
}));

const handleMenu = (event, setAnchor, setMenuOpen) => {
  setMenuOpen(true);
  setAnchor(event.currentTarget);
};
const handleClose = (setAnchor, setMenuOpen) => {
  setMenuOpen(false);
  setAnchor(null);
};

const Header = () => {
  const classes = useStyles();
  const [anchorEl, setAnchor] = useState(null);
  const [open, setMenuOpen] = useState(false);
  return (
    <>
      <AppBar position="static" className={classes.appBar} color="transparent">
        <div className={classes.brand}>
          <img className={classes.logo} src={Logo} alt="Logo" />
          <div className={classes.title}>mobility-toolbox-js</div>
        </div>

        <div className={classes.buttonCollapse}>
          <IconButton onClick={(e) => handleMenu(e, setAnchor, setMenuOpen)}>
            <MenuIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={open}
            onClose={() => handleClose(setAnchor, setMenuOpen)}
          >
            <MenuItem onClick={() => setMenuOpen(false)}>
              <NavLink to="/api">API</NavLink>
            </MenuItem>
            <MenuItem onClick={() => setMenuOpen(false)}>
              <NavLink to="/examples">Examples</NavLink>
            </MenuItem>
            <MenuItem onClick={() => setMenuOpen(false)}>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://github.com/geops/mobility-toolbox-js"
              >
                Code
              </a>
            </MenuItem>
          </Menu>
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
