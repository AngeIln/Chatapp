import React from 'react';
import { createGlobalStyle } from 'styled-components';

const Design = ({ children }) => {
  return (
    <>
      {createGlobalStyle(`
        body {
          background-color: #f5f5f5;
          color: #000;
          font-family: 'Helvetica Neue', sans-serif;
          margin: 0;
          padding: 0;
        }
      `)}
      {children}
    </>
  );
};

export default Design;
