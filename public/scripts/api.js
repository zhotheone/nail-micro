// API клієнт для взаємодії з бекендом
class ApiClient {
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
        this.pendingRequests = new Map();
    }

    // Загальний метод для виконання запитів
    async request(endpoint, method = 'GET', data = null) {
        const url = `${this.baseUrl}${endpoint}`;
        
        // Унікальний ключ для кешування запиту
        const cacheKey = `${method}:${url}:${data ? JSON.stringify(data) : ''}`;
        
        // Перевіряємо, чи цей запит вже виконується
        if (this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey);
        }
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        // Створюємо проміс для запиту і зберігаємо його
        const requestPromise = (async () => {
            try {
                const response = await fetch(url, options);
                
                // Видаляємо запит з кешу після завершення
                this.pendingRequests.delete(cacheKey);
                
                // Перевірка статусу відповіді
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Помилка запиту');
                }
                
                return await response.json();
            } catch (error) {
                console.error(`Помилка API (${method} ${endpoint}):`, error);
                // Видаляємо запит з кешу у випадку помилки
                this.pendingRequests.delete(cacheKey);
                throw error;
            }
        })();
        
        // Зберігаємо проміс у кеші
        this.pendingRequests.set(cacheKey, requestPromise);
        
        return requestPromise;
    }

    // Методи для роботи з клієнтами
    async getClients() {
        return this.request('/clients');
    }

    async getClient(id) {
        return this.request(`/clients/${id}`);
    }

    async createClient(clientData) {
        return this.request('/clients', 'POST', clientData);
    }

    async updateClient(id, clientData) {
        return this.request(`/clients/${id}`, 'PUT', clientData);
    }

    async deleteClient(id) {
        return this.request(`/clients/${id}`, 'DELETE');
    }

    // Методи для роботи з процедурами
    async getProcedures() {
        return this.request('/procedures');
    }

    async getProcedure(id) {
        return this.request(`/procedures/${id}`);
    }

    async createProcedure(procedureData) {
        return this.request('/procedures', 'POST', procedureData);
    }

    async updateProcedure(id, procedureData) {
        return this.request(`/procedures/${id}`, 'PUT', procedureData);
    }

    async deleteProcedure(id) {
        return this.request(`/procedures/${id}`, 'DELETE');
    }

    // Методи для роботи з записами
    async getAppointments() {
        return this.request('/appointments');
    }

    async getAppointment(id) {
        return this.request(`/appointments/${id}`);
    }

    async getAppointmentsByDate(date) {
        // Приймає дату у форматі 'YYYY-MM-DD'
        return this.request(`/appointments/date/${date}`);
    }

    async getAppointmentsByClient(clientId) {
        return this.request(`/appointments/client/${clientId}`);
    }

    async createAppointment(appointmentData) {
        return this.request('/appointments', 'POST', appointmentData);
    }

    async updateAppointment(id, appointmentData) {
        return this.request(`/appointments/${id}`, 'PUT', appointmentData);
    }

    async deleteAppointment(id) {
        return this.request(`/appointments/${id}`, 'DELETE');
    }

    // Методи для роботи з розкладом
    async getSchedule() {
        return this.request('/schedule');
    }

    async getDaySchedule(dayOfWeek) {
        return this.request(`/schedule/${dayOfWeek}`);
    }

    async createOrUpdateSchedule(dayOfWeek, scheduleData) {
        return this.request(`/schedule/${dayOfWeek}`, 'PUT', scheduleData);
    }
    
    // Методи для статистики
    async getStats(period = 'month') {
        return this.request(`/stats?period=${period}`);
    }
    
    async getEarningsStats(period = 'month') {
        return this.request(`/stats/earnings?period=${period}`);
    }
    
    async getTopClients(period = 'month', limit = 5) {
        return this.request(`/stats/top-clients?period=${period}&limit=${limit}`);
    }
    
    async getTopProcedures(period = 'month', limit = 5) {
        return this.request(`/stats/top-procedures?period=${period}&limit=${limit}`);
    }
    
    async getTopDays(period = 'month', limit = 5) {
        return this.request(`/stats/top-days?period=${period}&limit=${limit}`);
    }

    // Методи для роботи з розкладом
    async getSchedule() {
        return this.request('/schedule');
    }

    async getDaySchedule(dayOfWeek) {
        // Переконуємося, що dayOfWeek - число
        if (typeof dayOfWeek !== 'number' || isNaN(dayOfWeek)) {
            dayOfWeek = parseInt(dayOfWeek);
            if (isNaN(dayOfWeek)) {
                throw new Error('Некоректний день тижня');
            }
        }
        return this.request(`/schedule/${dayOfWeek}`);
    }

    async createOrUpdateSchedule(dayOfWeek, scheduleData) {
        // Переконуємося, що dayOfWeek - число
        if (typeof dayOfWeek !== 'number' || isNaN(dayOfWeek)) {
            dayOfWeek = parseInt(dayOfWeek);
            if (isNaN(dayOfWeek)) {
                throw new Error('Некоректний день тижня');
            }
        }
        return this.request(`/schedule/${dayOfWeek}`, 'PUT', scheduleData);
    }

    // Отримання записів за період (від початкової до кінцевої дати)
    async getAppointmentsByPeriod(startDate, endDate) {
        return this.request(`/appointments/period/${startDate}/${endDate}`);
    }

    // Метод для перевірки доступності часу
    async checkTimeAvailability(date, startTime, endTime) {
        const formattedDate = this.formatDateForAPI(date);
        return this.request(`/appointments/check-availability?date=${formattedDate}&startTime=${startTime}&endTime=${endTime}`);
    }

    // Допоміжний метод для форматування дати
    formatDateForAPI(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

}

// Створення екземпляру API клієнта
const apiClient = new ApiClient();