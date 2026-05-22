/* eslint-disable react/prop-types */
/* eslint-disable import/no-relative-packages */
import React from 'react';
import Grid from '@mui/material/Grid';
import { version } from '../../../../package.json';
import EsdocContent from './EsdocContent';
import EsdocNavigation from './EsdocNavigation';
import EsdocSearch from './EsdocSearch';
import { Box } from '@mui/material';

function Esdoc({ path }) {
  if (!path) {
    return null;
  }

  return (
    <div
      className={`esdoc`}
      style={{
        width: '100%',
      }}
    >
      <Box display={{ xs: 'none', sm: 'block' }}>
        <Grid>
          <Grid
            size={{ xs: 12 }}
            sx={(theme) => {
              return {
                padding: theme.spacing(1),
                paddingBottom: 115,
                margin: '0 auto',
                maxWidth: '740px',
              };
            }}
          >
            <EsdocContent path={path} />
          </Grid>
        </Grid>
      </Box>
      <Box display={{ xs: 'block', sm: 'none' }}>
        <Grid wrap="nowrap">
          <Grid style={{ minWidth: 260, maxWidth: 300 }}>
            <Box
              sx={(theme) => {
                return {
                  height: 'calc(100% - 32px)',
                  padding: theme.spacing(2),
                  backgroundColor: 'rgb(239, 239, 239)',
                };
              }}
            >
              {version}
              <EsdocSearch />
              <EsdocNavigation />
            <Box>
          </Grid>
          <Grid
            size={{ xs: 9 }}
            sx={(theme) => {
              return {
                padding: theme.spacing(1),
                paddingBottom: 115,
                margin: '0 auto',
                maxWidth: '740px',
              };
            }}
          >
            <EsdocContent path={path} />
          </Grid>
        </Grid>
      </Box>
    </div>
  );
}

export default React.memo(Esdoc);
