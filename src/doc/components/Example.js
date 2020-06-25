import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import CodeSandboxButton from './CodeSandboxButton';

const useStyles = makeStyles({
  root: {
    padding: 12,
  },
  htmlContainer: {
    height: 500,
  },
  paper: {
    position: 'relative',
    margin: '20px 0',
  },
  fileName: {
    padding: '10px 0 5px 15px',
  },
  editButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    paddingTop: 5,
    paddingRight: 10,
  },
});
// const makeId = (length) => {
//   let result = '';
//   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
//   const charactersLength = characters.length;
//   for (let i = 0; i < length; i += 1) {
//     result += characters.charAt(Math.floor(Math.random() * charactersLength));
//   }
//   return result;
// };

const Example = ({ example }) => {
  const { editButton, root, paper, htmlContainer, fileName } = useStyles();
  const [html, setHtml] = useState();
  const [js, setJs] = useState();

  useEffect(() => {
    import(`../examples/${example.files.html}`).then((h) => {
      // Clean the html loaded by the previous example
      setHtml(null);
      // Load the new html
      setHtml(h.default);
    });
    // console.log(makeId(3).toLowerCase());
    // const filePath = `../examples/${example.files.js}?dfdf=ocr`;
    // We use to avoid cache and re-execute the code of the module.
    import(`../examples/${example.files.js}?`).then((module) => {
      module.default();
    });

    fetch(`../examples/${example.files.js}`)
      .then((res) => res.text())
      .then((jsCode) => {
        // Replace relative import by library import
        setJs(
          jsCode
            .replace(/'\.\.\/\.\.\//gm, "'mobility-toolbox-js/src/")
            .replace('export default () => {\n', '')
            .replace(/^};\n$/gm, '')
            .replace(/^ {2}/gm, ''),
        );
      });
  }, [example]);

  return (
    <div className={root}>
      <Typography variant="h1">{example.name}</Typography>
      <Typography>{example.description}</Typography>

      <Paper className={paper}>
        <div
          className={htmlContainer}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </Paper>
      <Paper className={paper}>
        <Typography className={fileName}>{example.files.js}</Typography>
        <SyntaxHighlighter language="javascript">{js}</SyntaxHighlighter>
        <CodeSandboxButton className={editButton} html={html} js={js} />
      </Paper>
      <Paper className={paper}>
        <Typography className={fileName}>{example.files.html}</Typography>
        <SyntaxHighlighter language="html">{html}</SyntaxHighlighter>
        <CodeSandboxButton className={editButton} html={html} js={js} />
      </Paper>
    </div>
  );
};

Example.propTypes = {
  example: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    files: PropTypes.shape({
      js: PropTypes.string,
      html: PropTypes.string,
    }),
  }).isRequired,
};

export default React.memo(Example);
