const mongoose = require('mongoose');

const translationTaskSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  locale: {
    code: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  translator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  sourceFiles: [{
    filename: String,
    path: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  wordCount: {
    total: {
      type: Number,
      default: 0
    },
    translated: {
      type: Number,
      default: 0
    },
    reviewed: {
      type: Number,
      default: 0
    },
    approved: {
      type: Number,
      default: 0
    }
  },
  cost: {
    estimated: {
      type: Number,
      default: 0
    },
    actual: {
      type: Number,
      default: 0
    },
    savedTM: {
      type: Number,
      default: 0 // Saved through Translation Memory
    },
    savedAI: {
      type: Number,
      default: 0 // Saved through AI translation
    }
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'reviewed', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  deadline: {
    type: Date,
    required: true
  },
  estimatedDelivery: {
    type: Date,
    required: true
  },
  actualDelivery: {
    type: Date,
    default: null
  },
  qualityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  feedback: {
    translator: {
      type: String,
      default: ''
    },
    reviewer: {
      type: String,
      default: ''
    },
    client: {
      type: String,
      default: ''
    }
  },
  isAutoApproved: {
    type: Boolean,
    default: false
  },
  translationMemoryMatches: {
    exact: {
      type: Number,
      default: 0
    },
    fuzzy: {
      type: Number,
      default: 0
    },
    noMatch: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Calculate progress percentage
translationTaskSchema.virtual('progress').get(function() {
  if (this.wordCount.total === 0) return 0;
  return Math.round((this.wordCount.translated / this.wordCount.total) * 100);
});

// Calculate review progress
translationTaskSchema.virtual('reviewProgress').get(function() {
  if (this.wordCount.translated === 0) return 0;
  return Math.round((this.wordCount.reviewed / this.wordCount.translated) * 100);
});

// Check if task is overdue
translationTaskSchema.virtual('isOverdue').get(function() {
  return this.deadline < new Date() && this.status !== 'completed' && this.status !== 'approved';
});

// Ensure virtual fields are serialized
translationTaskSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('TranslationTask', translationTaskSchema);