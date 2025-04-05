import React, { ReactNode } from 'react';
import { AppBar, Box, Container, Toolbar, Typography, CssBaseline } from '@mui/material';
import './Layout.scss';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title = 'CALCUL DE PRIX OFFRE CLIMATISATION' }) => {
  return (
    <Box className="layout-root">
      <CssBaseline />
      <AppBar position="static" color="primary" className="app-bar">
        <Toolbar>
          <Box className="toolbar-content">
            <Box className="logo-container">
              {/* Logo can be added here */}
              <img src="/logo-header.png" alt="Logo" className="header-logo" />
            </Box>
            <Box className="title-container">
              <Typography variant="h6" component="h1" className="page-title">
                {title}
              </Typography>
            </Box>
            <Box className="quote-id-container">
              {/* Quote ID will be added dynamically */}
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Container component="main" className="main-content">
        {children}
      </Container>

      <Box component="footer" className="footer">
        <Typography variant="body2" color="textSecondary" align="center">
          © {new Date().getFullYear()} FACTEUR App
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout;