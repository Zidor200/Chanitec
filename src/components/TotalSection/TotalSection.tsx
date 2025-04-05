import React from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import './TotalSection.scss';

interface TotalSectionProps {
  totalSuppliesHT: number;
  totalLaborHT: number;
  totalHT: number;
  tva: number;
  totalTTC: number;
}

const TotalSection: React.FC<TotalSectionProps> = ({
  totalSuppliesHT,
  totalLaborHT,
  totalHT,
  tva,
  totalTTC
}) => {
  return (
    <Paper className="total-section" elevation={2}>
      <Typography variant="h6" className="section-title">
        TOTAUX
      </Typography>

      <TableContainer>
        <Table size="small" aria-label="totals table">
          <TableBody>
            <TableRow>
              <TableCell className="total-label">TOTAL FOURNITURE $ HT:</TableCell>
              <TableCell align="right" className="total-value">{totalSuppliesHT.toFixed(2)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="total-label">TOTAL MO $ HT:</TableCell>
              <TableCell align="right" className="total-value">{totalLaborHT.toFixed(2)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="total-label">TOTAL OFFRE USD HT:</TableCell>
              <TableCell align="right" className="total-value">{totalHT.toFixed(2)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="total-label">TVA:</TableCell>
              <TableCell align="right" className="total-value">{tva.toFixed(2)}</TableCell>
            </TableRow>
            <TableRow className="grand-total-row">
              <TableCell className="total-label grand-total">TOTAL OFFRE USD TTC:</TableCell>
              <TableCell align="right" className="total-value grand-total">{totalTTC.toFixed(2)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TotalSection;