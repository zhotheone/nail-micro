// Модуль для роботи з формами
const Forms = {
    // Ініціалізація форм
    init() {
        // Ініціалізація форми запису
        this.initBookingForm();
        
        // Ініціалізація форми редагування запису
        this.initEditAppointmentForm();
        
        // Ініціалізація форми клієнта
        this.initClientForm();
        
        // Ініціалізація форми процедури
        this.initProcedureForm();
    },
    
    // Ініціалізація форми запису
    initBookingForm() {
        const form = document.getElementById('booking-form');
        
        if (!form) return;
        
        // Обробник зміни дати - оновлення доступних часів
        const dateInput = document.getElementById('booking-date');
        if (dateInput) {
            dateInput.addEventListener('change', () => {
                this.updateAvailableTimeSlots();
            });
            
            // Також оновлюємо слоти при зміні процедури (бо змінюється тривалість)
            const procedureSelect = document.getElementById('booking-procedure-select');
            if (procedureSelect) {
                procedureSelect.addEventListener('change', () => {
                    if (dateInput.value) {
                        this.updateAvailableTimeSlots();
                    }
                    
                    // Автоматичне заповнення ціни при виборі процедури
                    const selectedProcedure = window.appState.procedures.find(p => p._id === procedureSelect.value);
                    if (selectedProcedure) {
                        document.getElementById('booking-price').value = selectedProcedure.price;
                    }
                });
            }
        }
        
        // Оновлюємо часові слоти при відкритті форми, якщо дата вже вибрана
        document.addEventListener('modalOpen', (e) => {
            if (e.detail.modalId === 'booking-modal') {
                if (dateInput && dateInput.value) {
                    this.updateAvailableTimeSlots();
                }
            }
        });
        
        // Обробник події відправки форми
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                // Блокування форми під час обробки
                this.setFormLoading(form, true);
                
                // Отримання даних форми безпосередньо з елементів
                // Виправлення: перевіряємо наявність поля id
                const idField = form.querySelector('[name="id"]');
                const appointmentId = idField ? idField.value : null;
                const clientId = form.querySelector('[name="clientId"]').value;
                const procedureId = form.querySelector('[name="procedureId"]').value;
                const dateStr = form.querySelector('[name="date"]').value;
                const timeStr = form.querySelector('[name="time"]').value;
                const price = parseFloat(form.querySelector('[name="price"]').value);
                
                // Виправлення: перевіряємо наявність поля finalPrice 
                const finalPriceField = form.querySelector('[name="finalPrice"]');
                const finalPrice = finalPriceField ? parseFloat(finalPriceField.value) : price;
                
                const status = form.querySelector('[name="status"]').value;
                const notes = form.querySelector('[name="notes"]').value;
                
                // Перевірка пошкоджених посилань і видалення тимчасових опцій
                if (clientId === 'broken') {
                    Toast.error('Будь ласка, виберіть дійсного клієнта для продовження.');
                    this.setFormLoading(form, false);
                    return;
                }
                
                if (procedureId === 'broken') {
                    Toast.error('Будь ласка, виберіть дійсну процедуру для продовження.');
                    this.setFormLoading(form, false);
                    return;
                }
                
                // Перевірка обов'язкових полів
                if (!clientId || !procedureId || !dateStr || !timeStr) {
                    Toast.error('Будь ласка, заповніть всі обов\'язкові поля для запису.');
                    this.setFormLoading(form, false);
                    return;
                }
                
                // Перевірка числових значень
                if (isNaN(price) || isNaN(finalPrice)) {
                    Toast.error('Будь ласка, вкажіть коректні значення для цін.');
                    this.setFormLoading(form, false);
                    return;
                }
                
                // Створення об'єкта дати та часу
                const dateTime = new Date(`${dateStr}T${timeStr}`);
                
                if (isNaN(dateTime.getTime())) {
                    Toast.error('Невірний формат дати або часу.');
                    this.setFormLoading(form, false);
                    return;
                }
                
                // Створення об'єкта запису
                const appointmentData = {
                    clientId,
                    procedureId,
                    time: dateTime.toISOString(),
                    price,
                    finalPrice: finalPrice || price,
                    status,
                    notes
                };
                
                console.log('Дані запису:', appointmentData);
                
                let result;
                
                if (appointmentId) {
                    // Оновлення існуючого запису
                    console.log('Оновлюємо існуючий запис ID:', appointmentId);
                    result = await apiClient.updateAppointment(appointmentId, appointmentData);
                    Toast.success('Запис успішно оновлено.');
                    Modals.close('edit-appointment-modal');
                } else {
                    // Створення нового запису
                    console.log('Створюємо новий запис');
                    result = await apiClient.createAppointment(appointmentData);
                    Toast.success('Запис успішно створено.');
                    Modals.close('booking-modal');
                }
                
                // Оновлення списку записів
                Appointments.loadAppointmentsForSelectedDate();
                
                // Розблокування форми
                this.setFormLoading(form, false);
            } catch (error) {
                console.error('Помилка збереження запису:', error);
                Toast.error('Не вдалося зберегти запис: ' + error.message);
                this.setFormLoading(form, false);
            }
        });
    },

    // Оновлений метод для завантаження доступних часових слотів
    async updateAvailableTimeSlots() {
        console.log('Оновлення доступних часових слотів...');
        
        const dateInput = document.getElementById('booking-date');
        const timeSelect = document.getElementById('booking-time-select');
        const procedureSelect = document.getElementById('booking-procedure-select');
        
        if (!dateInput || !timeSelect) {
            console.error('Не знайдено необхідних елементів форми');
            return;
        }
        
        try {
            // Показуємо індикатор завантаження
            timeSelect.innerHTML = '<option value="">Завантаження...</option>';
            timeSelect.disabled = true;
            
            // Отримання значення дати
            const dateValue = dateInput.value;
            if (!dateValue) {
                timeSelect.innerHTML = '<option value="">Спочатку виберіть дату</option>';
                timeSelect.disabled = true;
                return;
            }
            
            // Створення об'єкта дати
            const selectedDate = new Date(dateValue);
            
            // Отримання дня тижня (0 = неділя, 1 = понеділок, ...)
            const dayOfWeek = selectedDate.getDay();
            
            console.log('Вибраний день тижня:', dayOfWeek);
            
            // Отримання розкладу для цього дня
            const daySchedule = await Schedule.getDaySchedule(dayOfWeek);
            console.log('Отриманий розклад:', daySchedule);
            
            // Якщо немає розкладу або вихідний день
            if (!daySchedule) {
                timeSelect.innerHTML = '<option value="">Розклад не знайдено</option>';
                timeSelect.disabled = true;
                return;
            }
            
            if (daySchedule.isWeekend) {
                timeSelect.innerHTML = '<option value="">Вихідний день</option>';
                timeSelect.disabled = true;
                return;
            }
            
            // Отримання тривалості процедури
            let procedureDuration = 60; // За замовчуванням
            const selectedProcedureId = procedureSelect.value;
            if (selectedProcedureId) {
                const selectedProcedure = window.appState.procedures.find(p => p._id === selectedProcedureId);
                if (selectedProcedure) {
                    procedureDuration = selectedProcedure.timeToComplete;
                }
            }
            
            // Отримання всіх записів на вибрану дату
            const formattedDate = this.formatDateForAPI(selectedDate);
            const appointments = await apiClient.getAppointmentsByDate(formattedDate);
            
            console.log('Існуючі записи на цю дату:', appointments);
            
            // Отримання часових слотів з розкладу
            const timeTable = daySchedule.timeTable || {};
            const timeSlots = Object.values(timeTable).filter(Boolean);
            
            console.log('Доступні часові слоти:', timeSlots);
            
            // Очищення селекта
            timeSelect.innerHTML = '<option value="">Оберіть час</option>';
            
            // Якщо немає доступних слотів
            if (timeSlots.length === 0) {
                timeSelect.innerHTML = '<option value="">Немає доступних слотів</option>';
                timeSelect.disabled = true;
                return;
            }
            
            // Додавання опцій для кожного доступного часу
            for (const timeSlot of timeSlots) {
                // Розрахунок часу закінчення процедури
                const startTime = new Date(`${formattedDate}T${timeSlot}`);
                const endTime = new Date(startTime);
                endTime.setMinutes(endTime.getMinutes() + procedureDuration);
                
                // Формування часу закінчення у форматі HH:MM
                const endTimeStr = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
                
                // Перевірка доступності часу
                let isAvailable = true;
                let conflictReason = '';
                
                for (const appointment of appointments) {
                    // Пропускаємо скасовані записи
                    if (appointment.status === 'cancelled') continue;
                    
                    const appointmentStartTime = new Date(appointment.time);
                    
                    // Знаходження процедури для визначення тривалості
                    const procedure = appointment.procedureId;
                    const appDuration = procedure ? procedure.timeToComplete : 60;
                    
                    // Розрахунок часу закінчення
                    const appointmentEndTime = new Date(appointmentStartTime);
                    appointmentEndTime.setMinutes(appointmentEndTime.getMinutes() + appDuration);
                    
                    // Перевірка на перетин інтервалів
                    if (
                        (startTime < appointmentEndTime && endTime > appointmentStartTime)
                    ) {
                        isAvailable = false;
                        const clientName = appointment.clientId ? `${appointment.clientId.name} ${appointment.clientId.surName}` : 'Інший клієнт';
                        conflictReason = `Зайнято (${clientName})`;
                        break;
                    }
                }
                
                // Додавання опції
                const option = document.createElement('option');
                option.value = timeSlot;
                option.textContent = `${timeSlot} - ${endTimeStr}${isAvailable ? '' : ' • ' + conflictReason}`;
                
                // Якщо час недоступний, додаємо атрибут disabled
                if (!isAvailable) {
                    option.disabled = true;
                }
                
                timeSelect.appendChild(option);
            }
            
            // Розблокування селекта
            timeSelect.disabled = false;
        } catch (error) {
            console.error('Помилка оновлення доступних часових слотів:', error);
            timeSelect.innerHTML = '<option value="">Помилка завантаження</option>';
            timeSelect.disabled = true;
        }
    },

    // Допоміжний метод для форматування дати для API
    formatDateForAPI(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },

    // Ініціалізація форми редагування запису
    initEditAppointmentForm() {
        const form = document.getElementById('edit-appointment-form');
        
        if (!form) return;
        
        // Обробник події відправки форми
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                // Блокування форми під час обробки
                this.setFormLoading(form, true);
                
                // Отримання даних форми безпосередньо з елементів
                const appointmentId = form.querySelector('[name="id"]').value;
                const clientId = form.querySelector('[name="clientId"]').value;
                const procedureId = form.querySelector('[name="procedureId"]').value;
                const dateStr = form.querySelector('[name="date"]').value;
                const timeStr = form.querySelector('[name="time"]').value;
                const price = parseFloat(form.querySelector('[name="price"]').value);
                const finalPrice = parseFloat(form.querySelector('[name="finalPrice"]').value);
                const status = form.querySelector('[name="status"]').value;
                const notes = form.querySelector('[name="notes"]').value;
                
                // Перевірка обов'язкових полів
                if (!clientId || !procedureId || !dateStr || !timeStr) {
                    Toast.error('Будь ласка, заповніть всі обов\'язкові поля для запису.');
                    this.setFormLoading(form, false);
                    return;
                }
                
                // Перевірка числових значень
                if (isNaN(price) || isNaN(finalPrice)) {
                    Toast.error('Будь ласка, вкажіть коректні значення для цін.');
                    this.setFormLoading(form, false);
                    return;
                }
                
                // Створення об'єкта дати та часу
                const dateTime = new Date(`${dateStr}T${timeStr}`);
                
                if (isNaN(dateTime.getTime())) {
                    Toast.error('Невірний формат дати або часу.');
                    this.setFormLoading(form, false);
                    return;
                }
                
                // Створення об'єкта запису
                const appointmentData = {
                    clientId,
                    procedureId,
                    time: dateTime.toISOString(),
                    price,
                    finalPrice,
                    status,
                    notes
                };
                
                console.log('Дані запису для оновлення:', appointmentData);
                
                // Відправка запису через API
                await apiClient.updateAppointment(appointmentId, appointmentData);
                
                // Успішне оновлення
                Toast.success('Запис успішно оновлено.');
                
                // Закриття модального вікна
                Modals.close('edit-appointment-modal');
                
                // Оновлення списку записів
                Appointments.loadAppointmentsForSelectedDate();
                
                // Розблокування форми
                this.setFormLoading(form, false);
            } catch (error) {
                console.error('Помилка оновлення запису:', error);
                Toast.error('Не вдалося оновити запис. ' + error.message);
                this.setFormLoading(form, false);
            }
        });
        
        // Автоматичне заповнення ціни при виборі процедури
        const procedureSelect = document.getElementById('edit-appointment-procedure');
        procedureSelect.addEventListener('change', () => {
            const selectedProcedure = window.appState.procedures.find(p => p._id === procedureSelect.value);
            if (selectedProcedure) {
                document.getElementById('edit-appointment-price').value = selectedProcedure.price;
            }
        });
    },
    
    // Ініціалізація форми клієнта
    initClientForm() {
        const form = document.getElementById('client-form');
        
        if (!form) return;
        
        // Обробник події відправки форми
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                // Блокування форми під час обробки
                this.setFormLoading(form, true);
                
                // Отримання даних форми безпосередньо з елементів
                const nameInput = form.querySelector('[name="name"]');
                const surNameInput = form.querySelector('[name="surName"]');
                const phoneNumInput = form.querySelector('[name="phoneNum"]');
                const instagramInput = form.querySelector('[name="instagram"]');
                const trustRatingInput = form.querySelector('[name="trustRating"]');
                
                // Перевірка обов'язкових полів перед створенням об'єкта
                if (!nameInput.value || !surNameInput.value || !phoneNumInput.value) {
                    Toast.error('Будь ласка, заповніть всі обов\'язкові поля для клієнта.');
                    this.setFormLoading(form, false);
                    return;
                }
                
                // Створення об'єкта клієнта з перевірених значень
                const clientData = {
                    name: nameInput.value,
                    surName: surNameInput.value,
                    phoneNum: phoneNumInput.value,
                    instagram: instagramInput.value || '',
                    trustRating: parseInt(trustRatingInput.value) || 5
                };
                
                console.log('Дані клієнта для створення:', clientData);
                
                // Відправка клієнта через API
                await apiClient.createClient(clientData);
                
                // Успішне створення
                Toast.success('Клієнта успішно додано.');
                
                // Закриття модального вікна
                Modals.close('client-modal');
                
                // Оновлення списку клієнтів, якщо відкрита вкладка клієнтів
                if (window.appState.currentTab === 'clients') {
                    Clients.loadClients();
                }
                
                // Оновлення селектів з клієнтами
                this.loadClientSelect('booking-client-select');
                this.loadClientSelect('edit-appointment-client');
                
                // Розблокування форми
                this.setFormLoading(form, false);
            } catch (error) {
                console.error('Помилка створення клієнта:', error);
                Toast.error('Не вдалося створити клієнта. ' + error.message);
                this.setFormLoading(form, false);
            }
        });
    },
    
    // Ініціалізація форми процедури
    initProcedureForm() {
        const form = document.getElementById('procedure-form');
        
        if (!form) return;
        
        // Обробник події відправки форми
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                // Блокування форми під час обробки
                this.setFormLoading(form, true);
                
                // Отримання даних форми безпосередньо з елементів форми
                const nameInput = form.querySelector('[name="name"]');
                const priceInput = form.querySelector('[name="price"]');
                const timeToCompleteInput = form.querySelector('[name="timeToComplete"]');
                
                // Перевірка обов'язкових полів перед створенням об'єкта
                if (!nameInput.value || !priceInput.value || !timeToCompleteInput.value) {
                    Toast.error('Будь ласка, заповніть всі поля процедури.');
                    this.setFormLoading(form, false);
                    return;
                }
                
                // Перевірка числових значень
                const price = parseFloat(priceInput.value);
                const timeToComplete = parseInt(timeToCompleteInput.value);
                
                if (isNaN(price) || isNaN(timeToComplete)) {
                    Toast.error('Ціна та тривалість повинні бути числами.');
                    this.setFormLoading(form, false);
                    return;
                }
                
                // Створення об'єкта процедури з перевірених значень
                const procedureData = {
                    name: nameInput.value,
                    price: price,
                    timeToComplete: timeToComplete
                };
                
                console.log('Дані процедури для створення:', procedureData);
                
                // Відправка процедури через API
                await apiClient.createProcedure(procedureData);
                
                // Успішне створення
                Toast.success('Процедуру успішно додано.');
                
                // Закриття модального вікна
                Modals.close('procedure-modal');
                
                // Оновлення списку процедур, якщо відкрита вкладка процедур
                if (window.appState.currentTab === 'procedures') {
                    Procedures.loadProcedures();
                }
                
                // Оновлення селектів з процедурами
                this.loadProcedureSelect('booking-procedure-select');
                this.loadProcedureSelect('edit-appointment-procedure');
                
                // Розблокування форми
                this.setFormLoading(form, false);
            } catch (error) {
                console.error('Помилка створення процедури:', error);
                Toast.error('Не вдалося створити процедуру. ' + error.message);
                this.setFormLoading(form, false);
            }
        });
    },
    
    // Завантаження селекта з клієнтами
    async loadClientSelect(selectId) {
        const select = document.getElementById(selectId);
        
        if (!select) return;
        
        try {
            // Якщо клієнтів ще не завантажено, завантажуємо їх
            if (window.appState.clients.length === 0) {
                const clients = await apiClient.getClients();
                window.appState.clients = clients;
            }
            
            // Очищаємо селект
            select.innerHTML = '<option value="">Оберіть клієнта</option>';
            
            // Сортування клієнтів за алфавітом
            const sortedClients = [...window.appState.clients].sort((a, b) => {
                return `${a.name} ${a.surName}`.localeCompare(`${b.name} ${b.surName}`);
            });
            
            // Додаємо клієнтів до селекту
            sortedClients.forEach(client => {
                const option = document.createElement('option');
                option.value = client._id;
                option.textContent = `${client.name} ${client.surName}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Помилка завантаження клієнтів для селекту:', error);
            select.innerHTML = '<option value="">Помилка завантаження</option>';
        }
    },
    
    // Завантаження селекта з процедурами
    async loadProcedureSelect(selectId) {
        const select = document.getElementById(selectId);
        
        if (!select) return;
        
        try {
            // Якщо процедур ще не завантажено, завантажуємо їх
            if (window.appState.procedures.length === 0) {
                const procedures = await apiClient.getProcedures();
                window.appState.procedures = procedures;
            }
            
            // Очищаємо селект
            select.innerHTML = '<option value="">Оберіть процедуру</option>';
            
            // Сортування процедур за ціною
            const sortedProcedures = [...window.appState.procedures].sort((a, b) => {
                return a.price - b.price;
            });
            
            // Додаємо процедури до селекту
            sortedProcedures.forEach(procedure => {
                const option = document.createElement('option');
                option.value = procedure._id;
                
                // Форматування тривалості
                let duration = '';
                if (procedure.timeToComplete < 60) {
                    duration = `${procedure.timeToComplete} хв`;
                } else {
                    const hours = Math.floor(procedure.timeToComplete / 60);
                    const minutes = procedure.timeToComplete % 60;
                    
                    if (hours > 0) {
                        duration = `${hours} год`;
                        if (minutes > 0) {
                            duration += ` ${minutes} хв`;
                        }
                    } else {
                        duration = `${minutes} хв`;
                    }
                }
                
                option.textContent = `${procedure.name} (${procedure.price} грн, ${duration})`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Помилка завантаження процедур для селекту:', error);
            select.innerHTML = '<option value="">Помилка завантаження</option>';
        }
    },
    
    // Встановлення стану завантаження для форми
    setFormLoading(form, isLoading) {
        const submitButton = form.querySelector('button[type="submit"]');
        
        if (isLoading) {
            // Блокуємо кнопку та додаємо клас loading
            submitButton.disabled = true;
            submitButton.classList.add('loading');
            
            // Блокуємо всі поля форми
            form.querySelectorAll('input, select, textarea').forEach(field => {
                field.disabled = true;
            });
        } else {
            // Розблоковуємо кнопку та прибираємо клас loading
            submitButton.disabled = false;
            submitButton.classList.remove('loading');
            
            // Розблоковуємо всі поля форми
            form.querySelectorAll('input, select, textarea').forEach(field => {
                field.disabled = false;
            });
        }
    },
    
    // Форматування дати для input
    formatDateForInput(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },
    
    // Форматування часу для input
    formatTimeForInput(date) {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },
    
    // Перевірка, чи та сама дата
    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
};