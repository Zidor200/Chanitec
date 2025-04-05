import { LaborItem, SupplyItem } from '../models/Quote';

/**
 * Rounds a number to two decimal places (for display purposes only)
 */
export const roundToTwo = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates the dollar price from euro price using the exchange rate
 * PR dollar = PR euro * exchange rate
 */
export const calculateDollarPrice = (euroPrice: number, exchangeRate: number): number => {
  return euroPrice * exchangeRate;
};

/**
 * Calculates the sales price by applying the margin rate to the purchase price
 * PV/U dollar = PR dollar / margin rate
 */
export const calculateSalesPrice = (purchasePrice: number, marginRate: number): number => {
  return purchasePrice / marginRate;
};

/**
 * Calculates the total price for a supply item
 */
export const calculateSupplyItemTotal = (
  item: SupplyItem,
  exchangeRate: number,
  marginRate: number
): SupplyItem => {
  // PR dollar = PR euro * exchange rate
  const priceDollar = calculateDollarPrice(item.priceEuro, exchangeRate);

  // PV/U dollar = PR dollar / margin rate
  const unitPriceDollar = calculateSalesPrice(priceDollar, marginRate);

  // PV dollar total HT = PV/U * Quantity
  const totalPriceDollar = unitPriceDollar * item.quantity;

  return {
    ...item,
    priceDollar,
    unitPriceDollar,
    totalPriceDollar
  };
};

/**
 * Calculates the total price for a labor item
 */
export const calculateLaborItemTotal = (
  item: LaborItem,
  exchangeRate: number,
  marginRate: number
): LaborItem => {
  // PR dollar = PR euro * exchange rate
  const priceDollar = calculateDollarPrice(item.priceEuro, exchangeRate);

  // PV/U dollar = PR dollar / margin rate
  const unitPriceDollar = calculateSalesPrice(priceDollar, marginRate);

  // PV dollar total HT = PV/U * nbTechnicians * nbHours * weekendMultiplier
  const totalPriceDollar = unitPriceDollar * item.nbTechnicians * item.nbHours * item.weekendMultiplier;

  return {
    ...item,
    priceDollar,
    unitPriceDollar,
    totalPriceDollar
  };
};

/**
 * Calculates the total supplies price
 */
export const calculateTotalSupplies = (items: SupplyItem[]): number => {
  return items.reduce((total, item) => total + (item.totalPriceDollar || 0), 0);
};

/**
 * Calculates the total labor price
 */
export const calculateTotalLabor = (items: LaborItem[]): number => {
  return items.reduce((total, item) => total + (item.totalPriceDollar || 0), 0);
};

/**
 * Calculates VAT (16%)
 */
export const calculateVAT = (amount: number): number => {
  return amount * 0.16;
};

/**
 * Calculates the total TTC (including VAT)
 */
export const calculateTotalTTC = (totalHT: number): number => {
  return totalHT + calculateVAT(totalHT);
};