import React from 'react';
import { Spinner } from 'react-bootstrap';
import './style.css'; 

const PageLoader = () => {
  return (
    <div className="loader-container">
      <img
        src="stevenlogo.png"
        width="50"
        height="50"
        className="spinning-image"
        alt="Steven"
      />
    </div>
  );
};

export default PageLoader;

