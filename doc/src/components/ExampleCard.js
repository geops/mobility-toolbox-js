import { Box } from '@mui/material';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Icon from '@mui/material/Icon';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { CgArrowRight } from 'react-icons/cg';
import Markdown from 'react-markdown';

function ExampleCard({ example }) {
  const [raisedExample, setRaisedExample] = useState(null);
  const router = useRouter();

  return (
    <Box
      sx={(theme) => {
        return {
          '&:hover': {
            '& .MuiIcon-root': {
              color: theme.colors.primaryGreen,
              marginLeft: '60px',
            },
          },
          '& .MuiIcon-root': {
            height: '30px',
            margin: '35px',
            transition: 'margin-left 500ms ease, color 800ms ease',
            width: '30px',
          },
          height: '100%',
          position: 'relative',
          width: '100%',
        };
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
      <Box
        sx={{
          '&:hover': {
            border: '5px solid white',
          },
          alignItems: 'center',
          border:
            example === raisedExample ? '5px solid white' : '15px solid white',
          boxShadow:
            'inset 0px 1px 3px 0px rgba(0, 0, 0, 0.12), inset 0px -1px 1px 0px rgba(0, 0, 0, 0.14)',
          boxSizing: 'border-box',
          cursor: 'pointer',
          display: 'flex',
          height: '100%',
          position: 'absolute',
          transition: 'border 500ms ease',
          width: '100%',
          zIndex: 1,
        }}
        onClick={() => {
          return router.push(`/example/${example.key}`);
        }}
      />
      <Card
        sx={{
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          zIndex: 0,
        }}
        onBlur={() => {
          return setRaisedExample();
        }}
        onFocus={() => {
          return setRaisedExample(example);
        }}
        onMouseOut={() => {
          return setRaisedExample();
        }}
        onMouseOver={() => {
          return setRaisedExample(example);
        }}
        raised={example === raisedExample}
      >
        <CardActionArea
          onClick={() => {
            return router.push(`/example/${example.key}`);
          }}
        >
          <CardMedia
            image={example.img}
            style={{
              paddingTop: '56.25%',
            }}
          />
          <CardContent>
            <Link
              style={{
                color: '#353535',
                height: '100%',
                width: '100%',
              }}
              href={`/example/${example.key}`}
            >
              <Typography variant="h3">{example.name}</Typography>
            </Link>
            {/* Use of typography as wrapper breaks hydration of nextjs */}
            <div className="MuiTypography-root MuiTypography-body1">
              <Markdown>{example.description}</Markdown>
            </div>
          </CardContent>
          <CardActions>
            <Icon>
              <CgArrowRight />
            </Icon>
          </CardActions>
        </CardActionArea>
      </Card>
    </Box>
  );
}
export default React.memo(ExampleCard);
