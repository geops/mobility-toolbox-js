import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import makeStyles from '@mui/styles/makeStyles';
import React, { useEffect, useState } from 'react';

import ExampleCard from './ExampleCard';

const useStyles = makeStyles((theme) => {
  return {
    example: {
      '&.MuiGrid-item': {
        padding: '0 !important',
      },
    },
    filterField: {
      marginBottom: 40,
      width: '100%',
    },
    header: {
      marginBottom: 40,
    },
  };
});

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
      examples.filter((example) => {
        return (
          `${example.name}`.toLowerCase().includes(qry) ||
          (example.tags || []).find((tag) => {
            return tag.toLowerCase().includes(qry);
          })
        );
      }),
    );
    return () => {};
  }, [filter, examples]);

  return (
    <Grid container spacing={2}>
      <Grid className={classes.filterField} item xs={12}>
        <Typography className={classes.header} variant="h1">
          Examples
        </Typography>
        <TextField
          onChange={(e) => {
            return setFilter(e.target.value);
          }}
          placeholder="Filter..."
          value={filter}
          variant="standard"
        />
      </Grid>
      {!filteredExamples.length && (
        <Grid item xs={12}>
          Nothing found.
        </Grid>
      )}
      {filteredExamples.map((example) => {
        return (
          <Grid
            className={classes.example}
            container
            item
            key={example.key}
            lg={4}
            sm={6}
            xs={12}
          >
            <ExampleCard example={example} />
          </Grid>
        );
      })}
    </Grid>
  );
}

export default Examples;
