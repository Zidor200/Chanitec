import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
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
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { SupplyItem } from '../../models/Quote';
import { storageService } from '../../services/storage-service';
import './SuppliesSection.scss';

interface SuppliesSectionProps {
  items: SupplyItem[];
  description: string;
  exchangeRate: number;
  marginRate: number;
  totalHT: number;
  onAddItem: (item: Omit<SupplyItem, 'id'>) => void;
  onRemoveItem: (id: string) => void;
  onUpdateDescription: (description: string) => void;
  onUpdateExchangeRate: (rate: number) => void;
  onUpdateMarginRate: (rate: number) => void;
}

const SuppliesSection: React.FC<SuppliesSectionProps> = ({
  items,
  description,
  exchangeRate,
  marginRate,
  totalHT,
  onAddItem,
  onRemoveItem,
  onUpdateDescription,
  onUpdateExchangeRate,
  onUpdateMarginRate
}) => {
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [catalogItems, setCatalogItems] = useState<SupplyItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<SupplyItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<SupplyItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customPriceDialogOpen, setCustomPriceDialogOpen] = useState(false);
  const [customPrice, setCustomPrice] = useState<number>(0);

  // Load catalog items on component mount
  useEffect(() => {
    const loadedItems = storageService.getSupplies();
    setCatalogItems(loadedItems);
    setFilteredItems(loadedItems);
  }, []);

  // Filter items based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredItems(catalogItems);
    } else {
      const filtered = catalogItems.filter(item =>
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchTerm, catalogItems]);

  // Handle opening the search dialog
  const handleOpenSearchDialog = () => {
    setSearchDialogOpen(true);
    setSearchTerm('');
    setSelectedItem(null);
    setQuantity(1);
  };

  // Handle closing the search dialog
  const handleCloseSearchDialog = () => {
    setSearchDialogOpen(false);
  };

  // Handle selecting an item from the catalog
  const handleSelectItem = (item: SupplyItem) => {
    setSelectedItem(item);
  };

  // Handle adding the selected item
  const handleAddItem = () => {
    if (selectedItem) {
      if (selectedItem.priceEuro === 0) {
        setCustomPrice(0);
        setCustomPriceDialogOpen(true);
      } else {
        onAddItem({
          description: selectedItem.description,
          quantity: quantity,
          priceEuro: selectedItem.priceEuro,
        });
        handleCloseSearchDialog();
      }
    }
  };

  // Handle adding item with custom price
  const handleAddItemWithCustomPrice = () => {
    if (selectedItem && customPrice > 0) {
      onAddItem({
        description: selectedItem.description,
        quantity: quantity,
        priceEuro: customPrice,
      });
      setCustomPriceDialogOpen(false);
      handleCloseSearchDialog();
    }
  };

  return (
    <Paper className="supplies-section" elevation={2}>
      <Typography variant="h6" className="section-title">
        FOURNITURES
      </Typography>

      <TextField
        fullWidth
        label="Description des fournitures"
        value={description}
        onChange={(e) => onUpdateDescription(e.target.value)}
        variant="outlined"
        margin="normal"
        className="description-field"
        multiline
        rows={2}
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }} className="rates-container">
        <Box sx={{ flex: '1 1 220px' }}>
          <TextField
            fullWidth
            label="Taux de change"
            type="number"
            value={exchangeRate}
            onChange={(e) => onUpdateExchangeRate(parseFloat(e.target.value))}
            variant="outlined"
            margin="dense"
            InputProps={{
              inputProps: {
                min: 0,
                step: 0.01
              }
            }}
          />
        </Box>
        <Box sx={{ flex: '1 1 220px' }}>
          <TextField
            fullWidth
            label="Taux de marge"
            type="number"
            value={marginRate}
            onChange={(e) => onUpdateMarginRate(parseFloat(e.target.value))}
            variant="outlined"
            margin="dense"
            InputProps={{
              inputProps: {
                min: 0,
                max: 1,
                step: 0.01
              }
            }}
          />
        </Box>
      </Box>

      <Box className="item-actions">
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenSearchDialog}
          className="add-item-button"
        >
          Ajouter un article
        </Button>
      </Box>

      <TableContainer className="items-table-container">
        <Table size="small" aria-label="supplies table">
          <TableHead>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell align="right">Qté</TableCell>
              <TableCell align="right">PR €</TableCell>
              <TableCell align="right">PR $</TableCell>
              <TableCell align="right">PV/u $</TableCell>
              <TableCell align="right">PV $ Total HT</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Aucun article ajouté
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{item.priceEuro.toFixed(2)}</TableCell>
                  <TableCell align="right">{item.priceDollar?.toFixed(2)}</TableCell>
                  <TableCell align="right">{item.unitPriceDollar?.toFixed(2)}</TableCell>
                  <TableCell align="right">{item.totalPriceDollar?.toFixed(2)}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onRemoveItem(item.id)}
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

      <Box className="total-container">
        <Typography variant="subtitle1" className="total-label">
          TOTAL FOURNITURE $ HT:
        </Typography>
        <Typography variant="subtitle1" className="total-value">
          {totalHT.toFixed(2)}
        </Typography>
      </Box>

      {/* Item Search Dialog */}
      <Dialog
        open={searchDialogOpen}
        onClose={handleCloseSearchDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Ajouter un article</DialogTitle>
        <DialogContent>
          <Box className="search-container">
            <TextField
              fullWidth
              label="Rechercher un article"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              margin="normal"
              InputProps={{
                startAdornment: <SearchIcon color="action" />
              }}
            />
          </Box>

          <TableContainer className="search-results-container">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Prix €</TableCell>
                  <TableCell align="center">Action</TableCell>
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
                    <TableRow
                      key={item.id}
                      className={selectedItem?.id === item.id ? 'selected-item' : ''}
                      onClick={() => handleSelectItem(item)}
                    >
                      <TableCell>{item.description}</TableCell>
                      <TableCell align="right">{item.priceEuro.toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => handleSelectItem(item)}
                        >
                          Sélectionner
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {selectedItem && (
            <Box className="quantity-container">
              <Typography variant="subtitle1">
                Article sélectionné: {selectedItem.description}
              </Typography>
              <TextField
                label="Quantité"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                variant="outlined"
                margin="normal"
                InputProps={{
                  inputProps: {
                    min: 1,
                    step: 1
                  }
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSearchDialog} color="primary">
            Annuler
          </Button>
          <Button
            onClick={handleAddItem}
            color="primary"
            variant="contained"
            disabled={!selectedItem}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Price Dialog */}
      <Dialog
        open={customPriceDialogOpen}
        onClose={() => setCustomPriceDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Entrer un prix personnalisé</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph>
            L'article "{selectedItem?.description}" a un prix de 0.00€.
            Veuillez entrer un prix personnalisé pour cet article.
          </Typography>
          <TextField
            fullWidth
            label="Prix (€)"
            type="number"
            value={customPrice}
            onChange={(e) => setCustomPrice(parseFloat(e.target.value))}
            variant="outlined"
            margin="normal"
            autoFocus
            InputProps={{
              inputProps: {
                min: 0.01,
                step: 0.01
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomPriceDialogOpen(false)} color="primary">
            Annuler
          </Button>
          <Button
            onClick={handleAddItemWithCustomPrice}
            color="primary"
            variant="contained"
            disabled={customPrice <= 0}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default SuppliesSection;