// Модуль для ефекту брижі (ripple effect) в стилі Material Design
const Ripple = {
    init() {
        // Додавання обробників для всіх кнопок з матеріальним стилем
        this.addRippleToButtons();
        
        // Додавання оновлення ефекту при динамічних змінах DOM
        this.observeDOMChanges();
    },
    
    // Додавання ефекту брижі до кнопок
    addRippleToButtons() {
        // Селектори для елементів, які повинні мати ефект брижі
        const selectors = [
            '.btn-primary',
            '.btn-secondary',
            '.action-btn',
            '.period-btn',
            '.view-toggle-btn',
            '.calendar-nav-btn',
            '.month-day',
            '.day-header'
        ];
        
        // Для кожного селектора знаходимо елементи і додаємо обробник
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(button => {
                // Пропускаємо елементи, які вже мають обробник
                if (button.hasAttribute('data-ripple')) return;
                
                button.setAttribute('data-ripple', 'true');
                button.addEventListener('click', this.createRippleEffect);
            });
        });
    },
    
    // Створення ефекту брижі при кліку
    createRippleEffect(event) {
        const button = event.currentTarget;
        
        // Позиція кліку відносно кнопки
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Розмір брижі (більше з висоти або ширини елемента * 2)
        const size = Math.max(button.offsetWidth, button.offsetHeight) * 2;
        
        // Створення елемента брижі
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${x - size/2}px`;
        ripple.style.top = `${y - size/2}px`;
        
        // Прибирання існуючих брижів, якщо вони є
        button.querySelectorAll('.ripple').forEach(oldRipple => {
            oldRipple.remove();
        });
        
        // Додавання брижі
        button.appendChild(ripple);
        
        // Видалення брижі після анімації
        setTimeout(() => {
            ripple.remove();
        }, 600);
    },
    
    // Спостереження за змінами DOM для додавання ефекту до нових елементів
    observeDOMChanges() {
        // Створення MutationObserver
        const observer = new MutationObserver((mutations) => {
            // Перевірка, чи були додані нові вузли
            let shouldUpdate = false;
            
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0) {
                    shouldUpdate = true;
                }
            });
            
            // Якщо були додані нові вузли, оновлюємо ефекти
            if (shouldUpdate) {
                this.addRippleToButtons();
            }
        });
        
        // Налаштування і запуск спостереження
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
};

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    Ripple.init();
});