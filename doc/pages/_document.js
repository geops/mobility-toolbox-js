import React from "react";
import Document, { Html, Main, Head, NextScript } from "next/document";
import { documentGetInitialProps } from "@mui/material-nextjs/v16-pagesRouter";

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

MyDocument.getInitialProps = async (ctx) => {
  const finalProps = await documentGetInitialProps(ctx);
  return finalProps;
};
