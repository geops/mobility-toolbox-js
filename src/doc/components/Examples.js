import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import { Link, useParams } from 'react-router-dom';
import Example from './Example';
import EXAMPLES from '../examples';

const useStyles = makeStyles({
  root: {
  },
  filterField: {
    width: '100%',
    marginBottom: 15,
  },
  navigation: {
    background: '#e3e9ec',
    padding: 20,
    height: '100%',
    lineHeight: '150%',
  },
  examleListItem: {
  },
});

const filterExamples = (str, examples) => {
  const qry = str.toLowerCase();
  return examples.filter((ex) => (
    `${ex.name}`.toLowerCase().includes(qry)
    || (ex.tags || []).find((tag) => tag.toLowerCase().includes(qry))
  ));
};

export default () => {
  const classes = useStyles();
  const { exampleKey } = useParams();
  const example = EXAMPLES.find((e) => e.key === exampleKey) || EXAMPLES[0];
  const [filter, setFilter] = useState('');
  const exampleList = filter ? filterExamples(filter, EXAMPLES) : EXAMPLES;

  return (
    <Grid container className={classes.root} spacing={3}>
      <Grid item xs={3}>
        <div className={classes.navigation}>
          <TextField
            className={classes.filterField}
            placeholder="Filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {exampleList.map((ex) => (
            <div key={ex.key}>
              <Link to={`/examples/${ex.key}`} key={ex.key}>{ex.name}</Link>
            </div>
          ))}
        </div>
      </Grid>
      <Grid item xs={9}>
        {example && <Example example={example} />}
      </Grid>
    </Grid>
  );
};
