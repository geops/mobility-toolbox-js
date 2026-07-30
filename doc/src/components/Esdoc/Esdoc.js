/* eslint-disable react/prop-types */
/* eslint-disable import/no-relative-packages */
import React from "react";
import Grid from "@mui/material/Grid";
import { version } from "../../../../package.json";
import EsdocContent from "./EsdocContent";
import EsdocNavigation from "./EsdocNavigation";
import EsdocSearch from "./EsdocSearch";
import { Box } from "@mui/material";

function Esdoc({ path }) {
  if (!path) {
    return null;
  }

  return (
    <div
      className={`esdoc`}
      style={{
        width: "100%",
      }}
    >
      <Box
        sx={{
          display: { xs: "block", sm: "none" },
        }}
      >
        <Grid container>
          <Grid
            size={{ xs: 12 }}
            style={{
              padding: "12px",
              paddingBottom: "115px",
              margin: "0 auto",
              maxWidth: "740px",
            }}
          >
            <EsdocContent path={path} />
          </Grid>
        </Grid>
      </Box>
      <Box
        sx={{
          display: { xs: "none", sm: "block" },
        }}
      >
        <Grid container wrap="nowrap">
          <Grid size={{ xs: 3 }} style={{ minWidth: 260, maxWidth: 300 }}>
            <Box
              style={{
                height: "calc(100% - 32px)",
                padding: "12px",
                backgroundColor: "rgb(239, 239, 239)",
              }}
            >
              {version}
              <EsdocSearch />
              <EsdocNavigation />
            </Box>
          </Grid>
          <Grid
            size={{ xs: 9 }}
            style={{
              padding: "12px",
              paddingBottom: "115px",
              margin: "0 auto",
              maxWidth: "740px",
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
