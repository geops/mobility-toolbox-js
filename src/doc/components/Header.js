import React, { useState } from 'react';
import AppBar from '@material-ui/core/AppBar';
import {
  List,
  ListItem,
  Collapse,
  Tabs,
  Tab,
  Hidden,
  Divider,
  Typography,
} from '@material-ui/core';
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
    boxShadow: '0px 10px 15px #35353520',
    background: 'white',
    height: '100px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    [theme.breakpoints.down('xs')]: {
      width: 100,
    },
    width: 120,
  },
  title: {
    [theme.breakpoints.down('xs')]: {
      fontSize: 15,
      marginLeft: 10,
    },
    fontSize: 18,
    fontWeight: 500,
    marginLeft: 15,
  },
  buttonCollapse: {
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
    boxShadow: 'none',
  },
  menuList: {
    boxShadow: '0px 10px 15px #35353520',
    backgroundColor: 'white',
    '& .active': {
      fontWeight: 'bold',
      color: theme.colors.secondary,
    },
    zIndex: 1200,
    padding: 0,
  },
  menuListItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
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
  collapse: {
    position: 'sticky',
    top: 100,
    left: 'auto',
    right: 0,
    background: 'white',
    zIndex: 1100,
  },
}));

const Header = () => {
  const classes = useStyles();
  const [open, setMenuOpen] = useState(false);
  const path = window.location.pathname.split('/')[1];
  const [value, setValue] = useState(
    /^home|examples|api$/.test(path) ? path : 'home',
  );

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <>
      <AppBar position="sticky" className={classes.appBar}>
        <div className={classes.brand}>
          <img className={classes.logo} src={Logo} alt="Logo" />
          <Typography className={classes.title}>mobility-toolbox-js</Typography>
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
          <Tab value="home" component={NavLink} to="/home" label="Home" />
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

      <Hidden mdUp>
        <div className={classes.collapse}>
          <Collapse in={open}>
            <List className={classes.menuList}>
              <ListItem
                button
                className={classes.menuListItem}
                component={NavLink}
                onClick={() => setMenuOpen(false)}
                to="/home"
              >
                Home
              </ListItem>
              <Divider />
              <ListItem
                button
                className={classes.menuListItem}
                component={NavLink}
                onClick={() => setMenuOpen(false)}
                to="/api"
              >
                API
              </ListItem>
              <Divider />
              <ListItem
                button
                className={classes.menuListItem}
                component={NavLink}
                onClick={() => setMenuOpen(false)}
                to="/examples"
              >
                Examples
              </ListItem>
              <Divider />
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
      </Hidden>
    </>
  );
};

export default Header;
