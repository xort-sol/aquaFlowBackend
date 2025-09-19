const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userType: {
    type: String,
    required: [true, 'Please provide a user type'],
    enum: {
      values: ['customer', 'driver', 'admin'],
      message: 'User type must be customer, driver, or admin'
    }
  },
  // Common fields for all user types
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  // Customer-specific fields
  fullName: {
    type: String,
    required: function() {
      return this.userType === 'customer';
    },
    trim: true,
    maxlength: [100, 'Full name cannot be more than 100 characters']
  },
  houseNumber: {
    type: String,
    required: function() {
      return this.userType === 'customer';
    },
    trim: true,
    maxlength: [20, 'House number cannot be more than 20 characters']
  },
  portion: {
    type: String,
    required: function() {
      return this.userType === 'customer';
    },
    enum: {
      values: ['upper', 'lower'],
      message: 'Portion must be either upper or lower'
    }
  },
  address: {
    type: String,
    required: function() {
      return this.userType === 'customer';
    },
    trim: true,
    maxlength: [200, 'Address cannot be more than 200 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
