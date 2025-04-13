import { Client, Quote, Site, SupplyItem, LaborItem } from '../models/Quote';
import { PriceOffer } from '../models/PriceOffer';

const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
    // Helper method for making API calls
    private async fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
        }

        return response.json();
    }

    // Quotes
    async getQuotes(): Promise<Quote[]> {
        return this.fetchApi<Quote[]>('/quotes');
    }

    async getQuoteById(id: string): Promise<Quote> {
        return this.fetchApi<Quote>(`/quotes/${id}`);
    }

    async saveQuote(quote: Quote): Promise<Quote> {
        return this.fetchApi<Quote>('/quotes', {
            method: 'POST',
            body: JSON.stringify(quote),
        });
    }

    async deleteQuote(id: string): Promise<void> {
        await this.fetchApi(`/quotes/${id}`, {
            method: 'DELETE',
        });
    }

    // Clients
    async getClients(): Promise<Client[]> {
        return this.fetchApi<Client[]>('/clients');
    }

    async getClientById(id: string): Promise<Client> {
        return this.fetchApi<Client>(`/clients/${id}`);
    }

    async saveClient(client: Omit<Client, 'id'> & { id?: string }): Promise<Client> {
        return this.fetchApi<Client>('/clients', {
            method: 'POST',
            body: JSON.stringify(client),
        });
    }

    async deleteClient(id: string): Promise<void> {
        await this.fetchApi(`/clients/${id}`, {
            method: 'DELETE',
        });
    }

    // Sites
    async getSites(): Promise<Site[]> {
        return this.fetchApi<Site[]>('/sites');
    }

    async getSitesByClientId(clientId: string): Promise<Site[]> {
        return this.fetchApi<Site[]>(`/sites?clientId=${clientId}`);
    }

    async saveSite(site: Omit<Site, 'id'> & { id?: string }): Promise<Site> {
        return this.fetchApi<Site>('/sites', {
            method: 'POST',
            body: JSON.stringify(site),
        });
    }

    async deleteSite(id: string): Promise<void> {
        await this.fetchApi(`/sites/${id}`, {
            method: 'DELETE',
        });
    }

    // Supply Items
    async getSupplies(): Promise<SupplyItem[]> {
        return this.fetchApi<SupplyItem[]>('/items');
    }

    async saveSupply(supply: Omit<SupplyItem, 'id'> & { id?: string }): Promise<SupplyItem> {
        return this.fetchApi<SupplyItem>('/items', {
            method: 'POST',
            body: JSON.stringify(supply),
        });
    }

    async deleteSupply(id: string): Promise<void> {
        await this.fetchApi(`/items/${id}`, {
            method: 'DELETE',
        });
    }

    // Labor Items
    async getLaborItems(quoteId: string): Promise<LaborItem[]> {
        return this.fetchApi<LaborItem[]>(`/labor-items/${quoteId}`);
    }

    async createLaborItem(item: Omit<LaborItem, 'id'>): Promise<LaborItem> {
        return this.fetchApi<LaborItem>('/labor-items', {
            method: 'POST',
            body: JSON.stringify(item)
        });
    }

    // Price Offers
    async getPriceOffers(): Promise<PriceOffer[]> {
        return this.fetchApi<PriceOffer[]>('/price-offers');
    }

    async createPriceOffer(offer: Omit<PriceOffer, 'createdAt' | 'updatedAt'>): Promise<PriceOffer> {
        return this.fetchApi<PriceOffer>('/price-offers', {
            method: 'POST',
            body: JSON.stringify(offer)
        });
    }
}

// Export a singleton instance
export const apiService = new ApiService();