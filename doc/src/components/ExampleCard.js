import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Icon from '@mui/material/Icon';
import Typography from '@mui/material/Typography';
import makeStyles from '@mui/styles/makeStyles';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { CgArrowRight } from 'react-icons/cg';
import Markdown from 'react-markdown';

const useStyles = makeStyles((theme) => {
  return {
    card: {
      boxShadow: 'none',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      zIndex: 0,
    },
    cardOverlay: {
      '&:hover': {
        border: '5px solid white',
      },
      alignItems: 'center',
      border: '15px solid white',
      boxShadow:
        'inset 0px 1px 3px 0px rgba(0, 0, 0, 0.12), inset 0px -1px 1px 0px rgba(0, 0, 0, 0.14)',
      boxSizing: 'border-box',
      cursor: 'pointer',
      display: 'flex',
      height: '100%',
      position: 'absolute',
      transition: 'border 500ms ease',
      width: '100%',
      zIndex: 1,
    },
    cardOverlayHover: {
      border: '5px solid white',
    },
    cardWrapper: {
      '&:hover': {
        '& .MuiIcon-root': {
          color: theme.colors.primaryGreen,
          marginLeft: 60,
        },
      },
      '& .MuiIcon-root': {
        '& svg': {
          height: '100%',
          width: '100%',
        },
        height: 30,
        margin: 35,
        transition: 'margin-left 500ms ease, color 800ms ease',
        width: 30,
      },
      height: '100%',
      position: 'relative',
      width: '100%',
    },
    exampleLink: {
      color: '#353535',
      height: '100%',
      width: '100%',
    },
  };
});

function ExampleCard({ example }) {
  const classes = useStyles();
  const [raisedExample, setRaisedExample] = useState(null);
  const router = useRouter();

  return (
    <div className={classes.cardWrapper}>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
      <div
        className={
          classes.cardOverlay +
          (example === raisedExample ? ` ${classes.cardOverlayHover}` : '')
        }
        onClick={() => {
          return router.push(`/example/${example.key}`);
        }}
      />
      <Card
        classes={{
          root: classes.card,
        }}
        onBlur={() => {
          return setRaisedExample();
        }}
        onFocus={() => {
          return setRaisedExample(example);
        }}
        onMouseOut={() => {
          return setRaisedExample();
        }}
        onMouseOver={() => {
          return setRaisedExample(example);
        }}
        raised={example === raisedExample}
      >
        <CardActionArea
          onClick={() => {
            return router.push(`/example/${example.key}`);
          }}
        >
          <CardMedia
            image={example.img}
            style={{
              paddingTop: '56.25%',
            }}
          />
          <CardContent className={classes.cardContent}>
            <Link
              className={classes.exampleLink}
              href={`/example/${example.key}`}
            >
              <Typography variant="h3">{example.name}</Typography>
            </Link>
            {/* Use of typography as wrapper breaks hydration of nextjs */}
            <Markdown className="MuiTypography-root MuiTypography-body1">
              {example.description}
            </Markdown>
          </CardContent>
          <CardActions>
            <Icon>
              <CgArrowRight />
            </Icon>
          </CardActions>
        </CardActionArea>
      </Card>
    </div>
  );
}
export default React.memo(ExampleCard);
