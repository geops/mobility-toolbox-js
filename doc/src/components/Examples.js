import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import makeStyles from '@mui/styles/makeStyles';
import TextField from '@mui/material/TextField';
import ExampleCard from './ExampleCard';

const useStyles = makeStyles((theme) => ({
  filterField: {
    width: '100%',
    marginBottom: 40,
  },
  example: {
    '&.MuiGrid-item': {
      padding: '0 !important',
    },
  },
  header: {
    marginBottom: 40,
  },
}));

function Examples({ examples = [] }) {
  const classes = useStyles();
  const [filter, setFilter] = useState('');
  const [filteredExamples, setFilteredExamples] = useState(examples);

  useEffect(() => {
    if (!filter) {
      return () => {};
    }
    const qry = filter.toLowerCase();
    setFilteredExamples(
      examples.filter(
        (example) =>
          `${example.name}`.toLowerCase().includes(qry) ||
          (example.tags || []).find((tag) => tag.toLowerCase().includes(qry)),
      ),
    );
    return () => {};
  }, [filter, examples]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} className={classes.filterField}>
        <Typography variant="h1" className={classes.header}>
          Examples
        </Typography>
        <TextField
          variant="standard"
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
      {filteredExamples.map((example) => (
        <Grid
          item
          xs={12}
          sm={6}
          lg={4}
          container
          className={classes.example}
          key={example.key}
        >
          <ExampleCard example={example} />
        </Grid>
      ))}
    </Grid>
  );
}

export default Examples;
