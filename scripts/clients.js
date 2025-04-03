// JavaScript for clients.htmllet clients = JSON.parse(localStorage.getItem('clients') || '[]');

        function addSiteInput() {
            const container = document.getElementById('sites-container');
            const newSite = document.createElement('div');
            newSite.className = 'site-item';
            newSite.innerHTML = `
                <input type="text" class="site-input" placeholder="Nom du site" required>
                <button type="button" class="btn btn-danger" onclick="removeSiteInput(this)">Supprimer</button>
            `;
            container.appendChild(newSite);
        }

        function removeSiteInput(button) {
            button.parentElement.remove();
        }

        function addEditSiteInput() {
            const container = document.getElementById('edit-sites-container');
            const newSite = document.createElement('div');
            newSite.className = 'site-item';
            newSite.innerHTML = `
                <input type="text" class="site-input" placeholder="Nom du site" required>
                <button type="button" class="btn btn-danger" onclick="removeSiteInput(this)">Supprimer</button>
            `;
            container.appendChild(newSite);
        }

        function displayClients() {
            const clientsList = document.getElementById('clients-list');
            clientsList.innerHTML = clients.map(client => `
                <div class="client-card">
                    <div class="client-header">
                        <div>
                            <div class="client-name">${client.name}</div>
                            <div class="client-id">ID: ${client.id}</div>
                        </div>
                    </div>
                    <div class="sites-list">
                        ${client.sites.map(site => `
                            <span class="site-tag">${site}</span>
                        `).join('')}
                    </div>
                    <div class="client-actions">
                        <button class="btn btn-secondary" onclick="openEditModal('${client.id}')">Modifier</button>
                        <button class="btn btn-danger" onclick="deleteClient('${client.id}')">Supprimer</button>
                    </div>
                </div>
            `).join('');
        }

        function openEditModal(clientId) {
            const client = clients.find(c => c.id === clientId);
            if (!client) return;

            document.getElementById('edit-client-id').value = client.id;
            document.getElementById('edit-client-name').value = client.name;

            const sitesContainer = document.getElementById('edit-sites-container');
            sitesContainer.innerHTML = client.sites.map(site => `
                <div class="site-item">
                    <input type="text" class="site-input" value="${site}" required>
                    <button type="button" class="btn btn-danger" onclick="removeSiteInput(this)">Supprimer</button>
                </div>
            `).join('');

            document.getElementById('edit-modal').style.display = 'block';
        }

        function closeEditModal() {
            document.getElementById('edit-modal').style.display = 'none';
        }

        function deleteClient(clientId) {
            if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
                clients = clients.filter(c => c.id !== clientId);
                localStorage.setItem('clients', JSON.stringify(clients));
                displayClients();
            }
        }

        // Event Listeners
        document.getElementById('client-form').addEventListener('submit', function(e) {
            e.preventDefault();

            const name = document.getElementById('client-name').value;
            const id = document.getElementById('client-id').value;
            const sites = Array.from(document.getElementsByClassName('site-input'))
                .map(input => input.value.trim())
                .filter(site => site !== '');

            if (clients.some(c => c.id === id)) {
                alert('Un client avec cet ID existe déjà.');
                return;
            }

            clients.push({ name, id, sites });
            localStorage.setItem('clients', JSON.stringify(clients));

            this.reset();
            document.getElementById('sites-container').innerHTML = `
                <div class="site-item">
                    <input type="text" class="site-input" placeholder="Nom du site" required>
                </div>
            `;

            displayClients();
        });

        document.getElementById('edit-form').addEventListener('submit', function(e) {
            e.preventDefault();

            const clientId = document.getElementById('edit-client-id').value;
            const name = document.getElementById('edit-client-name').value;
            const sites = Array.from(document.getElementsByClassName('site-input'))
                .map(input => input.value.trim())
                .filter(site => site !== '');

            const index = clients.findIndex(c => c.id === clientId);
            if (index !== -1) {
                clients[index] = { ...clients[index], name, sites };
                localStorage.setItem('clients', JSON.stringify(clients));
                closeEditModal();
                displayClients();
            }
        });

        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('edit-modal');
            if (event.target === modal) {
                closeEditModal();
            }
        };

        // Initialize the page
        window.onload = function() {
            displayClients();
        };