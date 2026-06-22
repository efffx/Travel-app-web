import mongoose from 'mongoose';

const travelLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  destination: { type: String, required: true, trim: true },
  days: { type: Number, required: true, min: 1 },
  totalSpent: { type: Number, required: true, min: 0 },
  startDate: { type: Date },
  endDate: { type: Date },
  notes: { type: String, default: '', maxlength: 500 },
  rating: { type: Number, default: 3, min: 1, max: 5 },
  budgetBreakdown: {
    accommodation: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
    transportation: { type: Number, default: 0 },
    tickets: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
  companions: { type: String, default: '' },
  sourcePlan: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
}, { timestamps: true });

travelLogSchema.index({ user: 1, startDate: -1 });

export default mongoose.model('TravelLog', travelLogSchema);
