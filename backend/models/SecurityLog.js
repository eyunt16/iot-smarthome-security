const mongoose = require('mongoose');

const { Schema } = mongoose;

const securityLogSchema = new Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        'LOGIN_FAILED',
        'LOGIN_SUCCESS',
        'NODE_DISCONNECTED',
        'UNAUTHORIZED_ACCESS',
        'DEVICE_TRIGGERED',
        'ACCOUNT_UNLOCKED',
        'ACCOUNT_LOCKED',
        'DOOR_UNLOCKED',
        'DOOR_LOCKED',
        'USER_BANNED',
        'USER_UNBANNED',
        'IP_BANNED',
        'IP_UNBANNED',
      ],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'description is required.'],
      trim: true,
      minlength: [5, 'description must be at least 5 characters long.'],
      maxlength: [1000, 'description cannot exceed 1000 characters.'],
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: [45, 'ipAddress cannot exceed 45 characters.'],
      validate: {
        validator(value) {
          if (value == null || value === '') {
            return true;
          }

          return /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$|^(?:[a-fA-F0-9]{1,4}:){1,7}[a-fA-F0-9]{1,4}$/.test(
            value,
          );
        },
        message: 'ipAddress must be a valid IPv4 or IPv6 address.',
      },
    },
    nodeId: {
      type: Schema.Types.ObjectId,
      ref: 'Node',
      default: null,
      index: true,
    },
    resolved: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: 'throw',
  },
);

securityLogSchema.index({ eventType: 1, resolved: 1, timestamp: -1 });
securityLogSchema.index({ nodeId: 1, timestamp: -1 });
securityLogSchema.index({ ipAddress: 1, timestamp: -1 });

module.exports =
  mongoose.models.SecurityLog
  || mongoose.model('SecurityLog', securityLogSchema);
