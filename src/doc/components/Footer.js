import React from 'react';
import { IconButton } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import FooterLogo from '../img/footer_logo.svg';
import TwitterIcon from '../img/twitter.svg';
import FacebookIcon from '../img/facebook.svg';
import LinkedInIcon from '../img/linkedin.svg';
import GitHubIcon from '../img/github.svg';
import XingIcon from '../img/xing.svg';

const useStyles = makeStyles((theme) => ({
  footer: {
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      padding: '0 10px',
    },
    [theme.breakpoints.up('md')]: {
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0B4457',
    padding: '0 70px',
    display: 'flex',
    minHeight: 70,
    zIndex: 1100,
  },
  brand: {
    flexGrow: 1,
  },
  logo: {
    [theme.breakpoints.down('sm')]: {
      padding: 15,
      marginBottom: 15,
    },
    padding: 5,
    width: 100,
  },
  links: {
    [theme.breakpoints.up('md')]: {
      justifyContent: 'flex-end',
    },
    display: 'flex',
    justifyContent: 'flex-start',
    flexGrow: 1,
    height: 50,
  },
  icon: {
    width: 20,
    height: 20,
    padding: 10,
  },
}));

const Footer = () => {
  const classes = useStyles();
  return (
    <footer className={classes.footer}>
      <div className={classes.brand}>
        <img className={classes.logo} src={FooterLogo} alt="Logo" />
      </div>
      <div className={classes.links}>
        <IconButton
          className={classes.icon}
          href="https://twitter.com/geops?lang=en"
          target="_blank"
          rel="noopener"
        >
          <img className={classes.svg} src={TwitterIcon} alt="twitter" />
        </IconButton>
        <IconButton
          className={classes.icon}
          href="https://www.facebook.com/geOpsSpatialWeb"
          target="_blank"
          rel="noopener"
        >
          <img className={classes.svg} src={FacebookIcon} alt="facebook" />
        </IconButton>
        <IconButton
          className={classes.icon}
          href="https://github.com/geops/"
          target="_blank"
          rel="noopener"
        >
          <img className={classes.svg} src={GitHubIcon} alt="github" />
        </IconButton>
        <IconButton
          className={classes.icon}
          href="https://de.linkedin.com/company/geops"
          target="_blank"
          rel="noopener"
        >
          <img className={classes.svg} src={LinkedInIcon} alt="linkedin" />
        </IconButton>
        <IconButton
          className={classes.icon}
          href="https://www.xing.com/companies/geops"
          target="_blank"
          rel="noopener"
        >
          <img className={classes.svg} src={XingIcon} alt="xing" />
        </IconButton>
      </div>
    </footer>
  );
};

export default Footer;
