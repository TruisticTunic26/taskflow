require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors());

const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const workspaceRoutes = require('./routes/workspaces');
app.use('/api/workspaces', workspaceRoutes);

const taskRouters = require("./routes/tasks");
app.use('/api/tasks', taskRouters);

app.get('/', (req, res) => {
    res.send('Server is running');
});

const start = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        app.listen(process.env.PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`);
        });
    } catch (error) {
        console.log(error);
    }
};

start();