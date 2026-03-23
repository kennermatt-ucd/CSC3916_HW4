const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    username: String,
    review: String,
    rating: { type: Number, min: 0, max: 5 }
});

module.exports = mongoose.model('Review', ReviewSchema);
