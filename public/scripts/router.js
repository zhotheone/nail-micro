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
                
                // Додаємо ефект брижів при кліку (ripple effect)
                this.addRippleEffect(button, e);
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
        const tabContent = document.getElementById(`${tabId}-tab`);
        const tabButton = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        
        if (tabContent) {
            tabContent.classList.add('active');
        }
        
        if (tabButton) {
            tabButton.classList.add('active');
        }
        
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
        
        // Створюємо і диспетчеризуємо власну подію зміни вкладки
        const tabChangeEvent = new CustomEvent('tabChange', {
            detail: { tabId }
        });
        document.dispatchEvent(tabChangeEvent);
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
                // Тепер ініціалізація статистики відбувається через обробник події tabChange
                break;
        }
    },
    
    // Додавання ефекту брижів при кліку (ripple effect)
    addRippleEffect(button, event) {
        const x = event.clientX - button.getBoundingClientRect().left;
        const y = event.clientY - button.getBoundingClientRect().top;
        
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
};