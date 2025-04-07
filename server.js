// server.js - оновлена версія з підтримкою статистики
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const basicAuth = require('express-basic-auth');
require('dotenv').config();

// Ініціалізація Express додатку
const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(basicAuth({
    users: { 
        [process.env.USERNAME || 'admin']: process.env.PASSWORD || 'default_password'
    },
    challenge: true, // Покаже діалог входу у браузері
    realm: 'Nail Master App'
}));
app.use(cors());
app.use(bodyParser.json());

// Статичні файли
app.use(express.static(path.join(__dirname, 'public')));

// Підключення до MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB підключено'))
.catch(err => console.error('Помилка підключення до MongoDB:', err));

// Моделі
const ClientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    surName: { type: String, required: true },
    phoneNum: { type: String, required: true },
    instagram: { type: String },
    trustRating: { type: Number, default: 5, min: 1, max: 5 }
});

const ProcedureSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    timeToComplete: { type: Number, required: true } // у хвилинах
});

const AppointmentSchema = new mongoose.Schema({
    clientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Client',
        required: true 
    },
    procedureId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Procedure',
        required: true
    },
    time: { type: Date, required: true },
    price: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    finalPrice: { type: Number },
    notes: { type: String }
});

const ScheduleSchema = new mongoose.Schema({
    dayOfWeek: { 
        type: Number, 
        required: true,
        min: 0, // 0 = Неділя, 1 = Понеділок, ..., 6 = Субота
        max: 6 
    },
    timeTable: {
        1: { type: String }, // час у форматі ГГ:ХХ
        2: { type: String },
        3: { type: String },
        4: { type: String }
    },
    isWeekend: { type: Boolean, default: false }
});

const Client = mongoose.model('Client', ClientSchema);
const Procedure = mongoose.model('Procedure', ProcedureSchema);
const Appointment = mongoose.model('Appointment', AppointmentSchema);
const Schedule = mongoose.model('Schedule', ScheduleSchema);

// API маршрути для клієнтів
app.get('/api/clients', async (req, res) => {
    try {
        const clients = await Client.find();
        res.json(clients);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/clients/:id', async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ message: 'Клієнт не знайдений' });
        res.json(client);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/clients', async (req, res) => {
    const client = new Client({
        name: req.body.name,
        surName: req.body.surName,
        phoneNum: req.body.phoneNum,
        instagram: req.body.instagram,
        trustRating: req.body.trustRating
    });

    try {
        const newClient = await client.save();
        res.status(201).json(newClient);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/api/clients/:id', async (req, res) => {
    try {
        const updatedClient = await Client.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedClient) return res.status(404).json({ message: 'Клієнт не знайдений' });
        res.json(updatedClient);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/api/clients/:id', async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) return res.status(404).json({ message: 'Клієнт не знайдений' });
        
        res.json({ message: 'Клієнт видалений' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// API маршрути для процедур
app.get('/api/procedures', async (req, res) => {
    try {
        const procedures = await Procedure.find();
        res.json(procedures);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/procedures/:id', async (req, res) => {
    try {
        const procedure = await Procedure.findById(req.params.id);
        if (!procedure) return res.status(404).json({ message: 'Процедура не знайдена' });
        res.json(procedure);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/procedures', async (req, res) => {
    const procedure = new Procedure({
        name: req.body.name,
        price: req.body.price,
        timeToComplete: req.body.timeToComplete
    });

    try {
        const newProcedure = await procedure.save();
        res.status(201).json(newProcedure);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/api/procedures/:id', async (req, res) => {
    try {
        const updatedProcedure = await Procedure.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedProcedure) return res.status(404).json({ message: 'Процедура не знайдена' });
        res.json(updatedProcedure);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/api/procedures/:id', async (req, res) => {
    try {
        // Перевіряємо, чи ця процедура використовується в записах
        const appointmentsCount = await Appointment.countDocuments({ procedureId: req.params.id });
        
        if (appointmentsCount > 0) {
            return res.status(400).json({ 
                message: 'Неможливо видалити процедуру, яка використовується в записах.' 
            });
        }
        
        const procedure = await Procedure.findByIdAndDelete(req.params.id);
        if (!procedure) return res.status(404).json({ message: 'Процедура не знайдена' });
        
        res.json({ message: 'Процедура видалена' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// API маршрути для записів
app.get('/api/appointments', async (req, res) => {
    try {
        const appointments = await Appointment.find()
            .populate('clientId')
            .populate('procedureId');
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/appointments/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('clientId')
            .populate('procedureId');
        if (!appointment) return res.status(404).json({ message: 'Запис не знайдений' });
        res.json(appointment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/appointments', async (req, res) => {
    const appointment = new Appointment({
        clientId: req.body.clientId,
        procedureId: req.body.procedureId,
        time: req.body.time,
        price: req.body.price,
        status: req.body.status || 'pending',
        finalPrice: req.body.finalPrice || req.body.price,
        notes: req.body.notes
    });

    try {
        const newAppointment = await appointment.save();
        const populatedAppointment = await Appointment.findById(newAppointment._id)
            .populate('clientId')
            .populate('procedureId');
        res.status(201).json(populatedAppointment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/api/appointments/:id', async (req, res) => {
    try {
        const updatedAppointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate('clientId').populate('procedureId');
        
        if (!updatedAppointment) return res.status(404).json({ message: 'Запис не знайдений' });
        res.json(updatedAppointment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/api/appointments/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndDelete(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Запис не знайдений' });
        res.json({ message: 'Запис видалений' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// API маршрути для розкладу
app.get('/api/schedule', async (req, res) => {
    try {
        const schedule = await Schedule.find();
        res.json(schedule);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/schedule/:dayOfWeek', async (req, res) => {
    try {
        const daySchedule = await Schedule.findOne({ dayOfWeek: req.params.dayOfWeek });
        if (!daySchedule) return res.status(404).json({ message: 'Розклад не знайдений' });
        res.json(daySchedule);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/schedule', async (req, res) => {
    const schedule = new Schedule({
        dayOfWeek: req.body.dayOfWeek,
        timeTable: req.body.timeTable,
        isWeekend: req.body.isWeekend
    });

    try {
        const newSchedule = await schedule.save();
        res.status(201).json(newSchedule);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/api/schedule/:dayOfWeek', async (req, res) => {
    try {
        const updatedSchedule = await Schedule.findOneAndUpdate(
            { dayOfWeek: req.params.dayOfWeek },
            req.body,
            { new: true }
        );
        if (!updatedSchedule) return res.status(404).json({ message: 'Розклад не знайдений' });
        res.json(updatedSchedule);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Додаткові маршрути для складніших запитів

// Отримання записів на певну дату
app.get('/api/appointments/date/:date', async (req, res) => {
    try {
        const dateStart = new Date(req.params.date);
        dateStart.setHours(0, 0, 0, 0);
        
        const dateEnd = new Date(req.params.date);
        dateEnd.setHours(23, 59, 59, 999);
        
        console.log(`Запит записів на дату: ${req.params.date}`);
        console.log(`Діапазон: ${dateStart.toISOString()} - ${dateEnd.toISOString()}`);
        
        const appointments = await Appointment.find({
            time: { $gte: dateStart, $lte: dateEnd }
        })
            .populate('clientId')
            .populate('procedureId')
            .sort({ time: 1 });
        
        console.log(`Знайдено записів: ${appointments.length}`);
        res.json(appointments);
    } catch (err) {
        console.error('Помилка отримання записів на дату:', err);
        res.status(500).json({ message: err.message });
    }
});

// Отримання записів за період
app.get('/api/appointments/period/:startDate/:endDate', async (req, res) => {
    try {
        const startDate = new Date(req.params.startDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(req.params.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        const appointments = await Appointment.find({
            time: { $gte: startDate, $lte: endDate }
        })
            .populate('clientId')
            .populate('procedureId')
            .sort({ time: 1 });
        
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Отримання записів для конкретного клієнта
app.get('/api/appointments/client/:clientId', async (req, res) => {
    try {
        const appointments = await Appointment.find({ clientId: req.params.clientId })
            .populate('procedureId')
            .sort({ time: -1 });
        
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Підключення маршрутів статистики
const statsRoutes = require('./routes/stats');
app.use('/api/stats', statsRoutes);

// Роут для всіх інших запитів - відправляємо index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
});