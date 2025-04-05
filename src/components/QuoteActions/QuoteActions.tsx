import React from 'react';
import { Box, Button, Paper, Snackbar, Alert } from '@mui/material';
import {
  SaveOutlined,
  PrintOutlined,
  HistoryOutlined
} from '@mui/icons-material';
import { format } from 'date-fns';
import './QuoteActions.scss';

interface QuoteActionsProps {
  clientName: string;
  siteName: string;
  date: string;
  onSave: () => Promise<boolean>;
  onViewHistory: () => void;
  contentRef: React.RefObject<HTMLDivElement>;
}

const QuoteActions: React.FC<QuoteActionsProps> = ({
  clientName,
  siteName,
  date,
  onSave,
  onViewHistory,
  contentRef
}) => {
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<'success' | 'error'>('success');

  // Handle save action
  const handleSave = async () => {
    try {
      const success = await onSave();

      if (success) {
        setSnackbarMessage('Devis enregistré avec succès!');
        setSnackbarSeverity('success');
      } else {
        setSnackbarMessage('Erreur lors de l\'enregistrement du devis.');
        setSnackbarSeverity('error');
      }

      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Erreur lors de l\'enregistrement du devis.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Generate PDF filename
  const generatePdfFilename = () => {
    const formattedDate = date ? format(new Date(date), 'dd-MM-yyyy') : format(new Date(), 'dd-MM-yyyy');
    const cleanClientName = (clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
    const cleanSiteName = (siteName || 'Site').replace(/[^a-zA-Z0-9]/g, '_');

    return `${cleanClientName}_${cleanSiteName}_${formattedDate}.pdf`;
  };

  // Handle print action using browser print functionality
  const handlePrint = () => {
    if (contentRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const printContent = contentRef.current.innerHTML;
        const styles = Array.from(document.styleSheets)
          .map(styleSheet => {
            try {
              return Array.from(styleSheet.cssRules)
                .map(rule => rule.cssText)
                .join('\n');
            } catch (e) {
              return '';
            }
          })
          .join('\n');

        printWindow.document.write(`
          <html>
            <head>
              <title>${generatePdfFilename()}</title>
              <style>${styles}</style>
            </head>
            <body class="pdf-container">
              ${printContent}
            </body>
          </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Paper className="quote-actions" elevation={2}>
      <Box className="actions-container">
        <Button
          variant="contained"
          color="primary"
          className="action-button save-button"
          startIcon={<SaveOutlined />}
          onClick={handleSave}
        >
          Enregistrer
        </Button>

        <Button
          variant="contained"
          color="secondary"
          className="action-button print-button"
          startIcon={<PrintOutlined />}
          onClick={handlePrint}
        >
          Imprimer
        </Button>

        <Button
          variant="outlined"
          color="primary"
          className="action-button history-button"
          startIcon={<HistoryOutlined />}
          onClick={onViewHistory}
        >
          Historique
        </Button>
      </Box>

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
    </Paper>
  );
};

export default QuoteActions;