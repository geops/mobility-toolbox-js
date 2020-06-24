import React, { useState } from 'react';
import AppBar from '@material-ui/core/AppBar';
import { List, ListItem, Collapse, Tabs, Tab } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import CloseIcon from '@material-ui/icons/Close';
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
      color: theme.colors.secondary,
    },
  },
  buttonCollapse: {
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
    boxShadow: 'none',
  },
  menuList: {
    borderBottom: `2px solid ${theme.colors.primary}`,
    boxShadow:
      '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
    backgroundColor: 'white',
    zIndex: 1100,
    '& .active': {
      fontWeight: 'bold',
      color: theme.colors.secondary,
    },
  },
  menuListItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  tabs: {
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
    '& .active': {
      fontWeight: 'bold',
      color: theme.colors.secondary,
    },
  },
}));

const Header = () => {
  const classes = useStyles();
  const [open, setMenuOpen] = useState(false);
  const path = window.location.pathname.split('/')[1];
  const [value, setValue] = useState(
    /^examples|api$/.test(path) ? path : 'examples',
  );

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <>
      <AppBar position="static" className={classes.appBar} color="transparent">
        <div className={classes.brand}>
          <img className={classes.logo} src={Logo} alt="Logo" />
          <div className={classes.title}>mobility-toolbox-js</div>
        </div>

        <div className={classes.buttonCollapse}>
          <IconButton onClick={() => setMenuOpen(!open)}>
            {open ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        </div>

        <Tabs
          className={classes.tabs}
          value={value}
          onChange={handleChange}
          variant="fullWidth"
        >
          <Tab value="api" component={NavLink} to="/api" label="API" />
          <Tab
            value="examples"
            component={NavLink}
            to="/examples"
            label="Examples"
          />
          <Tab
            value="code"
            component="a"
            href="https://github.com/geops/mobility-toolbox-js"
            label="Code"
          />
        </Tabs>
      </AppBar>

      <div>
        <Collapse in={open}>
          <List className={classes.menuList}>
            <ListItem
              button
              className={classes.menuListItem}
              component={NavLink}
              to="/api"
            >
              API
            </ListItem>
            <ListItem
              button
              className={classes.menuListItem}
              component={NavLink}
              to="/examples"
            >
              Examples
            </ListItem>
            <ListItem
              button
              className={classes.menuListItem}
              component="a"
              href="https://github.com/geops/mobility-toolbox-js"
              target="_blank"
              rel="noopener"
            >
              Code
            </ListItem>
          </List>
        </Collapse>
      </div>
    </>
  );
};

export default Header;
