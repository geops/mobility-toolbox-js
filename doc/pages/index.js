import React from "react";
import { Container } from "@mui/material";
import Home from "../src/components/Home";

const contentSx = {
  flexGrow: 1,
  overflowY: "auto",
  paddingBottom: 115,
  margin: "auto",
  marginTop: 30,
};

function HomePage() {
  return (
    <Container style={contentSx}>
      <Home />
    </Container>
  );
}

export default HomePage;
