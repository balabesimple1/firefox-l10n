const mongoose = require('mongoose');

const glossarySchema = new mongoose.Schema({
  term: {
    type: String,
    required: true,
    trim: true
  },
  definition: {
    type: String,
    required: true,
    trim: true
  },
  translations: [{
    locale: {
      type: String,
      required: true // e.g., 'fr-FR', 'de-DE'
    },
    translation: {
      type: String,
      required: true,
      trim: true
    },
    notes: {
      type: String,
      default: ''
    },
    translator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  category: {
    type: String,
    required: true,
    default: 'general' // e.g., 'technical', 'marketing', 'legal', 'ui'
  },
  domain: {
    type: String,
    default: 'general'
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  sourceLocale: {
    type: String,
    required: true,
    default: 'en-US'
  },
  partOfSpeech: {
    type: String,
    enum: ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['draft', 'approved', 'deprecated'],
    default: 'draft'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    frequency: {
      type: String,
      enum: ['rare', 'common', 'frequent'],
      default: 'common'
    }
  }
}, {
  timestamps: true
});

// Create text index for search
glossarySchema.index({ 
  term: 'text', 
  definition: 'text',
  'translations.translation': 'text'
});

// Method to add or update translation
glossarySchema.methods.addTranslation = function(locale, translation, translator, notes = '') {
  const existingIndex = this.translations.findIndex(t => t.locale === locale);
  
  if (existingIndex >= 0) {
    // Update existing translation
    this.translations[existingIndex].translation = translation;
    this.translations[existingIndex].notes = notes;
    this.translations[existingIndex].translator = translator;
    this.translations[existingIndex].lastUpdated = new Date();
  } else {
    // Add new translation
    this.translations.push({
      locale,
      translation,
      notes,
      translator,
      lastUpdated: new Date()
    });
  }
  
  return this.save();
};

// Method to get translation for specific locale
glossarySchema.methods.getTranslation = function(locale) {
  return this.translations.find(t => t.locale === locale);
};

// Method to increment usage count
glossarySchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

// Static method to find terms by product
glossarySchema.statics.findByProduct = function(productId) {
  return this.find({ 
    products: productId, 
    isActive: true 
  }).populate('createdBy approvedBy', 'firstName lastName email');
};

module.exports = mongoose.model('Glossary', glossarySchema);