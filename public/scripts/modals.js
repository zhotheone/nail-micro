// Модуль для роботи з модальними вікнами
const Modals = {
    activeModal: null,
    
    // Ініціалізація модальних вікон
    init() {
        // Додавання обробників для закриття модальних вікон
        this.setupCloseHandlers();
        
        // Блокування скролу при відкритті модального вікна
        this.setupScrollLock();
    },
    
    // Відкриття модального вікна
    open(modalId) {
        const modal = document.getElementById(modalId);
        
        if (!modal) {
            console.error(`Модальне вікно з ID '${modalId}' не знайдено`);
            return;
        }
        
        // Закриття активного модального вікна, якщо воно є
        if (this.activeModal) {
            this.close(this.activeModal);
        }
        
        // Відкриття модального вікна
        modal.classList.add('active');
        this.activeModal = modal;
        
        // Додавання класу до body для блокування скролу
        document.body.classList.add('modal-open');
        
        // Фокус на першому полі форми, якщо є
        setTimeout(() => {
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
        
        // Подія відкриття модального вікна
        this.triggerModalEvent('modalOpen', modal.id);
    },
    
    // Закриття модального вікна
    close(modal) {
        if (typeof modal === 'string') {
            modal = document.getElementById(modal);
        }
        
        if (!modal) return;
        
        // Закриття модального вікна
        modal.classList.remove('active');
        
        // Видалення класу блокування скролу, якщо це було активне модальне вікно
        if (this.activeModal === modal) {
            document.body.classList.remove('modal-open');
            this.activeModal = null;
        }
        
        // Подія закриття модального вікна
        this.triggerModalEvent('modalClose', modal.id);
    },
    
    // Подія модального вікна
    triggerModalEvent(eventName, modalId) {
        const event = new CustomEvent(eventName, { 
            detail: { modalId } 
        });
        document.dispatchEvent(event);
    },
    
    // Налаштування обробників закриття
    setupCloseHandlers() {
        // Закриття модального вікна по кнопці закриття
        document.querySelectorAll('.modal-close').forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                this.close(modal);
            });
        });
        
        // Закриття модального вікна по кліку на фон
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.close(modal);
                }
            });
        });
        
        // Закриття модального вікна по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close(this.activeModal);
            }
        });
    },
    
    // Блокування скролу при відкритті модального вікна
    setupScrollLock() {
        // Додавання CSS-класу для body
        const style = document.createElement('style');
        style.textContent = `
            body.modal-open {
                overflow: hidden;
                padding-right: var(--scrollbar-width, 0px);
            }
        `;
        document.head.appendChild(style);
        
        // Розрахунок ширини скролбара
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
    },
    
    // Відкриття модального вікна для запису
    async openBookingModal() {
        try {
            // Скидання форми
            document.getElementById('booking-form').reset();
            
            // Завантаження клієнтів та процедур для селектів
            await Forms.loadClientSelect('booking-client-select');
            await Forms.loadProcedureSelect('booking-procedure-select');
            
            // Встановлення поточної дати
            const dateInput = document.querySelector('#booking-form [name="date"]');
            dateInput.value = Forms.formatDateForInput(window.appState.selectedDate);
            
            // Відкриття модального вікна
            this.open('booking-modal');
        } catch (error) {
            console.error('Помилка при відкритті форми запису:', error);
            Toast.error('Не вдалося завантажити дані для форми запису.');
        }
    },
    
    // Відкриття модального вікна для редагування запису
    async openEditAppointmentModal(appointmentId) {
        try {
            // Показуємо індикатор завантаження
            const form = document.getElementById('edit-appointment-form');
            Forms.setFormLoading(form, true);
            
            // Отримання запису за ID
            const appointment = await apiClient.getAppointment(appointmentId);
            
            // Заповнення форми даними запису
            document.getElementById('edit-appointment-id').value = appointment._id;
            
            // Завантаження селектів клієнтів та процедур
            await Forms.loadClientSelect('edit-appointment-client');
            await Forms.loadProcedureSelect('edit-appointment-procedure');
            
            // Встановлення вибраних значень з перевіркою на коректність
            const clientSelect = document.getElementById('edit-appointment-client');
            const procedureSelect = document.getElementById('edit-appointment-procedure');
            
            // Перевірка на правильність ID клієнта
            if (appointment.clientId && typeof appointment.clientId === 'object' && appointment.clientId._id) {
                clientSelect.value = appointment.clientId._id;
                
                // Якщо вибраного клієнта немає в списку, додаємо його
                if (clientSelect.value !== appointment.clientId._id) {
                    const option = document.createElement('option');
                    option.value = appointment.clientId._id;
                    option.textContent = `${appointment.clientId.name || ''} ${appointment.clientId.surName || ''} (ID: ${appointment.clientId._id})`;
                    clientSelect.appendChild(option);
                    clientSelect.value = appointment.clientId._id;
                    
                    // Додаємо попередження про проблеми з клієнтом
                    Toast.warning('Можливі проблеми з даними клієнта. Будь ласка, перевірте.', 'Увага');
                }
            } else {
                // Якщо клієнт не знайдений, створюємо порожню опцію
                const option = document.createElement('option');
                option.value = "broken";
                option.textContent = "⚠️ Клієнт не знайдений";
                clientSelect.appendChild(option);
                clientSelect.value = "broken";
                
                Toast.warning('Клієнт для цього запису не знайдений. Оберіть нового клієнта.', 'Увага');
            }
            
            // Перевірка на правильність ID процедури
            if (appointment.procedureId && typeof appointment.procedureId === 'object' && appointment.procedureId._id) {
                procedureSelect.value = appointment.procedureId._id;
                
                // Якщо вибраної процедури немає в списку, додаємо її
                if (procedureSelect.value !== appointment.procedureId._id) {
                    const option = document.createElement('option');
                    option.value = appointment.procedureId._id;
                    option.textContent = `${appointment.procedureId.name || 'Невідома процедура'} (ID: ${appointment.procedureId._id})`;
                    procedureSelect.appendChild(option);
                    procedureSelect.value = appointment.procedureId._id;
                    
                    // Додаємо попередження про проблеми з процедурою
                    Toast.warning('Можливі проблеми з даними процедури. Будь ласка, перевірте.', 'Увага');
                }
            } else {
                // Якщо процедура не знайдена, створюємо порожню опцію
                const option = document.createElement('option');
                option.value = "broken";
                option.textContent = "⚠️ Процедура не знайдена";
                procedureSelect.appendChild(option);
                procedureSelect.value = "broken";
                
                Toast.warning('Процедура для цього запису не знайдена. Оберіть нову процедуру.', 'Увага');
            }
            
            // Встановлення дати та часу
            const appointmentDate = new Date(appointment.time);
            document.getElementById('edit-appointment-date').value = Forms.formatDateForInput(appointmentDate);
            document.getElementById('edit-appointment-time').value = Forms.formatTimeForInput(appointmentDate);
            
            // Встановлення цін та статусу
            document.getElementById('edit-appointment-price').value = appointment.price || 0;
            document.getElementById('edit-appointment-finalPrice').value = appointment.finalPrice || appointment.price || 0;
            document.getElementById('edit-appointment-status').value = appointment.status || 'pending';
            document.getElementById('edit-appointment-notes').value = appointment.notes || '';
            
            // Вимикаємо індикатор завантаження
            Forms.setFormLoading(form, false);
            
            // Відкриття модального вікна
            this.open('edit-appointment-modal');
        } catch (error) {
            console.error('Помилка відкриття форми редагування запису:', error);
            Toast.error('Не вдалося завантажити дані для редагування запису.');
            
            // Вимикаємо індикатор завантаження
            Forms.setFormLoading(document.getElementById('edit-appointment-form'), false);
        }
    },
    
    // Відкриття модального вікна для запису клієнта
    async openBookingModalForClient(clientId) {
        try {
            // Скидання форми
            document.getElementById('booking-form').reset();
            
            // Завантаження клієнтів та процедур для селектів
            await Forms.loadClientSelect('booking-client-select');
            await Forms.loadProcedureSelect('booking-procedure-select');
            
            // Встановлення вибраного клієнта
            document.getElementById('booking-client-select').value = clientId;
            
            // Встановлення поточної дати
            const dateInput = document.querySelector('#booking-form [name="date"]');
            dateInput.value = Forms.formatDateForInput(window.appState.selectedDate);
            
            // Відкриття модального вікна
            this.open('booking-modal');
        } catch (error) {
            console.error('Помилка при відкритті форми запису для клієнта:', error);
            Toast.error('Не вдалося завантажити дані для форми запису.');
        }
    },
    
    // Відкриття модального вікна для додавання клієнта
    openClientModal() {
        // Скидання форми
        document.getElementById('client-form').reset();
        
        // Відкриття модального вікна
        this.open('client-modal');
    },
    
    // Відкриття модального вікна для додавання процедури
    openProcedureModal() {
        // Скидання форми
        document.getElementById('procedure-form').reset();
        
        // Відкриття модального вікна
        this.open('procedure-modal');
    }
};