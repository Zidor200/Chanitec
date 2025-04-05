import React, { useRef, useEffect } from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import Layout from '../../components/Layout/Layout';
import Navigation from '../../components/Navigation/Navigation';
import QuoteHeader from '../../components/QuoteHeader/QuoteHeader';
import SuppliesSection from '../../components/SuppliesSection/SuppliesSection';
import LaborSection from '../../components/LaborSection/LaborSection';
import TotalSection from '../../components/TotalSection/TotalSection';
import QuoteActions from '../../components/QuoteActions/QuoteActions';
import { useQuote } from '../../contexts/QuoteContext';
import './QuotePage.scss';

interface QuotePageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const QuotePage: React.FC<QuotePageProps> = ({ currentPath, onNavigate }) => {
  const {
    state,
    createNewQuote,
    saveQuote,
    setQuoteField,
    addSupplyItem,
    removeSupplyItem,
    addLaborItem,
    removeLaborItem,
    recalculateTotals
  } = useQuote();

  const { currentQuote, isLoading } = state;
  const contentRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  // Create a new quote if none exists
  useEffect(() => {
    if (!currentQuote) {
      createNewQuote();
    }
  }, [currentQuote, createNewQuote]);

  // Navigate to history page
  const handleViewHistory = () => {
    onNavigate('/history');
  };

  // If no quote is loaded or is still loading, show loading
  if (!currentQuote || isLoading) {
    return (
      <Layout>
        <Navigation currentPath={currentPath} onNavigate={onNavigate} />
        <Box className="loading-container">
          <Typography variant="h6">Chargement...</Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Navigation currentPath={currentPath} onNavigate={onNavigate} />

      <QuoteActions
        clientName={currentQuote.clientName}
        siteName={currentQuote.siteName}
        date={currentQuote.date}
        onSave={saveQuote}
        onViewHistory={handleViewHistory}
        contentRef={contentRef}
      />

      <Container ref={contentRef} className="quote-content">
        <QuoteHeader
          quoteId={currentQuote.id}
          clientName={currentQuote.clientName}
          siteName={currentQuote.siteName}
          object={currentQuote.object}
          date={currentQuote.date}
          onClientChange={(value) => setQuoteField('clientName', value)}
          onSiteChange={(value) => setQuoteField('siteName', value)}
          onObjectChange={(value) => setQuoteField('object', value)}
          onDateChange={(value) => setQuoteField('date', value)}
        />

        <SuppliesSection
          items={currentQuote.supplyItems}
          description={currentQuote.supplyDescription}
          exchangeRate={currentQuote.supplyExchangeRate}
          marginRate={currentQuote.supplyMarginRate}
          totalHT={currentQuote.totalSuppliesHT}
          onAddItem={addSupplyItem}
          onRemoveItem={removeSupplyItem}
          onUpdateDescription={(value) => setQuoteField('supplyDescription', value)}
          onUpdateExchangeRate={(value) => setQuoteField('supplyExchangeRate', value)}
          onUpdateMarginRate={(value) => setQuoteField('supplyMarginRate', value)}
        />

        <LaborSection
          items={currentQuote.laborItems}
          description={currentQuote.laborDescription}
          exchangeRate={currentQuote.laborExchangeRate}
          marginRate={currentQuote.laborMarginRate}
          totalHT={currentQuote.totalLaborHT}
          onAddItem={addLaborItem}
          onRemoveItem={removeLaborItem}
          onUpdateDescription={(value) => setQuoteField('laborDescription', value)}
          onUpdateExchangeRate={(value) => setQuoteField('laborExchangeRate', value)}
          onUpdateMarginRate={(value) => setQuoteField('laborMarginRate', value)}
        />

        <TotalSection
          totalSuppliesHT={currentQuote.totalSuppliesHT}
          totalLaborHT={currentQuote.totalLaborHT}
          totalHT={currentQuote.totalHT}
          tva={currentQuote.tva}
          totalTTC={currentQuote.totalTTC}
        />
      </Container>
    </Layout>
  );
};

export default QuotePage;