// Модуль для експорту розкладу для клієнтів
const ExportTimetable = {
    // Налаштування експорту
    settings: {
        theme: 'default', // default, dark, light, pastel
        showWeekends: true,
        hourFormat: '24h', // '12h' або '24h'
        workHoursOnly: true,
        watermark: 'Nail Master App',
        exportFormat: 'png', // png або pdf
        timeSlotHeight: 40, // Висота часового слоту (пікселі)
        hideClientInfo: true, // Приховати інформацію про клієнтів
        exportType: 'month', // month або day
        customColors: null // Додаткові налаштування кольорів
    },
    
    // Теми оформлення
    themes: {
        default: {
            background: '#1f1d2e',
            headerBackground: '#191724',
            text: '#e0def4',
            accent: '#eb6f92',
            grid: '#26233a',
            booked: '#eb6f92', // Замінено rgba на непрозорий колір
            available: '#403d52', // Замінено rgba на непрозорий колір
            weekend: '#f6c177', // Замінено rgba на непрозорий колір
            today: '#9ccfd8'
        },
        dark: {
            background: '#1e1b2e', // Deep, muted navy-purple for a dark base
            headerBackground: '#2a263f', // Slightly lighter to distinguish headers
            text: '#d8d4e6', // Light, soft purple-gray for readable text
            accent: '#a992c4', // Muted purple, echoing the original accent vibe
            grid: '#3b364f', // Darker grid lines for subtle separation
            booked: '#7a74c9', // Deepened version of the booked color
            available: '#c47a92', // Darker, richer version of available
            weekend: '#4a2f3b', // Dark, warm tone for weekends
            today: '#b55a67' // Muted red-pink for today, still distinct
        },
        light: {
            background: '#faf4ed',
            headerBackground: '#fffaf3',
            text: '#575279',
            accent: '#d7827e',
            grid: '#dfdad9',
            booked: '#d7827e', // Замінено rgba на непрозорий колір
            available: '#286c6c', // Замінено rgba на непрозорий колір
            weekend: '#797aaa', // Замінено rgba на непрозорий колір
            today: '#56949f'
        },
        pastel: {
            background: '#faf4ed',
            headerBackground: '#f2e9e1',
            text: '#575279',
            accent: '#907aa9',
            grid: '#dfdad9',
            booked: '#bbbbf1', // Замінено rgba на непрозорий колір
            available: '#ebbcba', // Замінено rgba на непрозорий колір
            weekend: '#f5e0dc', // Замінено rgba на непрозорий колір
            today: '#d7827e'
        }
    },
    
    // Ініціалізація модуля
    init() {
        // Додаємо кнопку експорту в верхню панель календаря
        this.addExportButton();
        
        // Ініціалізація модальних вікон
        this.initModals();
        
        // Додаємо обробники подій для налаштувань
        document.addEventListener('modalOpen', (e) => {
            if (e.detail.modalId === 'export-settings-modal') {
                this.updateSettingsForm();
            }
        });
    },
    
    // Додаємо кнопку експорту в календар
    addExportButton() {
        const calendarHeader = document.querySelector('.calendar-header');
        if (!calendarHeader) return;
        
        // Перевіряємо, чи кнопка вже існує
        if (document.getElementById('export-timetable-btn')) return;
        
        // Створюємо кнопку експорту
        const exportButton = document.createElement('button');
        exportButton.id = 'export-timetable-btn';
        exportButton.className = 'calendar-nav-btn';
        exportButton.innerHTML = '<i class="fas fa-file-export"></i>';
        exportButton.title = 'Експорт розкладу для клієнтів';
        
        // Додаємо обробник для відкриття налаштувань експорту
        exportButton.addEventListener('click', () => {
            this.openExportSettingsModal();
        });
        
        // Додаємо кнопку в заголовок календаря
        const navContainer = calendarHeader.querySelector('.calendar-actions') || calendarHeader;
        navContainer.appendChild(exportButton);
    },
    
    // Ініціалізація модальних вікон
    initModals() {
        // Створюємо модальне вікно налаштувань, якщо його ще немає
        if (!document.getElementById('export-settings-modal')) {
            this.createExportSettingsModal();
        }
        
        // Створюємо модальне вікно перегляду, якщо його ще немає
        if (!document.getElementById('export-preview-modal')) {
            this.createExportPreviewModal();
        }
    },
    
    // Створення модального вікна налаштувань експорту
    createExportSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'export-settings-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">Налаштування експорту розкладу</div>
                    <button class="modal-close">&times;</button>
                </div>
                <form id="export-settings-form">
                    <div class="export-type-selector" style="grid-column: 1 / -1; margin-bottom: 15px;">
                        <label class="form-label">Тип експорту</label>
                        <div class="export-type-buttons">
                            <button type="button" class="export-type-btn active" data-type="month">
                                <i class="fas fa-calendar-alt"></i> Місяць
                            </button>
                            <button type="button" class="export-type-btn" data-type="day">
                                <i class="fas fa-calendar-day"></i> Поточний день
                            </button>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Тема оформлення</label>
                        <select class="form-control" name="theme">
                            <option value="default">Стандартна</option>
                            <option value="dark">Темна</option>
                            <option value="light">Світла</option>
                            <option value="pastel">Пастельна</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Формат експорту</label>
                        <select class="form-control" name="exportFormat">
                            <option value="png">PNG зображення</option>
                            <option value="pdf">PDF документ</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Формат часу</label>
                        <select class="form-control" name="hourFormat">
                            <option value="24h">24-годинний (14:00)</option>
                            <option value="12h">12-годинний (2:00 PM)</option>
                        </select>
                    </div>
                    
                    <div class="form-check-group month-only-option">
                        <label class="form-check">
                            <input type="checkbox" name="showWeekends" checked>
                            <span class="form-check-label">Показувати вихідні дні</span>
                        </label>
                    </div>
                    
                    <div class="form-check-group">
                        <label class="form-check">
                            <input type="checkbox" name="workHoursOnly" checked>
                            <span class="form-check-label">Показувати тільки робочі години</span>
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Водяний знак</label>
                        <input type="text" class="form-control" name="watermark" value="Nail Master App">
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" id="export-preview-btn">
                            <i class="fas fa-eye"></i> Попередній перегляд
                        </button>
                        <button type="button" class="btn-primary" id="export-download-btn">
                            <i class="fas fa-download"></i> Завантажити
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Додаємо обробники подій
        // Обробники для перемикача типу експорту
        const exportTypeButtons = modal.querySelectorAll('.export-type-btn');
        exportTypeButtons.forEach(button => {
            button.addEventListener('click', () => {
                exportTypeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Оновлення типу експорту
                const exportType = button.getAttribute('data-type');
                this.settings.exportType = exportType;
                
                // Показувати/приховувати опції відповідно до типу експорту
                this.toggleExportTypeOptions(exportType);
            });
        });
        
        modal.querySelector('#export-preview-btn').addEventListener('click', () => {
            this.updateSettingsFromForm();
            this.generatePreview();
        });
        
        modal.querySelector('#export-download-btn').addEventListener('click', () => {
            this.updateSettingsFromForm();
            this.exportTimetable();
        });
        
        // Додаємо обробник для закриття модального вікна
        modal.querySelector('.modal-close').addEventListener('click', () => {
            Modals.close('export-settings-modal');
        });
        
        // Закриття по кліку на фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                Modals.close('export-settings-modal');
            }
        });
    },
    
    // Створення модального вікна попереднього перегляду
    createExportPreviewModal() {
        const modal = document.createElement('div');
        modal.className = 'modal modal-large';
        modal.id = 'export-preview-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">Попередній перегляд розкладу</div>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body export-preview-container">
                    <div id="timetable-preview" class="timetable-preview">
                        <div class="loader"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="preview-back-btn">
                        <i class="fas fa-arrow-left"></i> Назад до налаштувань
                    </button>
                    <button class="btn-primary" id="preview-download-btn">
                        <i class="fas fa-download"></i> Завантажити
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Додаємо обробники подій
        modal.querySelector('#preview-back-btn').addEventListener('click', () => {
            Modals.close('export-preview-modal');
            Modals.open('export-settings-modal');
        });
        
        modal.querySelector('#preview-download-btn').addEventListener('click', () => {
            this.exportTimetable();
        });
        
        // Додаємо обробник для закриття модального вікна
        modal.querySelector('.modal-close').addEventListener('click', () => {
            Modals.close('export-preview-modal');
        });
        
        // Закриття по кліку на фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                Modals.close('export-preview-modal');
            }
        });
    },
    
    // Відкриття модального вікна налаштувань експорту
    openExportSettingsModal() {
        // Оновлюємо налаштування з форми перед відкриттям
        this.updateSettingsForm();
        
        // Відкриваємо модальне вікно
        Modals.open('export-settings-modal');
    },
    
    // Оновлення форми налаштувань з поточних налаштувань
    updateSettingsForm() {
        const form = document.getElementById('export-settings-form');
        if (!form) return;
        
        // Встановлюємо тип експорту
        const exportTypeButtons = form.querySelectorAll('.export-type-btn');
        exportTypeButtons.forEach(button => {
            const type = button.getAttribute('data-type');
            if (type === this.settings.exportType) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // Перемикання опцій відповідно до типу експорту
        this.toggleExportTypeOptions(this.settings.exportType);
        
        // Встановлюємо значення полів форми
        form.querySelector('[name="theme"]').value = this.settings.theme;
        form.querySelector('[name="exportFormat"]').value = this.settings.exportFormat;
        form.querySelector('[name="hourFormat"]').value = this.settings.hourFormat;
        form.querySelector('[name="showWeekends"]').checked = this.settings.showWeekends;
        form.querySelector('[name="workHoursOnly"]').checked = this.settings.workHoursOnly;
        form.querySelector('[name="watermark"]').value = this.settings.watermark;
    },
    
    // Оновлення налаштувань з форми
    updateSettingsFromForm() {
        const form = document.getElementById('export-settings-form');
        if (!form) return;
        
        // Оновлюємо тип експорту
        const activeTypeButton = form.querySelector('.export-type-btn.active');
        if (activeTypeButton) {
            this.settings.exportType = activeTypeButton.getAttribute('data-type');
        }
        
        // Оновлюємо налаштування з полів форми
        this.settings.theme = form.querySelector('[name="theme"]').value;
        this.settings.exportFormat = form.querySelector('[name="exportFormat"]').value;
        this.settings.hourFormat = form.querySelector('[name="hourFormat"]').value;
        this.settings.showWeekends = form.querySelector('[name="showWeekends"]').checked;
        this.settings.workHoursOnly = form.querySelector('[name="workHoursOnly"]').checked;
        this.settings.watermark = form.querySelector('[name="watermark"]').value;
    },
    
    // Перемикання опцій відповідно до типу експорту
    toggleExportTypeOptions(exportType) {
        const form = document.getElementById('export-settings-form');
        if (!form) return;
        
        // Показуємо/приховуємо опції, що стосуються тільки експорту місяця
        const monthOnlyOptions = form.querySelectorAll('.month-only-option');
        monthOnlyOptions.forEach(option => {
            option.style.display = exportType === 'month' ? 'block' : 'none';
        });
    },
    
    // Генерація попереднього перегляду
    async generatePreview() {
        // Закриваємо вікно налаштувань
        Modals.close('export-settings-modal');
        
        // Відкриваємо вікно попереднього перегляду
        Modals.open('export-preview-modal');
        
        const previewContainer = document.getElementById('timetable-preview');
        previewContainer.innerHTML = '<div class="loader"></div>';
        
        try {
            // Створення HTML розкладу залежно від типу експорту
            let timetableHTML;
            
            if (this.settings.exportType === 'day') {
                timetableHTML = await this.generateDayTimetableHTML();
            } else {
                timetableHTML = await this.generateTimetableHTML();
            }
            
            // Оновлюємо контейнер попереднього перегляду
            previewContainer.innerHTML = timetableHTML;
            
            // Налаштовуємо скролінг в контейнері
            previewContainer.parentElement.scrollTop = 0;
        } catch (error) {
            console.error('Помилка генерації попереднього перегляду:', error);
            previewContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Не вдалося створити попередній перегляд: ${error.message}</p>
                </div>
            `;
        }
    },
    
    // Генерація HTML розкладу
    async generateTimetableHTML() {
        // Отримуємо поточну дату і місяць
        const currentDate = new Date(window.appState.selectedDate);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Отримуємо перший та останній день місяця
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Отримуємо день тижня для першого дня місяця (0 = неділя, 1 = понеділок, ...)
        let firstDayOfWeek = firstDay.getDay();
        firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Перетворення на європейський формат (0 = понеділок, 6 = неділя)
        
        // Отримуємо назву місяця
        const monthNames = [
            'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 
            'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
        ];
        const monthName = monthNames[month];
        
        // Завантажуємо розклад та записи на місяць
        const appointments = await this.loadMonthAppointments(year, month);
        const scheduleData = await this.loadMonthSchedule();
        
        // Отримуємо всі унікальні часові слоти з розкладу
        const allTimeSlots = this.getAllTimeSlots(scheduleData);
        
        // Отримуємо тему оформлення
        const theme = this.themes[this.settings.theme] || this.themes.default;
        
        // Створюємо HTML-структуру
        let html = `
            <div class="export-timetable" style="
                background-color: ${theme.background};
                color: ${theme.text};
                font-family: 'Fira Code', monospace;
                width: 100%;
                max-width: 1200px;
                margin: 0 auto;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            ">
                <div class="timetable-header" style="
                    background-color: ${theme.headerBackground};
                    padding: 20px;
                    text-align: center;
                    border-bottom: 1px solid ${theme.grid};
                ">
                    <h2 style="
                        margin: 0;
                        font-size: 24px;
                        color: ${theme.text};
                    ">${monthName} ${year}</h2>
                    <div style="
                        margin-top: 10px;
                        font-size: 14px;
                    ">Розклад на місяць</div>
                    <div style="
                        margin-top: 10px;
                        font-size: 16px;
                        font-weight: bold;
                    ">${this.settings.watermark}</div>
                </div>
                
                <div class="month-calendar" style="
                    padding: 20px;
                ">
                    <div class="calendar-weekdays" style="
                        display: grid;
                        grid-template-columns: ${this.settings.showWeekends ? 'repeat(7, 1fr)' : 'repeat(5, 1fr)'};
                        gap: 10px;
                        margin-bottom: 10px;
                        text-align: center;
                        font-weight: bold;
                    ">
        `;
        
        // Додаємо заголовки днів тижня
        const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
        const visibleWeekdays = this.settings.showWeekends ? weekdays : weekdays.slice(0, 5);
        
        visibleWeekdays.forEach(day => {
            const isWeekend = day === 'Сб' || day === 'Нд';
            html += `
                <div style="
                    padding: 10px;
                    color: ${isWeekend ? theme.accent : theme.text};
                ">${day}</div>
            `;
        });
        
        html += `
                    </div>
                    <div class="calendar-grid" style="
                        display: grid;
                        grid-template-columns: ${this.settings.showWeekends ? 'repeat(7, 1fr)' : 'repeat(5, 1fr)'};
                        gap: 10px;
                    ">
        `;
        
        // Додаємо пропуски для днів до початку місяця
        for (let i = 0; i < firstDayOfWeek; i++) {
            html += `
                <div style="
                    background-color: ${theme.headerBackground};
                    border-radius: 8px;
                    min-height: 100px;
                    opacity: 0.3;
                "></div>
            `;
        }
        
        // Додаємо дні місяця
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay(); // 0 = неділя, 1 = понеділок, ...
            
            // Пропускаємо вихідні дні, якщо налаштування вимкнено
            if (!this.settings.showWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
                continue;
            }
            
            // Перетворюємо на європейський день тижня (0 = понеділок, 6 = неділя)
            const europeanDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            
            // Перевіряємо, чи цей день є сьогодні
            const isToday = this.isSameDay(date, new Date());
            
            // Отримуємо розклад для цього дня тижня
            const daySchedule = scheduleData[dayOfWeek];
            
            // Перевіряємо, чи цей день є вихідним згідно з розкладом
            const isDayOff = !daySchedule || daySchedule.isWeekend;
            
            // Отримуємо записи на цей день
            const dateStr = this.formatDateForAPI(date);
            const dayAppointments = appointments.filter(app => 
                dateStr === this.formatDateForAPI(new Date(app.time))
            );
            
            html += `
                <div style="
                    background-color: ${theme.headerBackground};
                    border: 1px solid ${theme.grid};
                    border-radius: 8px;
                    overflow: hidden;
                    ${isToday ? `outline: 2px solid ${theme.today};` : ''}
                ">
                    <div style="
                        background-color: ${isDayOff ? theme.weekend : theme.headerBackground};
                        padding: 8px;
                        text-align: center;
                        border-bottom: 1px solid ${theme.grid};
                        font-weight: ${isToday ? 'bold' : 'normal'};
                    ">
                        ${day}
                    </div>
                    <div style="padding: 8px;">
            `;
            
            if (isDayOff) {
                // Якщо це вихідний день, показуємо повідомлення
                html += `
                    <div style="
                        padding: 8px;
                        text-align: center;
                        color: ${theme.accent};
                        font-size: 12px;
                    ">Вихідний</div>
                `;
            } else if (daySchedule && daySchedule.timeTable) {
                // Відображаємо слоти часу
                const slots = Object.values(daySchedule.timeTable).filter(Boolean);
                
                if (slots.length === 0) {
                    html += `
                        <div style="
                            padding: 8px;
                            text-align: center;
                            font-size: 12px;
                            color: ${theme.text};
                        ">Немає слотів</div>
                    `;
                } else {
                    // Сортуємо слоти за часом
                    slots.sort();
                    
                    slots.forEach(slot => {
                        // Перевіряємо, чи цей слот зайнятий
                        const [hours, minutes] = slot.split(':').map(Number);
                        const isBooked = dayAppointments.some(app => {
                            const appTime = new Date(app.time);
                            return (
                                appTime.getHours() === hours && 
                                appTime.getMinutes() === minutes &&
                                app.status !== 'cancelled'
                            );
                        });
                        
                        const slotTime = this.settings.hourFormat === '12h'
                            ? this.formatTime12h(hours, minutes)
                            : `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                        
                        html += `
                        <div style="
                            padding: 5px;
                            margin-bottom: 4px;
                            border-radius: 4px;
                            font-size: 12px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            background-color: ${isBooked ? theme.booked : theme.available};
                            opacity: 1;
                        ">
                            <span>${slotTime}</span>
                            <span>${isBooked ? '🔒' : '✓'}</span>
                        </div>
                        `;
                    });
                }
            } else {
                // Якщо немає розкладу для цього дня
                html += `
                    <div style="
                        padding: 8px;
                        text-align: center;
                        font-size: 12px;
                        color: ${theme.text};
                    ">Немає розкладу</div>
                `;
            }
            
            html += `
                    </div>
                </div>
            `;
        }
        
        // Закриваємо контейнери та додаємо легенду
        html += `
                    </div>
                </div>
                
                <div class="timetable-legend" style="
                    padding: 15px;
                    border-top: 1px solid ${theme.grid};
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                ">
                    <div style="
                        display: flex;
                        align-items: center;
                        font-size: 14px;
                    ">
                        <span style="
                            display: inline-block;
                            width: 14px;
                            height: 14px;
                            margin-right: 5px;
                            background-color: ${theme.available};
                            border-radius: 2px;
                        "></span>
                        Вільно
                    </div>
                    <div style="
                        display: flex;
                        align-items: center;
                        font-size: 14px;
                    ">
                        <span style="
                            display: inline-block;
                            width: 14px;
                            height: 14px;
                            margin-right: 5px;
                            background-color: ${theme.booked};
                            border-radius: 2px;
                        "></span>
                        Зайнято
                    </div>
                </div>
            </div>
        `;
        
        return html;
    },
    
    // Отримання всіх унікальних часових слотів з розкладу
    getAllTimeSlots(scheduleData) {
        const allSlots = new Set();
        
        Object.values(scheduleData).forEach(daySchedule => {
            if (daySchedule && daySchedule.timeTable && !daySchedule.isWeekend) {
                Object.values(daySchedule.timeTable).forEach(time => {
                    if (time) {
                        allSlots.add(time);
                    }
                });
            }
        });
        
        return [...allSlots].sort();
    },
    
    // Форматування часу у 12-годинному форматі
    formatTime12h(hours, minutes) {
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    },
    
    // Генерація HTML розкладу для одного дня
    async generateDayTimetableHTML() {
        // Отримуємо поточну вибрану дату
        const currentDate = new Date(window.appState.selectedDate);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const day = currentDate.getDate();
        const dayOfWeek = currentDate.getDay(); // 0 - неділя, 1 - понеділок, ...
        
        // Отримуємо назви дня тижня та місяця
        const weekdays = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота'];
        const monthNames = [
            'Січня', 'Лютого', 'Березня', 'Квітня', 'Травня', 'Червня', 
            'Липня', 'Серпня', 'Вересня', 'Жовтня', 'Листопада', 'Грудня'
        ];
        
        const dayName = weekdays[dayOfWeek];
        const monthName = monthNames[month];
        
        // Завантажуємо записи на день
        const formattedDate = this.formatDateForAPI(currentDate);
        const appointments = await apiClient.getAppointmentsByDate(formattedDate);
        
        // Отримуємо розклад для цього дня тижня
        let daySchedule;
        try {
            daySchedule = await apiClient.getDaySchedule(dayOfWeek);
        } catch (error) {
            console.error(`Помилка завантаження розкладу для дня тижня ${dayOfWeek}:`, error);
            daySchedule = null;
        }
        
        // Перевіряємо, чи день є вихідним
        const isDayOff = !daySchedule || daySchedule.isWeekend;
        
        // Отримуємо тему оформлення
        const theme = this.themes[this.settings.theme] || this.themes.default;
        
        // Створюємо HTML-структуру
        let html = `
            <div class="export-timetable day-timetable" style="
                background-color: ${theme.background};
                color: ${theme.text};
                font-family: 'Fira Code', monospace;
                width: 100%;
                max-width: 800px;
                margin: 0 auto;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            ">
                <div class="timetable-header" style="
                    background-color: ${theme.headerBackground};
                    padding: 20px;
                    text-align: center;
                    border-bottom: 1px solid ${theme.grid};
                ">
                    <h2 style="
                        margin: 0;
                        font-size: 24px;
                        color: ${theme.text};
                    ">${dayName}, ${day} ${monthName} ${year}</h2>
                    <div style="
                        margin-top: 10px;
                        font-size: 14px;
                    ">Розклад на день</div>
                    <div style="
                        margin-top: 10px;
                        font-size: 16px;
                        font-weight: bold;
                    ">${this.settings.watermark}</div>
                </div>
        `;
        
        // Якщо це вихідний день, показуємо відповідне повідомлення
        if (isDayOff) {
            html += `
                <div style="
                    padding: 40px 20px;
                    text-align: center;
                    font-size: 18px;
                    color: ${theme.accent};
                ">
                    <i class="fas fa-umbrella-beach" style="
                        font-size: 48px;
                        margin-bottom: 20px;
                        display: block;
                    "></i>
                    <h3 style="margin: 0 0 10px;">Вихідний день 😌</h3>
                    <p style="margin: 0;">Сьогодні вихідний за розкладом. Відпочиваємо!</p>
                </div>
            </div>
        `;
        } else if (daySchedule && daySchedule.timeTable) {
            // Отримуємо слоти часу з розкладу і сортуємо їх
            const timeSlots = Object.values(daySchedule.timeTable)
                .filter(Boolean)
                .sort((a, b) => {
                    const [aHours, aMinutes] = a.split(':').map(Number);
                    const [bHours, bMinutes] = b.split(':').map(Number);
                    return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
                });
            
            if (timeSlots.length === 0) {
                html += `
                    <div style="
                        padding: 40px 20px;
                        text-align: center;
                        font-size: 18px;
                    ">
                        <p>Немає запланованих слотів на цей день</p>
                    </div>
                `;
            } else {
                html += `
                    <div class="day-schedule-container" style="
                        padding: 20px;
                    ">
                        <div class="day-schedule-grid" style="
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 15px;
                        ">
                `;
                
                // Додаємо кожен слот часу
                timeSlots.forEach(slot => {
                    const [hours, minutes] = slot.split(':').map(Number);
                    
                    // Перевіряємо, чи цей слот зайнятий
                    const isBooked = appointments.some(app => {
                        const appTime = new Date(app.time);
                        return (
                            appTime.getHours() === hours && 
                            appTime.getMinutes() === minutes &&
                            app.status !== 'cancelled'
                        );
                    });
                    
                    // Форматуємо час відповідно до налаштувань
                    const formattedTime = this.settings.hourFormat === '12h'
                        ? this.formatTime12h(hours, minutes)
                        : `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                    
                    html += `
                        <div style="
                            background-color: ${isBooked ? theme.booked : theme.available};
                            padding: 15px;
                            border-radius: 8px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            opacity: 1;
                        ">
                            <div style="
                                font-size: 18px;
                                font-weight: bold;
                            ">${formattedTime}</div>
                            <div style="
                                font-size: 16px;
                            ">${isBooked ? '🔒 Зайнято' : '✓ Вільно'}</div>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            }
            
            html += `</div>`;
        } else {
            html += `
                <div style="
                    padding: 40px 20px;
                    text-align: center;
                    font-size: 18px;
                ">
                    <p>Розклад на цей день не знайдено</p>
                </div>
            `;
            
            html += `</div>`;
        }
        
        return html;
    },
    
    // Завантаження записів на місяць
    async loadMonthAppointments(year, month) {
        try {
            // Створення меж місяця
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);
            
            // Форматування дат для API
            const startDateStr = this.formatDateForAPI(startDate);
            const endDateStr = this.formatDateForAPI(endDate);
            
            // Отримання всіх записів на місяць
            const monthAppointments = await apiClient.getAppointmentsByPeriod(startDateStr, endDateStr);
            
            // Фільтруємо тільки активні записи
            return monthAppointments.filter(app => app.status !== 'cancelled');
        } catch (error) {
            console.error('Помилка завантаження записів для місяця:', error);
            return [];
        }
    },
    
    // Завантаження розкладу на місяць
    async loadMonthSchedule() {
        try {
            // Отримання розкладу через API
            const schedule = await apiClient.getSchedule();
            
            // Перетворення в об'єкт для швидшого доступу
            const scheduleMap = {};
            schedule.forEach(day => {
                scheduleMap[day.dayOfWeek] = day;
            });
            
            return scheduleMap;
        } catch (error) {
            console.error('Помилка завантаження розкладу:', error);
            return {};
        }
    },
    
    // Форматування дати для API
    formatDateForAPI(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },
    
    // Порівняння дат (тільки рік, місяць, день)
    isSameDay(date1, date2) {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    },
    
    // New helper to process the cloned document for rendering consistency
    processClone(clonedDoc) {
        const elements = clonedDoc.querySelectorAll('*');
        elements.forEach(el => {
            el.style.opacity = '1';
            if (el.style.backgroundColor && el.style.backgroundColor.includes('rgba')) {
                const rgba = el.style.backgroundColor;
                const match = rgba.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
                if (match) {
                    el.style.backgroundColor = `rgb(${match[1]}, ${match[2]}, ${match[3]})`;
                }
            }
        });
    },

    // Експорт розкладу
    async exportTimetable() {
        try {
            Toast.info('Підготовка до експорту...', 'Експорт');
            let timetableHTML = this.settings.exportType === 'day'
                ? await this.generateDayTimetableHTML()
                : await this.generateTimetableHTML();
            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.width = this.settings.exportType === 'day' ? '800px' : '1200px';
            container.style.height = 'auto';
            container.style.overflow = 'visible';
            container.style.background = this.themes[this.settings.theme].background;
            container.style.padding = '20px';
            container.innerHTML = timetableHTML;
            document.body.appendChild(container);
            
            if (typeof html2canvas === 'undefined') {
                await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
            }
            
            if (this.settings.exportFormat === 'pdf' && typeof jspdf === 'undefined') {
                await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            }
            
            const currentDate = new Date(window.appState.selectedDate);
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const day = currentDate.getDate();
            
            const monthNames = [
                'sichen', 'lyutiy', 'berezen', 'kviten', 'traven', 'cherven', 
                'lypen', 'serpen', 'veresen', 'zhovten', 'lystopad', 'gruden'
            ];
            
            let fileName;
            if (this.settings.exportType === 'day') {
                fileName = `rozklad_${day}_${monthNames[month]}_${year}`;
            } else {
                fileName = `rozklad_${monthNames[month]}_${year}`;
            }
            
            await new Promise(resolve => setTimeout(resolve, 500)); // Затримка для гарантованого завантаження
            
            // Compute dynamic scale factor for higher quality rendering
            const scaleFactor = window.devicePixelRatio ? window.devicePixelRatio * 2 : 4;
            
            if (this.settings.exportFormat === 'png') {
                const canvas = await html2canvas(container.querySelector('.export-timetable'), {
                    scale: scaleFactor,
                    backgroundColor: this.themes[this.settings.theme].background,
                    logging: false,
                    removeContainer: true,
                    useCORS: true,
                    letterRendering: true,
                    allowTaint: true,
                    imageTimeout: 0,
                    onclone: clonedDoc => { this.processClone(clonedDoc); }
                });
                
                const link = document.createElement('a');
                link.download = `${fileName}.png`;
                link.href = canvas.toDataURL('image/png', 1.0); // Максимальна якість
                link.click();
                
                Toast.success(`Розклад успішно експортовано в PNG`, 'Експорт завершено');
            } else if (this.settings.exportFormat === 'pdf') {
                const canvas = await html2canvas(container.querySelector('.export-timetable'), {
                    scale: scaleFactor,
                    backgroundColor: this.themes[this.settings.theme].background,
                    logging: false,
                    useCORS: true,
                    letterRendering: true,
                    allowTaint: true,
                    imageTimeout: 0,
                    onclone: clonedDoc => { this.processClone(clonedDoc); }
                });
                
                const imgData = canvas.toDataURL('image/png', 1.0); // Максимальна якість
                const orientation = this.settings.exportType === 'day' ? 'portrait' : 'landscape';
                const pdf = new jspdf.jsPDF({
                    orientation: orientation,
                    unit: 'mm'
                });
                
                const pdfWidth = orientation === 'landscape' ? 277 : 190;
                const imgWidth = pdfWidth;
                const imgHeight = canvas.height * imgWidth / canvas.width;
                
                pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
                pdf.save(`${fileName}.pdf`);
                
                Toast.success(`Розклад успішно експортовано в PDF`, 'Експорт завершено');
            }
            
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
            
            if (document.getElementById('export-preview-modal') && document.getElementById('export-preview-modal').classList.contains('active')) {
                Modals.close('export-preview-modal');
            }
        } catch (error) {
            console.error('Помилка експорту розкладу:', error);
            Toast.error(`Не вдалося експортувати розклад: ${error.message}`, 'Помилка експорту');
        }
    },
    
    // Завантаження скрипту
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Не вдалося завантажити скрипт: ${src}`));
            document.head.appendChild(script);
        });
    }
};

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    // Перевіряємо, чи відкрита вкладка розкладу
    if (document.getElementById('schedule-tab') && document.getElementById('schedule-tab').classList.contains('active')) {
        ExportTimetable.init();
    }
});

// Обробник події зміни вкладки
document.addEventListener('tabChange', (e) => {
    if (e.detail.tabId === 'schedule') {
        ExportTimetable.init();
    }
});