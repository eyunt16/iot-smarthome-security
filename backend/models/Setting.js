const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  notif: { type: Boolean, default: true },
  datalog: { type: Boolean, default: true },
  emailalert: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.models.Setting || mongoose.model('Setting', settingSchema);
