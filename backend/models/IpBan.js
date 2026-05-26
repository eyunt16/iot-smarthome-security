const mongoose = require('mongoose');

const ipBanSchema = new mongoose.Schema({
  ipAddress: { type: String, required: true, unique: true },
  reason: { type: String, default: 'Malicious activity detected' },
  bannedBy: { type: String, default: 'admin' }
}, { timestamps: true });

module.exports = mongoose.models.IpBan || mongoose.model('IpBan', ipBanSchema);
