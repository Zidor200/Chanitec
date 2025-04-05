import React, { useState, useEffect, useRef } from 'react';
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
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileUpload as FileUploadIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import Layout from '../../components/Layout/Layout';
import Navigation from '../../components/Navigation/Navigation';
import { SupplyItem } from '../../models/Quote';
import { storageService } from '../../services/storage-service';
import './ItemsPage.scss';

interface ItemsPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

// Define an interface for the Excel row data
interface ExcelRowData {
  Description: string;
  Prix: string | number;
  [key: string]: any;
}

const ItemsPage: React.FC<ItemsPageProps> = ({ currentPath, onNavigate }) => {
  // State for items data
  const [items, setItems] = useState<SupplyItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<SupplyItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // State for dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<SupplyItem>>({
    description: '',
    priceEuro: 0,
    quantity: 1
  });

  // State for file import
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load items on component mount
  useEffect(() => {
    loadItems();
  }, []);

  // Filter items when search term changes
  useEffect(() => {
    filterItems();
  }, [searchTerm, items]);

  // Load all items from storage
  const loadItems = () => {
    const loadedItems = storageService.getSupplies();
    setItems(loadedItems);
    setFilteredItems(loadedItems);
  };

  // Filter items based on search term
  const filterItems = () => {
    if (!searchTerm.trim()) {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item =>
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  };

  // Open dialog to add a new item
  const handleAddItem = () => {
    setCurrentItem({
      description: '',
      priceEuro: 0,
      quantity: 1
    });
    setIsEditing(false);
    setDialogOpen(true);
  };

  // Open dialog to edit existing item
  const handleEditItem = (item: SupplyItem) => {
    setCurrentItem(item);
    setIsEditing(true);
    setDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Handle input change in dialog
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentItem({
      ...currentItem,
      [name]: name === 'priceEuro' ? parseFloat(value) : value
    });
  };

  // Save item (create or update)
  const handleSaveItem = () => {
    if (!currentItem.description) {
      alert('Description is required');
      return;
    }

    try {
      const savedItem = storageService.saveSupply(currentItem as Omit<SupplyItem, 'id'> & { id?: string });

      if (isEditing) {
        // Update item in the list
        const updatedItems = items.map(item =>
          item.id === savedItem.id ? savedItem : item
        );
        setItems(updatedItems);
      } else {
        // Add new item to the list
        setItems([...items, savedItem]);
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
    }
  };

  // Delete an item
  const handleDeleteItem = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article?')) {
      try {
        const success = storageService.deleteSupply(id);
        if (success) {
          const updatedItems = items.filter(item => item.id !== id);
          setItems(updatedItems);
        }
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item');
      }
    }
  };

  // Trigger file input click
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection and import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<ExcelRowData>(worksheet);

        if (jsonData.length === 0) {
          showSnackbar('Le fichier est vide', 'error');
          return;
        }

        // Validate and transform data
        const validItems: Omit<SupplyItem, 'id'>[] = [];
        const invalidRows: number[] = [];

        jsonData.forEach((row: ExcelRowData, index: number) => {
          // Check for required fields - using the exact column names from the Excel file
          if (row.Description && (row.Prix !== undefined && !isNaN(parseFloat(String(row.Prix))))) {
            validItems.push({
              description: String(row.Description),
              priceEuro: parseFloat(String(row.Prix)),
              quantity: 1
            });
          } else {
            invalidRows.push(index + 2); // +2 because Excel is 1-indexed and we skip the header row
          }
        });

        // Save valid items
        if (validItems.length > 0) {
          const savedItems = validItems.map(item => storageService.saveSupply(item));
          setItems(prevItems => [...prevItems, ...savedItems]);

          if (invalidRows.length > 0) {
            showSnackbar(`Importé ${validItems.length} articles. Lignes invalides: ${invalidRows.join(', ')}`, 'info');
          } else {
            showSnackbar(`Importé ${validItems.length} articles avec succès`, 'success');
          }
        } else {
          showSnackbar('Aucun article valide trouvé dans le fichier', 'error');
        }
      } catch (error) {
        console.error('Error importing file:', error);
        showSnackbar('Erreur lors de l\'importation du fichier', 'error');
      }

      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
    };

    reader.onerror = () => {
      showSnackbar('Erreur lors de la lecture du fichier', 'error');
    };

    reader.readAsBinaryString(file);
  };

  // Show snackbar with message
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Layout title="Gestion des Articles">
      <Navigation currentPath={currentPath} onNavigate={onNavigate} />

      <Container className="items-page-container">
        <Paper elevation={2} className="items-paper">
          <Box className="items-header">
            <Typography variant="h6" className="section-title">
              ARTICLES DE FOURNITURE
            </Typography>
            <Box className="search-and-add">
              <TextField
                label="Rechercher un article"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-field"
              />
              <Box className="button-group">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                >
                  Nouvel Article
                </Button>
                <Tooltip title="Importer depuis Excel (Colonnes: Description, Prix)">
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<FileUploadIcon />}
                    onClick={handleImportClick}
                  >
                    Importer
                  </Button>
                </Tooltip>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </Box>
            </Box>
          </Box>

          <TableContainer className="items-table-container">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Prix (€)</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      Aucun article trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell align="right">{item.priceEuro.toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditItem(item)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>

      {/* Dialog for adding/editing items */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isEditing ? 'Modifier l\'article' : 'Ajouter un nouvel article'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            value={currentItem.description}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="priceEuro"
            label="Prix (€)"
            type="number"
            fullWidth
            variant="outlined"
            value={currentItem.priceEuro}
            onChange={handleInputChange}
            InputProps={{
              inputProps: {
                min: 0,
                step: 0.01
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSaveItem} color="primary" variant="contained">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Layout>
  );
};

export default ItemsPage;