const mongoose = require('mongoose');

const { Schema } = mongoose;

const sensorLogSchema = new Schema(
  {
    nodeId: {
      type: Schema.Types.ObjectId,
      ref: 'Node',
      required: [true, 'nodeId reference is required.'],
      index: true,
    },
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Device',
      required: [true, 'deviceId reference is required.'],
      index: true,
    },
    metric: {
      type: String,
      required: [true, 'metric is required.'],
      trim: true,
      minlength: [2, 'metric must be at least 2 characters long.'],
      maxlength: [50, 'metric cannot exceed 50 characters.'],
    },
    value: {
      type: Number,
      required: [true, 'value is required.'],
      validate: {
        validator(value) {
          return Number.isFinite(value);
        },
        message: 'value must be a finite number.',
      },
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

// Keep an index on timestamp for fast charting and time-range queries.
sensorLogSchema.index({ timestamp: -1 });
sensorLogSchema.index({ nodeId: 1, deviceId: 1, metric: 1, timestamp: -1 });

module.exports =
  mongoose.models.SensorLog || mongoose.model('SensorLog', sensorLogSchema);
