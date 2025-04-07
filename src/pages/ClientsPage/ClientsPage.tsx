import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Place as PlaceIcon
} from '@mui/icons-material';
import Layout from '../../components/Layout/Layout';
import { Client, Site } from '../../models/Quote';
import { storageService } from '../../services/storage-service';
import { generateClientId } from '../../utils/id-generator';
import './ClientsPage.scss';

interface ClientsPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const ClientsPage: React.FC<ClientsPageProps> = ({ currentPath, onNavigate }) => {
  // State for clients data
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // State for dialog - client
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [currentClient, setCurrentClient] = useState<Partial<Client>>({
    name: '',
    sites: []
  });

  // State for temporary sites in client dialog
  const [tempSites, setTempSites] = useState<string[]>([]);
  const [newSiteName, setNewSiteName] = useState('');
  const [principalSiteName, setPrincipalSiteName] = useState('Site principal');

  // State for dialog - site
  const [siteDialogOpen, setSiteDialogOpen] = useState(false);
  const [isEditingSite, setIsEditingSite] = useState(false);
  const [currentSite, setCurrentSite] = useState<Partial<Site>>({
    name: '',
    clientId: ''
  });

  // Load clients on component mount
  useEffect(() => {
    loadClients();
  }, []);

  // Filter clients when search term changes
  useEffect(() => {
    filterClients();
  }, [searchTerm, clients]);

  // Load all clients from storage
  const loadClients = () => {
    const loadedClients = storageService.getClients();

    // For each client, load its sites
    const clientsWithSites = loadedClients.map(client => {
      const sites = storageService.getSitesByClientId(client.id);
      return {
        ...client,
        sites
      };
    });

    setClients(clientsWithSites);
    setFilteredClients(clientsWithSites);
  };

  // Filter clients based on search term
  const filterClients = () => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClients(filtered);
    }
  };

  // CLIENT OPERATIONS

  // Open dialog to add a new client
  const handleAddClient = () => {
    setCurrentClient({
      name: '',
      sites: []
    });
    setTempSites([]); // Initialize with empty sites list
    setPrincipalSiteName('Site principal'); // Initialize with default principal site name
    setNewSiteName('');
    setIsEditingClient(false);
    setClientDialogOpen(true);
  };

  // Open dialog to edit existing client
  const handleEditClient = (client: Client) => {
    setCurrentClient(client);
    setTempSites([]); // We don't edit sites in the client dialog when editing
    setIsEditingClient(true);
    setClientDialogOpen(true);
  };

  // Close client dialog
  const handleCloseClientDialog = () => {
    setClientDialogOpen(false);
  };

  // Handle input change in client dialog
  const handleClientInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentClient({
      ...currentClient,
      [name]: value
    });
  };

  // Handle principal site name input change
  const handlePrincipalSiteNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrincipalSiteName(e.target.value);
  };

  // Handle new site name input change
  const handleNewSiteNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSiteName(e.target.value);
  };

  // Add site to temporary list
  const handleAddTempSite = () => {
    if (!newSiteName.trim()) return;

    setTempSites([...tempSites, newSiteName]);
    setNewSiteName('');
  };

  // Remove site from temporary list
  const handleRemoveTempSite = (index: number) => {
    const updatedSites = [...tempSites];
    updatedSites.splice(index, 1);
    setTempSites(updatedSites);
  };

  // Save client (create or update)
  const handleSaveClient = () => {
    if (!currentClient.name) {
      alert('Le nom du client est requis');
      return;
    }

    if (!isEditingClient && !principalSiteName.trim()) {
      alert('Le nom du site principal est requis');
      return;
    }

    try {
      // For new clients, create a sequential ID
      if (!isEditingClient) {
        currentClient.id = generateClientId(clients);
      }

      const savedClient = storageService.saveClient(currentClient as Omit<Client, 'id'> & { id?: string });

      if (isEditingClient) {
        // Update client in the list
        const updatedClients = clients.map(client =>
          client.id === savedClient.id ? { ...savedClient, sites: client.sites } : client
        );
        setClients(updatedClients);
      } else {
        // Create sites starting with the principal site
        const allSites = [principalSiteName, ...tempSites].filter(site => site.trim());
        const savedSites = allSites.map(siteName => {
          const site: Omit<Site, 'id'> = {
            name: siteName,
            clientId: savedClient.id
          };
          return storageService.saveSite(site);
        });

        // Add new client to the list with sites
        setClients([...clients, { ...savedClient, sites: savedSites }]);
      }

      handleCloseClientDialog();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Échec de l\'enregistrement du client');
    }
  };

  // Delete a client
  const handleDeleteClient = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client? Tous les sites associés seront également supprimés.')) {
      try {
        const success = storageService.deleteClient(id);
        if (success) {
          const updatedClients = clients.filter(client => client.id !== id);
          setClients(updatedClients);
        }
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Échec de la suppression du client');
      }
    }
  };

  // SITE OPERATIONS

  // Open dialog to add a new site
  const handleAddSite = (clientId: string) => {
    setCurrentSite({
      name: '',
      clientId
    });
    setIsEditingSite(false);
    setSiteDialogOpen(true);
  };

  // Open dialog to edit existing site
  const handleEditSite = (site: Site) => {
    setCurrentSite(site);
    setIsEditingSite(true);
    setSiteDialogOpen(true);
  };

  // Close site dialog
  const handleCloseSiteDialog = () => {
    setSiteDialogOpen(false);
  };

  // Handle input change in site dialog
  const handleSiteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentSite({
      ...currentSite,
      [name]: value
    });
  };

  // Save site (create or update)
  const handleSaveSite = () => {
    if (!currentSite.name) {
      alert('Le nom du site est requis');
      return;
    }

    try {
      const savedSite = storageService.saveSite(currentSite as Omit<Site, 'id'> & { id?: string });

      // Update the clients list to include the new/updated site
      const updatedClients = clients.map(client => {
        if (client.id === savedSite.clientId) {
          const updatedSites = isEditingSite
            ? client.sites.map(site => site.id === savedSite.id ? savedSite : site)
            : [...client.sites, savedSite];

          return {
            ...client,
            sites: updatedSites
          };
        }
        return client;
      });

      setClients(updatedClients);
      handleCloseSiteDialog();
    } catch (error) {
      console.error('Error saving site:', error);
      alert('Échec de l\'enregistrement du site');
    }
  };

  // Delete a site
  const handleDeleteSite = (siteId: string, clientId: string) => {
    // Find the client
    const client = clients.find(c => c.id === clientId);

    // Check if this is the last site - don't allow deletion if it's the only site
    if (client && client.sites.length <= 1) {
      alert('Impossible de supprimer le dernier site. Chaque client doit avoir au moins un site.');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce site?')) {
      try {
        const success = storageService.deleteSite(siteId);
        if (success) {
          const updatedClients = clients.map(client => {
            if (client.id === clientId) {
              return {
                ...client,
                sites: client.sites.filter(site => site.id !== siteId)
              };
            }
            return client;
          });
          setClients(updatedClients);
        }
      } catch (error) {
        console.error('Error deleting site:', error);
        alert('Échec de la suppression du site');
      }
    }
  };

  return (
    <Layout currentPath={currentPath} onNavigate={onNavigate}>
      <Box className="page-header">
        <Typography variant="h6" component="h1" className="page-title">
          CLIENTS ET SITES
        </Typography>
      </Box>
      <Container className="clients-page-container">
        <Paper elevation={2} className="clients-paper">
          <Box className="clients-header">
            <Typography variant="h6" className="section-title">
              CLIENTS ET SITES
            </Typography>
            <Box className="search-and-add">
              <TextField
                label="Rechercher un client"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-field"
              />
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddClient}
              >
                Nouveau Client
              </Button>
            </Box>
          </Box>

          <Box className="clients-list">
            {filteredClients.length === 0 ? (
              <Typography variant="body1" align="center" className="no-clients">
                Aucun client trouvé
              </Typography>
            ) : (
              filteredClients.map((client) => (
                <Accordion key={client.id} className="client-accordion">
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box className="client-summary">
                      <Typography variant="subtitle1" className="client-name">
                        {client.name} <span className="client-id">#{client.id}</span>
                      </Typography>
                      <Box className="client-actions">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClient(client);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClient(client.id);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box className="sites-container">
                      <Box className="sites-header">
                        <Typography variant="subtitle2">
                          Sites ({client.sites.length})
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => handleAddSite(client.id)}
                        >
                          Ajouter un site
                        </Button>
                      </Box>

                      <Divider className="sites-divider" />

                      {client.sites.length === 0 ? (
                        <Typography variant="body2" className="no-sites">
                          Aucun site pour ce client
                        </Typography>
                      ) : (
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Nom du site</TableCell>
                                <TableCell align="center">Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {client.sites.map((site) => (
                                <TableRow key={site.id}>
                                  <TableCell>
                                    <Box className="site-name">
                                      <PlaceIcon fontSize="small" className="site-icon" />
                                      {site.name}
                                    </Box>
                                  </TableCell>
                                  <TableCell align="center">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleEditSite(site)}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteSite(site.id, client.id)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </Box>
        </Paper>
      </Container>

      {/* Dialog for adding/editing clients */}
      <Dialog
        open={clientDialogOpen}
        onClose={handleCloseClientDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isEditingClient ? 'Modifier le client' : 'Ajouter un nouveau client'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Nom du client"
            type="text"
            fullWidth
            variant="outlined"
            value={currentClient.name}
            onChange={handleClientInputChange}
          />

          {!isEditingClient && (
            <Box className="sites-input-section" mt={3}>
              <Typography variant="subtitle2" gutterBottom>
                Sites du client
              </Typography>
              <Divider className="sites-divider" />

              {/* Principal site input */}
              <Box mt={2} mb={2}>
                <TextField
                  margin="dense"
                  label="Nom du site principal"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={principalSiteName}
                  onChange={handlePrincipalSiteNameChange}
                  helperText="Ce site sera automatiquement créé pour le client"
                />
              </Box>

              {/* Additional sites list */}
              <Typography variant="subtitle2" gutterBottom>
                Sites additionnels
              </Typography>

              <Box mt={2} className="sites-list">
                {tempSites.length > 0 ? (
                  <List dense>
                    {tempSites.map((site, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={site} />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            size="small"
                            color="error"
                            onClick={() => handleRemoveTempSite(index)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="textSecondary" className="no-sites">
                    Aucun site additionnel
                  </Typography>
                )}
              </Box>

              <Box mt={2} className="add-site-form">
                <Box display="flex" gap={1}>
                  <TextField
                    label="Nom du site"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={newSiteName}
                    onChange={handleNewSiteNameChange}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={handleAddTempSite}
                    disabled={!newSiteName.trim()}
                  >
                    <AddIcon fontSize="small" />
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClientDialog}>Annuler</Button>
          <Button
            onClick={handleSaveClient}
            color="primary"
            variant="contained"
            disabled={!currentClient.name || (!isEditingClient && !principalSiteName.trim())}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for adding/editing sites */}
      <Dialog
        open={siteDialogOpen}
        onClose={handleCloseSiteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isEditingSite ? 'Modifier le site' : 'Ajouter un nouveau site'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Nom du site"
            type="text"
            fullWidth
            variant="outlined"
            value={currentSite.name}
            onChange={handleSiteInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSiteDialog}>Annuler</Button>
          <Button onClick={handleSaveSite} color="primary" variant="contained">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default ClientsPage;