import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import Hidden from '@material-ui/core/Hidden';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import { NavLink, useParams } from 'react-router-dom';
import Example from './Example';
import EXAMPLES from '../examples';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    padding: theme.spacing(2),
  },
  filterField: {
    width: '100%',
    marginBottom: theme.spacing(2),
  },
  example: {
    padding: theme.spacing(2),
  },
  navigation: {
    background: '#e3e9ec',
    padding: theme.spacing(2),
    lineHeight: '200%',
  },
  exampleLink: {
    width: '100%',
    '&.active': {
      color: theme.colors.primary,
    },
  },
  select: {
    height: 50,
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
  const { exampleKey } = useParams();
  const example = EXAMPLES.find((e) => e.key === exampleKey) || EXAMPLES[0];
  const [filter, setFilter] = useState('');
  const exampleList = filter ? filterExamples(filter, EXAMPLES) : EXAMPLES;
  return (
    <>
      <Hidden smUp>
        <Grid container>
          <Grid item xs={12} className={classes.navigation}>
            <Select
              className={classes.select}
              variant="outlined"
              value={example.key}
              fullWidth
              MenuProps={{
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
                getContentAnchorEl: null,
              }}
            >
              {exampleList.map((ex) => (
                <MenuItem key={ex.key} value={ex.key}>
                  <NavLink
                    className={classes.exampleLink}
                    to={`/examples/${ex.key}`}
                  >
                    {ex.name}
                  </NavLink>
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={12} className={classes.example}>
            {example && <Example example={example} />}
          </Grid>
        </Grid>
      </Hidden>
      <Hidden only="xs">
        <Grid container>
          <Grid item xs={3} className={classes.navigation}>
            <div>
              <TextField
                className={classes.filterField}
                placeholder="Filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              {exampleList.map((ex) => (
                <div key={ex.key}>
                  <NavLink
                    className={classes.exampleLink}
                    to={`/examples/${ex.key}`}
                  >
                    {ex.name}
                  </NavLink>
                </div>
              ))}
            </div>
          </Grid>
          <Grid item xs={9} className={classes.example}>
            {example && <Example example={example} />}
          </Grid>
        </Grid>
      </Hidden>
    </>
  );
};
