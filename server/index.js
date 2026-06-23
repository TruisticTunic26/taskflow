require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { setIO } = require('./socket');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

setIO(io);

app.use(express.json());
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

io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    socket.on('joinWorkspace', (workspaceId) => {
        socket.join(workspaceId);
        console.log(`User joined workspace: ${workspaceId}`);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
    });
});

const start = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        server.listen(process.env.PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`);
        });
    } catch (error) {
        console.log(error);
    }
};

start();