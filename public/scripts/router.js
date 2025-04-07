// Модуль маршрутизації для переключення між вкладками
const Router = {
    // Ініціалізація маршрутизатора
    init() {
        // Отримання всіх кнопок вкладок
        const tabButtons = document.querySelectorAll('.tab-btn');
        
        // Додавання обробників подій для кнопок
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = button.getAttribute('data-tab');
                this.navigateTo(tabId);
            });
        });
        
        // Перевірка URL на наявність хеша для початкової навігації
        if (window.location.hash) {
            const tabId = window.location.hash.substring(1);
            const validTabs = ['schedule', 'clients', 'procedures', 'stats'];
            
            if (validTabs.includes(tabId)) {
                this.navigateTo(tabId, false);
            }
        }
        
        // Додавання обробника зміни хеша
        window.addEventListener('hashchange', () => {
            if (window.location.hash) {
                const tabId = window.location.hash.substring(1);
                const validTabs = ['schedule', 'clients', 'procedures', 'stats'];
                
                if (validTabs.includes(tabId)) {
                    this.navigateTo(tabId, false);
                }
            }
        });
    },
    
    // Функція для переходу на вкладку
    navigateTo(tabId, updateHash = true) {
        const appState = window.appState;
        
        // Якщо вкладка вже відкрита, нічого не робимо
        if (appState.currentTab === tabId) return;
        
        // Сховати всі вкладки і зняти активний клас з кнопок
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-btn').forEach(button => {
            button.classList.remove('active');
        });
        
        // Показати вибрану вкладку і встановити активний клас для кнопки
        document.getElementById(`${tabId}-tab`).classList.add('active');
        document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
        
        // Оновлення стану додатка
        appState.currentTab = tabId;
        
        // Оновлення хеша URL, якщо потрібно
        if (updateHash) {
            window.location.hash = tabId;
        }
        
        // Завантаження даних для вкладки
        this.loadTabData(tabId);
        
        // Скрол до верху вкладки
        window.scrollTo(0, 0);
    },
    
    // Завантаження даних для вибраної вкладки
    loadTabData(tabId) {
        switch(tabId) {
            case 'schedule':
                Calendar.renderCalendar();
                Appointments.loadAppointmentsForSelectedDate();
                break;
            case 'clients':
                Clients.loadClients();
                break;
            case 'procedures':
                Procedures.loadProcedures();
                break;
            case 'stats':
                Stats.init();
                Stats.loadStatistics();
                break;
        }
    }
};