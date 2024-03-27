import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CardActionArea from '@mui/material/CardActionArea';
import Icon from '@mui/material/Icon';
import Typography from '@mui/material/Typography';
import makeStyles from '@mui/styles/makeStyles';
import { CgArrowRight } from 'react-icons/cg';
import Markdown from 'react-markdown';
import Link from 'next/link';
import { useRouter } from 'next/router';

const useStyles = makeStyles((theme) => ({
  exampleLink: {
    height: '100%',
    width: '100%',
    color: '#353535',
  },
  cardWrapper: {
    position: 'relative',
    height: '100%',
    width: '100%',
    '& .MuiIcon-root': {
      width: 30,
      height: 30,
      '& svg': {
        height: '100%',
        width: '100%',
      },
      margin: 35,
      transition: 'margin-left 500ms ease, color 800ms ease',
    },
    '&:hover': {
      '& .MuiIcon-root': {
        marginLeft: 60,
        color: theme.colors.primaryGreen,
      },
    },
  },
  cardOverlay: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow:
      'inset 0px 1px 3px 0px rgba(0, 0, 0, 0.12), inset 0px -1px 1px 0px rgba(0, 0, 0, 0.14)',
    border: '15px solid white',
    transition: 'border 500ms ease',
    '&:hover': {
      border: '5px solid white',
    },
    cursor: 'pointer',
    zIndex: 1,
  },
  cardOverlayHover: {
    border: '5px solid white',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    boxShadow: 'none',
    zIndex: 0,
  },
}));

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
        onClick={() => router.push(`/example/${example.key}`)}
      />
      <Card
        classes={{
          root: classes.card,
        }}
        raised={example === raisedExample}
        onMouseOver={() => setRaisedExample(example)}
        onMouseOut={() => setRaisedExample()}
        onFocus={() => setRaisedExample(example)}
        onBlur={() => setRaisedExample()}
      >
        <CardActionArea onClick={() => router.push(`/example/${example.key}`)}>
          <CardMedia
            image={example.img}
            style={{
              paddingTop: '56.25%',
            }}
          />
          <CardContent className={classes.cardContent}>
            <Link
              href={`/example/${example.key}`}
              className={classes.exampleLink}
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
