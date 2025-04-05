import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Paper,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Layout from '../../components/Layout/Layout';
import Navigation from '../../components/Navigation/Navigation';
import { useQuote } from '../../contexts/QuoteContext';
import { storageService } from '../../services/storage-service';
import { Quote, Client, Site } from '../../models/Quote';
import './HistoryPage.scss';

interface HistoryPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ currentPath, onNavigate }) => {
  // States for quotes and filters
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  // Filter states
  const [filterId, setFilterId] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterSite, setFilterSite] = useState('');
  const [filterDate, setFilterDate] = useState('all');

  const { loadQuote } = useQuote();

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Update filtered quotes when filters or quotes change
  useEffect(() => {
    applyFilters();
  }, [filterId, filterClient, filterSite, filterDate, quotes]);

  // Load all necessary data from storage
  const loadData = () => {
    const allQuotes = storageService.getQuotes();
    const allClients = storageService.getClients();

    setQuotes(allQuotes);
    setClients(allClients);
    setFilteredQuotes(allQuotes);
  };

  // Update site options when client changes
  const updateSiteOptions = () => {
    if (filterClient) {
      const sitesForClient = storageService.getSitesByClientId(filterClient);
      setSites(sitesForClient);
    } else {
      setSites([]);
    }

    // Reset site filter when client changes
    setFilterSite('');
  };

  // Apply all filters to the quotes
  const applyFilters = () => {
    let result = [...quotes];

    // Filter by ID
    if (filterId) {
      result = result.filter(quote =>
        quote.id.toLowerCase().includes(filterId.toLowerCase())
      );
    }

    // Filter by client
    if (filterClient) {
      result = result.filter(quote =>
        quote.clientName === clients.find(c => c.id === filterClient)?.name
      );
    }

    // Filter by site
    if (filterSite) {
      result = result.filter(quote =>
        quote.siteName === sites.find(s => s.id === filterSite)?.name
      );
    }

    // Filter by date
    if (filterDate !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (filterDate) {
        case 'today':
          result = result.filter(quote => {
            const quoteDate = new Date(quote.date);
            quoteDate.setHours(0, 0, 0, 0);
            return quoteDate.getTime() === today.getTime();
          });
          break;

        case 'week':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          result = result.filter(quote => {
            const quoteDate = new Date(quote.date);
            return quoteDate >= startOfWeek && quoteDate <= today;
          });
          break;

        case 'month':
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          result = result.filter(quote => {
            const quoteDate = new Date(quote.date);
            return quoteDate >= startOfMonth && quoteDate <= today;
          });
          break;

        case 'year':
          const startOfYear = new Date(today.getFullYear(), 0, 1);
          result = result.filter(quote => {
            const quoteDate = new Date(quote.date);
            return quoteDate >= startOfYear && quoteDate <= today;
          });
          break;
      }
    }

    // Sort by date (newest first)
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredQuotes(result);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterId('');
    setFilterClient('');
    setFilterSite('');
    setFilterDate('all');
  };

  // Load a quote and navigate to quote page
  const handleLoadQuote = (quoteId: string) => {
    loadQuote(quoteId);
    onNavigate('/');
  };

  // Delete a quote
  const handleDeleteQuote = (quoteId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
      const success = storageService.deleteQuote(quoteId);
      if (success) {
        setQuotes(quotes.filter(q => q.id !== quoteId));
      }
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Layout>
      <Navigation currentPath={currentPath} onNavigate={onNavigate} />

      <Container className="history-container">
        <Typography variant="h4" gutterBottom>
          Historique des Devis
        </Typography>

        <Paper elevation={3} className="filters-section">
          <Typography variant="h6" gutterBottom>
            Filtres
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 220px' }}>
              <TextField
                fullWidth
                label="ID"
                variant="outlined"
                value={filterId}
                onChange={(e) => setFilterId(e.target.value)}
                size="small"
              />
            </Box>

            <Box sx={{ flex: '1 1 220px' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Client</InputLabel>
                <Select
                  value={filterClient}
                  label="Client"
                  onChange={(e) => {
                    setFilterClient(e.target.value as string);
                    updateSiteOptions();
                  }}
                >
                  <MenuItem value="">Tous les clients</MenuItem>
                  {clients.map(client => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: '1 1 220px' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Site</InputLabel>
                <Select
                  value={filterSite}
                  label="Site"
                  onChange={(e) => setFilterSite(e.target.value as string)}
                  disabled={!filterClient}
                >
                  <MenuItem value="">Tous les sites</MenuItem>
                  {sites.map(site => (
                    <MenuItem key={site.id} value={site.id}>
                      {site.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: '1 1 220px' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Période</InputLabel>
                <Select
                  value={filterDate}
                  label="Période"
                  onChange={(e) => setFilterDate(e.target.value as string)}
                >
                  <MenuItem value="all">Toutes les dates</MenuItem>
                  <MenuItem value="today">Aujourd'hui</MenuItem>
                  <MenuItem value="week">Cette semaine</MenuItem>
                  <MenuItem value="month">Ce mois</MenuItem>
                  <MenuItem value="year">Cette année</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Box mt={2}>
            <Button
              variant="outlined"
              onClick={clearFilters}
              size="small"
            >
              Effacer les filtres
            </Button>
          </Box>
        </Paper>

        <Box mt={3}>
          {filteredQuotes.length === 0 ? (
            <Typography variant="body1" align="center" style={{ marginTop: 20 }}>
              Aucun devis trouvé.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {filteredQuotes.map(quote => (
                <Box key={quote.id} sx={{ width: { xs: '100%', sm: '47%', md: '31%' } }}>
                  <Card elevation={2} className="quote-card">
                    <CardContent>
                      <Typography variant="h6" component="div" className="quote-id">
                        {quote.id}
                      </Typography>

                      <Typography color="textSecondary" gutterBottom>
                        {quote.clientName} - {quote.siteName}
                      </Typography>

                      <Typography variant="body2">
                        {quote.object}
                      </Typography>

                      <Divider style={{ margin: '10px 0' }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Date: {formatDate(quote.date)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Total: {quote.totalHT.toFixed(2)} $ HT
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>

                    <CardActions disableSpacing>
                      <IconButton
                        aria-label="voir"
                        onClick={() => handleLoadQuote(quote.id)}
                        size="small"
                      >
                        <VisibilityIcon />
                      </IconButton>

                      <IconButton
                        aria-label="supprimer"
                        onClick={() => handleDeleteQuote(quote.id)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Container>
    </Layout>
  );
};

export default HistoryPage;