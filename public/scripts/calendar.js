// Модуль для роботи з календарем
const Calendar = {
    // Ініціалізація календаря
    init() {
        // Додавання обробників для перемикачів виду
        this.initViewToggle();
        
        // Встановлення поточної дати
        if (!window.appState.selectedDate) {
            window.appState.selectedDate = new Date();
        }
    },
    
    // Ініціалізація перемикачів виду календаря
    initViewToggle() {
        const viewToggleButtons = document.querySelectorAll('.view-toggle-btn');
        
        viewToggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Зміна активної кнопки
                viewToggleButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Зміна виду календаря
                const view = button.getAttribute('data-view');
                window.appState.currentView = view;
                
                // Перемикання відображення
                const daysView = document.getElementById('days-view');
                const monthView = document.getElementById('month-view');
                
                if (view === 'week') {
                    daysView.style.display = 'flex';
                    monthView.classList.remove('active');
                } else if (view === 'month') {
                    daysView.style.display = 'none';
                    monthView.classList.add('active');
                }
                
                // Оновлення календаря
                this.renderCalendar();
            });
        });
    },
    
    // Рендерінг календаря
    renderCalendar() {
        // Оновлення заголовка календаря
        this.updateCalendarTitle();
        
        // Рендерінг відповідного виду
        if (window.appState.currentView === 'week') {
            this.renderWeekView();
        } else {
            this.renderMonthView();
        }
    },
    
    // Оновлення заголовка календаря
    // Оновлення заголовка календаря
    updateCalendarTitle() {
        const titleElement = document.getElementById('calendar-month');
        const currentYear = window.appState.selectedDate.getFullYear();
        const currentMonth = window.appState.selectedDate.getMonth();
        
        // Додаємо селектор року до заголовка
        titleElement.innerHTML = `
            ${this.formatMonthYear(window.appState.selectedDate)}
            <select id="year-selector" class="year-selector">
                ${this.generateYearOptions(currentYear)}
            </select>
        `;
        
        // Додаємо обробник зміни року
        const yearSelector = document.getElementById('year-selector');
        if (yearSelector) {
            yearSelector.value = currentYear;
            yearSelector.addEventListener('change', (e) => {
                const newYear = parseInt(e.target.value);
                const newDate = new Date(window.appState.selectedDate);
                newDate.setFullYear(newYear);
                window.appState.selectedDate = newDate;
                this.renderCalendar();
                Appointments.loadAppointmentsForSelectedDate();
            });
        }
    },
    
    // Генерація опцій для селектора років
    generateYearOptions(currentYear) {
        // Створюємо опції для 10 років назад і 5 років вперед
        const startYear = currentYear - 10;
        const endYear = currentYear + 5;
        
        let options = '';
        for (let year = startYear; year <= endYear; year++) {
            options += `<option value="${year}">${year}</option>`;
        }
        
        return options;
    },
    
    // Рендерінг тижневого виду
    renderWeekView() {
        const daysViewContainer = document.getElementById('days-view');
        
        // Показуємо індикатор завантаження
        daysViewContainer.innerHTML = '<div class="loader"></div>';
        
        // Отримуємо поточний день тижня (0 = неділя, 1 = понеділок, ...)
        const currentDay = window.appState.selectedDate.getDay();
        
        // Знаходимо початок тижня (понеділок)
        const startOfWeek = new Date(window.appState.selectedDate);
        const diff = currentDay === 0 ? -6 : 1 - currentDay; // Якщо сьогодні неділя, відраховуємо 6 днів назад
        startOfWeek.setDate(startOfWeek.getDate() + diff);
        
        // Очищаємо контейнер
        daysViewContainer.innerHTML = '';
        
        // Створюємо 7 днів тижня
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + i);
            
            const isToday = this.isSameDay(dayDate, new Date());
            const isSelected = this.isSameDay(dayDate, window.appState.selectedDate);
            
            const dayElement = document.createElement('div');
            dayElement.className = `day-header ${isSelected ? 'active' : ''} ${isToday ? 'today' : ''}`;
            dayElement.setAttribute('data-date', this.formatDateForAPI(dayDate));
            
            const dayOfWeek = dayDate.getDay();
            const dayName = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][dayOfWeek];
            
            dayElement.innerHTML = `
                <div class="day-name">${dayName}</div>
                <div class="day-date">${dayDate.getDate()}</div>
            `;
            
            dayElement.addEventListener('click', () => {
                // Оновлення вибраної дати
                window.appState.selectedDate = dayDate;
                
                // Оновлення активного класу
                daysViewContainer.querySelectorAll('.day-header').forEach(day => {
                    day.classList.remove('active');
                });
                dayElement.classList.add('active');
                
                // Завантаження записів на вибрану дату
                Appointments.loadAppointmentsForSelectedDate();
            });
            
            daysViewContainer.appendChild(dayElement);
        }
    },
    
    // Рендерінг місячного виду
    renderMonthView() {
        const monthGrid = document.getElementById('month-grid');
        
        // Показуємо індикатор завантаження
        monthGrid.innerHTML = '<div class="loader"></div>';
        
        // Очищаємо контейнер
        monthGrid.innerHTML = '';
        
        // Додавання заголовків днів тижня
        const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
        weekdays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'weekday-header';
            dayHeader.textContent = day;
            monthGrid.appendChild(dayHeader);
        });
        
        // Отримання першого дня місяця
        const firstDay = new Date(window.appState.selectedDate.getFullYear(), window.appState.selectedDate.getMonth(), 1);
        
        // Визначення дня тижня для першого дня місяця (0 = неділя, 1 = понеділок, ...)
        let dayOfWeek = firstDay.getDay();
        dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Перетворення на європейський формат (0 = понеділок, 6 = неділя)
        
        // Додавання днів попереднього місяця
        const prevMonthDays = dayOfWeek;
        const lastDayPrevMonth = new Date(firstDay);
        lastDayPrevMonth.setDate(0); // Останній день попереднього місяця
        
        for (let i = prevMonthDays - 1; i >= 0; i--) {
            const day = new Date(lastDayPrevMonth);
            day.setDate(lastDayPrevMonth.getDate() - i);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'month-day other-month';
            dayElement.textContent = day.getDate();
            dayElement.setAttribute('data-date', this.formatDateForAPI(day));
            
            dayElement.addEventListener('click', () => {
                window.appState.selectedDate = day;
                this.renderCalendar();
                Appointments.loadAppointmentsForSelectedDate();
            });
            
            monthGrid.appendChild(dayElement);
        }
        
        // Додавання днів поточного місяця
        const lastDay = new Date(window.appState.selectedDate.getFullYear(), window.appState.selectedDate.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Завантаження всіх записів на місяць для відмітки днів з записами
        this.loadMonthAppointments().then(appointmentDays => {
            for (let i = 1; i <= daysInMonth; i++) {
                const day = new Date(window.appState.selectedDate.getFullYear(), window.appState.selectedDate.getMonth(), i);
                
                const isToday = this.isSameDay(day, new Date());
                const isSelected = this.isSameDay(day, window.appState.selectedDate);
                const hasAppointments = appointmentDays.includes(i);
                
                const dayElement = document.createElement('div');
                dayElement.className = `month-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasAppointments ? 'has-appointments' : ''}`;
                dayElement.textContent = i;
                dayElement.setAttribute('data-date', this.formatDateForAPI(day));
                
                dayElement.addEventListener('click', () => {
                    window.appState.selectedDate = day;
                    this.renderCalendar();
                    Appointments.loadAppointmentsForSelectedDate();
                });
                
                monthGrid.appendChild(dayElement);
            }
            
            // Додавання днів наступного місяця (для заповнення сітки)
            const totalCells = Math.ceil((prevMonthDays + daysInMonth) / 7) * 7;
            const nextMonthDays = totalCells - (prevMonthDays + daysInMonth);
            
            for (let i = 1; i <= nextMonthDays; i++) {
                const day = new Date(window.appState.selectedDate.getFullYear(), window.appState.selectedDate.getMonth() + 1, i);
                
                const dayElement = document.createElement('div');
                dayElement.className = 'month-day other-month';
                dayElement.textContent = i;
                dayElement.setAttribute('data-date', this.formatDateForAPI(day));
                
                dayElement.addEventListener('click', () => {
                    window.appState.selectedDate = day;
                    this.renderCalendar();
                    Appointments.loadAppointmentsForSelectedDate();
                });
                
                monthGrid.appendChild(dayElement);
            }
        }).catch(error => {
            console.error('Помилка завантаження записів для місяця:', error);
            Toast.error('Не вдалося завантажити дані для календаря.');
        });
    },
    
    // Завантаження записів для місяця
    async loadMonthAppointments() {
        try {
            // Створення меж місяця
            const year = window.appState.selectedDate.getFullYear();
            const month = window.appState.selectedDate.getMonth();
            
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);
            
            // Форматування дат для API
            const startDateStr = this.formatDateForAPI(startDate);
            const endDateStr = this.formatDateForAPI(endDate);
            
            // Отримання всіх записів на місяць
            const monthAppointments = await apiClient.getAppointmentsByPeriod(startDateStr, endDateStr);
            
            // Отримання днів з записами
            const appointmentDays = monthAppointments.map(app => {
                const date = new Date(app.time);
                return date.getDate();
            });
            
            // Повертаємо унікальні дні
            return [...new Set(appointmentDays)];
        } catch (error) {
            console.error('Помилка завантаження записів для місяця:', error);
            return [];
        }
    },
    
    // Форматування місяця та року
    formatMonthYear(date) {
        const months = [
            'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 
            'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
        ];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    },
    
    // Форматування дати для API
    formatDateForAPI(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },
    
    // Перевірка, чи та сама дата
    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
};