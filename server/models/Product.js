const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  repository: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  locales: [{
    code: {
      type: String,
      required: true // e.g., 'en-US', 'fr-FR', 'de-DE'
    },
    name: {
      type: String,
      required: true // e.g., 'English (US)', 'French (France)'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    translator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    ratePerWord: {
      type: Number,
      default: 0.10 // Default rate per word in USD
    }
  }],
  settings: {
    autoApprovalThreshold: {
      type: Number,
      default: 500 // Auto-approve translations under $500
    },
    requiresReview: {
      type: Boolean,
      default: true
    },
    translationMemoryEnabled: {
      type: Boolean,
      default: true
    },
    aiTranslationEnabled: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'archived'],
    default: 'active'
  },
  totalWordCount: {
    type: Number,
    default: 0
  },
  translatedWordCount: {
    type: Number,
    default: 0
  },
  totalCost: {
    type: Number,
    default: 0
  },
  costSavedTM: {
    type: Number,
    default: 0 // Cost saved through Translation Memory
  },
  costSavedAI: {
    type: Number,
    default: 0 // Cost saved through AI translations
  }
}, {
  timestamps: true
});

// Calculate translation progress
productSchema.virtual('progress').get(function() {
  if (this.totalWordCount === 0) return 0;
  return Math.round((this.translatedWordCount / this.totalWordCount) * 100);
});

// Get active locales
productSchema.virtual('activeLocales').get(function() {
  return this.locales.filter(locale => locale.isActive);
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);