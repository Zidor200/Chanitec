import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Snackbar, Alert } from '@mui/material';
import { QuoteProvider } from './contexts/QuoteContext';
import QuotePage from './pages/QuotePage/QuotePage';
import HistoryPage from './pages/HistoryPage/HistoryPage';
import ClientsPage from './pages/ClientsPage/ClientsPage';
import ItemsPage from './pages/ItemsPage/ItemsPage';
import { storageService } from './services/storage-service';
import './App.scss';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#2196f3',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
  },
});

function App() {
  const [currentPath, setCurrentPath] = useState('/');
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info' as 'info' | 'success' | 'warning' | 'error'
  });

  // Initialize app data
  useEffect(() => {
    // The initialization happens automatically in the StorageService constructor
    // This just checks if we should show a notification about it
    const isInitialized = localStorage.getItem('app_initialized') === 'true';
    const justInitialized = localStorage.getItem('app_just_initialized') !== 'true';

    if (isInitialized && justInitialized) {
      // Show a welcome notification
      setNotification({
        open: true,
        message: 'Données d\'exemple chargées avec succès',
        severity: 'success'
      });

      // Mark as just initialized to prevent showing notification again
      localStorage.setItem('app_just_initialized', 'true');
    }
  }, []);

  // Handle navigation
  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification({...notification, open: false});
  };

  // Render appropriate page based on current path
  const renderPage = () => {
    switch (currentPath) {
      case '/':
        return (
          <QuotePage
            currentPath={currentPath}
            onNavigate={handleNavigate}
          />
        );
      case '/history':
        return (
          <HistoryPage
            currentPath={currentPath}
            onNavigate={handleNavigate}
          />
        );
      case '/clients':
        return (
          <ClientsPage
            currentPath={currentPath}
            onNavigate={handleNavigate}
          />
        );
      case '/items':
        return (
          <ItemsPage
            currentPath={currentPath}
            onNavigate={handleNavigate}
          />
        );
      default:
        // Redirect to home if path not found
        setCurrentPath('/');
        return null;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QuoteProvider>
        {renderPage()}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </QuoteProvider>
    </ThemeProvider>
  );
}

export default App;