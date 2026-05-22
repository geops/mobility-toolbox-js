import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';

import ExampleCard from './ExampleCard';

function Examples({ examples = [] }) {
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
    <>
      <Grid container spacing={2} style={{ marginBottom: 40, padding: 15 }}>
        <Grid size={{ xs: 12 }}>
          <Typography
            style={{
              marginBottom: '40px',
            }}
            variant="h1"
          >
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
          <Grid size={{ xs: 12 }}>Nothing found.</Grid>
        )}
      </Grid>
      <Grid container spacing={2}>
        {filteredExamples.map((example) => {
          return (
            <Grid key={example.key} size={{ xs: 12, sm: 6, lg: 4 }}>
              <ExampleCard example={example} />
            </Grid>
          );
        })}
      </Grid>
    </>
  );
}

export default Examples;
