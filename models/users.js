const mongoose = require("mongoose");
const { Schema } = mongoose;
const { v4 } = require("uuid");

const uuid = () => {
  const tokens = v4().split("-");
  return tokens[2] + tokens[1] + tokens[0] + tokens[3] + tokens[4];
};

//name, pass to field, both type string
const exerciseSchema = new Schema({
  exerciseName: {
    type: String,
    default: null,
  },
  exerciseId: {
    type: String,
    default: () => uuid(),
  },
  exerciseStartDate: {
    type: Date,
    default: null,
  },
  exerciseEndDate: {
    type: Date,
    default: null,
  },
  exerciseTime: {
    type: Number,
    default: null,
  },
  repeatDate: {
    type: [String],
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastUpdated: {
    type: Date,
    default: null,
  },
  scheduledDate: [
    {
      date: Date,
      isDone: Boolean,
    },
  ],
});

const foodSchema = new Schema({
  foodList: {
    type: [
      {
        foodCategory: String,
        totalCalory: Number,
        menu: [
          {
            name: String,
            calory: Number,
          },
        ],
      },
    ],
  },
  foodId: {
    type: String,
    default: () => uuid(),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastUpdated: {
    type: Date,
    default: null,
  },
});

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    default: null,
  },
  age: {
    type: Number,
    default: null,
  },
  userFoodList: {
    type: [foodSchema],
    default: [],
  },
  userExerciseList: {
    type: [exerciseSchema],
    default: [],
  },
  lastUpdated: {
    type: Date,
    default: null,
  },
  todayCalory: {
    type: Number,
    default: null,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);
const Food = mongoose.model("Food", foodSchema);

module.exports = { User, Exercise, Food };
