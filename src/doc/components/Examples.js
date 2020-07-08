import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import { NavLink } from 'react-router-dom';
import EXAMPLES from '../examples';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    padding: theme.spacing(2),
  },
  filterField: {
    width: '100%',
    margin: theme.spacing(1),
  },
  cardActionsButton: {
    borderRadius: '5px 0 0 0',
  },
  exampleLink: {
    width: '100%',
    '&.active': {
      color: theme.colors.primary,
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

export default () => {
  const classes = useStyles();
  const [filter, setFilter] = useState('');
  const [raisedExampe, setRaisedExample] = useState(null);
  const filteredExamples = filterExamples(filter, EXAMPLES);

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12} className={classes.filterField}>
          <TextField
            placeholder="Filter"
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
            lg={3}
            className={classes.example}
            key={ex.key}
          >
            <NavLink className={classes.exampleLink} to={`/example/${ex.key}`}>
              <Card
                raised={ex === raisedExampe}
                className={classes.card}
                onMouseOver={() => setRaisedExample(ex)}
                onMouseOut={() => setRaisedExample(null)}
                onFocus={() => setRaisedExample(ex)}
                onBlur={() => setRaisedExample(null)}
              >
                <CardMedia image={ex.img} />
                <CardHeader title={ex.name} />
                <CardContent>{ex.description}</CardContent>
                <CardActions className={classes.cardActions}>
                  <Button className={classes.cardActionsButton}>Show...</Button>
                </CardActions>
              </Card>
            </NavLink>
          </Grid>
        ))}
      </Grid>
    </>
  );
};
