// Виправлений метод closeToast у модулі Toast
const Toast = {
    container: null,
    queue: [],
    maxVisible: 3,
    visibleCount: 0,
    toasts: new Set(), // Зберігаємо активні тости для перевірки
    
    // Ініціалізація тостів
    init() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            document.body.appendChild(this.container);
        }
    },
    
    // Створення нового тосту
    create(options) {
        const defaultOptions = {
            type: 'info', // info, success, error, warning
            title: '',
            message: '',
            duration: 3000, // мс
            showProgress: true,
            closeOnClick: true
        };
        
        const settings = { ...defaultOptions, ...options };
        
        // Якщо забагато видимих тостів - додаємо в чергу
        if (this.visibleCount >= this.maxVisible) {
            this.queue.push(settings);
            return;
        }
        
        // Збільшуємо лічильник видимих тостів
        this.visibleCount++;
        
        // Створюємо елемент тосту
        const toast = document.createElement('div');
        toast.className = `toast toast-${settings.type}`;
        
        // Іконка тосту
        let icon = '';
        switch (settings.type) {
            case 'success':
                icon = '<i class="fas fa-check-circle"></i>';
                break;
            case 'error':
                icon = '<i class="fas fa-exclamation-circle"></i>';
                break;
            case 'warning':
                icon = '<i class="fas fa-exclamation-triangle"></i>';
                break;
            default:
                icon = '<i class="fas fa-info-circle"></i>';
        }
        
        // Вміст тосту
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                ${settings.title ? `<div class="toast-title">${settings.title}</div>` : ''}
                <div class="toast-message">${settings.message}</div>
            </div>
            <div class="toast-close">&times;</div>
            ${settings.showProgress ? '<div class="toast-progress"></div>' : ''}
        `;
        
        // Додаємо тост до контейнера
        this.container.appendChild(toast);
        
        // Додаємо до колекції активних тостів
        this.toasts.add(toast);
        
        // Відображаємо тост з анімацією
        setTimeout(() => {
            toast.classList.add('show');
            
            // Додаємо анімацію прогресу, якщо потрібно
            if (settings.showProgress) {
                const progressBar = toast.querySelector('.toast-progress');
                progressBar.classList.add('active');
            }
        }, 10);
        
        // Обробник закриття тосту
        const closeToast = () => {
            // Перевіряємо, чи тост ще існує в DOM і в колекції
            if (!this.toasts.has(toast)) {
                return;
            }
            
            toast.classList.remove('show');
            
            // Видаляємо тост із колекції
            this.toasts.delete(toast);
            
            setTimeout(() => {
                // Перевіряємо, чи тост ще в DOM
                if (toast.parentNode === this.container) {
                    this.container.removeChild(toast);
                }
                
                this.visibleCount--;
                
                // Якщо є тости в черзі - показуємо наступний
                if (this.queue.length > 0) {
                    const nextToast = this.queue.shift();
                    this.create(nextToast);
                }
            }, 300);
        };
        
        // Таймер для автоматичного закриття
        if (settings.duration > 0) {
            setTimeout(closeToast, settings.duration);
        }
        
        // Обробник кліка по кнопці закриття
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', closeToast);
        
        // Закриття по кліку на тост
        if (settings.closeOnClick) {
            toast.addEventListener('click', (e) => {
                // Перевіряємо, що клік не по кнопці закриття
                if (e.target !== closeBtn && !closeBtn.contains(e.target)) {
                    closeToast();
                }
            });
        }
        
        return toast;
    },
    
    // Методи для різних типів тостів
    success(message, title = 'Успіх', options = {}) {
        return this.create({ type: 'success', title, message, ...options });
    },
    
    error(message, title = 'Помилка', options = {}) {
        return this.create({ type: 'error', title, message, ...options });
    },
    
    warning(message, title = 'Увага', options = {}) {
        return this.create({ type: 'warning', title, message, ...options });
    },
    
    info(message, title = 'Інформація', options = {}) {
        return this.create({ type: 'info', title, message, ...options });
    }
};