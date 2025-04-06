import React, { useEffect, useState } from 'react';
import { Box, Paper, TextField, Typography, MenuItem, Tooltip } from '@mui/material';
import { Client, Site } from '../../models/Quote';
import { storageService } from '../../services/storage-service';
import { extractVersion } from '../../utils/id-generator';
import './QuoteHeader.scss';

interface QuoteHeaderProps {
  quoteId: string;
  clientName: string;
  siteName: string;
  object: string;
  date: string;
  onClientChange: (value: string) => void;
  onSiteChange: (value: string) => void;
  onObjectChange: (value: string) => void;
  onDateChange: (value: string) => void;
}

const QuoteHeader: React.FC<QuoteHeaderProps> = ({
  quoteId,
  clientName,
  siteName,
  object,
  date,
  onClientChange,
  onSiteChange,
  onObjectChange,
  onDateChange
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  // Format quoteId to display version information
  const formatQuoteId = (id: string) => {
    const match = id.match(/^(F-\d{8})-(\d{3})$/);

    if (match) {
      const [_, baseId, version] = match;
      const versionNum = parseInt(version, 10);

      if (versionNum === 0) {
        return id;
      } else {
        return (
          <>
            {baseId}-<span className="version-number">{version}</span>
          </>
        );
      }
    }

    return id;
  };

  // Load clients on component mount
  useEffect(() => {
    const loadedClients = storageService.getClients();
    setClients(loadedClients);

    // If a client is selected, load its sites
    if (clientName) {
      const selectedClient = loadedClients.find(c => c.name === clientName);
      if (selectedClient) {
        const clientSites = storageService.getSitesByClientId(selectedClient.id);
        setSites(clientSites);
      }
    }
  }, [clientName]);

  // Handle client selection change
  const handleClientChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onClientChange(value);

    // Clear site when client changes
    onSiteChange('');

    // Load sites for selected client
    const selectedClient = clients.find(c => c.name === value);
    if (selectedClient) {
      const clientSites = storageService.getSitesByClientId(selectedClient.id);
      setSites(clientSites);
    } else {
      setSites([]);
    }
  };

  const version = extractVersion(quoteId);
  const isRevision = version !== null && version > 0;

  return (
    <Paper className="quote-header" elevation={2}>
      <Box className="quote-id-display">
        <Typography variant="subtitle1" className="id-label">
          ID Devis:
        </Typography>
        <Tooltip title={isRevision ? `Version ${version} du devis` : "Version originale"}>
          <Typography variant="subtitle1" className={`id-value ${isRevision ? 'is-revision' : ''}`}>
            {formatQuoteId(quoteId)}
          </Typography>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }} className="info-grid">
        <Box sx={{ flex: '1 1 220px' }}>
          <TextField
            select
            fullWidth
            label="CLIENT"
            value={clientName}
            onChange={handleClientChange}
            variant="outlined"
            margin="normal"
            className="header-field"
          >
            <MenuItem value="">Sélectionnez un client</MenuItem>
            {clients.map((client) => (
              <MenuItem key={client.id} value={client.name}>
                {client.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box sx={{ flex: '1 1 220px' }}>
          <TextField
            select
            fullWidth
            label="SITE"
            value={siteName}
            onChange={(e) => onSiteChange(e.target.value)}
            variant="outlined"
            margin="normal"
            className="header-field"
            disabled={!clientName}
          >
            <MenuItem value="">Sélectionnez un site</MenuItem>
            {sites.map((site) => (
              <MenuItem key={site.id} value={site.name}>
                {site.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box sx={{ flex: '1 1 220px' }}>
          <TextField
            fullWidth
            label="OBJET"
            value={object}
            onChange={(e) => onObjectChange(e.target.value)}
            variant="outlined"
            margin="normal"
            className="header-field"
            placeholder="Objet de l'intervention"
          />
        </Box>

        <Box sx={{ flex: '1 1 220px' }}>
          <TextField
            fullWidth
            label="DATE"
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            variant="outlined"
            margin="normal"
            className="header-field"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default QuoteHeader;

