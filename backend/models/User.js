const mongoose = require('mongoose');
const net = require('net');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required.'],
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters long.'],
      maxlength: [50, 'Username cannot exceed 50 characters.'],
      match: [/^[a-zA-Z0-9_.-]+$/, 'Username contains invalid characters.'],
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      trim: true,
      lowercase: true,
      maxlength: [254, 'Email cannot exceed 254 characters.'],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email format is invalid.'],
      unique: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required.'],
      minlength: [60, 'Password hash appears invalid.'],
      maxlength: [255, 'Password hash cannot exceed 255 characters.'],
      select: false,
    },
    role: {
      type: String,
      required: true,
      enum: ['SuperAdmin', 'HomeOwner', 'Guest', 'admin'],
      default: 'Guest',
      index: true,
    },
    lastLoginIP: {
      type: String,
      trim: true,
      maxlength: [45, 'IP address cannot exceed 45 characters.'],
      validate: {
        validator(value) {
          if (value == null || value === '') {
            return true;
          }

          return net.isIP(value) !== 0;
        },
        message: 'lastLoginIP must be a valid IPv4 or IPv6 address.',
      },
    },
    failedLoginAttempts: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'failedLoginAttempts cannot be negative.'],
      max: [1000, 'failedLoginAttempts is out of range.'],
    },
    isLocked: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    expoPushTokens: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: 'throw',
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

userSchema.index({ role: 1, isLocked: 1 });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
