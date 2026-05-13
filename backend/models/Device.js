const mongoose = require('mongoose');

const { Schema } = mongoose;

const deviceSchema = new Schema(
  {
    nodeId: {
      type: Schema.Types.ObjectId,
      ref: 'Node',
      required: [true, 'nodeId reference is required.'],
      index: true,
    },
    deviceName: {
      type: String,
      required: [true, 'deviceName is required.'],
      trim: true,
      minlength: [2, 'deviceName must be at least 2 characters long.'],
      maxlength: [100, 'deviceName cannot exceed 100 characters.'],
    },
    type: {
      type: String,
      required: true,
      enum: ['Sensor', 'Relay', 'Alarm'],
      index: true,
    },
    currentValue: {
      type: Schema.Types.Mixed,
      default: null,
      validate: {
        validator(value) {
          return (
            value === null
            || ['string', 'number', 'boolean'].includes(typeof value)
          );
        },
        message: 'currentValue must be a string, number, boolean, or null.',
      },
    },
    pin: {
      type: Number,
      required: [true, 'pin is required.'],
      min: [0, 'pin must be zero or greater.'],
      max: [99, 'pin is out of supported range.'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: 'throw',
  },
);

deviceSchema.index({ nodeId: 1, deviceName: 1 }, { unique: true });
deviceSchema.index({ nodeId: 1, pin: 1 }, { unique: true });
deviceSchema.index({ type: 1, nodeId: 1 });

module.exports = mongoose.models.Device || mongoose.model('Device', deviceSchema);
