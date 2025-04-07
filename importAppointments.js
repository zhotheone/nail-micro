const mongoose = require('mongoose');
require('dotenv').config();

// Define schemas
const clientSchema = new mongoose.Schema({
  name: String,
  surName: String,
  phoneNum: String,
  instagram: String,
  trustRating: Number
});

const procedureSchema = new mongoose.Schema({
  name: String,
  price: Number,
  duration: Number
});

const appointmentSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  procedureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Procedure' },
  time: Date,
  price: Number,
  status: String,
  finalPrice: Number,
  notes: String
});

// Create models
const Client = mongoose.model('Client', clientSchema);
const Procedure = mongoose.model('Procedure', procedureSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);

// Procedure mapping (for simplicity)
const procedureTypes = {
  'педикюр': { name: 'Педикюр', price: 350, duration: 60 },
  'маникюр': { name: 'Маникюр', price: 500, duration: 60 },
  'коррекция': { name: 'Коррекция', price: 500, duration: 120 },
  'маник': { name: 'Маникюр', price: 500, duration: 60 },
  'снятие': { name: 'Снятие', price: 100, duration: 30 }
};

// Raw appointment data
const rawData = `
01.03 - Даша Коммисарова - педикюр - 350
01.03 - Даша Коммисарова - маникюр - 500
01.03 - Катя Чернишкова - педикюр - 350
02.03 - Маша Лазоркина - коррекция - 500
02.03 - Елена Даяна - корреция - 500
02.03 - Лера Инст - коррекция - 500
04.03 - Наташа АТБ - маник - 500
04.03 - Валя Вовчок - педикюр - 350
05.03 - Ангелина (Саша) - педикюр - 400
05.03 - Лиза Белоусова - коррекция - 500
07.03 - Инна Задумина - коррекция - 500
09.03 - Даша Тренер - педикюр - 400
11.03 - Юля Литовская - снятие - 100
12.03 - Тетя Оля - коррекция - 500
13.03 - Даша Лавели - маник - 500
13.03 - Диана Инст -  коррекция - 500
14.03 - Ларисина Мама - коррекция - 500
14.03 - Таня Пилипенко - педикюр - 400
15.03 - Даша Оля - коррекция - 500
15.03 - Лидия Савощенко - коррекция -  500
20.03 - Инна Задумина - коррекция - 500
21.03 - Анастасия инст - коррекция - 500
21.03 - Анна Витренко - коррекция - 500
22.03 - Аня Хижняк - коррекция - 500
22.03 - Карина Тимченко - коррекция - 500
22.03 - Оля Федько - коррекция - 500
22.03 - Лера Инст - коррекция - 500
23.03 - Оксана Юриевна - коррекция - 500
23.03 - Оксана Юриевна - педикюр - 350
23.03 - Мария Демьяненко - коррекция - 500
23.03 - Мария Демьяненко - педикюр - 400
26.03 - Наташа АТБ - коррекция - 500
26.03 - Настя Левченко - коррекция - 500
27.03 - Аня Решта - коррекция - 500
29.03 - Даша Комиссарова - педикюр - 350
`.trim();

// Parse appointment data
function parseAppointments(data) {
  return data.split('\n').map(line => {
    const [datePart, namePart, procedurePart, pricePart] = line.split(' - ');
    
    // Parse date (assuming current year)
    const [day, month] = datePart.split('.');
    const dateObj = new Date(`2025-${month}-${day}T10:00:00`); // Use 10:00 AM as default time
    
    // Parse name
    const nameParts = namePart.trim().split(' ');
    let name, surName = '';
    if (nameParts.length > 1) {
      name = nameParts[0];
      surName = nameParts.slice(1).join(' ');
    } else {
      name = nameParts[0];
    }
    
    // Parse procedure and price
    const procedure = procedurePart.trim().toLowerCase();
    const price = parseInt(pricePart.trim(), 10);
    
    return {
      date: dateObj,
      client: { name, surName },
      procedure,
      price
    };
  });
}

async function importData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const parsedAppointments = parseAppointments(rawData);
    
    // Create or get procedures
    const procedureMap = {};
    for (const procKey in procedureTypes) {
      const procDetails = procedureTypes[procKey];
      let proc = await Procedure.findOne({ name: procDetails.name });
      if (!proc) {
        proc = await Procedure.create({
          name: procDetails.name,
          price: procDetails.price,
          duration: procDetails.duration
        });
        console.log(`Created procedure: ${proc.name}`);
      }
      procedureMap[procKey] = proc._id;
    }
    
    // Create clients and appointments
    const clientMap = {};
    
    for (const appointment of parsedAppointments) {
      const clientKey = `${appointment.client.name} ${appointment.client.surName}`.trim();
      
      // Create or get client
      if (!clientMap[clientKey]) {
        let client = await Client.findOne({ 
          name: appointment.client.name,
          surName: appointment.client.surName
        });
        
        if (!client) {
          client = await Client.create({
            name: appointment.client.name,
            surName: appointment.client.surName,
            phoneNum: "",  // No phone numbers in the data
            instagram: "",
            trustRating: 5
          });
          console.log(`Created client: ${client.name} ${client.surName}`);
        }
        
        clientMap[clientKey] = client._id;
      }
      
      // Find procedure ID
      let procedureKey = appointment.procedure;
      if (procedureKey === 'корреция') procedureKey = 'коррекция'; // Fix typo in data
      
      const procedureId = procedureMap[procedureKey];
      
      if (!procedureId) {
        console.error(`Procedure not found: ${procedureKey}`);
        continue;
      }
      
      // Create appointment
      const newAppointment = await Appointment.create({
        clientId: clientMap[clientKey],
        procedureId: procedureId,
        time: appointment.date,
        price: appointment.price,
        status: "completed",
        finalPrice: appointment.price,
        notes: ""
      });
      
      console.log(`Created appointment for ${clientKey} on ${appointment.date.toISOString()}`);
    }
    
    console.log('Data import completed');
    
  } catch (error) {
    console.error('Error importing data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

importData();
