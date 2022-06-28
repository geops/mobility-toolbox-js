import React from 'react';
import { Container, makeStyles } from '@material-ui/core';
import Documentation from '../../src/components/Documentation';

const useStyles = makeStyles({
  root: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: 0,
  },
});

// export async function getStaticProps({ params, locale }) {
//   // params contains the post `id`.
//   // If the route is like /posts/1, then params.id is 1
//   // const res = await fetch(`https://.../posts/${params.id}`)
//   // const post = await res.json()

//   // Pass post data to the page via props
//   return {
//     props: {},
//     // // Re-generate the post at most once per second
//     // // if a request comes in
//     // revalidate: 1,
//   };
// }

function ApiPage() {
  const classes = useStyles();
  return (
    <Container className={classes.root}>
      <Documentation />
    </Container>
  );
  // return (
  //   <Routes>
  //     <Route path="/" element={<Main />}>
  //       <Route index element={<Navigate to="/home" />} />
  //       <Route
  //         index
  //         path="/home"
  //         element={
  //           <Container className={classes.content}>
  //             <Home />
  //           </Container>
  //         }
  //       />
  //       <Route
  //         path="/examples"
  //         element={
  //           <Container className={classes.content}>
  //             <Examples />
  //           </Container>
  //         }
  //       />
  //       <Route
  //         path="/example/:exampleKey"
  //         element={
  //           <Container className={classes.content}>
  //             <Example />
  //           </Container>
  //         }
  //       />
  //       <Route path="/api">
  //         <Route
  //           index
  //           element={
  //             <Container className={classes.documentation} maxWidth={false}>
  //               <Documentation />
  //             </Container>
  //           }
  //         />
  //         <Route
  //           path="*"
  //           element={
  //             <Container className={classes.documentation} maxWidth={false}>
  //               <Documentation />
  //             </Container>
  //           }
  //         />
  //       </Route>
  //     </Route>
  //   </Routes>
  // );
}

export default ApiPage;
