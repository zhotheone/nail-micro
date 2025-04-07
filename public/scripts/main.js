// Головний файл додатка
document.addEventListener('DOMContentLoaded', () => {
    // Ініціалізація модулів та стану додатка
    const state = {
        selectedDate: new Date(),
        clients: [],
        procedures: [],
        appointments: [],
        schedule: [],
        currentView: 'week',
        currentTab: 'schedule',
        loading: {
            clients: false,
            procedures: false,
            appointments: false,
            schedule: false
        },
        error: null
    };
    
    // Оголошення глобального стану для інших модулів
    window.appState = state;
    
    // Ініціалізація модулів
    initializeApp();
    
    // Ініціалізація усіх модулів
    function initializeApp() {
        console.log('🚀 Ініціалізація додатку Nail Master App...');
        
        // Ініціалізація базових модулів
        Toast.init();
        Router.init();
        Ripple.init();
        
        // Ініціалізація функціональних модулів
        Calendar.init();
        Appointments.init();
        Clients.init();
        Procedures.init();
        Forms.init();
        Modals.init();
        Schedule.init();
        
        // Ініціалізація плаваючої кнопки для додавання
        initAddButton();
        
        // Завантаження початкових даних для активної вкладки
        loadInitialData();
        
        // Додавання ефекту прокрутки для заголовків
        setupScrollEffects();
        
        console.log('✅ Додаток ініціалізовано успішно');
    }
    
    // Обробник для плаваючої кнопки додавання
    function initAddButton() {
        const addButton = document.getElementById('add-button');
        
        if (!addButton) return;
        
        addButton.addEventListener('click', () => {
            const currentTab = state.currentTab;
            
            switch(currentTab) {
                case 'schedule':
                    Modals.openBookingModal();
                    break;
                case 'clients':
                    Modals.openClientModal();
                    break;
                case 'procedures':
                    Modals.openProcedureModal();
                    break;
                case 'stats':
                    Toast.info('Статистика доступна тільки для перегляду.');
                    break;
            }
        });
    }
    
    // Завантаження початкових даних
    function loadInitialData() {
        // Отримання активної вкладки
        const activeTab = document.querySelector('.tab-content.active');
        
        if (!activeTab) return;
        
        const tabId = activeTab.id.split('-')[0];
        
        // Встановлення активної вкладки в стані
        state.currentTab = tabId;
        
        // Завантаження даних в залежності від активної вкладки
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
                // Статистика ініціалізується через обробник події tabChange
                // Створюємо подію зміни вкладки для ініціалізації статистики
                document.dispatchEvent(new CustomEvent('tabChange', {
                    detail: { tabId: 'stats' }
                }));
                break;
        }
    }
    
    // Налаштування ефектів при прокрутці
    function setupScrollEffects() {
        window.addEventListener('scroll', () => {
            // Фіксація пошукових контейнерів при прокрутці
            const searchContainer = document.querySelector('.search-container');
            const filterContainer = document.querySelector('.filter-container');
            
            if (searchContainer) {
                if (window.scrollY > 50) {
                    searchContainer.classList.add('scrolled');
                } else {
                    searchContainer.classList.remove('scrolled');
                }
            }
            
            if (filterContainer) {
                if (window.scrollY > 50) {
                    filterContainer.classList.add('scrolled');
                } else {
                    filterContainer.classList.remove('scrolled');
                }
            }
        });
    }
});