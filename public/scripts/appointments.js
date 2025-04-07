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
            
            // Перевіряємо, чи це вихідний день
            const dayOfWeek = window.appState.selectedDate.getDay();
            const isWeekend = await this.checkIfWeekend(dayOfWeek);
            
            if (isWeekend) {
                // Показуємо повідомлення про вихідний день
                appointmentsList.innerHTML = `
                    <div class="weekend-message">
                        <i class="fas fa-umbrella-beach"></i>
                        <h3>Вихідний день 😌</h3>
                        <p>Сьогодні вихідний за розкладом. Відпочиваємо!</p>
                    </div>
                `;
                window.appState.loading.appointments = false;
                return;
            }
            
            // Форматування дати для API
            const formattedDate = this.formatDateForAPI(window.appState.selectedDate);
            
            console.log(`Запит записів на дату: ${formattedDate}`);
            console.log(`Рік: ${window.appState.selectedDate.getFullYear()}`);
            
            try {
                // Отримання записів через API
                const appointments = await apiClient.getAppointmentsByDate(formattedDate);
                
                // Перевірка, чи немає записів і чи можуть бути записи з іншим роком
                if (appointments.length === 0) {
                    // Спробуємо знайти записи на ту ж дату, але з різними роками
                    try {
                        const day = window.appState.selectedDate.getDate();
                        const month = window.appState.selectedDate.getMonth() + 1;
                        
                        // Використовуємо новий метод API для пошуку за днем/місяцем
                        const dayMonthAppointments = await apiClient.searchAppointmentsByDayMonth(day, month);
                        
                        if (dayMonthAppointments.length > 0) {
                            // Якщо знайдено записи з іншими роками, показуємо підказку
                            const years = [...new Set(dayMonthAppointments.map(app => new Date(app.time).getFullYear()))].sort();
                            
                            if (years.length > 0) {
                                const yearsText = years.join(', ');
                                Toast.info(`Знайдено записи на ${day}.${month} в інших роках: ${yearsText}. Виберіть потрібний рік у селекторі вгорі.`, 'Підказка', { duration: 7000 });
                            }
                        }
                    } catch (error) {
                        // Ігноруємо помилку, просто продовжуємо
                        console.log('Пошук записів за днем і місяцем не вдався:', error);
                    }
                }
                
                // Перевірка на валідність записів та виведення попереджень
                let hasInvalidData = false;
                
                // Фільтрація і перевірка даних
                const validatedAppointments = appointments.map(appointment => {
                    // Визначаємо, чи є проблеми з ID клієнта або процедури
                    // але НЕ фільтруємо записи, а просто помічаємо проблеми
                    
                    // Перевірка на правильність ID клієнта
                    if (!appointment.clientId || typeof appointment.clientId !== 'object') {
                        hasInvalidData = true;
                        console.warn(`Запис #${appointment._id} має неправильний ID клієнта:`, appointment.clientId);
                    }
                    
                    // Перевірка на правильність ID процедури
                    if (!appointment.procedureId || typeof appointment.procedureId !== 'object') {
                        hasInvalidData = true;
                        console.warn(`Запис #${appointment._id} має неправильний ID процедури:`, appointment.procedureId);
                    }
                    
                    return appointment;
                });
                
                window.appState.appointments = validatedAppointments;
                
                // Показуємо попередження, якщо є некоректні дані
                if (hasInvalidData) {
                    Toast.warning('Деякі записи мають неправильні посилання. Перевірте дані.', 'Увага', { duration: 5000 });
                }
                
                // Рендерінг списку записів
                this.renderAppointmentsList();
            } catch (error) {
                console.error('Помилка обробки даних записів:', error);
                Toast.error('Не вдалося обробити дані записів: ' + error.message);
                
                // Якщо є помилка парсингу даних, все одно показуємо дані як є
                window.appState.appointments = [];
                this.renderAppointmentsList();
            }
            
            // Оновлюємо стан завантаження
            window.appState.loading.appointments = false;
        } catch (error) {
            console.error('Помилка завантаження записів:', error);
            appointmentsList.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Помилка завантаження</h3>
                    <p>Не вдалося завантажити записи: ${error.message}</p>
                </div>
            `;
            window.appState.loading.appointments = false;
        }
    },
    
    // Перевірка, чи обраний день - вихідний
    async checkIfWeekend(dayOfWeek) {
        try {
            const daySchedule = await Schedule.getDaySchedule(dayOfWeek);
            return !daySchedule || daySchedule.isWeekend;
        } catch (error) {
            console.error('Помилка перевірки вихідного дня:', error);
            return false;
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
        sortedAppointments.forEach((appointment, index) => {
            const appointmentTime = new Date(appointment.time);
            
            // Перевірка наявності даних клієнта
            const hasValidClient = appointment.clientId && typeof appointment.clientId === 'object';
            let clientName = 'Клієнт не знайдено';
            let clientWarning = '';
            
            if (hasValidClient) {
                clientName = `${appointment.clientId.name || ''} ${appointment.clientId.surName || ''}`.trim();
                if (!clientName) {
                    clientName = 'Ім\'я клієнта відсутнє';
                }
            } else {
                clientWarning = `<div class="appointment-warning">
                    <i class="fas fa-exclamation-triangle"></i> Помилка: некоректний ID клієнта
                </div>`;
            }
            
            // Перевірка наявності даних процедури
            const hasValidProcedure = appointment.procedureId && typeof appointment.procedureId === 'object';
            let procedureName = 'Процедура не знайдена';
            let procedureWarning = '';
            let durationMinutes = 60; // Тривалість за замовчуванням
            
            if (hasValidProcedure) {
                procedureName = appointment.procedureId.name || 'Назва процедури відсутня';
                durationMinutes = appointment.procedureId.timeToComplete || 60;
            } else {
                procedureWarning = `<div class="appointment-warning">
                    <i class="fas fa-exclamation-triangle"></i> Помилка: некоректний ID процедури
                </div>`;
            }
            
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
                default:
                    statusText = 'Невідомий';
                    statusClass = 'status-pending';
            }
            
            // Форматування ціни
            const price = appointment.finalPrice || appointment.price || 0;
            const formattedPrice = this.formatCurrency(price);
            
            // Створення елемента для запису
            const appointmentElement = document.createElement('div');
            appointmentElement.className = `appointment-item ${appointment.status || 'pending'}`;
            appointmentElement.setAttribute('data-delay', index); // Для анімації
            appointmentElement.innerHTML = `
                <div class="appointment-time">
                    <i class="fas fa-clock"></i>
                    ${startTimeStr} - ${endTimeStr}
                </div>
                <div class="appointment-client">
                    <i class="fas fa-user"></i>
                    ${clientName}
                </div>
                ${clientWarning}
                <div class="appointment-service">${procedureName} • ${formattedPrice}</div>
                ${procedureWarning}
                <div><span class="status ${statusClass}">${statusText}</span></div>
                ${appointment.notes ? `<div class="appointment-notes">${appointment.notes}</div>` : ''}
                <div class="appointment-actions">
                    ${appointment.status === 'pending' ? `<button class="action-btn btn-confirm" data-id="${appointment._id}" data-action="confirm"><i class="fas fa-check"></i> Підтвердити</button>` : ''}
                    ${appointment.status === 'confirmed' ? `<button class="action-btn btn-confirm" data-id="${appointment._id}" data-action="complete"><i class="fas fa-check-double"></i> Виконано</button>` : ''}
                    <button class="action-btn btn-edit" data-id="${appointment._id}" data-action="edit"><i class="fas fa-edit"></i> Редагувати</button>
                    ${appointment.status !== 'cancelled' ? `<button class="action-btn btn-cancel" data-id="${appointment._id}" data-action="cancel"><i class="fas fa-ban"></i> Скасувати</button>` : ''}
                    ${appointment.status === 'cancelled' ? `<button class="action-btn btn-cancel" data-id="${appointment._id}" data-action="delete"><i class="fas fa-trash"></i> Видалити</button>` : ''}
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
                button.innerHTML = status === 'confirmed' ? '<i class="fas fa-check"></i> Підтвердити' : 
                                  status === 'cancelled' ? '<i class="fas fa-ban"></i> Скасувати' : 
                                  '<i class="fas fa-check-double"></i> Виконано';
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
                button.innerHTML = '<i class="fas fa-trash"></i> Видалити';
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