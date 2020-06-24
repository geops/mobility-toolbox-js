import React from 'react';
import TwitterIcon from '@material-ui/icons/Twitter';
import FacebookIcon from '@material-ui/icons/Facebook';
import GitHubIcon from '@material-ui/icons/GitHub';
import LinkedInIcon from '@material-ui/icons/LinkedIn';
import { IconButton } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import FooterLogo from '../img/footer_logo.svg';

const useStyles = makeStyles((theme) => ({
  footer: {
    [theme.breakpoints.down('sm')]: {
      padding: '0 10px',
    },
    backgroundColor: '#0B4457',
    padding: '0 70px',
    maxHeight: 80,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexGrow: 1,
  },
  logo: {
    padding: 5,
    height: 15,
  },
  links: {
    display: 'flex',
    justifyContent: 'flex-end',
    flexGrow: 1,
  },
  icon: {
    [theme.breakpoints.down('xs')]: {
      padding: 8,
    },
    padding: 10,
  },
  svg: {
    [theme.breakpoints.down('xs')]: {
      width: 15,
      height: 15,
    },
    fill: 'white',
  },
}));

const Header = () => {
  const classes = useStyles();
  return (
    <div className={classes.footer}>
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
          <TwitterIcon className={classes.svg} />
        </IconButton>
        <IconButton
          className={classes.icon}
          href="https://www.facebook.com/geOpsSpatialWeb"
          target="_blank"
          rel="noopener"
        >
          <FacebookIcon className={classes.svg} />
        </IconButton>
        <IconButton
          className={classes.icon}
          href="https://github.com/geops/"
          target="_blank"
          rel="noopener"
        >
          <GitHubIcon className={classes.svg} />
        </IconButton>
        <IconButton
          className={classes.icon}
          href="https://de.linkedin.com/company/geops"
          target="_blank"
          rel="noopener"
        >
          <LinkedInIcon className={classes.svg} />
        </IconButton>
      </div>
    </div>
  );
};

export default Header;
