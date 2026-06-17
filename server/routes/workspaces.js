const express = require('express');
const router = express.Router();
const Workspace = require('../models/Workspace');
const protect = require('../middleware/auth');
const User = require('../models/User');

router.post('/', protect, async (req, res) => {
    const newWorkspace = new Workspace({
        name: req.body.name,
        owner: req.user.id,
        members: [req.user.id]
    });

    try {
        const savedWorkspace = await newWorkspace.save();
        res.status(201).json(savedWorkspace);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get('/', protect, async (req, res) => {
    try {
        const workspaces = await Workspace.find({ members: req.user.id });
        res.status(200).json(workspaces);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', protect, async (req, res) => {
    const workspaceId = req.params.id;

    try {
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
        else res.status(200).json(workspace);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/:id/invite', protect, async (req, res) => {
    try {
        const invitedUser = await User.findOne({ email: req.body.email });
        if (!invitedUser) return res.status(404).json({ message: 'User not found' });

        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

        if (workspace.members.includes(invitedUser._id)) return res.status(400).json({ message: 'User is already a member of the workspace' });

        if (workspace.owner.toString() !== req.user.id.toString()) return res.status(403).json({ message: 'Only the owner can invite members' });
        workspace.members.push(invitedUser._id);
        await workspace.save();
        res.status(200).json({ message: 'User invited successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;