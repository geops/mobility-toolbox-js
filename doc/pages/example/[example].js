import React from 'react';
import { Container, makeStyles } from '@material-ui/core';
import { useRouter } from 'next/router';
import EXAMPLES from '../../src/examples';
import Example from '../../src/components/Example';

const useStyles = makeStyles({
  content: {
    flexGrow: 1,
    overflowY: 'auto',
    paddingBottom: 115,
    margin: 'auto',
    marginTop: 30,
  },
});

export async function getStaticPaths() {
  return {
    paths: EXAMPLES.map(({ key }) => {
      return { params: { example: key } };
    }),
    fallback: false, // false or 'blocking'
  };
}

export async function getStaticProps({ params, locale }) {
  // params contains the post `id`.
  // If the route is like /posts/1, then params.id is 1
  // const res = await fetch(`https://.../posts/${params.id}`)
  // const post = await res.json()

  // Pass post data to the page via props
  return {
    props: {
      example: EXAMPLES.find((example) => example.key === params.example),
    },
    // // Re-generate the post at most once per second
    // // if a request comes in
    // revalidate: 1,
  };
}

function ExamplePage({ example }) {
  const classes = useStyles();
  const router = useRouter();
  return (
    <Container className={classes.content}>
      <Example example={example} />
    </Container>
  );
}

export default ExamplePage;
