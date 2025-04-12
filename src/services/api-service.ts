import { Client, Quote, Site, SupplyItem, LaborItem } from '../models/Quote';
import { PriceOffer } from '../models/PriceOffer';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Something went wrong');
    }
    return response.json();
};

// API Service class
class ApiService {
    // Clients
    async getClients(): Promise<Client[]> {
        const response = await fetch(`${API_BASE_URL}/clients`);
        return handleResponse(response);
    }

    async createClient(client: Omit<Client, 'id'>): Promise<Client> {
        const response = await fetch(`${API_BASE_URL}/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(client)
        });
        return handleResponse(response);
    }

    // Sites
    async getSites(): Promise<Site[]> {
        const response = await fetch(`${API_BASE_URL}/sites`);
        return handleResponse(response);
    }

    async createSite(site: Omit<Site, 'id'>): Promise<Site> {
        const response = await fetch(`${API_BASE_URL}/sites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(site)
        });
        return handleResponse(response);
    }

    // Quotes
    async getQuotes(): Promise<Quote[]> {
        const response = await fetch(`${API_BASE_URL}/quotes`);
        return handleResponse(response);
    }

    async getQuote(id: string): Promise<Quote> {
        const response = await fetch(`${API_BASE_URL}/quotes/${id}`);
        return handleResponse(response);
    }

    async createQuote(quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quote> {
        const response = await fetch(`${API_BASE_URL}/quotes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(quote)
        });
        return handleResponse(response);
    }

    // Supply Items
    async getSupplyItems(quoteId: string): Promise<SupplyItem[]> {
        const response = await fetch(`${API_BASE_URL}/supply-items/${quoteId}`);
        return handleResponse(response);
    }

    async createSupplyItem(item: Omit<SupplyItem, 'id'>): Promise<SupplyItem> {
        const response = await fetch(`${API_BASE_URL}/supply-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        return handleResponse(response);
    }

    // Labor Items
    async getLaborItems(quoteId: string): Promise<LaborItem[]> {
        const response = await fetch(`${API_BASE_URL}/labor-items/${quoteId}`);
        return handleResponse(response);
    }

    async createLaborItem(item: Omit<LaborItem, 'id'>): Promise<LaborItem> {
        const response = await fetch(`${API_BASE_URL}/labor-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        return handleResponse(response);
    }

    // Price Offers
    async getPriceOffers(): Promise<PriceOffer[]> {
        const response = await fetch(`${API_BASE_URL}/price-offers`);
        return handleResponse(response);
    }

    async createPriceOffer(offer: Omit<PriceOffer, 'createdAt' | 'updatedAt'>): Promise<PriceOffer> {
        const response = await fetch(`${API_BASE_URL}/price-offers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(offer)
        });
        return handleResponse(response);
    }
}

// Export a singleton instance
export const apiService = new ApiService();