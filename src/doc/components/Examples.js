import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import MuiCard from '@material-ui/core/Card';
import MuiCardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Icon from '@material-ui/core/Icon';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { CgArrowRight } from 'react-icons/cg';
import TextField from '@material-ui/core/TextField';
import Markdown from 'react-markdown';
import EXAMPLES from '../examples';

const Card = withStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    boxShadow: 'none',
  },
})(MuiCard);

const CardMedia = withStyles({
  root: {
    paddingTop: '56.25%',
  },
})(MuiCardMedia);

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    padding: theme.spacing(2),
  },
  filterField: {
    width: '100%',
  },
  example: {
    '&.MuiGrid-item': {
      padding: '0 !important',
    },
  },
  exampleLink: {
    height: '100%',
    width: '100%',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
  },
  header: {
    marginBottom: 40,
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
  },
}));

const filterExamples = (str, examples) => {
  const qry = str.toLowerCase();
  return examples.filter(
    (ex) =>
      `${ex.name}`.toLowerCase().includes(qry) ||
      (ex.tags || []).find((tag) => tag.toLowerCase().includes(qry)),
  );
};

// Get the public api key
fetch('https://developer.geops.io/publickey')
  .then((response) => response.json())
  .then((data) => {
    if (data && data.success) {
      window.apiKey = data.key;
    }
  });

function Examples() {
  const classes = useStyles();
  const [filter, setFilter] = useState('');
  const [raisedExampe, setRaisedExample] = useState(null);
  const filteredExamples = filterExamples(filter, EXAMPLES);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} className={classes.filterField}>
        <Typography variant="h1" className={classes.header}>
          Examples
        </Typography>
        <TextField
          placeholder="Filter..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </Grid>
      {!filteredExamples.length && (
        <Grid item xs={12}>
          Nothing found.
        </Grid>
      )}
      {filteredExamples.map((ex) => (
        <Grid
          item
          xs={12}
          sm={6}
          lg={4}
          container
          className={classes.example}
          key={ex.key}
        >
          <a href={`/example/${ex.key}`} className={classes.exampleLink}>
            <div className={classes.cardWrapper}>
              <div className={classes.cardOverlay} />
              <Card
                raised={ex === raisedExampe}
                className={classes.card}
                onMouseOver={() => setRaisedExample(ex)}
                onMouseOut={() => setRaisedExample(null)}
                onFocus={() => setRaisedExample(ex)}
                onBlur={() => setRaisedExample(null)}
              >
                <CardMedia image={ex.img} />
                <Box className={classes.container}>
                  <CardContent className={classes.cardContent}>
                    <Typography variant="h3">{ex.name}</Typography>
                    <Typography>
                      <Markdown className={classes.readme}>
                        {ex.description || ''}
                      </Markdown>
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Icon>
                      <CgArrowRight />
                    </Icon>
                  </CardActions>
                </Box>
              </Card>
            </div>
          </a>
        </Grid>
      ))}
    </Grid>
  );
}

export default Examples;
