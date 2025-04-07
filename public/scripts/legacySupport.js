// Модуль для підтримки роботи зі старими даними
const LegacySupport = {
    // Ініціалізація
    init() {
        console.log('📦 Ініціалізація підтримки старих даних');
        
        // Зберігання років, у яких є записи
        this.knownYears = new Set();
        
        // Додаємо поточний рік
        this.knownYears.add(new Date().getFullYear());
        
        // Шукаємо кнопку для сканування минулих років
        this.addScanYearsButton();
        
        // Додаємо відстеження помилок при завантаженні записів
        this.trackAppointmentLoading();
    },
    
    // Додає кнопку для сканування записів у минулих роках
    addScanYearsButton() {
        const calendarHeader = document.querySelector('.calendar-header');
        
        if (!calendarHeader) return;
        
        // Перевіряємо, чи кнопка вже існує
        if (document.getElementById('scan-years-btn')) return;
        
        // Створюємо кнопку
        const scanButton = document.createElement('button');
        scanButton.id = 'scan-years-btn';
        scanButton.className = 'calendar-nav-btn';
        scanButton.innerHTML = '<i class="fas fa-history"></i>';
        scanButton.title = 'Сканувати записи в минулих роках';
        
        // Додаємо обробник події
        scanButton.addEventListener('click', () => {
            this.scanPreviousYears();
        });
        
        // Додаємо кнопку до навігації календаря
        const navContainer = calendarHeader.querySelector('.calendar-actions') || calendarHeader;
        navContainer.appendChild(scanButton);
    },
    
    // Сканує записи в минулих роках
    async scanPreviousYears() {
        Toast.info('Сканування записів у минулих роках...', 'Процес');
        
        // Поточна дата
        const currentDate = new Date(window.appState.selectedDate);
        const day = currentDate.getDate();
        const month = currentDate.getMonth() + 1;
        
        try {
            // Запитуємо API для знаходження всіх записів на цей день у всіх роках
            const appointments = await apiClient.searchAppointmentsByDayMonth(day, month);
            
            if (appointments.length > 0) {
                // Збираємо роки з усіх записів
                const years = appointments.map(app => new Date(app.time).getFullYear());
                
                // Додаємо всі унікальні роки до відомих років
                years.forEach(year => this.knownYears.add(year));
                
                // Оновлюємо селектор років
                this.updateYearSelector();
                
                // Показуємо повідомлення користувачу
                const uniqueYears = [...new Set(years)].sort();
                const yearsText = uniqueYears.join(', ');
                
                if (uniqueYears.length > 0) {
                    Toast.success(`Знайдено записи на ${day}.${month} в роках: ${yearsText}`, 'Сканування завершено');
                } else {
                    Toast.info('Записів у інших роках не знайдено', 'Сканування завершено');
                }
            } else {
                Toast.info('Записів у інших роках не знайдено', 'Сканування завершено');
            }
        } catch (error) {
            console.error('Помилка сканування минулих років:', error);
            Toast.error('Не вдалося сканувати минулі роки. ' + error.message);
        }
    },
    
    // Оновлення селектора років
    updateYearSelector() {
        const yearSelector = document.getElementById('year-selector');
        
        if (!yearSelector) return;
        
        // Поточне значення
        const currentValue = parseInt(yearSelector.value);
        
        // Створюємо нові опції
        const years = [...this.knownYears].sort((a, b) => b - a); // Сортуємо за спаданням
        
        // Очищаємо селектор
        yearSelector.innerHTML = '';
        
        // Додаємо нові опції
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelector.appendChild(option);
        });
        
        // Відновлюємо вибране значення
        yearSelector.value = currentValue;
    },
    
    // Відстеження завантаження записів для виявлення проблем з датами
    trackAppointmentLoading() {
        // Перехоплюємо оригінальний метод API
        const originalGetAppointments = apiClient.getAppointmentsByDate;
        
        // Замінюємо його власною функцією
        apiClient.getAppointmentsByDate = async (date) => {
            try {
                const result = await originalGetAppointments.call(apiClient, date);
                
                // Якщо отримали результат, додаємо рік до відомих років
                if (result && result.length > 0) {
                    const dateObj = new Date(date);
                    this.knownYears.add(dateObj.getFullYear());
                }
                
                return result;
            } catch (error) {
                // Якщо помилка містить інформацію про невідповідність року
                if (error.message && error.message.includes('year')) {
                    Toast.warning('Можливо, запис має невідповідний рік. Спробуйте змінити рік у селекторі.', 'Підказка');
                }
                throw error;
            }
        };
    }
};

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        LegacySupport.init();
    }, 1000); // Затримка, щоб переконатися, що інші модулі вже ініціалізовані
});