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
  Chip,
  Card,
  CardContent,
  InputBase,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Place as PlaceIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout/Layout';
import { Client, Site } from '../../models/Quote';
import { apiService } from '../../services/api-service';
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
  const [currentSite, setCurrentSite] = useState<Omit<Site, 'id'> & { id?: string }>({
    name: '',
    clientId: ''
  });

  // State for expanded client
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  // Load clients on component mount
  useEffect(() => {
    loadClients();
  }, []);

  // Filter clients when search term changes
  useEffect(() => {
    filterClients();
  }, [searchTerm, clients]);

  // Load all clients from API
  const loadClients = async () => {
    try {
      const loadedClients = await apiService.getClients();

      // For each client, load its sites
      const clientsWithSites = await Promise.all((loadedClients ?? []).map(async client => {
        try {
          const sites = await apiService.getSitesByClientId(client.id);
          return { ...client, sites: sites ?? [] };
        } catch (error) {
          console.error(`Error loading sites for client ${client.id}:`, error);
          return { ...client, sites: [] };
        }
      }));

      setClients(clientsWithSites);
      setFilteredClients(clientsWithSites);
    } catch (error) {
      console.error('Error loading clients:', error);
      alert('Erreur lors du chargement des clients');
    }
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
  const handleSaveClient = async () => {
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

      const savedClient = await apiService.saveClient(currentClient as Omit<Client, 'id'> & { id?: string });

      if (isEditingClient) {
        // Update client in the list
        const updatedClients = clients.map(client =>
          client.id === savedClient.id ? { ...savedClient, sites: client.sites } : client
        );
        setClients(updatedClients);
      } else {
        // Create sites starting with the principal site
        const allSites = [principalSiteName, ...tempSites].filter(site => site.trim());
        const savedSites = await Promise.all((allSites ?? []).map(async siteName => {
          const site: Omit<Site, 'id'> = {
            name: siteName,
            clientId: savedClient.id
          };
          return await apiService.saveSite(site);
        }));

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
  const handleDeleteClient = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client?\n\nATTENTION: Cette action supprimera également:\n- Tous les sites associés à ce client\n- Tous les devis liés aux sites de ce client\n\nCette action est irréversible.')) {
      try {
        // Start optimistic update
        setClients(prevClients => prevClients.filter(client => client.id !== id));
        setFilteredClients(prevFiltered => prevFiltered.filter(client => client.id !== id));

        await apiService.deleteClient(id);

        // Show success message
        alert('Client supprimé avec succès');
      } catch (error) {
        console.error('Error deleting client:', error);

        // Revert optimistic update on error
        await loadClients(); // Reload all clients to ensure data consistency

        // Show error message
        alert('Échec de la suppression du client. Veuillez réessayer.');
      }
    }
  };

  // SITE OPERATIONS

  // Open dialog to add a new site
  const handleAddSite = (clientId: string) => {
    setCurrentSite({
      name: '',
      clientId: clientId
    });
    setIsEditingSite(false);
    setSiteDialogOpen(true);
  };

  // Open dialog to edit existing site
  const handleEditSite = (site: Site) => {
    setCurrentSite({
      id: site.id,
      name: site.name,
      clientId: site.clientId
    });
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

  // Add this function to check if site name is unique
  const isSiteNameUnique = async (name: string, excludeSiteId?: string) => {
    try {
      const allSites = await apiService.getSites();
      return !allSites.some(site =>
        site.name.toLowerCase() === name.toLowerCase() &&
        site.id !== excludeSiteId
      );
    } catch (error) {
      console.error('Error checking site name uniqueness:', error);
      return false;
    }
  };

  // Update the site save handler
  const handleSaveSite = async () => {
    if (!currentSite.name) {
      alert('Le nom du site est requis');
      return;
    }

    if (!currentSite.clientId) {
      alert('Le client est requis');
      return;
    }

    try {
      // Check if site name is unique
      const isUnique = await isSiteNameUnique(
        currentSite.name,
        isEditingSite ? currentSite.id : undefined
      );

      if (!isUnique) {
        alert('Un site avec ce nom existe déjà. Chaque site doit avoir un nom unique.');
        return;
      }

      if (isEditingSite && currentSite.id) {
        // Update existing site
        const siteToUpdate = {
          id: currentSite.id,
          name: currentSite.name,
          clientId: currentSite.clientId
        };
        const updatedSite = await apiService.saveSite(siteToUpdate);

        // Update sites in client list
        setClients(prevClients =>
          prevClients.map(client => {
            if (client.id === currentSite.clientId) {
              return {
                ...client,
                sites: client.sites.map(site =>
                  site.id === updatedSite.id ? updatedSite : site
                )
              };
            }
            return client;
          })
        );
      } else {
        // Create new site
        const siteToCreate = {
          name: currentSite.name,
          clientId: currentSite.clientId
        };
        const newSite = await apiService.saveSite(siteToCreate);

        // Add site to client's sites list
        setClients(prevClients =>
          prevClients.map(client => {
            if (client.id === currentSite.clientId) {
              return {
                ...client,
                sites: [...client.sites, newSite]
              };
            }
            return client;
          })
        );
      }

      handleCloseSiteDialog();
    } catch (error: any) {
      console.error('Error saving site:', error);
      alert(error.response?.data?.error || 'Échec de l\'enregistrement du site');
    }
  };

  // Delete a site
  const handleDeleteSite = async (siteId: string, clientId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce site?\n\nATTENTION: Cette action supprimera également tous les devis associés à ce site.\n\nCette action est irréversible.')) {
      try {
        // Start optimistic update
        setClients(prevClients =>
          prevClients.map(client => {
            if (client.id === clientId) {
              return {
                ...client,
                sites: client.sites.filter(site => site.id !== siteId)
              };
            }
            return client;
          })
        );
        setFilteredClients(prevFiltered =>
          prevFiltered.map(client => {
            if (client.id === clientId) {
              return {
                ...client,
                sites: client.sites.filter(site => site.id !== siteId)
              };
            }
            return client;
          })
        );

        await apiService.deleteSite(siteId);

        // Show success message
        alert('Site supprimé avec succès');
      } catch (error) {
        console.error('Error deleting site:', error);

        // Revert optimistic update on error
        await loadClients(); // Reload all clients to ensure data consistency

        // Show error message
        alert('Échec de la suppression du site. Veuillez réessayer.');
      }
    }
  };

  // Toggle client expansion
  const handleToggleClientExpand = (clientId: string) => {
    setExpandedClient(expandedClient === clientId ? null : clientId);
  };

  return (
    <Layout currentPath={currentPath} onNavigate={onNavigate}>
      <Container maxWidth="lg" className="clients-page">
        <Box className="page-header">
          <Typography variant="h6" className="header-title">
            CLIENTS ET SITES
          </Typography>
        </Box>

        <Box className="content-header">
          <TextField
            className="search-box"
            placeholder="Rechercher un client"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddClient}
            className="add-button"
          >
            Nouveau Client
          </Button>
        </Box>

        {filteredClients.map((client) => (
          <Paper key={client.id} className="client-card">
            <Box className="client-header">
              <Box className="client-name">
                <IconButton
                  size="small"
                  onClick={() => handleToggleClientExpand(client.id)}
                >
                  {expandedClient === client.id ? (
                    <KeyboardArrowUpIcon />
                  ) : (
                    <KeyboardArrowDownIcon />
                  )}
                </IconButton>
                {client.name}
                <Typography component="span" className="client-id">
                  #{client.id}
                </Typography>
              </Box>
              <Box className="actions">
                <IconButton
                  className="action-button edit"
                  onClick={() => handleEditClient(client)}
                  size="small"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  className="action-button delete"
                  onClick={() => handleDeleteClient(client.id)}
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Collapse in={expandedClient === client.id}>
              <Box className="sites-section">
                <Box className="sites-header">
                  <Typography className="sites-title">
                    Sites ({client.sites?.length || 0})
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddSite(client.id)}
                  >
                    Ajouter un site
                  </Button>
                </Box>

                <Box className="sites-list">
                  {client.sites?.map((site) => (
                    <Box key={site.id} className="site-item">
                      <Box className="site-name">
                        <PlaceIcon className="location-icon" />
                        {site.name}
                      </Box>
                      <Box className="site-actions">
                        <IconButton
                          className="action-button edit"
                          onClick={() => handleEditSite(site)}
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          className="action-button delete"
                          onClick={() => handleDeleteSite(site.id, site.clientId)}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Collapse>
          </Paper>
        ))}

        {/* Client Dialog */}
        <Dialog
          open={clientDialogOpen}
          onClose={handleCloseClientDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {isEditingClient ? 'Modifier le client' : 'Nouveau client'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Nom du client"
              type="text"
              fullWidth
              value={currentClient.name}
              onChange={handleClientInputChange}
              variant="outlined"
            />
            {!isEditingClient && (
              <>
                <TextField
                  margin="dense"
                  label="Nom du site principal"
                  type="text"
                  fullWidth
                  value={principalSiteName}
                  onChange={handlePrincipalSiteNameChange}
                  variant="outlined"
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseClientDialog}>Annuler</Button>
            <Button onClick={handleSaveClient} color="primary" variant="contained">
              {isEditingClient ? 'Modifier' : 'Créer'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Site Dialog */}
        <Dialog
          open={siteDialogOpen}
          onClose={handleCloseSiteDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {isEditingSite ? 'Modifier le site' : 'Nouveau site'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Nom du site"
              type="text"
              fullWidth
              value={currentSite.name}
              onChange={handleSiteInputChange}
              variant="outlined"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSiteDialog}>Annuler</Button>
            <Button onClick={handleSaveSite} color="primary" variant="contained">
              {isEditingSite ? 'Modifier' : 'Créer'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default ClientsPage;