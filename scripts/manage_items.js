// JavaScript for manage_items.htmllet items = [];

        // Setup modern spinners
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

        // Load items from localStorage
        function loadItems() {
            const items = JSON.parse(localStorage.getItem('items') || '[]');
            return items;
        }

        // Save items to localStorage
        function saveItems(items) {
            localStorage.setItem('items', JSON.stringify(items));
        }

        // Update the table display
        function updateTable() {
            const tbody = document.getElementById('items-table-body');
            tbody.innerHTML = '';

            items.sort((a, b) => a.description.localeCompare(b.description)).forEach((item, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <input type="text" value="${item.description}" onchange="updateItem(${index}, 'description', this.value)">
                    </td>
                    <td>
                        <div class="number-input-container">
                            <input type="number" step="0.01" value="${item.pre}" onchange="updateItem(${index}, 'pre', this.value)">
                        </div>
                    </td>
                    <td class="action-buttons">
                        <button class="delete-btn" onclick="deleteItem(${index})">Supprimer</button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            // Setup spinners for the newly added number inputs
            setupModernSpinners();
        }

        // Update item
        function updateItem(index, field, value) {
            const item = items[index];

            if (field === 'description') {
                value = value.trim();
                // Check if new description already exists (except for the current item)
                if (value !== item.description &&
                    items.some(i => i.description === value)) {
                    alert('Cet article existe déjà');
                    updateTable(); // Reset the table to previous values
                    return;
                }
            }

            item[field] = value;
            saveItems(items);
        }

        // Delete item
        function deleteItem(index) {
            if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
                items.splice(index, 1);
                saveItems(items);
                updateTable();
            }
        }

        // Add new item
        function addNewItem() {
            const description = document.getElementById('new-description').value.trim();
            const pre = document.getElementById('new-pre').value;

            if (!description) {
                alert('Veuillez entrer une description');
                return;
            }

            // Check if item already exists
            if (items.some(item => item.description === description)) {
                alert('Cet article existe déjà');
                return;
            }

            items.push({ description, pre });
            saveItems(items);
            updateTable();

            // Clear form
            document.getElementById('new-description').value = '';
            document.getElementById('new-pre').value = '';
        }

        // Initialize the page
        window.onload = function() {
            items = loadItems();
            updateTable();

            // Initialize items if not exists
            if (!localStorage.getItem('items')) {
                const initialItems = [
                    { description: "ACETYLYNE", pre: "" },
                    { description: "ANTI ROUILLE", pre: "" },
                    { description: "AZOTE", pre: "" },
                    { description: "BAGUETTE EN ARGENT", pre: "0.73" },
                    { description: "BANDE ADHESIVE ALU", pre: "14.95" },
                    { description: "BANDE ARMAFLEX", pre: "27.52" },
                    { description: "BANDE VINYLE", pre: "1.85" },
                    { description: "BUTANE 400G", pre: "12.29" },
                    { description: "CABLE RIGIDE 3x2,5", pre: "1.81" },
                    { description: "CABLE SOUPLE 3x2,5", pre: "1.36" },
                    { description: "COLLE ARMAFLEX", pre: "36.91" },
                    { description: "COLLE PATEX", pre: "7.45" },
                    { description: "COUDE PVC 32MM", pre: "0.94" },
                    { description: "DILUANT", pre: "41.36" },
                    { description: "DISJONCTEUR ELECTRONIQUE", pre: "64.83" },
                    { description: "FEUILLE ARMAFLEX 19", pre: "25.27" },
                    { description: "FEUILLE ARMAFLEX 25", pre: "81.37" },
                    { description: "FEUILLE ARMAFLEX 32", pre: "84.24" },
                    { description: "FILTRE DESHYDRATEUR 1/2", pre: "" },
                    { description: "FILTRE DESHYDRATEUR 3/8", pre: "32.86" },
                    { description: "FILTRE DESHYDRATEUR 5/8", pre: "" },
                    { description: "FREON R134", pre: "10.09" },
                    { description: "FREON R22", pre: "7.07" },
                    { description: "FREON R404A", pre: "12.97" },
                    { description: "FREON R407", pre: "12.96" },
                    { description: "FREON R410A", pre: "12.77" },
                    { description: "GOULOTTE", pre: "" },
                    { description: "GOULOTTE MOSAIQUE", pre: "" },
                    { description: "LAINE DE VERRE", pre: "33.76" },
                    { description: "MANCHON PVC 32MM", pre: "0.88" },
                    { description: "OXYGENE", pre: "" },
                    { description: "SPLIT 12000BTU", pre: "362.33" },
                    { description: "SPLIT 18000BTU", pre: "529.69" },
                    { description: "SPLIT 24000BTU", pre: "651.74" },
                    { description: "SUPPORT CONDENSEUR", pre: "16.86" },
                    { description: "SUPPORT MURAL 3/24", pre: "6.54" },
                    { description: "THINNER", pre: "" },
                    { description: "TOLE GALVA 0.6", pre: "" },
                    { description: "TOLE GALVA 0.8", pre: "" },
                    { description: "TUBE ARMAFLEX 60", pre: "32.39" },
                    { description: "TUBE ARMAFLEX M114", pre: "62.43" },
                    { description: "TUBE ARMAFLEX M22", pre: "14.79" },
                    { description: "TUBE ARMAFLEX M28", pre: "11.93" },
                    { description: "TUBE ARMAFLEX M32", pre: "103.64" },
                    { description: "TUBE ARMAFLEX M35", pre: "17.11" },
                    { description: "TUBE ARMAFLEX M42", pre: "21.93" },
                    { description: "TUBE ARMAFLEX M48", pre: "25.5" },
                    { description: "TUBE ARMAFLEX M76", pre: "41.45" },
                    { description: "TUBE ARMAFLEX M89", pre: "29.19" },
                    { description: "TUBE CUIVRE 1/2", pre: "16.77" },
                    { description: "TUBING 3/8", pre: "9.44" },
                    { description: "TUBING 3/8-5/8", pre: "17.47" },
                    { description: "TUYAU ECOULEMENT/FLEXIBLE", pre: "" },
                    { description: "TUYAU PVC 32MM", pre: "2.47" }
                ];
                saveItems(initialItems);
            }

            setupModernSpinners();
        };

        document.getElementById('excel-file').addEventListener('change', function(e) {
            const fileName = e.target.files[0]?.name || 'Aucun fichier choisi';
            document.getElementById('file-name').textContent = fileName;

            if (e.target.files.length) {
                const file = e.target.files[0];
                const reader = new FileReader();

                reader.onload = function(e) {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Get the first worksheet
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

                    // Convert to JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: ['description', 'pre'] });

                    // Remove header row if it exists
                    if (jsonData.length > 0 &&
                        (jsonData[0].description.toLowerCase().includes('description') ||
                         jsonData[0].pre.toLowerCase().includes('prix') ||
                         jsonData[0].pre.toLowerCase().includes('pr'))) {
                        jsonData.shift();
                    }

                    // Update existing items and add new ones
                    let updatedCount = 0;
                    let addedCount = 0;

                    jsonData.forEach(row => {
                        if (row.description && row.pre !== undefined) {
                            const description = row.description.toString().trim().toUpperCase();
                            const pre = row.pre.toString().trim();

                            // Skip empty rows
                            if (!description) return;

                            // Find existing item
                            const existingItem = items.find(item =>
                                item.description.toUpperCase() === description
                            );

                            if (existingItem) {
                                // Update existing item
                                existingItem.pre = pre;
                                updatedCount++;
                            } else {
                                // Add new item
                                items.push({ description, pre });
                                addedCount++;
                            }
                        }
                    });

                    // Save and update display
                    saveItems(items);
                    updateTable();

                    // Show results
                    alert(`Importation terminée!\n${updatedCount} articles mis à jour\n${addedCount} nouveaux articles ajoutés`);

                    // Reset file input
                    e.target.value = '';
                    document.getElementById('file-name').textContent = 'Aucun fichier choisi';
                };

                reader.readAsArrayBuffer(file);
            }
        });