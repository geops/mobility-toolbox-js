import React from "react";
import { Container } from "@mui/material";
import Documentation from "../../src/components/Documentation";

const rootSx = {
  flexGrow: 1,
  overflowY: "auto",
  padding: 0,
};

function ApiPage() {
  return (
    <Container sx={rootSx}>
      <Documentation />
    </Container>
  );
}

export default ApiPage;
