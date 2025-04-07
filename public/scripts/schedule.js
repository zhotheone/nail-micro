// Модуль для роботи з розкладом
const Schedule = {
    // Поточний розклад
    schedule: [],
    
    // Ініціалізація модуля розкладу
    init() {
        // Завантаження розкладу при ініціалізації
        this.loadSchedule();
        
        // Додавання кнопки для керування розкладом
        this.addScheduleButton();
    },
    
    // Додавання кнопки для керування розкладом
    addScheduleButton() {
        if (document.getElementById('schedule-manage-btn')) return;
        
        const calendarHeader = document.querySelector('.calendar-header');
        if (!calendarHeader) return;
        
        const scheduleButton = document.createElement('button');
        scheduleButton.id = 'schedule-manage-btn';
        scheduleButton.className = 'btn-primary schedule-btn';
        scheduleButton.innerHTML = '<i class="fas fa-clock"></i> Редагувати розклад';
        
        scheduleButton.addEventListener('click', () => {
            this.openScheduleModal();
        });
        
        calendarHeader.appendChild(scheduleButton);
    },
    
    // Завантаження розкладу
    async loadSchedule() {
        try {
            const schedule = await apiClient.getSchedule();
            this.schedule = schedule;
            return schedule;
        } catch (error) {
            console.error('Помилка завантаження розкладу:', error);
            Toast.error('Не вдалося завантажити розклад.');
            return [];
        }
    },
    
    // Отримання розкладу для конкретного дня тижня
    async getDaySchedule(dayOfWeek) {
        try {
            // Переконуємося, що dayOfWeek - число
            dayOfWeek = parseInt(dayOfWeek);
            if (isNaN(dayOfWeek)) {
                console.error('Некоректний день тижня:', dayOfWeek);
                return null;
            }
            
            // Перевіряємо, чи є розклад у кеші
            const cachedSchedule = this.schedule.find(s => s.dayOfWeek === dayOfWeek);
            if (cachedSchedule) return cachedSchedule;
            
            // Якщо немає в кеші, завантажуємо з сервера
            const daySchedule = await apiClient.getDaySchedule(dayOfWeek);
            
            // Оновлюємо кеш
            if (daySchedule) {
                const index = this.schedule.findIndex(s => s.dayOfWeek === dayOfWeek);
                if (index !== -1) {
                    this.schedule[index] = daySchedule;
                } else {
                    this.schedule.push(daySchedule);
                }
            }
            
            return daySchedule;
        } catch (error) {
            console.error(`Помилка отримання розкладу для дня тижня ${dayOfWeek}:`, error);
            return null;
        }
    },
    
    // Перевірка доступності часу для запису
    async checkTimeAvailability(date, startTime, endTime) {
        try {
            // Отримуємо день тижня
            const dayOfWeek = date.getDay();
            
            // Отримуємо розклад для цього дня
            const daySchedule = await this.getDaySchedule(dayOfWeek);
            
            // Якщо день вихідний, він недоступний
            if (!daySchedule || daySchedule.isWeekend) {
                return {
                    available: false,
                    message: 'Цей день є вихідним'
                };
            }
            
            // Перевіряємо, чи входить обраний час в робочий графік
            const timeSlots = Object.values(daySchedule.timeTable).filter(Boolean);
            if (timeSlots.length === 0) {
                return {
                    available: false,
                    message: 'Немає доступних часових слотів для цього дня'
                };
            }
            
            // Перевіряємо, чи є у розкладі обраний час
            const startHour = parseInt(startTime.split(':')[0]);
            const startMinute = parseInt(startTime.split(':')[1]);
            
            let timeInSchedule = false;
            for (const timeSlot of timeSlots) {
                const slotHour = parseInt(timeSlot.split(':')[0]);
                const slotMinute = parseInt(timeSlot.split(':')[1]);
                
                if (startHour === slotHour && startMinute === slotMinute) {
                    timeInSchedule = true;
                    break;
                }
            }
            
            if (!timeInSchedule) {
                return {
                    available: false,
                    message: 'Обраний час не відповідає розкладу. Доступні години: ' + timeSlots.join(', ')
                };
            }
            
            // Отримуємо всі записи на вибрану дату
            const formattedDate = this.formatDateForAPI(date);
            const appointments = await apiClient.getAppointmentsByDate(formattedDate);
            
            // Перевіряємо, чи не перетинається час з існуючими записами
            const startDateTime = new Date(`${formattedDate}T${startTime}`);
            const endDateTime = new Date(`${formattedDate}T${endTime}`);
            
            for (const appointment of appointments) {
                const appointmentStartTime = new Date(appointment.time);
                
                // Знаходження процедури для визначення тривалості
                const procedure = appointment.procedureId;
                const durationMinutes = procedure ? procedure.timeToComplete : 60;
                
                // Розрахунок часу закінчення
                const appointmentEndTime = new Date(appointmentStartTime);
                appointmentEndTime.setMinutes(appointmentEndTime.getMinutes() + durationMinutes);
                
                // Перевірка на перетин інтервалів
                if (
                    (startDateTime < appointmentEndTime && endDateTime > appointmentStartTime) &&
                    appointment.status !== 'cancelled'
                ) {
                    return {
                        available: false,
                        message: 'Обраний час перетинається з існуючим записом'
                    };
                }
            }
            
            // Якщо всі перевірки пройдені, час доступний
            return {
                available: true,
                message: 'Час доступний для запису'
            };
        } catch (error) {
            console.error('Помилка перевірки доступності часу:', error);
            return {
                available: false,
                message: 'Помилка перевірки доступності. Спробуйте інший час.'
            };
        }
    },
    
    // Форматування дати для API
    formatDateForAPI(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },
    
    // Відкриття модального вікна для редагування розкладу
    async openScheduleModal() {
        try {
            // Створення модального вікна, якщо його ще немає
            if (!document.getElementById('schedule-modal')) {
                this.createScheduleModal();
            }
            
            // Завантаження актуального розкладу
            const schedule = await this.loadSchedule();
            
            // Заповнення форми даними розкладу
            this.populateScheduleForm(schedule);
            
            // Відкриття модального вікна
            Modals.open('schedule-modal');
        } catch (error) {
            console.error('Помилка відкриття форми редагування розкладу:', error);
            Toast.error('Не вдалося завантажити дані для редагування розкладу.');
        }
    },
    
    // Створення модального вікна для редагування розкладу
    createScheduleModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'schedule-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">Редагування розкладу</div>
                    <button class="modal-close">&times;</button>
                </div>
                <div id="schedule-form-container">
                    <div class="schedule-tabs">
                        <button class="schedule-tab active" data-day="1">Пн</button>
                        <button class="schedule-tab" data-day="2">Вт</button>
                        <button class="schedule-tab" data-day="3">Ср</button>
                        <button class="schedule-tab" data-day="4">Чт</button>
                        <button class="schedule-tab" data-day="5">Пт</button>
                        <button class="schedule-tab" data-day="6">Сб</button>
                        <button class="schedule-tab" data-day="0">Нд</button>
                    </div>
                    
                    <div class="schedule-content">
                        <!-- Тут будуть відображатися форми для кожного дня -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Додавання обробника для вкладок днів тижня
        const tabs = modal.querySelectorAll('.schedule-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Активація вкладки
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Показ форми для відповідного дня
                const dayOfWeek = parseInt(tab.dataset.day);
                this.showDayScheduleForm(dayOfWeek);
            });
        });
        
        // Додавання обробника для закриття модального вікна
        modal.querySelector('.modal-close').addEventListener('click', () => {
            Modals.close('schedule-modal');
        });
        
        // Закриття по кліку на фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                Modals.close('schedule-modal');
            }
        });
    },
    
    // Заповнення форми даними розкладу
    populateScheduleForm(schedule) {
        // Ініціалізуємо форми для всіх днів тижня
        for (let day = 0; day <= 6; day++) {
            this.createDayScheduleForm(day);
        }
        
        // Заповнюємо форми даними
        schedule.forEach(daySchedule => {
            const dayOfWeek = daySchedule.dayOfWeek;
            const form = document.getElementById(`schedule-form-${dayOfWeek}`);
            
            if (form) {
                // Встановлюємо стан вихідного дня
                const isWeekendCheckbox = form.querySelector('.is-weekend-checkbox');
                if (isWeekendCheckbox) {
                    isWeekendCheckbox.checked = daySchedule.isWeekend;
                    
                    // Оновлюємо стан полів часу
                    const timeContainer = form.querySelector('.time-slots-container');
                    if (timeContainer) {
                        timeContainer.style.display = daySchedule.isWeekend ? 'none' : 'block';
                    }
                }
                
                // Заповнюємо поля часу
                const timeSlots = daySchedule.timeTable;
                if (timeSlots) {
                    Object.keys(timeSlots).forEach(slotIndex => {
                        const timeInput = form.querySelector(`input[name="timeSlot${slotIndex}"]`);
                        if (timeInput && timeSlots[slotIndex]) {
                            timeInput.value = timeSlots[slotIndex];
                        }
                    });
                }
            }
        });
        
        // Показуємо форму для понеділка за замовчуванням
        this.showDayScheduleForm(1);
    },
    
    // Створення форми для дня тижня
    createDayScheduleForm(dayOfWeek) {
        // Виправлення апострофу у назві дня тижня
        const daysOfWeek = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота'];
        const dayName = daysOfWeek[dayOfWeek];
        
        const formHTML = `
            <form id="schedule-form-${dayOfWeek}" class="day-schedule-form" data-day="${dayOfWeek}">
                <h3 class="day-title">${dayName}</h3>
                <input type="hidden" name="dayOfWeek" value="${dayOfWeek}">
                
                <div class="form-group weekend-toggle">
                    <label class="form-check">
                        <input type="checkbox" class="form-check-input is-weekend-checkbox" name="isWeekend">
                        <span class="form-check-label">Вихідний день</span>
                    </label>
                </div>
                
                <div class="time-slots-container">
                    <h3>Часові слоти</h3>
                    <p class="time-hint">Вкажіть час початку процедур</p>
                    
                    <div class="time-slots">
                        <div class="form-group">
                            <label class="form-label">Слот 1</label>
                            <input type="time" class="form-control" name="timeSlot1">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Слот 2</label>
                            <input type="time" class="form-control" name="timeSlot2">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Слот 3</label>
                            <input type="time" class="form-control" name="timeSlot3">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Слот 4</label>
                            <input type="time" class="form-control" name="timeSlot4">
                        </div>
                    </div>
                </div>
                
                <button type="button" class="btn-primary save-schedule-btn" data-day="${dayOfWeek}">
                    <span class="btn-text">Зберегти розклад</span>
                    <span class="btn-loader"></span>
                </button>
            </form>
        `;
        
        const container = document.querySelector('.schedule-content');
        
        // Перевіряємо, чи не існує вже форма
        if (!document.getElementById(`schedule-form-${dayOfWeek}`)) {
            // Додаємо форму в контейнер
            container.insertAdjacentHTML('beforeend', formHTML);
            
            // Додаємо обробники подій
            const form = document.getElementById(`schedule-form-${dayOfWeek}`);
            
            // Обробник зміни стану вихідного дня
            const isWeekendCheckbox = form.querySelector('.is-weekend-checkbox');
            isWeekendCheckbox.addEventListener('change', function() {
                const timeContainer = form.querySelector('.time-slots-container');
                timeContainer.style.display = this.checked ? 'none' : 'block';
            });
            
            // Обробник кнопки збереження
            const saveButton = form.querySelector('.save-schedule-btn');
            saveButton.addEventListener('click', () => {
                const dayToSave = parseInt(saveButton.getAttribute('data-day'));
                this.saveScheduleForDay(dayToSave);
            });
        }
        
        // Ховаємо всі форми
        document.querySelectorAll('.day-schedule-form').forEach(form => {
            form.style.display = 'none';
        });
    },
    
    // Збереження розкладу для конкретного дня
    async saveScheduleForDay(dayOfWeek) {
        try {
            // Отримуємо форму для дня
            const form = document.getElementById(`schedule-form-${dayOfWeek}`);
            if (!form) {
                throw new Error('Форму для обраного дня не знайдено');
            }
            
            // Блокування інтерфейсу під час обробки
            const saveButton = form.querySelector('.save-schedule-btn');
            saveButton.disabled = true;
            saveButton.classList.add('loading');
            
            // Отримання даних форми
            const isWeekendCheckbox = form.querySelector('.is-weekend-checkbox');
            const isWeekend = isWeekendCheckbox.checked;
            
            // Створення об'єкта розкладу
            const scheduleData = {
                dayOfWeek,
                isWeekend,
                timeTable: {}
            };
            
            // Заповнення часових слотів
            if (!isWeekend) {
                for (let i = 1; i <= 4; i++) {
                    const timeInput = form.querySelector(`input[name="timeSlot${i}"]`);
                    if (timeInput && timeInput.value) {
                        scheduleData.timeTable[i] = timeInput.value;
                    }
                }
            }
            
            // Оновлення розкладу через API
            await apiClient.createOrUpdateSchedule(dayOfWeek, scheduleData);
            
            // Успішне оновлення
            Toast.success(`Розклад на ${daysOfWeek[dayOfWeek]} успішно оновлено.`);
            
            // Оновлення кешу розкладу
            await this.loadSchedule();
            
            // Розблокування інтерфейсу
            saveButton.disabled = false;
            saveButton.classList.remove('loading');
        } catch (error) {
            console.error('Помилка оновлення розкладу:', error);
            Toast.error('Не вдалося оновити розклад. ' + error.message);
            
            // Розблокування інтерфейсу в разі помилки
            const saveButton = document.querySelector(`#schedule-form-${dayOfWeek} .save-schedule-btn`);
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.classList.remove('loading');
            }
        }
    },
    
    // Показ форми для конкретного дня
    showDayScheduleForm(dayOfWeek) {
        // Ховаємо всі форми
        document.querySelectorAll('.day-schedule-form').forEach(form => {
            form.style.display = 'none';
        });
        
        // Показуємо форму для вибраного дня
        const form = document.getElementById(`schedule-form-${dayOfWeek}`);
        if (form) {
            form.style.display = 'block';
        }
    }
};

// Назви днів тижня (виправлено апостроф)
const daysOfWeek = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота'];

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    // Перевіряємо, чи відкрита вкладка розкладу
    if (document.getElementById('schedule-tab') && document.getElementById('schedule-tab').classList.contains('active')) {
        Schedule.init();
    }
});

// Обробник події зміни вкладки
document.addEventListener('tabChange', (e) => {
    if (e.detail.tabId === 'schedule') {
        Schedule.init();
    }
});