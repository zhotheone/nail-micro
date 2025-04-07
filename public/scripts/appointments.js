// Модуль для роботи з записами
const Appointments = {
    // Ініціалізація
    init() {
        // Ініціалізуємо обробники подій для списку записів
        this.initAppointmentListHandlers();
    },
    
    // Ініціалізація обробників подій для списку записів
    initAppointmentListHandlers() {
        // Делегування подій для списку записів
        const appointmentsList = document.getElementById('appointments-list');
        
        if (!appointmentsList) return;
        
        appointmentsList.addEventListener('click', async (e) => {
            // Перевіряємо, чи клік був по кнопці дії
            const button = e.target.closest('.action-btn');
            
            if (!button) return;
            
            // Отримуємо ID запису та дію
            const appointmentId = button.getAttribute('data-id');
            const action = button.getAttribute('data-action');
            
            // Виконуємо відповідну дію
            if (action === 'edit') {
                await Modals.openEditAppointmentModal(appointmentId);
            } else if (action === 'confirm') {
                await this.updateAppointmentStatus(appointmentId, 'confirmed');
            } else if (action === 'cancel') {
                await this.updateAppointmentStatus(appointmentId, 'cancelled');
            } else if (action === 'complete') {
                await this.updateAppointmentStatus(appointmentId, 'completed');
            } else if (action === 'delete') {
                await this.deleteAppointment(appointmentId);
            }
        });
    },
    
    // Завантаження записів на вибрану дату
    async loadAppointmentsForSelectedDate() {
        const appointmentsList = document.getElementById('appointments-list');
        
        if (!appointmentsList) return;
        
        try {
            // Показуємо індикатор завантаження
            appointmentsList.innerHTML = '<div class="loader"></div>';
            
            // Оновлюємо стан завантаження
            window.appState.loading.appointments = true;
            
            // Форматування дати для API
            const formattedDate = this.formatDateForAPI(window.appState.selectedDate);
            
            // Отримання записів через API
            const appointments = await apiClient.getAppointmentsByDate(formattedDate);
            window.appState.appointments = appointments;
            
            // Рендерінг списку записів
            this.renderAppointmentsList();
            
            // Оновлюємо стан завантаження
            window.appState.loading.appointments = false;
        } catch (error) {
            console.error('Помилка завантаження записів:', error);
            appointmentsList.innerHTML = `
                <div class="error-message">
                    Помилка завантаження записів: ${error.message}
                </div>
            `;
            window.appState.loading.appointments = false;
        }
    },
    
    // Рендерінг списку записів
    renderAppointmentsList() {
        const appointmentsList = document.getElementById('appointments-list');
        
        // Очистка списку
        appointmentsList.innerHTML = '';
        
        // Перевірка наявності записів
        if (!window.appState.appointments || window.appState.appointments.length === 0) {
            appointmentsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-day"></i>
                    <h3>Немає записів на цей день</h3>
                    <p>Натисніть кнопку "+" щоб додати новий запис</p>
                </div>
            `;
            return;
        }
        
        // Сортування записів по часу
        const sortedAppointments = [...window.appState.appointments].sort((a, b) => {
            return new Date(a.time) - new Date(b.time);
        });
        
        // Додавання записів до списку
        sortedAppointments.forEach(appointment => {
            const appointmentTime = new Date(appointment.time);
            
            // Знаходження процедури для визначення тривалості
            const procedure = appointment.procedureId;
            const durationMinutes = procedure ? procedure.timeToComplete : 60;
            
            // Розрахунок часу закінчення
            const endTime = new Date(appointmentTime);
            endTime.setMinutes(endTime.getMinutes() + durationMinutes);
            
            // Форматування часу
            const startTimeStr = this.formatTime(appointmentTime);
            const endTimeStr = this.formatTime(endTime);
            
            // Визначення тексту статусу
            let statusText = '';
            let statusClass = '';
            switch (appointment.status) {
                case 'pending':
                    statusText = 'Очікує';
                    statusClass = 'status-pending';
                    break;
                case 'confirmed':
                    statusText = 'Підтверджено';
                    statusClass = 'status-confirmed';
                    break;
                case 'completed':
                    statusText = 'Виконано';
                    statusClass = 'status-completed';
                    break;
                case 'cancelled':
                    statusText = 'Скасовано';
                    statusClass = 'status-cancelled';
                    break;
            }
            
            // Форматування ціни
            const price = appointment.finalPrice || appointment.price;
            const formattedPrice = this.formatCurrency(price);
            
            // Створення елемента для запису
            const appointmentElement = document.createElement('div');
            appointmentElement.className = 'appointment-item';
            appointmentElement.innerHTML = `
                <div class="appointment-time">${startTimeStr} - ${endTimeStr}</div>
                <div class="appointment-client">${appointment.clientId.name} ${appointment.clientId.surName}</div>
                <div class="appointment-service">${procedure ? procedure.name : 'Невідома процедура'} • ${formattedPrice}</div>
                <div><span class="status ${statusClass}">${statusText}</span></div>
                <div class="appointment-actions">
                    ${appointment.status === 'pending' ? `<button class="action-btn btn-confirm" data-id="${appointment._id}" data-action="confirm">✓ Підтвердити</button>` : ''}
                    ${appointment.status === 'confirmed' ? `<button class="action-btn btn-confirm" data-id="${appointment._id}" data-action="complete">✓ Виконано</button>` : ''}
                    <button class="action-btn btn-edit" data-id="${appointment._id}" data-action="edit">✏️ Редагувати</button>
                    ${appointment.status !== 'cancelled' ? `<button class="action-btn btn-cancel" data-id="${appointment._id}" data-action="cancel">❌ Скасувати</button>` : ''}
                    ${appointment.status === 'cancelled' ? `<button class="action-btn btn-cancel" data-id="${appointment._id}" data-action="delete">🗑️ Видалити</button>` : ''}
                </div>
            `;
            
            // Додавання елемента до списку
            appointmentsList.appendChild(appointmentElement);
        });
    },
    
    // Оновлення статусу запису
    async updateAppointmentStatus(appointmentId, status) {
        try {
            // Показуємо спінер завантаження
            const button = document.querySelector(`.action-btn[data-id="${appointmentId}"][data-action="${status === 'confirmed' ? 'confirm' : status === 'cancelled' ? 'cancel' : 'complete'}"]`);
            
            if (button) {
                button.innerHTML = `<div class="btn-loader"></div>`;
                button.disabled = true;
            }
            
            // Оновлення статусу
            await apiClient.updateAppointment(appointmentId, { status });
            
            // Показуємо повідомлення про успіх
            const statusText = status === 'confirmed' ? 'підтверджено' : 
                               status === 'cancelled' ? 'скасовано' : 
                               'позначено як виконаний';
            Toast.success(`Запис успішно ${statusText}.`);
            
            // Оновлюємо список записів
            await this.loadAppointmentsForSelectedDate();
        } catch (error) {
            console.error(`Помилка оновлення статусу запису на "${status}":`, error);
            Toast.error(`Не вдалося оновити статус запису. ${error.message}`);
            
            // Відновлюємо кнопку
            const button = document.querySelector(`.action-btn[data-id="${appointmentId}"][data-action="${status === 'confirmed' ? 'confirm' : status === 'cancelled' ? 'cancel' : 'complete'}"]`);
            
            if (button) {
                button.innerHTML = status === 'confirmed' ? '✓ Підтвердити' : 
                                  status === 'cancelled' ? '❌ Скасувати' : 
                                  '✓ Виконано';
                button.disabled = false;
            }
        }
    },
    
    // Видалення запису
    async deleteAppointment(appointmentId) {
        // Запит на підтвердження
        if (!confirm('Ви впевнені, що хочете видалити цей запис?')) return;
        
        try {
            // Показуємо спінер завантаження
            const button = document.querySelector(`.action-btn[data-id="${appointmentId}"][data-action="delete"]`);
            
            if (button) {
                button.innerHTML = `<div class="btn-loader"></div>`;
                button.disabled = true;
            }
            
            // Видалення запису
            await apiClient.deleteAppointment(appointmentId);
            
            // Показуємо повідомлення про успіх
            Toast.success('Запис успішно видалено.');
            
            // Оновлюємо список записів
            await this.loadAppointmentsForSelectedDate();
        } catch (error) {
            console.error('Помилка видалення запису:', error);
            Toast.error(`Не вдалося видалити запис. ${error.message}`);
            
            // Відновлюємо кнопку
            const button = document.querySelector(`.action-btn[data-id="${appointmentId}"][data-action="delete"]`);
            
            if (button) {
                button.innerHTML = '🗑️ Видалити';
                button.disabled = false;
            }
        }
    },
    
    // Отримання записів за період (для календаря)
    async getAppointmentsByPeriod(startDate, endDate) {
        try {
            // Форматування дат для API
            const formattedStartDate = startDate instanceof Date ? 
                this.formatDateForAPI(startDate) : startDate;
            
            const formattedEndDate = endDate instanceof Date ? 
                this.formatDateForAPI(endDate) : endDate;
            
            // Отримання записів через API
            return await apiClient.getAppointmentsByPeriod(formattedStartDate, formattedEndDate);
        } catch (error) {
            console.error('Помилка отримання записів за період:', error);
            return [];
        }
    },
    
    // Форматування дати для API
    formatDateForAPI(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },
    
    // Форматування часу
    formatTime(date) {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },
    
    // Форматування валюти
    formatCurrency(amount) {
        return new Intl.NumberFormat('uk-UA', {
            style: 'currency',
            currency: 'UAH',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
};