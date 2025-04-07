// Модуль для роботи зі статистикою
const Stats = {
    currentPeriod: 'month',
    charts: {},
    
    // Ініціалізація
    init() {
        // Налаштування кнопок вибору періоду
        const periodButtons = document.querySelectorAll('.period-btn');
        periodButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Зміна активної кнопки
                periodButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Зміна періоду та оновлення статистики
                this.currentPeriod = button.dataset.period;
                this.loadStatistics();
            });
        });
        
        // Запуск завантаження статистики
        this.loadStatistics();
    },
    
    // Завантаження та відображення статистики
    async loadStatistics() {
        try {
            // Показуємо лоадери
            this.showLoaders();
            
            // Отримуємо дані статистики
            const stats = await apiClient.getStats(this.currentPeriod);
            const earningsData = await apiClient.getEarningsStats(this.currentPeriod);
            const topClients = await apiClient.getTopClients(this.currentPeriod, 5);
            const topProcedures = await apiClient.getTopProcedures(this.currentPeriod, 5);
            const topDays = await apiClient.getTopDays(this.currentPeriod, 5);
            
            // Відображаємо дані
            this.renderStats(stats);
            this.renderEarningsChart(earningsData);
            this.renderProceduresChart(topProcedures);
            this.renderTopClients(topClients);
            this.renderTopDays(topDays);
            
        } catch (error) {
            console.error('Помилка завантаження статистики:', error);
            Toast.error('Не вдалося завантажити статистику. Спробуйте пізніше.');
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
        const ctx = document.getElementById('earnings-chart');
        
        if (!ctx) {
            console.error('Елемент для графіка доходів не знайдено');
            return;
        }
        
        // Перевірка наявності об'єкта графіка для оновлення
        if (this.charts.earnings) {
            this.charts.earnings.destroy();
        }
        
        // Отримання змінних CSS
        const style = getComputedStyle(document.documentElement);
        const primaryColor = style.getPropertyValue('--primary-color').trim() || '#ebbcba';
        const foamColor = style.getPropertyValue('--foam').trim() || '#9ccfd8';
        const baseColor = style.getPropertyValue('--base').trim() || '#191724';
        const overlayColor = style.getPropertyValue('--overlay').trim() || '#26233a';
        const borderColor = style.getPropertyValue('--border-color').trim() || '#6e6a86';
        const textColor = style.getPropertyValue('--text').trim() || '#e0def4';
        const subtleColor = style.getPropertyValue('--subtle').trim() || '#908caa';
        
        // Створення налаштувань графіка
        const chartConfig = {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Доходи',
                    data: data.earnings,
                    borderColor: primaryColor,
                    backgroundColor: 'rgba(235, 188, 186, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: foamColor,
                    pointBorderColor: baseColor,
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
                        backgroundColor: overlayColor,
                        titleColor: textColor,
                        bodyColor: subtleColor,
                        borderColor: borderColor,
                        borderWidth: 1,
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
                            color: 'rgba(110, 106, 134, 0.1)'
                        },
                        ticks: {
                            color: subtleColor,
                            callback: function(value) {
                                return new Intl.NumberFormat('uk-UA', {
                                    style: 'currency',
                                    currency: 'UAH',
                                    minimumFractionDigits: 0
                                }).format(value);
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: subtleColor
                        }
                    }
                }
            }
        };
        
        // Створення графіка
        this.charts.earnings = new Chart(ctx, chartConfig);
    },
    
    // Графік популярних процедур
    renderProceduresChart(data) {
        const ctx = document.getElementById('procedures-chart');
        
        if (!ctx) {
            console.error('Елемент для графіка процедур не знайдено');
            return;
        }
        
        // Перевірка наявності об'єкта графіка для оновлення
        if (this.charts.procedures) {
            this.charts.procedures.destroy();
        }
        
        // Отримання змінних CSS
        const style = getComputedStyle(document.documentElement);
        const primaryColor = style.getPropertyValue('--primary-color').trim() || '#ebbcba';
        const irisColor = style.getPropertyValue('--iris').trim() || '#c4a7e7';
        const pineColor = style.getPropertyValue('--pine').trim() || '#31748f';
        const foamColor = style.getPropertyValue('--foam').trim() || '#9ccfd8';
        const goldColor = style.getPropertyValue('--gold').trim() || '#f6c177';
        
        // Кольори для графіка
        const colors = [
            primaryColor,
            irisColor,
            pineColor,
            foamColor,
            goldColor
        ];
        
        // Переконуємося, що у нас є дані
        if (!data || data.length === 0) {
            ctx.innerHTML = '<div class="empty-state">Немає даних про процедури за вибраний період</div>';
            return;
        }
        
        // Налаштування графіка
        const chartConfig = {
            type: 'doughnut',
            data: {
                labels: data.map(item => item.name),
                datasets: [{
                    data: data.map(item => item.count),
                    backgroundColor: colors,
                    borderColor: style.getPropertyValue('--base').trim() || '#191724',
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: style.getPropertyValue('--text').trim() || '#e0def4',
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
                        backgroundColor: style.getPropertyValue('--overlay').trim() || '#26233a',
                        titleColor: style.getPropertyValue('--text').trim() || '#e0def4',
                        bodyColor: style.getPropertyValue('--subtle').trim() || '#908caa',
                        borderColor: style.getPropertyValue('--border-color').trim() || '#6e6a86',
                        borderWidth: 1,
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
        
        // Створення графіка
        this.charts.procedures = new Chart(ctx, chartConfig);
    },
    
    // Таблиця топ-клієнтів
    renderTopClients(clients) {
        const container = document.getElementById('top-clients');
        
        if (!container) {
            console.error('Контейнер для топ-клієнтів не знайдено');
            return;
        }
        
        if (!clients || clients.length === 0) {
            container.innerHTML = '<div class="empty-state">Немає даних про клієнтів за вибраний період</div>';
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
            container.innerHTML = '<div class="empty-state">Немає даних про дні за вибраний період</div>';
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
                const container = document.createElement('div');
                container.className = 'loading-container';
                container.innerHTML = loaderHTML + '<p>Завантаження даних...</p>';
                element.innerHTML = '';
                element.appendChild(container);
            }
        });
        
        // Таблиці
        const tableContainers = ['top-clients', 'top-days'];
        tableContainers.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.innerHTML = loaderHTML;
        });
    }
};

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    // Перевіряємо, чи відкрита вкладка статистики
    if (document.getElementById('stats-tab') && document.getElementById('stats-tab').classList.contains('active')) {
        Stats.init();
    }
});

// Обробник події зміни вкладки
document.addEventListener('tabChange', (e) => {
    if (e.detail.tabId === 'stats') {
        Stats.init();
    }
});