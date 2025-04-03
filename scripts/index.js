// JavaScript for index.htmllet items = [];

        // Load items from localStorage
        function loadItems() {
            const storedItems = JSON.parse(localStorage.getItem('items') || '[]');
            items = storedItems;
        }

        let txChg = 1.15;
        let txMarge = 0.75;
        let selectedItems = [];
        let laborItems = [];
        let moTxChg = 1.2;
        let moTxMarge = 0.8;

        function roundToTwo(num) {
            return num;

        }

        function updateRatesAndRecalculate() {
            txChg = parseFloat(document.getElementById('tx-chg').value) || 1.15;
            txMarge = parseFloat(document.getElementById('tx-marge').value) || 0.75;
            moTxChg = parseFloat(document.getElementById('mo-tx-chg').value) || 1.2;
            moTxMarge = parseFloat(document.getElementById('mo-tx-marge').value) || 0.8;

            updateTable();
            updateLaborTable();
        }

        function calculateMOPVS(pre, weekend = 1, nbTech = 1, nbHours = 1) {
            if (!pre || pre === '') return '';
            const weekendMultiplier = parseFloat(weekend);
            const prs = parseFloat(pre) * nbTech * nbHours * weekendMultiplier * moTxChg;
            const pvs = prs / moTxMarge;
            return roundToTwo(pvs);
        }

        function populateDropdown() {
            const select = document.getElementById('item-select');
            select.innerHTML = '<option value="">Sélectionner un article</option><option value="custom">+ Ajouter un nouvel article</option>';

            items.sort((a, b) => a.description.localeCompare(b.description)).forEach(item => {
                const option = document.createElement('option');
                option.value = item.description;
                option.textContent = item.description;
                select.appendChild(option);
            });

            select.addEventListener('change', function() {
                const customForm = document.getElementById('custom-item-form');
                customForm.style.display = this.value === 'custom' ? 'block' : 'none';
            });
        }

        function addSelectedItem() {
            if (!selectedItem) {
                alert('Veuillez sélectionner un article');
                return;
            }

            const quantityInput = document.getElementById('item-quantity');
            const quantity = parseInt(quantityInput.value) || 1;

            const existingItem = selectedItems.find(i => i.description === selectedItem.description);
                if (existingItem) {
                    existingItem.quantity += quantity;
                } else {
                selectedItems.push({ ...selectedItem, quantity });
                }

                updateTable();
            document.getElementById('item-selector').textContent = 'Sélectionner un article ▼';
                quantityInput.value = '1';
            selectedItem = null;
        }

        function addCustomItem() {
            const description = document.getElementById('custom-description').value;
            const pre = document.getElementById('custom-pre').value;

            if (!description || !pre) {
                alert('Veuillez remplir tous les champs');
                return;
            }

            const newItem = { description, pre };
            items.push(newItem);
            selectedItems.push({ ...newItem, quantity: 1 });

            document.getElementById('custom-description').value = '';
            document.getElementById('custom-pre').value = '';
            document.getElementById('custom-item-form').style.display = 'none';

            populateDropdown();
            updateTable();
        }

        function addLabor() {
            const nbTech = parseInt(document.getElementById('mo-nb-tech').value) || 1;
            const nbHours = parseInt(document.getElementById('mo-nb-hours').value) || 1;
            const weekend = parseFloat(document.getElementById('mo-weekend').value);
            const pre = parseFloat(document.getElementById('mo-pre').value) || 10;

            laborItems.push({ nbTech, nbHours, weekend, pre });
            updateLaborTable();
        }

        function updateTable() {
            const tbody = document.querySelector('#fournitures-table tbody');
            tbody.innerHTML = '';

            selectedItems.forEach(item => {
                const row = document.createElement('tr');
                const prs = item.pre ? roundToTwo(parseFloat(item.pre) * txChg) : '';
                const pvus = prs ? roundToTwo(parseFloat(prs) / txMarge) : '';
                const pvsTotal = pvus ? roundToTwo(parseFloat(pvus) * item.quantity) : '';

                console.log("item.pre",item.pre,"prs",prs,"pvus",pvus,"pvsTotal",pvsTotal);

                row.innerHTML = `
                    <td>${item.description}</td>
                    <td style="text-align: right;">${item.quantity}</td>
                    <td>
                        <input type="number" step="0.01" value="${item.pre}"
                            onchange="updateItemPrice('${item.description}', this.value)"
                            style="width: 80px; padding: 4px;">
                    </td>
                    <td style="text-align: right;">${prs.toFixed(2)}</td>
                    <td style="text-align: right;">${pvus.toFixed(2)}</td>
                    <td style="text-align: right;">${pvsTotal.toFixed(2)}</td>
                    <td>
                        <button onclick="removeItem('${item.description}')" style="padding: 2px 5px; background-color: #ff4444; color: white; border: none; border-radius: 3px; cursor: pointer;">
                            X
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            calculateTotals();
        }

        function updateLaborTable() {
            const tbody = document.querySelector('#labor-table tbody');
            tbody.innerHTML = '';

            laborItems.forEach((item, index) => {
                const row = document.createElement('tr');
                const weekendText = item.weekend === 1.6 ? 'Weekend' : 'Normal';
                const prs = roundToTwo(parseFloat(item.pre) * item.nbTech * item.nbHours * item.weekend * moTxChg);
                const pvsTotal = roundToTwo(parseFloat(calculateMOPVS(item.pre, item.weekend, item.nbTech, item.nbHours)));

                row.innerHTML = `
                    <td style="text-align: right;">${item.nbTech}</td>
                    <td style="text-align: right;">${item.nbHours}</td>
                    <td style="text-align: center;">${weekendText}</td>
                    <td style="text-align: right;">${item.pre}</td>
                    <td style="text-align: right;">${prs}</td>
                     <td style="text-align: right;">${pvsTotal}</td>
                    <td style="text-align: right;">${pvsTotal}</td>
                    <td>
                        <button onclick="removeLaborItem(${index})" style="padding: 2px 5px; background-color: #ff4444; color: white; border: none; border-radius: 3px; cursor: pointer;">
                            X
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            calculateTotals();
        }

        function updateItemPrice(description, newPrice) {
            const item = selectedItems.find(i => i.description === description);
            if (item) {
                item.pre = newPrice;
                console.log("item.pre",item.pre,"newPrice",newPrice,"description",description,"i.description",item.description);
                updateTable();
            }
        }

        function removeItem(description) {
            selectedItems = selectedItems.filter(item => item.description !== description);
            updateTable();
        }

        function removeLaborItem(index) {
            laborItems.splice(index, 1);
            updateLaborTable();
        }

        function calculateTotals() {
            let totalHT = 0;
            let totalMO = 0;

            selectedItems.forEach(item => {
                if (item.pre && item.pre !== '') {
                    const prs = roundToTwo(parseFloat(item.pre) * txChg);
                    const pvus = prs ? roundToTwo(parseFloat(prs) / txMarge) : '';
                    const quantity = parseInt(item.quantity) || 0;
                    if (!isNaN(pvus) && !isNaN(quantity)) {
                        totalHT += parseFloat(pvus) * quantity;
                    }
                }
            });

            laborItems.forEach(item => {
                const pvs = parseFloat(calculateMOPVS(item.pre, item.weekend, item.nbTech, item.nbHours));
                if (!isNaN(pvs)) {
                    totalMO += pvs;
                }
            });

            const totalOffreHT = totalHT + totalMO;
            const tva = totalOffreHT * 0.16;
            const totalTTC = totalOffreHT + tva;

            document.getElementById('total-fournitures').textContent = roundToTwo(totalOffreHT).toFixed(2);
            document.getElementById('table-total-fournitures').textContent = roundToTwo(totalHT).toFixed(2);
            document.getElementById('tva').textContent = roundToTwo(tva).toFixed(2);
            document.getElementById('total-ttc').textContent = roundToTwo(totalTTC).toFixed(2);
            document.getElementById('total-mo').textContent = roundToTwo(totalMO).toFixed(2);
            document.getElementById('table-total-mo').textContent = roundToTwo(totalMO).toFixed(2);
            document.getElementById('total-general').textContent = roundToTwo(totalTTC).toFixed(2);
        }

        function prepareAndPrint() {
            try {
                // Hide elements that shouldn't be printed
                const elementsToHide = document.querySelectorAll('.nav-links, .btn-save, .btn-print, #update-quote-btn, .select-item-section');
                if (elementsToHide) {
                    elementsToHide.forEach(el => {
                        if (el) el.style.display = 'none';
                    });
                }

                // Show only the print-friendly content
                const printContent = document.querySelectorAll('.quote-content');
                if (printContent) {
                    printContent.forEach(el => {
                        if (el) el.classList.add('print-ready');
                    });
                }

                // Trigger print
                window.print();

                // Restore elements after printing
                setTimeout(() => {
                    if (elementsToHide) {
                        elementsToHide.forEach(el => {
                            if (el) el.style.display = '';
                        });
                    }
                    if (printContent) {
                        printContent.forEach(el => {
                            if (el) el.classList.remove('print-ready');
                        });
                    }
                }, 500);

            } catch (error) {
                console.error('Error during print preparation:', error);
            }
        }

        function setupSearch() {
            const itemSelector = document.getElementById('item-selector');
            const searchResults = document.getElementById('search-results');
            let selectedIndex = -1;
            let selectedItem = null;

            // Function to toggle items list
            window.toggleItemsList = function() {
                if (searchResults.style.display === 'block') {
                    searchResults.style.display = 'none';
                } else {
                    showAllItems();
                }
            }

            function showAllItems() {
                searchResults.innerHTML = items
                    .sort((a, b) => a.description.localeCompare(b.description))
                    .map((item, index) => {
                        const safeDescription = item.description
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;')
                            .replace(/'/g, '&#039;');

                        const safePrice = (item.pre || '')
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;')
                            .replace(/'/g, '&#039;');

                        return `
                            <div class="search-result-item"
                                 data-index="${index}"
                                 data-description="${safeDescription}"
                                 data-price="${safePrice}"
                                 onclick="selectSearchItem(this)">
                                ${safeDescription}${safePrice ? ` - ${safePrice} €` : ''}
                            </div>
                        `;
                    }).join('');
                searchResults.style.display = 'block';
            }

            // Close search results when clicking outside
            document.addEventListener('click', function(e) {
                if (!itemSelector.contains(e.target) && !searchResults.contains(e.target)) {
                    searchResults.style.display = 'none';
                }
            });

            // Handle keyboard navigation for the dropdown
            document.addEventListener('keydown', function(e) {
                if (searchResults.style.display !== 'block') return;

                const results = document.querySelectorAll('.search-result-item');
                if (!results.length) return;

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
                    updateSelection(results);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    selectedIndex = Math.max(selectedIndex - 1, 0);
                    updateSelection(results);
                } else if (e.key === 'Enter' && selectedIndex >= 0) {
                    e.preventDefault();
                    results[selectedIndex].click();
                } else if (e.key === 'Escape') {
                    searchResults.style.display = 'none';
                }
            });
        }

        function updateSelection(results) {
            results.forEach((result, index) => {
                if (index === selectedIndex) {
                    result.classList.add('selected');
                    result.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                } else {
                    result.classList.remove('selected');
                }
            });
        }

        window.selectSearchItem = function(element) {
            const description = element.getAttribute('data-description');
            const price = element.getAttribute('data-price');

            document.getElementById('item-selector').textContent = description;
            selectedItem = items.find(item => item.description === description);
            document.getElementById('search-results').style.display = 'none';
        }

        // Modify window.onload
        window.onload = function() {
            loadItems(); // Load items from localStorage
            setupSearch();
            updateTable();
            updateLaborTable();
            document.getElementById('date-input').valueAsDate = new Date();

            // Load clients into dropdown
            const clientSelect = document.getElementById('client-input');
            const clients = loadClients();
            clientSelect.innerHTML = '<option value="">Sélectionnez un client</option>';
            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.name;
                option.textContent = client.name;
                clientSelect.appendChild(option);
            });

            // Setup modern spinners
            setupModernSpinners();

            // Load quote from history if available
            const currentQuote = localStorage.getItem('currentQuote');
            if (currentQuote) {
                const quote = JSON.parse(currentQuote);
                const facteur = FACTEUR.fromJSON(quote);

                // Load client information
                document.getElementById('client-input').value = facteur.clientName;
                document.getElementById('site-input').value = facteur.site;
                document.getElementById('object-input').value = facteur.object;
                document.getElementById('date-input').value = facteur.date;

                // Load fournitures
                selectedItems = facteur.fournitures.map(item => ({
                    description: item.description,
                    quantity: parseInt(item.quantity),
                    pre: item.pre
                }));
                updateTable();

                // Load main d'œuvre
                laborItems = facteur.maindoeuvre.map(item => ({
                    nbTech: parseInt(item.nbTech),
                    nbHours: parseInt(item.nbHours),
                    weekend: parseFloat(item.weekend),
                    pre: item.pre
                }));
                updateLaborTable();

                // Load descriptions
                document.getElementById('mo-description').value = facteur.maindoeuvre[0]?.description || '';
                document.getElementById('fournitures-description').value = facteur.fournitures[0]?.description || '';

                // Clear the current quote from localStorage
                localStorage.removeItem('currentQuote');
            }

            // Load quote information if originalQuoteId exists
            const originalQuoteId = localStorage.getItem('originalQuoteId');
            const isFromHistory = localStorage.getItem('fromHistory');

            if (originalQuoteId && isFromHistory === 'true') {
                loadQuote(); // This will display the original quote ID
            } else {
                generateNewQuoteId(); // Only generate new ID for new quotes
            }
        };

        function setupModernSpinners() {
            // Add click handlers for all number inputs
            document.querySelectorAll('input[type="number"]').forEach(input => {
                const container = document.createElement('div');
                container.className = 'number-input-container';
                input.parentNode.insertBefore(container, input);
                container.appendChild(input);

                // Add up/down buttons
                const upButton = document.createElement('button');
                upButton.className = 'spinner-up';
                upButton.type = 'button';
                upButton.setAttribute('tabindex', '-1');

                const downButton = document.createElement('button');
                downButton.className = 'spinner-down';
                downButton.type = 'button';
                downButton.setAttribute('tabindex', '-1');

                container.appendChild(upButton);
                container.appendChild(downButton);

                // Handle button clicks
                upButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    const step = parseFloat(input.step) || 1;
                    const max = input.max ? parseFloat(input.max) : Infinity;
                    const newValue = (parseFloat(input.value) || 0) + step;
                    input.value = Math.min(newValue, max);
                    input.dispatchEvent(new Event('change'));
                });

                downButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    const step = parseFloat(input.step) || 1;
                    const min = input.min ? parseFloat(input.min) : -Infinity;
                    const newValue = (parseFloat(input.value) || 0) - step;
                    input.value = Math.max(newValue, min);
                    input.dispatchEvent(new Event('change'));
                });

                // Handle keyboard navigation
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        upButton.click();
                    } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        downButton.click();
                    }
                });
            });
        }

        class FACTEUR {
            static generateId() {
                // Generate an 8-digit random number
                const randomNum = Math.floor(10000000 + Math.random() * 90000000);
                // Start with version 000
                const version = '000';
                // Combine in the required format
                return `FACT-${randomNum}-${version}`;
            }

            constructor(clientName, site, object, date, fournitures, maindoeuvre, fout_TxChn, fout_TxMarge, mo_TxChn, mo_TxMarge, totalFournitures, totalMaindoeuvre) {
                this.id = FACTEUR.generateId();
                this.clientName = clientName;
                this.site = site;
                this.object = object;
                this.date = date;
                this.fournitures = fournitures;
                this.maindoeuvre = maindoeuvre;
                this.fout_TxChn = fout_TxChn;
                this.fout_TxMarge = fout_TxMarge;
                this.mo_TxChn = mo_TxChn;
                this.mo_TxMarge = mo_TxMarge;
                this.totalFournitures = totalFournitures;
                this.totalMaindoeuvre = totalMaindoeuvre;
                this.timestamp = new Date().toISOString();
            }

            // When updating a quote, we'll need to increment the version
            incrementVersion(currentId) {
                const parts = currentId.split('-');
                const currentVersion = parseInt(parts[2], 10);
                const newVersion = (currentVersion + 1).toString().padStart(3, '0');
                return `${parts[0]}-${parts[1]}-${newVersion}`;
            }

            static fromJSON(json) {
                const facteur = new FACTEUR(
                    json.clientName,
                    json.site,
                    json.object,
                    json.date,
                    json.fournitures,
                    json.maindoeuvre,
                    json.fout_TxChn,
                    json.fout_TxMarge,
                    json.mo_TxChn,
                    json.mo_TxMarge,
                    json.totalFournitures,
                    json.totalMaindoeuvre
                );
                facteur.id = json.id; // Preserve the original ID
                return facteur;
            }

            toJSON() {
                return {
                    id: this.id,
                    clientName: this.clientName,
                    site: this.site,
                    object: this.object,
                    date: this.date,
                    fournitures: this.fournitures,
                    maindoeuvre: this.maindoeuvre,
                    fout_TxChn: this.fout_TxChn,
                    fout_TxMarge: this.fout_TxMarge,
                    mo_TxChn: this.mo_TxChn,
                    mo_TxMarge: this.mo_TxMarge,
                    totalFournitures: this.totalFournitures,
                    totalMaindoeuvre: this.totalMaindoeuvre,
                    timestamp: this.timestamp
                };
            }
        }

        function saveToHistory() {
            const history = JSON.parse(localStorage.getItem('quoteHistory') || '[]');

            // Create a new FACTEUR instance
            const facteur = new FACTEUR(
                document.getElementById('client-input').value,
                document.getElementById('site-input').value,
                document.getElementById('object-input').value,
                document.getElementById('date-input').value,
                selectedItems.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    pre: item.pre,
                    prs: (parseFloat(item.pre) * txChg).toFixed(2),
                    pvus: (parseFloat(item.pre) * txChg / txMarge).toFixed(2),
                    pvs: (parseFloat(item.pre) * txChg / txMarge * item.quantity).toFixed(2)
                })),
                laborItems.map(item => ({
                    description: document.getElementById('mo-description').value,
                    nbTech: item.nbTech,
                    nbHours: item.nbHours,
                    weekend: item.weekend,
                    pre: item.pre,
                    prs: (parseFloat(item.pre) * item.nbTech * item.nbHours * item.weekend * moTxChg).toFixed(2),
                    pvus: (parseFloat(item.pre) * item.nbTech * item.nbHours * item.weekend * moTxChg / moTxMarge).toFixed(2),
                    pvs: (parseFloat(item.pre) * item.nbTech * item.nbHours * item.weekend * moTxChg / moTxMarge).toFixed(2)
                }))
            );

            history.push(facteur.toJSON());
            localStorage.setItem('quoteHistory', JSON.stringify(history));
            console.log('Facteur saved to history:', facteur);
        }

        function loadQuote() {
            const originalQuoteId = localStorage.getItem('originalQuoteId');
            const isFromHistory = localStorage.getItem('fromHistory');

            if (originalQuoteId && isFromHistory === 'true') {
                // Get quote history and find the quote with matching ID
                const history = JSON.parse(localStorage.getItem('quoteHistory') || '[]');
                const quote = history.find(q => q.id === originalQuoteId);

                if (quote) {
                    // Display the original quote ID in the existing container
                    document.getElementById('quote-id-display').textContent = originalQuoteId;

                    // Set client first
                    document.getElementById('client-input').value = quote.clientName;

                    // Update site options based on selected client
                    updateSiteOptions();

                    // Set site after options are loaded
                    const siteSelect = document.getElementById('site-input');
                    const siteOptions = Array.from(siteSelect.options);
                    const siteExists = siteOptions.some(option => option.value === quote.site);

                    if (siteExists) {
                        siteSelect.value = quote.site;
                    } else {
                        // If site doesn't exist in options, add it as the first option
                        const newOption = document.createElement('option');
                        newOption.value = quote.site;
                        newOption.textContent = quote.site;
                        siteSelect.insertBefore(newOption, siteSelect.firstChild);
                        siteSelect.value = quote.site;
                    }

                    document.getElementById('object-input').value = quote.object;
                    document.getElementById('date-input').value = quote.date;

                    // Load fournitures
                    selectedItems = quote.fournitures.map(item => ({
                        description: item.description,
                        quantity: parseInt(item.quantity),
                        pre: item.pre
                    }));
                    updateTable();

                    // Load main d'œuvre
                    laborItems = quote.maindoeuvre.map(item => ({
                        description: item.description,
                        nbTech: parseInt(item.nbTech),
                        nbHours: parseInt(item.nbHours),
                        weekend: parseFloat(item.weekend),
                        pre: item.pre
                    }));
                    updateLaborTable();

                    // Load descriptions
                    document.getElementById('mo-description').value = quote.maindoeuvre[0]?.description || '';
                    document.getElementById('fournitures-description').value = quote.fournitures[0]?.description || '';

                    // Show update button and hide save button
                    document.getElementById('update-quote-btn').style.display = 'inline-block';
                    document.querySelector('.btn-save').style.display = 'none';

                    // Clear the fromHistory flag after loading
                    localStorage.removeItem('fromHistory');
                }
            } else {
                // Normal new quote mode
                document.getElementById('update-quote-btn').style.display = 'none';
                document.querySelector('.btn-save').style.display = 'inline-block';
                generateNewQuoteId(); // Generate new ID for new quotes
            }
        }

        function updateQuote() {
            const originalQuoteId = localStorage.getItem('originalQuoteId');
            if (!originalQuoteId) return;

            // Get current values
            const clientName = document.getElementById('client-input').value;
            const site = document.getElementById('site-input').value;
            const object = document.getElementById('object-input').value;
            const date = document.getElementById('date-input').value;

            // Get the history
            let history = JSON.parse(localStorage.getItem('quoteHistory') || '[]');

            // Find the original quote to get its ID parts
            const originalQuote = history.find(quote => quote.id === originalQuoteId);
            if (!originalQuote) return;

            // Split the ID into parts (FACT-NUMBER-VERSION)
            const parts = originalQuote.id.split('-');
            const currentVersion = parseInt(parts[2], 10);
            const newVersion = (currentVersion + 1).toString().padStart(3, '0');

            // Create the new ID with incremented version
            const newId = `${parts[0]}-${parts[1]}-${newVersion}`;

            // Create the updated quote object
            const updatedQuote = {
                id: newId,
                clientName: clientName,
                site: site,
                object: object,
                date: date,
                fournitures: selectedItems.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    pre: item.pre
                })),
                maindoeuvre: laborItems.map(item => ({
                    description: item.description,
                    nbTech: item.nbTech,
                    nbHours: item.nbHours,
                    weekend: item.weekend,
                    pre: item.pre
                })),
                timestamp: new Date().toISOString(),
                parentId: originalQuoteId
            };

            // Add the new version to history (don't modify original)
            history.push(updatedQuote);

            // Save the updated history
            localStorage.setItem('quoteHistory', JSON.stringify(history));

            // Clear the original quote ID and fromHistory flag
            localStorage.removeItem('originalQuoteId');
            localStorage.removeItem('fromHistory');

            // Hide the update button
            document.getElementById('update-quote-btn').style.display = 'none';

            // Show success message
            alert('Nouvelle version du devis créée avec succès!');

            // Clear the form
            clearForm();
        }

        function addFournitureItem(item) {
            selectedItems.push(item);
            updateTable();
            saveFormState();
        }

        function addLaborItem(item) {
            laborItems.push(item);
            updateLaborTable();
            saveFormState();
        }

        function removeFournitureItem(index) {
            selectedItems.splice(index, 1);
            updateTable();
            saveFormState();
        }

        function removeLaborItem(index) {
            laborItems.splice(index, 1);
            updateLaborTable();
            saveFormState();
        }

        function clearForm() {
            // Clear all input fields
            document.getElementById('client-input').value = '';
            document.getElementById('site-input').value = '';
            document.getElementById('object-input').value = '';
            document.getElementById('date-input').value = '';
            document.getElementById('mo-description').value = '';
            document.getElementById('fournitures-description').value = '';

            // Clear arrays
            selectedItems = [];
            laborItems = [];

            // Update tables
            updateTable();
            updateLaborTable();

            // Clear any quote ID info if it exists
            const quoteIdInfo = document.querySelector('.quote-header div');
            if (quoteIdInfo) {
                quoteIdInfo.remove();
            }

            // Restore buttons to default state
            document.getElementById('update-quote-btn').style.display = 'none';
            document.querySelector('.btn-save').style.display = 'inline-block';
            generateNewQuoteId(); // Generate new ID when form is cleared
        }

        function saveFormState() {
            const tempState = {
                clientName: document.getElementById('client-input').value,
                site: document.getElementById('site-input').value,
                object: document.getElementById('object-input').value,
                date: document.getElementById('date-input').value,
                selectedItems: selectedItems,
                laborItems: laborItems,
                moDescription: document.getElementById('mo-description').value,
                fournituresDescription: document.getElementById('fournitures-description').value
            };
            sessionStorage.setItem('formState', JSON.stringify(tempState));
        }

        function loadFormState() {
            const tempState = sessionStorage.getItem('formState');
            if (tempState) {
                const state = JSON.parse(tempState);

                document.getElementById('client-input').value = state.clientName || '';
                document.getElementById('site-input').value = state.site || '';
                document.getElementById('object-input').value = state.object || '';
                document.getElementById('date-input').value = state.date || '';

                selectedItems = state.selectedItems || [];
                laborItems = state.laborItems || [];

                document.getElementById('mo-description').value = state.moDescription || '';
                document.getElementById('fournitures-description').value = state.fournituresDescription || '';

                updateTable();
                updateLaborTable();
            }
        }

        function loadClients() {
            return JSON.parse(localStorage.getItem('clients') || '[]');
        }

        function updateSiteOptions() {
            const clientSelect = document.getElementById('client-input');
            const siteSelect = document.getElementById('site-input');
            const selectedClient = clientSelect.value;

            // Clear current options
            siteSelect.innerHTML = '<option value="">Sélectionnez un site</option>';

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
        }

        // Add event listeners to save state on changes
        document.addEventListener('DOMContentLoaded', function() {
            // Load any saved state
            loadFormState();

            // Add change listeners to all form inputs
            const inputs = document.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('change', saveFormState);
                input.addEventListener('input', saveFormState); // For real-time saving
            });
        });

        // Modify the existing saveQuote function to check for existing ID
        function saveQuote() {
            // Get all required values
            const clientName = document.getElementById('client-input').value.trim();
            const site = document.getElementById('site-input').value.trim();
            const object = document.getElementById('object-input').value.trim();
            const date = document.getElementById('date-input').value.trim();
            const fout_TxChn = document.getElementById('tx-chg').value.trim();
            const fout_TxMarge = document.getElementById('tx-marge').value.trim();
            const mo_TxChn = document.getElementById('mo-tx-chg').value.trim();
            const mo_TxMarge = document.getElementById('mo-tx-marge').value.trim();
            const totalFournitures = document.getElementById('total-fournitures').textContent.trim();
            const totalMaindoeuvre = document.getElementById('total-mo').textContent.trim();

            // Check if any required field is empty
            if (!clientName || !site || !object || !date) {
                alert('Veuillez remplir tous les champs obligatoires (Client, Site, Objet, Date)');
                return;
            }

            // Check if there are any items in fournitures or main d'oeuvre
            if (selectedItems.length === 0 && laborItems.length === 0) {
                alert('Veuillez ajouter au moins un élément (Fournitures ou Main d\'œuvre)');
                return;
            }

            // Create new quote
            const quote = new FACTEUR(
                clientName,
                site,
                object,
                date,
                selectedItems.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    pre: item.pre
                })),
                laborItems.map(item => ({
                    description: document.getElementById('mo-description').value,
                    nbTech: item.nbTech,
                    nbHours: item.nbHours,
                    weekend: item.weekend,
                    pre: item.pre
                })),
                fout_TxChn,
                fout_TxMarge,
                mo_TxChn,
                mo_TxMarge,
                totalFournitures,
                totalMaindoeuvre
            );

            // Save to history
            const history = JSON.parse(localStorage.getItem('quoteHistory') || '[]');
            history.push(quote.toJSON());
            localStorage.setItem('quoteHistory', JSON.stringify(history));

            // Show success message
            alert('Devis enregistré avec succès!');
            clearForm(); // Clear the form after saving
        }

        let currentQuoteId = null;

        function generateNewQuoteId() {
            currentQuoteId = FACTEUR.generateId();
            document.getElementById('quote-id-display').textContent = currentQuoteId;
        }