import React from 'react';
import { Box, Button, Paper } from '@mui/material';
import {
  HomeOutlined,
  HistoryOutlined,
  PeopleOutlineOutlined,
  InventoryOutlined
} from '@mui/icons-material';
import './Navigation.scss';

interface NavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPath, onNavigate }) => {
  // Navigation items
  const navItems = [
    { path: '/', label: 'Accueil', icon: <HomeOutlined /> },
    { path: '/history', label: 'Historique', icon: <HistoryOutlined /> },
    { path: '/clients', label: 'Clients', icon: <PeopleOutlineOutlined /> },
    { path: '/items', label: 'Gérer les articles', icon: <InventoryOutlined /> }
  ];

  return (
    <Paper className="navigation-container" elevation={1}>
      <Box className="nav-links">
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant={currentPath === item.path ? 'contained' : 'text'}
            color="primary"
            className={`nav-button ${currentPath === item.path ? 'active' : ''}`}
            startIcon={item.icon}
            onClick={() => onNavigate(item.path)}
          >
            {item.label}
          </Button>
        ))}
      </Box>
    </Paper>
  );
};

export default Navigation;