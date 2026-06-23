const express = require('express');
const Task = require('../models/Task');
const router = express.Router();

const protect = require('../middleware/auth');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const { getIO } = require('../socket');

router.post('/', protect, async (req, res) => {
    try {
        const task = new Task({
            title: req.body.title,
            description: req.body.description,
            status: req.body.status,
            priority: req.body.priority,
            dueDate: req.body.dueDate,
            assignedTo: req.body.assignedTo,
            workspace: req.body.workspace
        });
        await task.save();
        const io = getIO();

        if (!io) {
            res.status(500).json({ message: 'Socket.io not initialized' });
        }

        io.to(task.workspace.toString()).emit('taskCreated', task);
        console.log('Task created:', task);
        res.status(201).json(task);
    }
    catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/', protect, async (req, res) => {
    try {
        const tasks = await Task.find({ workspace: req.query.workspaceId }).populate('assignedTo', 'name');
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id', protect, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const workspace = await Workspace.findById(task.workspace);
        if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

        const isMember = workspace.members.some((memberId) => memberId.equals(req.user.id));
        if (!isMember) {
            return res.status(403).json({ message: 'You are not a member of this workspace' });
        }

        const isOwner = workspace.owner.equals(req.user.id);
        if (req.body.assignedTo && !isOwner) {
            return res.status(403).json({ message: 'Only the owner can reassign tasks' });
        }

        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('assignedTo', 'name');
        const io = getIO();

        if (!io) {
            res.status(500).json({ message: 'Socket.io not initialized' });
        }

        io.to(task.workspace.toString()).emit('taskUpdated', updatedTask);
        res.status(200).json(updatedTask);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', protect, async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });
        const io = getIO();
        if (!io) {
            res.status(500).json({ message: 'Socket.io not initialized' });
        }
        io.to(task.workspace.toString()).emit('taskDeleted', task);
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;