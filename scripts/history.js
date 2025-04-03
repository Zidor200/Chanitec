let allQuotes = [];
let filteredQuotes = [];
let filterTimeout;

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function loadClients() {
    return JSON.parse(localStorage.getItem('clients') || '[]');
}

function filterByDate(quoteDate, filterValue) {
    if (filterValue === 'all') return true;

    const date = new Date(quoteDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    switch(filterValue) {
        case 'today':
            return date >= today;
        case 'week':
            return date >= startOfWeek;
        case 'month':
            return date >= startOfMonth;
        case 'year':
            return date >= startOfYear;
        default:
            return true;
    }
}

function updateSiteFilter() {
    const clientSelect = document.getElementById('filter-client');
    const siteSelect = document.getElementById('filter-site');
    const selectedClient = clientSelect.value;

    siteSelect.innerHTML = '<option value="">Tous les sites</option>';

    if (selectedClient) {
        const clients = loadClients();
        const client = clients.find(c => c.name === selectedClient);
        if (client) {
            client.sites.forEach(site => {
                const option = document.createElement('option');
                option.value = site;
                option.textContent = site;
                siteSelect.appendChild(option);
            });
        }
    }

    applyFilters();
}

function applyFilters() {
    const idFilter = document.getElementById('filter-id').value.toLowerCase();
    const clientFilter = document.getElementById('filter-client').value;
    const siteFilter = document.getElementById('filter-site').value;
    const dateFilter = document.getElementById('filter-date').value;

    const history = JSON.parse(localStorage.getItem('quoteHistory') || '[]');
    const filteredHistory = history.filter(quote => {
        const matchesId = !idFilter || quote.id.toLowerCase().includes(idFilter);
        const matchesClient = !clientFilter || quote.clientName === clientFilter;
        const matchesSite = !siteFilter || quote.site === siteFilter;
        const matchesDate = filterByDate(quote.date, dateFilter);

        return matchesId && matchesClient && matchesSite && matchesDate;
    });

    displayQuoteHistory(filteredHistory);
}

function displayQuoteHistory(quotes) {
    const historyContainer = document.getElementById('history-list');
    historyContainer.innerHTML = '';

    if (quotes.length === 0) {
        historyContainer.innerHTML = '<div class="no-results">Aucune facture ne correspond à vos critères de recherche</div>';
        return;
    }

    quotes.forEach(quote => {
        const quoteElement = document.createElement('div');
        quoteElement.className = 'history-item';
        quoteElement.innerHTML = `
            <div class="history-header">
                <div class="history-client">
                    ${quote.clientName} - ${quote.site}
                </div>
                <div class="history-date">
                    ${formatDate(quote.timestamp)}
                </div>
            </div>
            <div class="history-details">
                <div class="history-section">
                    <h3>Client</h3>
                    <p>ID: ${quote.id}</p>
                    <p>Nom: ${quote.clientName}</p>
                    <p>Site: ${quote.site}</p>
                    <p>Objet: ${quote.object}</p>
                    <p>Date: ${formatDate(quote.date)}</p>
                </div>
                <div class="history-section">
                    <h3>Fournitures</h3>
                    ${quote.fournitures.map(f => `
                        <p>${f.description} - ${f.quantity} unités - ${f.pre} €</p>
                    `).join('')}
                    <p>Total Fournitures: ${quote.totalFournitures} €</p>

                </div>
                <div class="history-section">
                    <h3>Main d'œuvre</h3>
                    ${quote.maindoeuvre.map(m => `
                        <p>${m.description} - ${m.nbTech} tech(s) - ${m.nbHours}h - ${m.pre} €</p>
                    `).join('')}
                    <p>Total Main d'œuvre: ${quote.totalMaindoeuvre} €</p>
                </div>
            </div>
            <div class="actions">
                <button class="btn btn-view" onclick="viewQuote('${quote.id}')">Voir</button>
                <button class="btn btn-delete" onclick="deleteQuote('${quote.id}')">Supprimer</button>
            </div>
        `;
        historyContainer.appendChild(quoteElement);
    });
}

function viewQuote(quoteId) {
    localStorage.setItem('originalQuoteId', quoteId);
    localStorage.setItem('fromHistory', 'true');
    window.location.href = 'index.html';
}

function deleteQuote(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
        const history = JSON.parse(localStorage.getItem('quoteHistory') || '[]');
        const updatedHistory = history.filter(item => item.id !== id);
        localStorage.setItem('quoteHistory', JSON.stringify(updatedHistory));
        applyFilters(); // Refresh the display
    }
}

function clearFilters() {
    document.getElementById('filter-id').value = '';
    document.getElementById('filter-client').value = '';
    document.getElementById('filter-site').value = '';
    document.getElementById('filter-date').value = 'all';
    applyFilters();
}

// Initialize the page and add event listeners
window.onload = function() {
    // Load clients into dropdown
    const clientSelect = document.getElementById('filter-client');
    const clients = loadClients();
    clientSelect.innerHTML = '<option value="">Tous les clients</option>';
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.name;
        option.textContent = client.name;
        clientSelect.appendChild(option);
    });

    // Load initial history
    applyFilters();

    // Add real-time filter listeners
    document.getElementById('filter-id').addEventListener('input', debouncedApplyFilters);
    document.getElementById('filter-client').addEventListener('change', updateSiteFilter);
    document.getElementById('filter-site').addEventListener('change', debouncedApplyFilters);
    document.getElementById('filter-date').addEventListener('change', debouncedApplyFilters);
};

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedApplyFilters = debounce(applyFilters, 300);// JavaScript for History.html