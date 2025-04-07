// Модуль для роботи з плаваючою кнопкою додавання (FAB)
const FAB = {
    // Ініціалізація
    init() {
        // Отримуємо елементи FAB
        this.container = document.getElementById('fab-container');
        this.mainButton = document.getElementById('fab-main');
        this.overlay = document.getElementById('fab-overlay');
        this.addAppointmentButton = document.getElementById('fab-add-appointment');
        this.addClientButton = document.getElementById('fab-add-client');
        this.addProcedureButton = document.getElementById('fab-add-procedure');
        
        // Додаємо обробники подій
        this.setupEventListeners();
        
        // Додаємо адаптивність до поточної вкладки
        this.updateVisibilityBasedOnTab();
    },
    
    // Налаштування обробників подій
    setupEventListeners() {
        // Головна кнопка - відкриття/закриття меню
        if (this.mainButton) {
            this.mainButton.addEventListener('click', (e) => {
                this.toggleMenu();
                this.addRippleEffect(e);
            });
        }
        
        // Накладка для закриття меню
        if (this.overlay) {
            this.overlay.addEventListener('click', () => {
                this.closeMenu();
            });
        }
        
        // Мініатюрні кнопки для конкретних дій
        if (this.addAppointmentButton) {
            this.addAppointmentButton.addEventListener('click', (e) => {
                this.addRippleEffect(e);
                Modals.openBookingModal();
                this.closeMenu();
            });
        }
        
        if (this.addClientButton) {
            this.addClientButton.addEventListener('click', (e) => {
                this.addRippleEffect(e);
                Modals.openClientModal();
                this.closeMenu();
            });
        }
        
        if (this.addProcedureButton) {
            this.addProcedureButton.addEventListener('click', (e) => {
                this.addRippleEffect(e);
                Modals.openProcedureModal();
                this.closeMenu();
            });
        }
        
        // Оновлення при зміні вкладки
        document.addEventListener('tabChange', (e) => {
            this.updateVisibilityBasedOnTab(e.detail?.tabId);
        });
        
        // Закриття меню при скролі
        window.addEventListener('scroll', () => {
            if (this.isMenuOpen()) {
                this.closeMenu();
            }
        });
        
        // Закриття меню при натисканні Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen()) {
                this.closeMenu();
            }
        });
    },
    
    // Відкриття/закриття меню FAB
    toggleMenu() {
        if (this.isMenuOpen()) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    },
    
    // Відкриття меню
    openMenu() {
        this.container.classList.add('active');
        this.mainButton.classList.add('active');
        this.overlay.classList.add('active');
        document.body.classList.add('fab-menu-open');
    },
    
    // Закриття меню
    closeMenu() {
        this.container.classList.remove('active');
        this.mainButton.classList.remove('active');
        this.overlay.classList.remove('active');
        document.body.classList.remove('fab-menu-open');
    },
    
    // Перевірка, чи меню відкрите
    isMenuOpen() {
        return this.container.classList.contains('active');
    },
    
    // Оновлення видимості кнопок залежно від активної вкладки
    // Виправлена функція updateVisibilityBasedOnTab в fab.js
    updateVisibilityBasedOnTab(tabId) {
        if (!tabId) {
            // Якщо tabId не вказано, витягуємо з appState
            tabId = window.appState?.currentTab;
        }
        
        // За замовчуванням показуємо всі кнопки
        if (this.addAppointmentButton) this.addAppointmentButton.style.display = 'flex';
        if (this.addClientButton) this.addClientButton.style.display = 'flex';
        if (this.addProcedureButton) this.addProcedureButton.style.display = 'flex';
        
        // Приховуємо кнопку FAB на вкладці статистики
        if (this.container) {
            this.container.style.display = tabId === 'stats' ? 'none' : 'flex';
        }
        
        // Визначаємо, яка з міні-кнопок має бути головною (знизу) для поточної вкладки
        if (tabId) {
            // Змінні для відстеження порядку кнопок
            let topButton = null;
            let middleButton = null;
            let bottomButton = null;
            
            switch (tabId) {
                case 'schedule':
                    // На вкладці розкладу, "Додати запис" повинна бути знизу
                    bottomButton = this.addAppointmentButton;
                    middleButton = this.addClientButton;
                    topButton = this.addProcedureButton;
                    break;
                    
                case 'clients':
                    // На вкладці клієнтів, "Додати клієнта" повинна бути знизу
                    bottomButton = this.addClientButton;
                    middleButton = this.addAppointmentButton;
                    topButton = this.addProcedureButton;
                    break;
                    
                case 'procedures':
                    // На вкладці процедур, "Додати процедуру" повинна бути знизу
                    bottomButton = this.addProcedureButton;
                    middleButton = this.addAppointmentButton;
                    topButton = this.addClientButton;
                    break;
            }
            
            // Встановлюємо порядок відображення кнопок, якщо вони визначені
            if (bottomButton && middleButton && topButton) {
                // Встановлюємо z-index, щоб нижня кнопка була попереду
                bottomButton.style.zIndex = '3';
                middleButton.style.zIndex = '2';
                topButton.style.zIndex = '1';
                
                // Встановлюємо порядок у DOM, щоб кнопки анімувалися в правильному порядку
                if (this.container) {
                    // Очищаємо спочатку контейнер від всіх міні-кнопок
                    const mainButton = this.mainButton;
                    const buttonsToPrepend = [];
                    
                    // Тимчасово зберігаємо всі міні-кнопки
                    if (bottomButton && bottomButton.parentNode === this.container) {
                        this.container.removeChild(bottomButton);
                        buttonsToPrepend.push(bottomButton);
                    }
                    if (middleButton && middleButton.parentNode === this.container) {
                        this.container.removeChild(middleButton);
                        buttonsToPrepend.push(middleButton);
                    }
                    if (topButton && topButton.parentNode === this.container) {
                        this.container.removeChild(topButton);
                        buttonsToPrepend.push(topButton);
                    }
                    
                    // Переконуємося, що головна кнопка (FAB) на самому початку контейнера
                    // Це важливо, тому що flex-direction: column-reverse в CSS забезпечить 
                    // розташування головної кнопки знизу
                    if (this.mainButton && this.mainButton.parentNode === this.container) {
                        this.container.removeChild(this.mainButton);
                    }
                    this.container.appendChild(this.mainButton);
                    
                    // Додаємо міні-кнопки в потрібному порядку
                    // Вони будуть розташовані над головною кнопкою через CSS flex-direction: column-reverse
                    this.container.appendChild(bottomButton);
                    this.container.appendChild(middleButton);
                    this.container.appendChild(topButton);
                }
            }
        }
    },
    
    // Додавання ефекту хвиль при кліку
    addRippleEffect(event) {
        const button = event.currentTarget;
        
        // Створення елемента ефекту
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        
        // Розрахунок розміру ефекту (більший з розмірів кнопки)
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;
        
        // Розміщення і розміри ефекту
        ripple.style.width = ripple.style.height = `${diameter}px`;
        ripple.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
        ripple.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
        
        // Додавання ефекту до кнопки
        button.appendChild(ripple);
        
        // Видалення ефекту після анімації
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
};

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    FAB.init();
});