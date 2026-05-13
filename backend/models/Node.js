const mongoose = require('mongoose');

const { Schema } = mongoose;

const nodeSchema = new Schema(
  {
    nodeId: {
      type: String,
      required: [true, 'nodeId is required.'],
      trim: true,
      uppercase: true,
      minlength: [3, 'nodeId must be at least 3 characters long.'],
      maxlength: [100, 'nodeId cannot exceed 100 characters.'],
      match: [/^[A-Z0-9_:-]+$/, 'nodeId contains invalid characters.'],
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Node name is required.'],
      trim: true,
      minlength: [2, 'Node name must be at least 2 characters long.'],
      maxlength: [100, 'Node name cannot exceed 100 characters.'],
    },
    location: {
      type: String,
      required: [true, 'Location is required.'],
      trim: true,
      minlength: [2, 'Location must be at least 2 characters long.'],
      maxlength: [150, 'Location cannot exceed 150 characters.'],
    },
    status: {
      type: String,
      required: true,
      enum: ['Online', 'Offline'],
      default: 'Offline',
      index: true,
    },
    lastHeartbeat: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: 'throw',
  },
);

nodeSchema.index({ nodeId: 1 }, { unique: true });
nodeSchema.index({ status: 1, lastHeartbeat: -1 });
nodeSchema.index({ location: 1, name: 1 });

module.exports = mongoose.models.Node || mongoose.model('Node', nodeSchema);
