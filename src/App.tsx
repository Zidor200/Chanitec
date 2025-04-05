import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QuoteProvider } from './contexts/QuoteContext';
import QuotePage from './pages/QuotePage/QuotePage';
import HistoryPage from './pages/HistoryPage/HistoryPage';
import ClientsPage from './pages/ClientsPage/ClientsPage';
import ItemsPage from './pages/ItemsPage/ItemsPage';
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

  // Handle navigation
  const handleNavigate = (path: string) => {
    setCurrentPath(path);
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
      </QuoteProvider>
    </ThemeProvider>
  );
}

export default App;