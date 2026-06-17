const mongoose = require('mongoose');

const WorkspaceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const WorkspaceModel = mongoose.model('Workspace', WorkspaceSchema);

module.exports = WorkspaceModel;