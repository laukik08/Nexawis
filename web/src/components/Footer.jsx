import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer section-spacing container">
      <div className="footer-top">
        <div className="footer-brand">
          <span className="footer-logo">NEXAWIS</span>
          <p className="footer-description">
            Adaptive Workforce Intelligence Framework for Sustainable Project Team Formation.
          </p>
        </div>
        
        <div className="footer-links-grid">
          <div className="footer-column">
            <h4>Platform</h4>
            <a href="#">Burnout Modeling</a>
            <a href="#">Success Prediction</a>
            <a href="#">AWIS Scoring</a>
            <a href="#">Recommendation Engine</a>
          </div>
          <div className="footer-column">
            <h4>Resources</h4>
            <a href="#">Documentation</a>
            <a href="#">API Reference</a>
            <a href="#">Security</a>
          </div>
          <div className="footer-column">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} NEXAWIS. All rights reserved.</p>
        <div className="footer-legal">
          <span>Enterprise Grade</span>
          <span>SOC2 Type II</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
