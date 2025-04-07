// Модуль для роботи з клієнтами
const Clients = {
    // Ініціалізація
    init() {
        // Ініціалізуємо обробники подій для списку клієнтів
        this.initClientListHandlers();
    },
    
    // Ініціалізація обробників подій для списку клієнтів
    initClientListHandlers() {
        // Делегування подій для списку клієнтів
        const clientsList = document.getElementById('clients-list');
        
        if (!clientsList) return;
        
        clientsList.addEventListener('click', async (e) => {
            // Перевіряємо, чи клік був по кнопці дії
            const button = e.target.closest('.action-btn');
            
            if (!button) return;
            
            // Отримуємо ID клієнта та дію
            const clientId = button.getAttribute('data-id');
            const action = button.getAttribute('data-action');
            
            // Виконуємо відповідну дію
            if (action === 'edit-client') {
                await this.openEditClientModal(clientId);
            } else if (action === 'book-client') {
                await Modals.openBookingModalForClient(clientId);
            } else if (action === 'delete-client') {
                await this.deleteClient(clientId);
            }
        });
    },
    
    // Завантаження клієнтів
    async loadClients() {
        const clientsList = document.getElementById('clients-list');
        
        if (!clientsList) return;
        
        try {
            // Показуємо індикатор завантаження
            clientsList.innerHTML = '<div class="loader"></div>';
            
            // Оновлюємо стан завантаження
            window.appState.loading.clients = true;
            
            // Отримання клієнтів через API
            const clients = await apiClient.getClients();
            window.appState.clients = clients;
            
            // Рендерінг списку клієнтів
            this.renderClientsList();
            
            // Оновлюємо стан завантаження
            window.appState.loading.clients = false;
        } catch (error) {
            console.error('Помилка завантаження клієнтів:', error);
            clientsList.innerHTML = `
                <div class="error-message">
                    Помилка завантаження клієнтів: ${error.message}
                </div>
            `;
            window.appState.loading.clients = false;
        }
    },
    
    // Рендерінг списку клієнтів
    renderClientsList() {
        const clientsList = document.getElementById('clients-list');
        
        // Очистка списку
        clientsList.innerHTML = '';
        
        // Перевірка наявності клієнтів
        if (!window.appState.clients || window.appState.clients.length === 0) {
            clientsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>Немає клієнтів</h3>
                    <p>Натисніть кнопку "+" щоб додати нового клієнта</p>
                </div>
            `;
            return;
        }
        
        // Сортування клієнтів за алфавітом
        const sortedClients = [...window.appState.clients].sort((a, b) => {
            return (a.name + ' ' + a.surName).localeCompare(b.name + ' ' + b.surName);
        });
        
        // Створення елементів пошуку
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <div class="form-group">
                <input type="search" id="client-search" class="form-control" placeholder="Пошук клієнтів...">
            </div>
        `;
        
        clientsList.appendChild(searchContainer);
        
        // Контейнер для списку клієнтів
        const listContainer = document.createElement('div');
        listContainer.id = 'clients-list-container';
        
        // Додавання клієнтів до списку
        sortedClients.forEach(client => {
            // Створення рейтингу зірок
            let stars = '';
            for (let i = 1; i <= 5; i++) {
                stars += i <= client.trustRating ? '★' : '☆';
            }
            
            const clientElement = document.createElement('div');
            clientElement.className = 'list-item';
            clientElement.setAttribute('data-name', `${client.name} ${client.surName}`);
            clientElement.setAttribute('data-phone', client.phoneNum);
            
            clientElement.innerHTML = `
                <div class="list-item-details">
                    <h3>${client.name} ${client.surName}</h3>
                    <p>📱 ${client.phoneNum}</p>
                    ${client.instagram ? `<p>📸 ${client.instagram}</p>` : ''}
                    <div class="trust-rating">${stars}</div>
                </div>
                <div class="list-item-actions">
                    <button class="action-btn btn-edit" data-id="${client._id}" data-action="edit-client">✏️</button>
                    <button class="action-btn btn-confirm" data-id="${client._id}" data-action="book-client">📝</button>
                    <button class="action-btn btn-cancel" data-id="${client._id}" data-action="delete-client">🗑️</button>
                </div>
            `;
            
            listContainer.appendChild(clientElement);
        });
        
        clientsList.appendChild(listContainer);
        
        // Додавання обробника пошуку
        const searchInput = document.getElementById('client-search');
        searchInput.addEventListener('input', this.filterClients);
    },
    
    // Фільтрація клієнтів при пошуку
    filterClients() {
        const query = this.value.toLowerCase();
        const clientItems = document.querySelectorAll('#clients-list-container .list-item');
        
        clientItems.forEach(item => {
            const name = item.getAttribute('data-name').toLowerCase();
            const phone = item.getAttribute('data-phone').toLowerCase();
            
            // Перевірка, чи співпадає запит з ім'ям або телефоном
            if (name.includes(query) || phone.includes(query)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    },
    
    // Відкриття модального вікна для редагування клієнта
    async openEditClientModal(clientId) {
        try {
            // Отримання клієнта за ID
            const client = await apiClient.getClient(clientId);
            
            // Створення модального вікна, якщо його ще немає
            if (!document.getElementById('edit-client-modal')) {
                this.createEditClientModal();
            }
            
            // Заповнення форми даними клієнта
            const form = document.getElementById('edit-client-form');
            form.querySelector('[name="id"]').value = client._id;
            form.querySelector('[name="name"]').value = client.name;
            form.querySelector('[name="surName"]').value = client.surName;
            form.querySelector('[name="phoneNum"]').value = client.phoneNum;
            form.querySelector('[name="instagram"]').value = client.instagram || '';
            form.querySelector('[name="trustRating"]').value = client.trustRating;
            
            // Відкриття модального вікна
            Modals.open('edit-client-modal');
        } catch (error) {
            console.error('Помилка відкриття форми редагування клієнта:', error);
            Toast.error('Не вдалося завантажити дані для редагування клієнта.');
        }
    },
    
    // Створення модального вікна для редагування клієнта
    createEditClientModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'edit-client-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">Редагування клієнта</div>
                    <button class="modal-close">&times;</button>
                </div>
                <form id="edit-client-form">
                    <input type="hidden" name="id">
                    <div class="form-group">
                        <label class="form-label">Ім'я</label>
                        <input type="text" class="form-control" name="name" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Прізвище</label>
                        <input type="text" class="form-control" name="surName" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Телефон</label>
                        <input type="tel" class="form-control" name="phoneNum" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Instagram</label>
                        <input type="text" class="form-control" name="instagram">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Рейтинг довіри</label>
                        <select class="form-control" name="trustRating">
                            <option value="5">★★★★★ (5 зірок)</option>
                            <option value="4">★★★★☆ (4 зірки)</option>
                            <option value="3">★★★☆☆ (3 зірки)</option>
                            <option value="2">★★☆☆☆ (2 зірки)</option>
                            <option value="1">★☆☆☆☆ (1 зірка)</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-primary">
                        <span class="btn-text">Зберегти зміни</span>
                        <span class="btn-loader"></span>
                    </button>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Додавання обробника для форми
        const form = document.getElementById('edit-client-form');
        form.addEventListener('submit', this.handleEditClientSubmit.bind(this));
        
        // Додавання обробника для закриття модального вікна
        modal.querySelector('.modal-close').addEventListener('click', () => {
            Modals.close('edit-client-modal');
        });
        
        // Закриття по кліку на фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                Modals.close('edit-client-modal');
            }
        });
    },
    
    // Обробник для форми редагування клієнта
    async handleEditClientSubmit(e) {
        e.preventDefault();
        
        try {
            // Форма для редагування клієнта
            const form = e.target;
            
            // Блокування форми під час обробки
            Forms.setFormLoading(form, true);
            
            // Отримання даних форми
            const formData = new FormData(form);
            const clientId = formData.get('id');
            
            // Створення об'єкта клієнта
            const clientData = {
                name: formData.get('name'),
                surName: formData.get('surName'),
                phoneNum: formData.get('phoneNum'),
                instagram: formData.get('instagram'),
                trustRating: parseInt(formData.get('trustRating'))
            };
            
            // Перевірка обов'язкових полів
            if (!clientData.name || !clientData.surName || !clientData.phoneNum) {
                Toast.error('Будь ласка, заповніть всі обов\'язкові поля.');
                Forms.setFormLoading(form, false);
                return;
            }
            
            // Оновлення клієнта через API
            await apiClient.updateClient(clientId, clientData);
            
            // Успішне оновлення
            Toast.success('Клієнта успішно оновлено.');
            
            // Закриття модального вікна
            Modals.close('edit-client-modal');
            
            // Оновлення списку клієнтів
            await this.loadClients();
            
            // Оновлення селектів з клієнтами
            Forms.loadClientSelect('booking-client-select');
            Forms.loadClientSelect('edit-appointment-client');
            
            // Розблокування форми
            Forms.setFormLoading(form, false);
        } catch (error) {
            console.error('Помилка оновлення клієнта:', error);
            Toast.error('Не вдалося оновити клієнта. ' + error.message);
            Forms.setFormLoading(e.target, false);
        }
    },
    
    // Видалення клієнта
    async deleteClient(clientId) {
        // Запит на підтвердження
        if (!confirm('Ви впевнені, що хочете видалити цього клієнта? Всі його записи також будуть видалені.')) return;
        
        try {
            // Показуємо спінер завантаження
            const button = document.querySelector(`.action-btn[data-id="${clientId}"][data-action="delete-client"]`);
            
            if (button) {
                button.innerHTML = `<div class="btn-loader"></div>`;
                button.disabled = true;
            }
            
            // Видалення клієнта
            await apiClient.deleteClient(clientId);
            
            // Показуємо повідомлення про успіх
            Toast.success('Клієнта успішно видалено.');
            
            // Оновлюємо список клієнтів
            await this.loadClients();
            
            // Оновлення селектів з клієнтами
            Forms.loadClientSelect('booking-client-select');
            Forms.loadClientSelect('edit-appointment-client');
        } catch (error) {
            console.error('Помилка видалення клієнта:', error);
            Toast.error(`Не вдалося видалити клієнта. ${error.message}`);
            
            // Відновлюємо кнопку
            const button = document.querySelector(`.action-btn[data-id="${clientId}"][data-action="delete-client"]`);
            
            if (button) {
                button.innerHTML = '🗑️';
                button.disabled = false;
            }
        }
    }
};