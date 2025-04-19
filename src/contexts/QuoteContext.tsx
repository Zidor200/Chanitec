import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  LaborItem,
  Quote,
  SupplyItem
} from '../models/Quote';
import { apiService } from '../services/api-service';
import {
  calculateLaborItemTotal,
  calculateSupplyItemTotal,
  calculateTotalLabor,
  calculateTotalSupplies,
  calculateTotalTTC,
  calculateVAT
} from '../utils/calculations';
import { generateId, generateQuoteId, extractBaseId, extractVersion } from '../utils/id-generator';

// Default values
const DEFAULT_EXCHANGE_RATE = 1.15;
const DEFAULT_MARGIN_RATE = 0.75;
const DEFAULT_LABOR_EXCHANGE_RATE = 1.2;
const DEFAULT_LABOR_MARGIN_RATE = 0.8;
const DEFAULT_DESCRIPTION = "";

// State interface
interface QuoteState {
  currentQuote: Quote | null;
  isEditing: boolean;
  isLoading: boolean;
  error: string | null;
  isExistingQuote: boolean;
}

// Action types
type QuoteAction =
  | { type: 'SET_QUOTE'; payload: Quote }
  | { type: 'SET_EXISTING_QUOTE'; payload: boolean }
  | { type: 'CLEAR_QUOTE' }
  | { type: 'START_EDIT' }
  | { type: 'CANCEL_EDIT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_QUOTE_FIELD'; payload: { field: keyof Quote; value: any } }
  | { type: 'ADD_SUPPLY_ITEM'; payload: Omit<SupplyItem, 'id'> }
  | { type: 'UPDATE_SUPPLY_ITEM'; payload: SupplyItem }
  | { type: 'REMOVE_SUPPLY_ITEM'; payload: string }
  | { type: 'ADD_LABOR_ITEM'; payload: Omit<LaborItem, 'id'> }
  | { type: 'UPDATE_LABOR_ITEM'; payload: LaborItem }
  | { type: 'REMOVE_LABOR_ITEM'; payload: string }
  | { type: 'RECALCULATE_TOTALS' };

// Initial state
const initialState: QuoteState = {
  currentQuote: null,
  isEditing: false,
  isLoading: false,
  error: null,
  isExistingQuote: false,
};

// Reducer function
const quoteReducer = (state: QuoteState, action: QuoteAction): QuoteState => {
  switch (action.type) {
    case 'SET_QUOTE':
      return {
        ...state,
        currentQuote: action.payload,
        isEditing: false,
        error: null,
      };

    case 'SET_EXISTING_QUOTE':
      return {
        ...state,
        isExistingQuote: action.payload,
      };

    case 'CLEAR_QUOTE':
      return {
        ...state,
        currentQuote: null,
        isEditing: false,
        isExistingQuote: false,
      };

    case 'START_EDIT':
      return {
        ...state,
        isEditing: true,
      };

    case 'CANCEL_EDIT':
      return {
        ...state,
        isEditing: false,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'UPDATE_QUOTE_FIELD':
      if (!state.currentQuote) return state;

      return {
        ...state,
        currentQuote: {
          ...state.currentQuote,
          [action.payload.field]: action.payload.value,
        },
      };

    case 'ADD_SUPPLY_ITEM': {
      if (!state.currentQuote) return state;

      const newItem: SupplyItem = {
        id: generateId(),
        ...action.payload,
      };

      // Calculate prices
      const calculatedItem = calculateSupplyItemTotal(
        newItem,
        state.currentQuote.supplyExchangeRate,
        state.currentQuote.supplyMarginRate
      );

      const updatedItems = [...state.currentQuote.supplyItems, calculatedItem];
      const totalSuppliesHT = calculateTotalSupplies(updatedItems);
      const totalHT = Number(totalSuppliesHT) + Number(state.currentQuote.totalLaborHT);
      const tva = calculateVAT(totalHT);
      const totalTTC = totalHT + tva;

      return {
        ...state,
        currentQuote: {
          ...state.currentQuote,
          supplyItems: updatedItems,
          totalSuppliesHT,
          totalHT,
          tva,
          totalTTC,
        },
      };
    }

    case 'UPDATE_SUPPLY_ITEM': {
      if (!state.currentQuote) return state;

      const updatedItems = (state.currentQuote.supplyItems ?? []).map(item =>
        item.id === action.payload.id
          ? calculateSupplyItemTotal(
              action.payload,
              state.currentQuote!.supplyExchangeRate,
              state.currentQuote!.supplyMarginRate
            )
          : item
      );

      const totalSuppliesHT = calculateTotalSupplies(updatedItems);
      const totalHT = Number(totalSuppliesHT) + Number(state.currentQuote.totalLaborHT);
      const tva = calculateVAT(totalHT);
      const totalTTC = totalHT + tva;

      return {
        ...state,
        currentQuote: {
          ...state.currentQuote,
          supplyItems: updatedItems,
          totalSuppliesHT,
          totalHT,
          tva,
          totalTTC,
        },
      };
    }

    case 'REMOVE_SUPPLY_ITEM': {
      if (!state.currentQuote) return state;

      const updatedItems = state.currentQuote.supplyItems.filter(
        item => item.id !== action.payload
      );

      const totalSuppliesHT = calculateTotalSupplies(updatedItems);
      const totalHT = Number(totalSuppliesHT) + Number(state.currentQuote.totalLaborHT);
      const tva = calculateVAT(totalHT);
      const totalTTC = totalHT + tva;

      return {
        ...state,
        currentQuote: {
          ...state.currentQuote,
          supplyItems: updatedItems,
          totalSuppliesHT,
          totalHT,
          tva,
          totalTTC,
        },
      };
    }

    case 'ADD_LABOR_ITEM': {
      if (!state.currentQuote) return state;

      const newItem: LaborItem = {
        id: generateId(),
        ...action.payload,
      };

      // Calculate prices
      const calculatedItem = calculateLaborItemTotal(
        newItem,
        state.currentQuote.laborExchangeRate,
        state.currentQuote.laborMarginRate
      );

      const updatedItems = [...state.currentQuote.laborItems, calculatedItem];
      const totalLaborHT = calculateTotalLabor(updatedItems);
      const totalHT = Number(totalLaborHT) + Number(state.currentQuote.totalSuppliesHT);
      const tva = calculateVAT(totalHT);
      const totalTTC = totalHT + tva;

      return {
        ...state,
        currentQuote: {
          ...state.currentQuote,
          laborItems: updatedItems,
          totalLaborHT,
          totalHT,
          tva,
          totalTTC,
        },
      };
    }

    case 'UPDATE_LABOR_ITEM': {
      if (!state.currentQuote) return state;

      const updatedItems = (state.currentQuote.laborItems ?? []).map(item =>
        item.id === action.payload.id
          ? calculateLaborItemTotal(
              action.payload,
              state.currentQuote!.laborExchangeRate,
              state.currentQuote!.laborMarginRate
            )
          : item
      );

      const totalLaborHT = calculateTotalLabor(updatedItems);
      const totalHT = Number(totalLaborHT) + Number(state.currentQuote.totalSuppliesHT);
      const tva = calculateVAT(totalHT);
      const totalTTC = totalHT + tva;

      return {
        ...state,
        currentQuote: {
          ...state.currentQuote,
          laborItems: updatedItems,
          totalLaborHT,
          totalHT,
          tva,
          totalTTC,
        },
      };
    }

    case 'REMOVE_LABOR_ITEM': {
      if (!state.currentQuote) return state;

      const updatedItems = state.currentQuote.laborItems.filter(
        item => item.id !== action.payload
      );

      const totalLaborHT = calculateTotalLabor(updatedItems);
      const totalHT = Number(totalLaborHT) + Number(state.currentQuote.totalSuppliesHT);
      const tva = calculateVAT(totalHT);
      const totalTTC = totalHT + tva;

      return {
        ...state,
        currentQuote: {
          ...state.currentQuote,
          laborItems: updatedItems,
          totalLaborHT,
          totalHT,
          tva,
          totalTTC,
        },
      };
    }

    case 'RECALCULATE_TOTALS': {
      if (!state.currentQuote) return state;

      const recalculatedSupplyItems = (state.currentQuote.supplyItems ?? []).map(item =>
        calculateSupplyItemTotal(
          item,
          state.currentQuote!.supplyExchangeRate,
          state.currentQuote!.supplyMarginRate
        )
      );

      const recalculatedLaborItems = (state.currentQuote.laborItems ?? []).map(item =>
        calculateLaborItemTotal(
          item,
          state.currentQuote!.laborExchangeRate,
          state.currentQuote!.laborMarginRate
        )
      );

      // Recalculate totals
      const totalSuppliesHT = calculateTotalSupplies(recalculatedSupplyItems);
      const totalLaborHT = calculateTotalLabor(recalculatedLaborItems);
      const totalHT = Number(totalSuppliesHT) + Number(totalLaborHT);
      const tva = calculateVAT(totalHT);
      const totalTTC = totalHT + tva;

      return {
        ...state,
        currentQuote: {
          ...state.currentQuote,
          supplyItems: recalculatedSupplyItems,
          laborItems: recalculatedLaborItems,
          totalSuppliesHT,
          totalLaborHT,
          totalHT,
          tva,
          totalTTC,
        },
      };
    }

    default:
      return state;
  }
};

// Context interface
interface QuoteContextProps {
  state: QuoteState;
  createNewQuote: () => void;
  loadQuote: (id: string) => void;
  saveQuote: () => Promise<boolean>;
  updateQuote: () => Promise<boolean>;
  setQuoteField: <K extends keyof Quote>(field: K, value: Quote[K]) => void;
  addSupplyItem: (item: Omit<SupplyItem, 'id'>) => void;
  updateSupplyItem: (item: SupplyItem) => void;
  removeSupplyItem: (id: string) => void;
  addLaborItem: (item: Omit<LaborItem, 'id'>) => void;
  updateLaborItem: (item: LaborItem) => void;
  removeLaborItem: (id: string) => void;
  recalculateTotals: () => void;
  clearQuote: () => void;
}

// Create context
const QuoteContext = createContext<QuoteContextProps | undefined>(undefined);

// Provider props
interface QuoteProviderProps {
  children: ReactNode;
}

// Provider component
export const QuoteProvider: React.FC<QuoteProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(quoteReducer, initialState);

  // Create a new quote
  const createNewQuote = () => {
    const newQuote: Quote = {
      id: generateQuoteId(),
      clientName: '',
      siteName: '',
      object: '',
      date: new Date().toISOString().split('T')[0],
      supplyDescription: DEFAULT_DESCRIPTION,
      laborDescription: DEFAULT_DESCRIPTION,
      supplyExchangeRate: DEFAULT_EXCHANGE_RATE,
      supplyMarginRate: DEFAULT_MARGIN_RATE,
      laborExchangeRate: DEFAULT_LABOR_EXCHANGE_RATE,
      laborMarginRate: DEFAULT_LABOR_MARGIN_RATE,
      supplyItems: [],
      laborItems: [],
      totalSuppliesHT: 0,
      totalLaborHT: 0,
      totalHT: 0,
      tva: 0,
      totalTTC: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch({ type: 'SET_QUOTE', payload: newQuote });
    dispatch({ type: 'SET_EXISTING_QUOTE', payload: false });
  };

  // Load a quote by ID
  const loadQuote = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Get the complete quote with all items from the backend
      const quote = await apiService.getQuoteById(id);

      dispatch({ type: 'SET_QUOTE', payload: quote });
      dispatch({ type: 'SET_EXISTING_QUOTE', payload: true });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load quote' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Save current quote
  const saveQuote = async (): Promise<boolean> => {
    if (!state.currentQuote) return false;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // If it's a new quote, ensure the ID format is correct
      if (!state.isExistingQuote) {
        // If the ID doesn't end with -000, add it
        if (!state.currentQuote.id.endsWith('-000')) {
          state.currentQuote.id = `${state.currentQuote.id}-000`;
        }
      }

      // Save the quote
      const savedQuote = await apiService.saveQuote(state.currentQuote);

      dispatch({ type: 'SET_QUOTE', payload: savedQuote });
      dispatch({ type: 'SET_EXISTING_QUOTE', payload: true });
      return true;
    } catch (error) {
      console.error('Error saving quote:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to save quote' });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Update current quote - create a new version
  const updateQuote = async (): Promise<boolean> => {
    if (!state.currentQuote) return false;

    try {
      // Extract the base ID and current version
      const parts = state.currentQuote.id.split('-');
      const baseId = parts.slice(0, -1).join('-'); // Everything except the last part
      const currentVersion = parseInt(parts[parts.length - 1]) || 0;

      // Create a new quote with incremented version
      const newVersion = (currentVersion + 1).toString().padStart(3, '0');
      const newQuoteId = `${baseId}-${newVersion}`;

      // Update the current quote's ID
      dispatch({
        type: 'UPDATE_QUOTE_FIELD',
        payload: { field: 'id', value: newQuoteId }
      });

      // Set as new quote to trigger normal save behavior
      dispatch({ type: 'SET_EXISTING_QUOTE', payload: false });

      // Use the existing save function
      return await saveQuote();
    } catch (error) {
      console.error('Error updating quote:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update quote' });
      return false;
    }
  };

  // Update a field in the quote
  const setQuoteField = <K extends keyof Quote>(field: K, value: Quote[K]) => {
    dispatch({
      type: 'UPDATE_QUOTE_FIELD',
      payload: { field, value }
    });

    // Recalculate totals if rates are changed
    if (
      field === 'supplyExchangeRate' ||
      field === 'supplyMarginRate' ||
      field === 'laborExchangeRate' ||
      field === 'laborMarginRate'
    ) {
      dispatch({ type: 'RECALCULATE_TOTALS' });
    }
  };

  // Add a supply item
  const addSupplyItem = (item: Omit<SupplyItem, 'id'>) => {
    dispatch({ type: 'ADD_SUPPLY_ITEM', payload: item });
  };

  // Update a supply item
  const updateSupplyItem = (item: SupplyItem) => {
    dispatch({ type: 'UPDATE_SUPPLY_ITEM', payload: item });
  };

  // Remove a supply item
  const removeSupplyItem = (id: string) => {
    dispatch({ type: 'REMOVE_SUPPLY_ITEM', payload: id });
  };

  // Add a labor item
  const addLaborItem = (item: Omit<LaborItem, 'id'>) => {
    dispatch({ type: 'ADD_LABOR_ITEM', payload: item });
  };

  // Update a labor item
  const updateLaborItem = (item: LaborItem) => {
    dispatch({ type: 'UPDATE_LABOR_ITEM', payload: item });
  };

  // Remove a labor item
  const removeLaborItem = (id: string) => {
    dispatch({ type: 'REMOVE_LABOR_ITEM', payload: id });
  };

  // Recalculate all totals
  const recalculateTotals = () => {
    dispatch({ type: 'RECALCULATE_TOTALS' });
  };

  const clearQuote = () => {
    dispatch({ type: 'CLEAR_QUOTE' });
  };

  const value = {
    state,
    createNewQuote,
    loadQuote,
    saveQuote,
    updateQuote,
    setQuoteField,
    addSupplyItem,
    updateSupplyItem,
    removeSupplyItem,
    addLaborItem,
    updateLaborItem,
    removeLaborItem,
    recalculateTotals,
    clearQuote
  };

  return (
    <QuoteContext.Provider value={value}>
      {children}
    </QuoteContext.Provider>
  );
};

// Custom hook for using the quote context
export const useQuote = (): QuoteContextProps => {
  const context = useContext(QuoteContext);

  if (context === undefined) {
    throw new Error('useQuote must be used within a QuoteProvider');
  }

  return context;
};