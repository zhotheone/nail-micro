// Модуль для роботи з процедурами
const Procedures = {
    // Ініціалізація
    init() {
        // Ініціалізуємо обробники подій для списку процедур
        this.initProcedureListHandlers();
    },
    
    // Ініціалізація обробників подій для списку процедур
    initProcedureListHandlers() {
        // Делегування подій для списку процедур
        const proceduresList = document.getElementById('procedures-list');
        
        if (!proceduresList) return;
        
        proceduresList.addEventListener('click', async (e) => {
            // Перевіряємо, чи клік був по кнопці дії
            const button = e.target.closest('.action-btn');
            
            if (!button) return;
            
            // Отримуємо ID процедури та дію
            const procedureId = button.getAttribute('data-id');
            const action = button.getAttribute('data-action');
            
            // Виконуємо відповідну дію
            if (action === 'edit-procedure') {
                await this.openEditProcedureModal(procedureId);
            } else if (action === 'delete-procedure') {
                await this.deleteProcedure(procedureId);
            }
        });
    },
    
    // Завантаження процедур
    async loadProcedures() {
        const proceduresList = document.getElementById('procedures-list');
        
        if (!proceduresList) return;
        
        try {
            // Показуємо індикатор завантаження
            proceduresList.innerHTML = '<div class="loader"></div>';
            
            // Оновлюємо стан завантаження
            window.appState.loading.procedures = true;
            
            // Отримання процедур через API
            const procedures = await apiClient.getProcedures();
            window.appState.procedures = procedures;
            
            // Рендерінг списку процедур
            this.renderProceduresList();
            
            // Оновлюємо стан завантаження
            window.appState.loading.procedures = false;
        } catch (error) {
            console.error('Помилка завантаження процедур:', error);
            proceduresList.innerHTML = `
                <div class="error-message">
                    Помилка завантаження процедур: ${error.message}
                </div>
            `;
            window.appState.loading.procedures = false;
        }
    },
    
    // Рендерінг списку процедур
    renderProceduresList() {
        const proceduresList = document.getElementById('procedures-list');
        
        // Очистка списку
        proceduresList.innerHTML = '';
        
        // Перевірка наявності процедур
        if (!window.appState.procedures || window.appState.procedures.length === 0) {
            proceduresList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-paint-brush"></i>
                    <h3>Немає процедур</h3>
                    <p>Натисніть кнопку "+" щоб додати нову процедуру</p>
                </div>
            `;
            return;
        }
        
        // Сортування процедур за ціною
        const sortedProcedures = [...window.appState.procedures].sort((a, b) => {
            return a.price - b.price;
        });
        
        // Створення елементів пошуку та сортування
        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-container';
        filterContainer.innerHTML = `
            <div class="form-group">
                <input type="search" id="procedure-search" class="form-control" placeholder="Пошук процедур...">
            </div>
            <div class="form-group">
                <select id="procedure-sort" class="form-control">
                    <option value="name">Сортувати за назвою</option>
                    <option value="price" selected>Сортувати за ціною</option>
                    <option value="duration">Сортувати за тривалістю</option>
                </select>
            </div>
        `;
        
        proceduresList.appendChild(filterContainer);
        
        // Контейнер для списку процедур
        const listContainer = document.createElement('div');
        listContainer.id = 'procedures-list-container';
        
        // Додавання процедур до списку
        sortedProcedures.forEach(procedure => {
            // Форматування тривалості
            let durationText = '';
            if (procedure.timeToComplete < 60) {
                durationText = `${procedure.timeToComplete} хв`;
            } else {
                const hours = Math.floor(procedure.timeToComplete / 60);
                const minutes = procedure.timeToComplete % 60;
                durationText = hours > 0 ? `${hours} год` : '';
                durationText += minutes > 0 ? ` ${minutes} хв` : '';
            }
            
            // Форматування ціни
            const formattedPrice = new Intl.NumberFormat('uk-UA', {
                style: 'currency',
                currency: 'UAH',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(procedure.price);
            
            const procedureElement = document.createElement('div');
            procedureElement.className = 'list-item';
            procedureElement.setAttribute('data-name', procedure.name);
            procedureElement.setAttribute('data-price', procedure.price);
            procedureElement.setAttribute('data-duration', procedure.timeToComplete);
            
            procedureElement.innerHTML = `
                <div class="list-item-details">
                    <h3>${procedure.name}</h3>
                    <p>${formattedPrice} • ${durationText}</p>
                </div>
                <div class="list-item-actions">
                    <button class="action-btn btn-edit" data-id="${procedure._id}" data-action="edit-procedure">✏️</button>
                    <button class="action-btn btn-cancel" data-id="${procedure._id}" data-action="delete-procedure">🗑️</button>
                </div>
            `;
            
            listContainer.appendChild(procedureElement);
        });
        
        proceduresList.appendChild(listContainer);
        
        // Додавання обробників пошуку та сортування
        const searchInput = document.getElementById('procedure-search');
        const sortSelect = document.getElementById('procedure-sort');
        
        searchInput.addEventListener('input', this.filterProcedures);
        sortSelect.addEventListener('change', this.sortProcedures);
    },
    
    // Фільтрація процедур при пошуку
    filterProcedures() {
        const query = this.value.toLowerCase();
        const procedureItems = document.querySelectorAll('#procedures-list-container .list-item');
        
        procedureItems.forEach(item => {
            const name = item.getAttribute('data-name').toLowerCase();
            
            // Перевірка, чи співпадає запит з назвою
            if (name.includes(query)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    },
    
    // Сортування процедур
    sortProcedures() {
        const sortBy = this.value;
        const procedureItems = Array.from(document.querySelectorAll('#procedures-list-container .list-item'));
        const container = document.getElementById('procedures-list-container');
        
        // Сортування елементів
        procedureItems.sort((a, b) => {
            if (sortBy === 'name') {
                return a.getAttribute('data-name').localeCompare(b.getAttribute('data-name'));
            } else if (sortBy === 'price') {
                return parseFloat(a.getAttribute('data-price')) - parseFloat(b.getAttribute('data-price'));
            } else if (sortBy === 'duration') {
                return parseInt(a.getAttribute('data-duration')) - parseInt(b.getAttribute('data-duration'));
            }
            return 0;
        });
        
        // Очищення та повторне додавання елементів
        container.innerHTML = '';
        procedureItems.forEach(item => {
            container.appendChild(item);
        });
    },
    
    // Відкриття модального вікна для редагування процедури
    async openEditProcedureModal(procedureId) {
        try {
            // Отримання процедури за ID
            const procedure = await apiClient.getProcedure(procedureId);
            
            // Створення модального вікна, якщо його ще немає
            if (!document.getElementById('edit-procedure-modal')) {
                this.createEditProcedureModal();
            }
            
            // Заповнення форми даними процедури
            const form = document.getElementById('edit-procedure-form');
            form.querySelector('[name="id"]').value = procedure._id;
            form.querySelector('[name="name"]').value = procedure.name;
            form.querySelector('[name="price"]').value = procedure.price;
            form.querySelector('[name="timeToComplete"]').value = procedure.timeToComplete;
            
            // Відкриття модального вікна
            Modals.open('edit-procedure-modal');
        } catch (error) {
            console.error('Помилка відкриття форми редагування процедури:', error);
            Toast.error('Не вдалося завантажити дані для редагування процедури.');
        }
    },
    
    // Створення модального вікна для редагування процедури
    createEditProcedureModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'edit-procedure-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">Редагування процедури</div>
                    <button class="modal-close">&times;</button>
                </div>
                <form id="edit-procedure-form">
                    <input type="hidden" name="id">
                    <div class="form-group">
                        <label class="form-label">Назва</label>
                        <input type="text" class="form-control" name="name" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Ціна (грн)</label>
                        <input type="number" class="form-control" name="price" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Тривалість (хв)</label>
                        <input type="number" class="form-control" name="timeToComplete" required>
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
        const form = document.getElementById('edit-procedure-form');
        form.addEventListener('submit', this.handleEditProcedureSubmit.bind(this));
        
        // Додавання обробника для закриття модального вікна
        modal.querySelector('.modal-close').addEventListener('click', () => {
            Modals.close('edit-procedure-modal');
        });
        
        // Закриття по кліку на фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                Modals.close('edit-procedure-modal');
            }
        });
    },
    
    // Обробник для форми редагування процедури
    async handleEditProcedureSubmit(e) {
        e.preventDefault();
        
        try {
            // Форма для редагування процедури
            const form = e.target;
            
            // Блокування форми під час обробки
            Forms.setFormLoading(form, true);
            
            // Отримання даних форми
            const formData = new FormData(form);
            const procedureId = formData.get('id');
            
            // Створення об'єкта процедури
            const procedureData = {
                name: formData.get('name'),
                price: parseFloat(formData.get('price')),
                timeToComplete: parseInt(formData.get('timeToComplete'))
            };
            
            // Перевірка обов'язкових полів
            if (!procedureData.name || isNaN(procedureData.price) || isNaN(procedureData.timeToComplete)) {
                Toast.error('Будь ласка, заповніть всі поля коректно.');
                Forms.setFormLoading(form, false);
                return;
            }
            
            // Оновлення процедури через API
            await apiClient.updateProcedure(procedureId, procedureData);
            
            // Успішне оновлення
            Toast.success('Процедуру успішно оновлено.');
            
            // Закриття модального вікна
            Modals.close('edit-procedure-modal');
            
            // Оновлення списку процедур
            await this.loadProcedures();
            
            // Оновлення селектів з процедурами
            Forms.loadProcedureSelect('booking-procedure-select');
            Forms.loadProcedureSelect('edit-appointment-procedure');
            
            // Розблокування форми
            Forms.setFormLoading(form, false);
        } catch (error) {
            console.error('Помилка оновлення процедури:', error);
            Toast.error('Не вдалося оновити процедуру. ' + error.message);
            Forms.setFormLoading(e.target, false);
        }
    },
    
    // Видалення процедури
    async deleteProcedure(procedureId) {
        // Запит на підтвердження
        if (!confirm('Ви впевнені, що хочете видалити цю процедуру?')) return;
        
        try {
            // Показуємо спінер завантаження
            const button = document.querySelector(`.action-btn[data-id="${procedureId}"][data-action="delete-procedure"]`);
            
            if (button) {
                button.innerHTML = `<div class="btn-loader"></div>`;
                button.disabled = true;
            }
            
            // Видалення процедури
            await apiClient.deleteProcedure(procedureId);
            
            // Показуємо повідомлення про успіх
            Toast.success('Процедуру успішно видалено.');
            
            // Оновлюємо список процедур
            await this.loadProcedures();
            
            // Оновлення селектів з процедурами
            Forms.loadProcedureSelect('booking-procedure-select');
            Forms.loadProcedureSelect('edit-appointment-procedure');
        } catch (error) {
            console.error('Помилка видалення процедури:', error);
            Toast.error(`Не вдалося видалити процедуру. ${error.message}`);
            
            // Відновлюємо кнопку
            const button = document.querySelector(`.action-btn[data-id="${procedureId}"][data-action="delete-procedure"]`);
            
            if (button) {
                button.innerHTML = '🗑️';
                button.disabled = false;
            }
        }
    }
};