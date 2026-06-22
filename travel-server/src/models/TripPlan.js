import mongoose from 'mongoose';

const spotSchema = new mongoose.Schema({
  spot: String, duration: String, ticket: String,
  transportation: String, description: String,
}, { _id: false });

const daySchema = new mongoose.Schema({
  day: Number, date: String,
  morning: { type: spotSchema, default: () => ({}) },
  afternoon: { type: spotSchema, default: () => ({}) },
  evening: { type: spotSchema, default: () => ({}) },
}, { _id: false });

const tripPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  city: { type: String, required: true },
  days: { type: Number, required: true },
  totalBudget: { type: Number, required: true },
  dailyItinerary: [daySchema],
  budgetBreakdown: {
    accommodation: Number, food: Number, transportation: Number,
    tickets: Number, other: Number,
  },
  tips: [String],
  warnings: [String],
  sourceQuery: { city: String, budget: Number, days: Number },
}, { timestamps: true });

export default mongoose.model('TripPlan', tripPlanSchema);
