/**
 * Generates a random ID combining a timestamp and random characters
 */
export const generateId = (): string => {
  const timestamp = new Date().getTime().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`;
};

/**
 * Generates a quote ID with F-prefix followed by current date and random characters
 */
export const generateQuoteId = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

  return `F-${year}${month}${day}-${random}`;
};

/**
 * Generates a sequential client ID in the format "0001", "0002", etc.
 * Gets the highest existing client ID and increments it by 1
 */
export const generateClientId = (existingClients: { id: string }[]): string => {
  // If no clients exist, start with 0001
  if (!existingClients || existingClients.length === 0) {
    return '0001';
  }

  // Find the highest existing client ID
  const numericIds = existingClients
    .map(client => {
      // Try to convert ID to a number, if it's in the expected format
      const numericId = parseInt(client.id, 10);
      return isNaN(numericId) ? 0 : numericId;
    })
    .filter(id => id > 0);

  const highestId = numericIds.length > 0 ? Math.max(...numericIds) : 0;

  // Increment and pad with leading zeros
  const nextId = (highestId + 1).toString().padStart(4, '0');
  return nextId;
};