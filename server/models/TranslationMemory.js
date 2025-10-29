const mongoose = require('mongoose');

const translationMemorySchema = new mongoose.Schema({
  sourceText: {
    type: String,
    required: true,
    trim: true
  },
  targetText: {
    type: String,
    required: true,
    trim: true
  },
  sourceLocale: {
    type: String,
    required: true // e.g., 'en-US'
  },
  targetLocale: {
    type: String,
    required: true // e.g., 'fr-FR'
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  context: {
    type: String,
    default: '' // Additional context for the translation
  },
  domain: {
    type: String,
    default: 'general' // e.g., 'technical', 'marketing', 'legal'
  },
  quality: {
    type: String,
    enum: ['low', 'medium', 'high', 'verified'],
    default: 'medium'
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
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    wordCount: {
      type: Number,
      default: 1
    },
    characterCount: {
      type: Number,
      default: 0
    },
    complexity: {
      type: String,
      enum: ['simple', 'medium', 'complex'],
      default: 'simple'
    }
  }
}, {
  timestamps: true
});

// Create compound index for efficient lookups
translationMemorySchema.index({ 
  sourceText: 'text', 
  sourceLocale: 1, 
  targetLocale: 1, 
  product: 1 
});

// Calculate character count before saving
translationMemorySchema.pre('save', function(next) {
  this.metadata.characterCount = this.sourceText.length;
  next();
});

// Method to find similar translations
translationMemorySchema.statics.findSimilar = function(sourceText, sourceLocale, targetLocale, productId, threshold = 0.8) {
  // This is a simplified similarity search - in production, you'd use more sophisticated algorithms
  return this.find({
    sourceLocale,
    targetLocale,
    product: productId,
    isActive: true,
    $text: { $search: sourceText }
  }).limit(10);
};

// Method to increment usage count
translationMemorySchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

module.exports = mongoose.model('TranslationMemory', translationMemorySchema);