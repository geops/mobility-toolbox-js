import React from 'react';
import { Container, makeStyles } from '@material-ui/core';
import Home from '../src/components/Home';

const useStyles = makeStyles({
  content: {
    flexGrow: 1,
    overflowY: 'auto',
    paddingBottom: 115,
    margin: 'auto',
    marginTop: 30,
  },
});

function App() {
  const classes = useStyles();
  return (
    <Container className={classes.content}>
      <Home />
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

export default App;
