// Модуль для роботи зі статистикою
const Stats = {
    currentPeriod: 'month',
    charts: {},
    
    // Ініціалізація
    init() {
        console.log('Ініціалізація модуля статистики');
        
        // Додаємо елемент для відображення діапазону дат, якщо ще не існує
        this.addDateRangeElement();
        
        // Налаштування кнопок вибору періоду
        const periodButtons = document.querySelectorAll('.period-btn');
        periodButtons.forEach(period => {
            period.addEventListener('click', () => {
                // Зміна активної кнопки
                periodButtons.forEach(btn => btn.classList.remove('active'));
                period.classList.add('active');
                
                // Зміна періоду та оновлення статистики
                this.currentPeriod = period.dataset.period;
                
                // Оновлення відображення діапазону дат
                this.updateDateRangeText();
                
                // Завантаження статистики
                this.loadStatistics();
            });
        });
        
        // Оновлюємо відображення діапазону дат при ініціалізації
        this.updateDateRangeText();
        
        // Запуск завантаження статистики при ініціалізації
        setTimeout(() => {
            this.loadStatistics();
        }, 100);
    },
    
    // Додавання елемента для відображення діапазону дат
    addDateRangeElement() {
        const statsHeader = document.querySelector('.stats-header');
        if (!statsHeader) return;
        
        // Перевіряємо, чи вже існує елемент
        if (document.getElementById('stats-date-range')) return;
        
        // Створюємо елемент для відображення діапазону дат
        const dateRangeElement = document.createElement('div');
        dateRangeElement.id = 'stats-date-range';
        dateRangeElement.className = 'stats-date-range';
        
        // Додаємо елемент після селектора періоду
        const periodSelector = statsHeader.querySelector('.period-selector');
        if (periodSelector && periodSelector.parentNode) {
            periodSelector.parentNode.insertBefore(dateRangeElement, periodSelector.nextSibling);
        } else {
            statsHeader.appendChild(dateRangeElement);
        }
    },
    
    // Оновлення тексту діапазону дат
    updateDateRangeText() {
        const dateRangeElement = document.getElementById('stats-date-range');
        if (!dateRangeElement) return;
        
        const { startDate, endDate } = this.getDateRange(this.currentPeriod);
        
        // Форматування дат
        const formatDate = (date) => {
            return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
        };
        
        // Оновлення тексту
        const rangeText = `${formatDate(startDate)} - ${formatDate(endDate)}`;
        dateRangeElement.innerHTML = `<i class="fas fa-calendar-alt"></i> ${rangeText}`;
    },
    
    // Завантаження та відображення статистики
    async loadStatistics() {
        try {
            console.log('Завантаження статистики для періоду:', this.currentPeriod);
            // Показуємо лоадери
            this.showLoaders();
            
            // Паралельне завантаження всіх даних статистики
            const [stats, earningsData, topClients, topProcedures, topDays] = await Promise.all([
                this.fetchStats(),
                this.fetchEarningsData(),
                this.fetchTopClients(),
                this.fetchTopProcedures(),
                this.fetchTopDays()
            ]);
            
            // Відображаємо дані
            if (stats) this.renderStats(stats);
            if (earningsData) this.renderEarningsChart(earningsData);
            if (topProcedures) this.renderProceduresChart(topProcedures);
            if (topClients) this.renderTopClients(topClients);
            if (topDays) this.renderTopDays(topDays);
            
        } catch (error) {
            console.error('Помилка завантаження статистики:', error);
            Toast.error('Не вдалося завантажити статистику. Спробуйте пізніше.');
        }
    },
    
    // Завантаження загальної статистики
    async fetchStats() {
        try {
            return await apiClient.getStats(this.currentPeriod);
        } catch (error) {
            console.error('Помилка завантаження загальної статистики:', error);
            this.showErrorMessage('#total-earnings', 'Помилка завантаження');
            this.showErrorMessage('#total-clients', 'Помилка завантаження');
            this.showErrorMessage('#total-appointments', 'Помилка завантаження');
            this.showErrorMessage('#avg-earning', 'Помилка завантаження');
            return null;
        }
    },
    
    // Завантаження даних про доходи
    async fetchEarningsData() {
        try {
            return await apiClient.getEarningsStats(this.currentPeriod);
        } catch (error) {
            console.error('Помилка завантаження даних про доходи:', error);
            this.showErrorMessage('#earnings-chart', 'Не вдалося завантажити дані про доходи');
            return null;
        }
    },
    
    // Завантаження даних про топ клієнтів
    async fetchTopClients() {
        try {
            return await apiClient.getTopClients(this.currentPeriod, 5);
        } catch (error) {
            console.error('Помилка завантаження даних про топ клієнтів:', error);
            this.showErrorMessage('#top-clients', 'Не вдалося завантажити дані про найкращих клієнтів');
            return null;
        }
    },
    
    // Завантаження даних про топ процедури
    async fetchTopProcedures() {
        try {
            return await apiClient.getTopProcedures(this.currentPeriod, 5);
        } catch (error) {
            console.error('Помилка завантаження даних про топ процедури:', error);
            this.showErrorMessage('#procedures-chart', 'Не вдалося завантажити дані про найпопулярніші процедури');
            return null;
        }
    },
    
    // Завантаження даних про найкращі дні
    async fetchTopDays() {
        try {
            return await apiClient.getTopDays(this.currentPeriod, 5);
        } catch (error) {
            console.error('Помилка завантаження даних про найкращі дні:', error);
            this.showErrorMessage('#top-days', 'Не вдалося завантажити дані про найкращі дні');
            return null;
        }
    },
    
    // Відображення повідомлення про помилку
    showErrorMessage(selector, message) {
        const container = document.querySelector(selector);
        if (container) {
            container.innerHTML = `
                <div class="stats-empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    },
    
    // Відображення основних показників
    renderStats(stats) {
        // Форматування чисел для відображення
        const formatter = new Intl.NumberFormat('uk-UA', {
            style: 'currency',
            currency: 'UAH',
            minimumFractionDigits: 0
        });
        
        // Заповнення карток статистики
        document.querySelector('#total-earnings .stats-card-value').innerHTML = 
            formatter.format(stats.totalEarnings);
            
        document.querySelector('#total-clients .stats-card-value').innerHTML = 
            `${stats.clientsCount} <small>клієнтів</small>`;
            
        document.querySelector('#total-appointments .stats-card-value').innerHTML = 
            `${stats.appointmentsCount} <small>записів</small>`;
            
        document.querySelector('#avg-earning .stats-card-value').innerHTML = 
            formatter.format(stats.avgEarning);
        
        // Додаємо тренди, якщо вони є
        if (stats.trends) {
            this.renderTrend('#total-earnings', stats.trends.earnings);
            this.renderTrend('#total-clients', stats.trends.clients);
            this.renderTrend('#total-appointments', stats.trends.appointments);
            this.renderTrend('#avg-earning', stats.trends.avgEarning);
        }
    },
    
    // Додавання індикаторів тренду
    renderTrend(selector, trend) {
        if (!trend) return;
        
        const container = document.querySelector(`${selector} .stats-card-value`);
        if (!container) return;
        
        // Видаляємо попередній індикатор тренду, якщо є
        const existingTrend = container.querySelector('.stats-card-trend');
        if (existingTrend) {
            existingTrend.remove();
        }
        
        const trendElement = document.createElement('div');
        trendElement.className = `stats-card-trend ${trend.direction === 'up' ? 'positive' : 'negative'}`;
        trendElement.innerHTML = `
            <i class="fas fa-${trend.direction === 'up' ? 'arrow-up' : 'arrow-down'}"></i>
            ${Math.abs(trend.percent).toFixed(1)}%
        `;
        
        container.appendChild(trendElement);
    },
    
    // Графік доходів
    renderEarningsChart(data) {
        const container = document.getElementById('earnings-chart');
        
        if (!container) {
            console.error('Елемент для графіка доходів не знайдено');
            return;
        }
        
        // Створюємо canvas для графіка, якщо його ще немає
        let canvas = container.querySelector('canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            container.innerHTML = '';
            container.appendChild(canvas);
        }
        
        // Перевірка наявності даних
        if (!data.labels || !data.earnings || data.labels.length === 0) {
            container.innerHTML = `
                <div class="stats-empty-state">
                    <i class="fas fa-chart-bar"></i>
                    <p>Немає даних за вибраний період</p>
                </div>
            `;
            return;
        }
        
        // Перевірка наявності об'єкта графіка для оновлення
        if (this.charts.earnings) {
            this.charts.earnings.destroy();
        }
        
        // Отримання змінних CSS
        const style = getComputedStyle(document.documentElement);
        const primaryColor = style.getPropertyValue('--md-primary').trim() || '#eb6f92';
        const onBackgroundColor = style.getPropertyValue('--md-on-background').trim() || '#e0def4';
        const backgroundColor = style.getPropertyValue('--md-background').trim() || '#191724';
        const surfaceVariantColor = style.getPropertyValue('--md-surface-variant').trim() || '#26233a';
        const textMediumColor = style.getPropertyValue('--md-text-medium').trim() || 'rgba(224, 222, 244, 0.7)';
        
        // Створення налаштувань графіка
        const chartConfig = {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Доходи',
                    data: data.earnings,
                    borderColor: primaryColor,
                    backgroundColor: 'rgba(235, 111, 146, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: primaryColor,
                    pointBorderColor: backgroundColor,
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: surfaceVariantColor,
                        titleColor: onBackgroundColor,
                        bodyColor: textMediumColor,
                        borderWidth: 0,
                        padding: 10,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += new Intl.NumberFormat('uk-UA', {
                                    style: 'currency',
                                    currency: 'UAH',
                                    minimumFractionDigits: 0
                                }).format(context.parsed.y);
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(224, 222, 244, 0.1)'
                        },
                        ticks: {
                            color: textMediumColor,
                            font: {
                                family: "'Fira Code', monospace",
                                size: 11
                            },
                            callback: function(value) {
                                return new Intl.NumberFormat('uk-UA', {
                                    style: 'currency',
                                    currency: 'UAH',
                                    minimumFractionDigits: 0,
                                    notation: 'compact'
                                }).format(value);
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: textMediumColor,
                            font: {
                                family: "'Fira Code', monospace",
                                size: 11
                            }
                        }
                    }
                }
            }
        };
        
        // Переконуємося, що Chart.js доступний
        if (typeof Chart !== 'undefined') {
            // Створення графіка
            this.charts.earnings = new Chart(canvas, chartConfig);
        } else {
            console.error('Chart.js не знайдено');
            container.innerHTML = `
                <div class="stats-empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Не вдалося ініціалізувати графік. Chart.js не знайдено.</p>
                </div>
            `;
        }
    },
    
    // Графік популярних процедур
    renderProceduresChart(data) {
        const container = document.getElementById('procedures-chart');
        
        if (!container) {
            console.error('Елемент для графіка процедур не знайдено');
            return;
        }
        
        // Створюємо canvas для графіка, якщо його ще немає
        let canvas = container.querySelector('canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            container.innerHTML = '';
            container.appendChild(canvas);
        }
        
        // Переконуємося, що у нас є дані
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="stats-empty-state">
                    <i class="fas fa-chart-pie"></i>
                    <p>Немає даних про процедури за вибраний період</p>
                </div>
            `;
            return;
        }
        
        // Перевірка наявності об'єкта графіка для оновлення
        if (this.charts.procedures) {
            this.charts.procedures.destroy();
        }
        
        // Отримання змінних CSS
        const style = getComputedStyle(document.documentElement);
        const primaryColor = style.getPropertyValue('--md-primary').trim() || '#eb6f92';
        const secondaryColor = style.getPropertyValue('--md-secondary').trim() || '#9ccfd8';
        const secondaryDarkColor = style.getPropertyValue('--md-secondary-dark').trim() || '#31748f';
        const warningColor = style.getPropertyValue('--md-warning').trim() || '#f6c177';
        const irisColor = style.getPropertyValue('--iris').trim() || '#c4a7e7';
        const backgroundColor = style.getPropertyValue('--md-background').trim() || '#191724';
        const textMediumColor = style.getPropertyValue('--md-text-medium').trim() || 'rgba(224, 222, 244, 0.7)';
        const onBackgroundColor = style.getPropertyValue('--md-on-background').trim() || '#e0def4';
        // Додана відсутня змінна
        const surfaceVariantColor = style.getPropertyValue('--md-surface-variant').trim() || '#26233a';
        
        // Кольори для графіка
        const colors = [
            primaryColor,
            secondaryColor,
            secondaryDarkColor,
            warningColor,
            irisColor
        ];
        
        // Налаштування графіка
        const chartConfig = {
            type: 'doughnut',
            data: {
                labels: data.map(item => item.name),
                datasets: [{
                    data: data.map(item => item.count),
                    backgroundColor: colors,
                    borderColor: backgroundColor,
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: onBackgroundColor,
                            padding: 15,
                            font: {
                                family: "'Fira Code', monospace",
                                size: 12
                            },
                            generateLabels: function(chart) {
                                const original = Chart.overrides.doughnut.plugins.legend.labels.generateLabels;
                                const labels = original.call(this, chart);
                                
                                labels.forEach((label, i) => {
                                    // Додаємо кількість до мітки
                                    if (i < data.length) {
                                        const count = data[i].count;
                                        label.text = `${label.text} (${count})`;
                                    }
                                });
                                
                                return labels;
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: surfaceVariantColor,
                        titleColor: onBackgroundColor,
                        bodyColor: textMediumColor,
                        borderWidth: 0,
                        padding: 10,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };
        
        // Переконуємося, що Chart.js доступний
        if (typeof Chart !== 'undefined') {
            // Створення графіка
            this.charts.procedures = new Chart(canvas, chartConfig);
        } else {
            console.error('Chart.js не знайдено');
            container.innerHTML = `
                <div class="stats-empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Не вдалося ініціалізувати графік. Chart.js не знайдено.</p>
                </div>
            `;
        }
    },
    
    // Таблиця топ-клієнтів
    renderTopClients(clients) {
        const container = document.getElementById('top-clients');
        
        if (!container) {
            console.error('Контейнер для топ-клієнтів не знайдено');
            return;
        }
        
        if (!clients || clients.length === 0) {
            container.innerHTML = `
                <div class="stats-empty-state">
                    <i class="fas fa-users"></i>
                    <p>Немає даних про клієнтів за вибраний період</p>
                </div>
            `;
            return;
        }
        
        // Форматування суми
        const formatter = new Intl.NumberFormat('uk-UA', {
            style: 'currency',
            currency: 'UAH',
            minimumFractionDigits: 0
        });
        
        // Створення таблиці
        let tableHTML = `
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Клієнт</th>
                        <th>Візитів</th>
                        <th>Сума</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Додавання рядків таблиці
        clients.forEach(client => {
            tableHTML += `
                <tr>
                    <td>${client.name} ${client.surName}</td>
                    <td>${client.visits}</td>
                    <td>${formatter.format(client.totalSpent)}</td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
    },
    
    // Таблиця топ-днів
    renderTopDays(days) {
        const container = document.getElementById('top-days');
        
        if (!container) {
            console.error('Контейнер для топ-днів не знайдено');
            return;
        }
        
        if (!days || days.length === 0) {
            container.innerHTML = `
                <div class="stats-empty-state">
                    <i class="fas fa-calendar-day"></i>
                    <p>Немає даних про дні за вибраний період</p>
                </div>
            `;
            return;
        }
        
        // Форматування суми
        const formatter = new Intl.NumberFormat('uk-UA', {
            style: 'currency',
            currency: 'UAH',
            minimumFractionDigits: 0
        });
        
        // Назви днів тижня
        const weekdays = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота'];
        
        // Створення таблиці
        let tableHTML = `
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Дата</th>
                        <th>Записів</th>
                        <th>Дохід</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Додавання рядків таблиці
        days.forEach(day => {
            const date = new Date(day.date);
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')} (${weekdays[date.getDay()]})`;
            
            tableHTML += `
                <tr>
                    <td>${formattedDate}</td>
                    <td>${day.appointmentsCount}</td>
                    <td>${formatter.format(day.earnings)}</td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
    },
    
    getDateRange(period) {
        const now = new Date();
        const startDate = new Date();
        
        switch(period) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate.setMonth(now.getMonth() - 1); // За замовчуванням - місяць
        }
        
        // Встановлюємо час початку і кінця дня
        startDate.setHours(0, 0, 0, 0);
        
        return { startDate, endDate: now };
    },
    
    // Показати індикатори завантаження
    showLoaders() {
        const loaderHTML = '<div class="loader"></div>';
        
        // Картки статистики
        const statCards = ['total-earnings', 'total-clients', 'total-appointments', 'avg-earning'];
        statCards.forEach(id => {
            const element = document.querySelector(`#${id} .stats-card-value`);
            if (element) element.innerHTML = loaderHTML;
        });
        
        // Графіки
        const chartContainers = ['earnings-chart', 'procedures-chart'];
        chartContainers.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                // Очищаємо Canvas перед показом лоадера
                if (this.charts[id.split('-')[0]]) {
                    this.charts[id.split('-')[0]].destroy();
                    this.charts[id.split('-')[0]] = null;
                }
                // Показуємо лоадер
                element.innerHTML = `<div class="loading-container">${loaderHTML}<p>Завантаження даних...</p></div>`;
            }
        });
        
        // Таблиці
        const tableContainers = ['top-clients', 'top-days'];
        tableContainers.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.innerHTML = `<div class="loading-container">${loaderHTML}</div>`;
        });
    }
};

// Глобальна змінна для доступу до Chart.js
let Chart;

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    // Перевіряємо, чи відкрита вкладка статистики
    if (document.getElementById('stats-tab') && document.getElementById('stats-tab').classList.contains('active')) {
        // Перевіряємо наявність Chart.js
        if (window.Chart) {
            Chart = window.Chart;
            Stats.init();
        } else {
            console.error('Chart.js не знайдено. Завантажуємо Chart.js динамічно');
            // Динамічне завантаження Chart.js
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
            script.onload = () => {
                Chart = window.Chart;
                Stats.init();
            };
            script.onerror = () => {
                console.error('Помилка завантаження Chart.js');
                Toast.error('Не вдалося завантажити необхідні бібліотеки для статистики');
            };
            document.head.appendChild(script);
        }
    }
});

// Обробник події зміни вкладки
document.addEventListener('tabChange', (e) => {
    if (e.detail.tabId === 'stats') {
        // Перевіряємо наявність Chart.js
        if (window.Chart) {
            Chart = window.Chart;
            Stats.init();
        } else {
            console.error('Chart.js не знайдено. Завантажуємо Chart.js динамічно');
            // Динамічне завантаження Chart.js
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
            script.onload = () => {
                Chart = window.Chart;
                Stats.init();
            };
            script.onerror = () => {
                console.error('Помилка завантаження Chart.js');
                Toast.error('Не вдалося завантажити необхідні бібліотеки для статистики');
            };
            document.head.appendChild(script);
        }
    }
});