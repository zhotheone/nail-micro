// routes/stats.js - маршрути для статистики
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Отримання моделей (використовуємо існуючі моделі)
const Appointment = mongoose.model('Appointment');
const Client = mongoose.model('Client');
const Procedure = mongoose.model('Procedure');

// Допоміжні функції для роботи з датами
function getDateRange(period) {
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
}

// Отримання даних для порівняння (для трендів)
function getPreviousDateRange(period) {
    const { startDate, endDate } = getDateRange(period);
    const duration = endDate - startDate;
    
    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(prevEndDate - duration);
    
    return { startDate: prevStartDate, endDate: prevEndDate };
}

// Загальна статистика
router.get('/', async (req, res) => {
    try {
        const period = req.query.period || 'month';
        const { startDate, endDate } = getDateRange(period);
        const prevRange = getPreviousDateRange(period);
        
        // Запит для поточного періоду
        const appointments = await Appointment.find({
            time: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed', 'confirmed'] }
        }).populate('clientId').populate('procedureId');
        
        // Запит для попереднього періоду (для трендів)
        const prevAppointments = await Appointment.find({
            time: { $gte: prevRange.startDate, $lte: prevRange.endDate },
            status: { $in: ['completed', 'confirmed'] }
        });
        
        // Унікальні клієнти
        const uniqueClientIds = [...new Set(appointments.map(app => app.clientId?._id?.toString()))].filter(Boolean);
        const prevUniqueClientIds = [...new Set(prevAppointments.map(app => app.clientId?.toString()))].filter(Boolean);
        
        // Розрахунок загальної суми
        const totalEarnings = appointments.reduce((sum, app) => {
            return sum + (app.finalPrice || app.price);
        }, 0);
        
        // Розрахунок суми для попереднього періоду
        const prevTotalEarnings = prevAppointments.reduce((sum, app) => {
            return sum + (app.finalPrice || app.price);
        }, 0);
        
        // Розрахунок середнього чеку
        const avgEarning = appointments.length > 0 ? totalEarnings / appointments.length : 0;
        const prevAvgEarning = prevAppointments.length > 0 ? prevTotalEarnings / prevAppointments.length : 0;
        
        // Розрахунок трендів
        const calculateTrend = (current, previous) => {
            if (previous === 0) return { direction: 'up', percent: 100 };
            
            const diff = current - previous;
            const percent = (diff / previous) * 100;
            
            return {
                direction: percent >= 0 ? 'up' : 'down',
                percent
            };
        };
        
        // Підготовка результатів
        const result = {
            totalEarnings,
            clientsCount: uniqueClientIds.length,
            appointmentsCount: appointments.length,
            avgEarning,
            trends: {
                earnings: calculateTrend(totalEarnings, prevTotalEarnings),
                clients: calculateTrend(uniqueClientIds.length, prevUniqueClientIds.length),
                appointments: calculateTrend(appointments.length, prevAppointments.length),
                avgEarning: calculateTrend(avgEarning, prevAvgEarning)
            }
        };
        
        res.json(result);
    } catch (err) {
        console.error('Помилка отримання статистики:', err);
        res.status(500).json({ message: err.message });
    }
});

// Статистика доходів за період
router.get('/earnings', async (req, res) => {
    try {
        const period = req.query.period || 'month';
        const { startDate, endDate } = getDateRange(period);
        
        // Запит для отримання всіх завершених та підтверджених записів
        const appointments = await Appointment.find({
            time: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed', 'confirmed'] }
        }).sort({ time: 1 });
        
        // Підготовка даних в залежності від періоду
        let labels = [];
        let earnings = [];
        
        if (period === 'week') {
            // Для тижня - групуємо по днях
            const days = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
            const dailyEarnings = new Array(7).fill(0);
            
            appointments.forEach(app => {
                const date = new Date(app.time);
                const dayIndex = date.getDay();
                dailyEarnings[dayIndex] += (app.finalPrice || app.price);
            });
            
            // Отримання дат для останніх 7 днів
            const weekLabels = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - 6 + i);
                return `${days[d.getDay()]} ${d.getDate()}`;
            });
            
            labels = weekLabels;
            earnings = dailyEarnings;
            
        } else if (period === 'month') {
            // Для місяця - групуємо по днях
            const daysInMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
            const dailyEarnings = new Array(daysInMonth).fill(0);
            
            appointments.forEach(app => {
                const date = new Date(app.time);
                const dayOfMonth = date.getDate();
                dailyEarnings[dayOfMonth - 1] += (app.finalPrice || app.price);
            });
            
            labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
            earnings = dailyEarnings;
            
        } else if (period === 'year') {
            // Для року - групуємо по місяцях
            const months = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];
            const monthlyEarnings = new Array(12).fill(0);
            
            appointments.forEach(app => {
                const date = new Date(app.time);
                const monthIndex = date.getMonth();
                monthlyEarnings[monthIndex] += (app.finalPrice || app.price);
            });
            
            labels = months;
            earnings = monthlyEarnings;
        }
        
        res.json({ labels, earnings });
    } catch (err) {
        console.error('Помилка отримання статистики доходів:', err);
        res.status(500).json({ message: err.message });
    }
});

// Найкращі клієнти
router.get('/top-clients', async (req, res) => {
    try {
        const period = req.query.period || 'month';
        const limit = parseInt(req.query.limit) || 5;
        const { startDate, endDate } = getDateRange(period);
        
        // Отримуємо всі записи за період
        const appointments = await Appointment.find({
            time: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed', 'confirmed'] }
        }).populate('clientId');
        
        // Групуємо записи по клієнтах
        const clientsMap = new Map();
        
        appointments.forEach(app => {
            if (!app.clientId) return;
            
            const clientId = app.clientId._id.toString();
            const amount = app.finalPrice || app.price;
            
            if (!clientsMap.has(clientId)) {
                clientsMap.set(clientId, {
                    id: clientId,
                    name: app.clientId.name,
                    surName: app.clientId.surName,
                    visits: 0,
                    totalSpent: 0
                });
            }
            
            const clientStats = clientsMap.get(clientId);
            clientStats.visits += 1;
            clientStats.totalSpent += amount;
        });
        
        // Перетворюємо Map в масив та сортуємо
        const topClients = Array.from(clientsMap.values())
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, limit);
        
        res.json(topClients);
    } catch (err) {
        console.error('Помилка отримання найкращих клієнтів:', err);
        res.status(500).json({ message: err.message });
    }
});

// Найпопулярніші процедури
router.get('/top-procedures', async (req, res) => {
    try {
        const period = req.query.period || 'month';
        const limit = parseInt(req.query.limit) || 5;
        const { startDate, endDate } = getDateRange(period);
        
        // Отримуємо всі записи за період
        const appointments = await Appointment.find({
            time: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed', 'confirmed'] }
        }).populate('procedureId');
        
        // Групуємо записи по процедурах
        const proceduresMap = new Map();
        
        appointments.forEach(app => {
            if (!app.procedureId) return;
            
            const procedureId = app.procedureId._id.toString();
            
            if (!proceduresMap.has(procedureId)) {
                proceduresMap.set(procedureId, {
                    id: procedureId,
                    name: app.procedureId.name,
                    count: 0,
                    totalEarnings: 0
                });
            }
            
            const procedureStats = proceduresMap.get(procedureId);
            procedureStats.count += 1;
            procedureStats.totalEarnings += (app.finalPrice || app.price);
        });
        
        // Перетворюємо Map в масив та сортуємо
        const topProcedures = Array.from(proceduresMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
        
        res.json(topProcedures);
    } catch (err) {
        console.error('Помилка отримання найпопулярніших процедур:', err);
        res.status(500).json({ message: err.message });
    }
});

// Найкращі дні
router.get('/top-days', async (req, res) => {
    try {
        const period = req.query.period || 'month';
        const limit = parseInt(req.query.limit) || 5;
        const { startDate, endDate } = getDateRange(period);
        
        // Отримуємо всі записи за період
        const appointments = await Appointment.find({
            time: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed', 'confirmed'] }
        });
        
        // Групуємо записи по днях
        const daysMap = new Map();
        
        appointments.forEach(app => {
            const date = new Date(app.time);
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
            
            if (!daysMap.has(dateStr)) {
                daysMap.set(dateStr, {
                    date: dateStr,
                    appointmentsCount: 0,
                    earnings: 0
                });
            }
            
            const dayStats = daysMap.get(dateStr);
            dayStats.appointmentsCount += 1;
            dayStats.earnings += (app.finalPrice || app.price);
        });
        
        // Перетворюємо Map в масив та сортуємо
        const topDays = Array.from(daysMap.values())
            .sort((a, b) => b.earnings - a.earnings)
            .slice(0, limit);
        
        res.json(topDays);
    } catch (err) {
        console.error('Помилка отримання найкращих днів:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;