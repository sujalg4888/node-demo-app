const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, },
    password: { type: String, required: true },
    email: { type: String, required: true },
    createdAt: { type: Date, default: new Date},
    updatedAt: { type: Date, default: new Date },
    deletedAt: { type: Date },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    lastLoggedInAt: { type: Date },
    isEmailVerified: { type: Boolean, default: false },
    files: []
})

module.exports = mongoose.model('Users', UserSchema);