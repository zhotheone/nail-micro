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
    Router.init();
    Calendar.init();
    Appointments.init();
    Clients.init();
    Procedures.init();
    Forms.init();
    Modals.init();
    
    // Ініціалізація плаваючої кнопки для додавання
    initAddButton();
    
    // Завантаження початкових даних для активної вкладки
    loadInitialData();
    
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
        const activeTab = document.querySelector('.tab-content.active').id.split('-')[0];
        
        // Встановлення активної вкладки в стані
        state.currentTab = activeTab;
        
        // Завантаження даних в залежності від активної вкладки
        switch(activeTab) {
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
});