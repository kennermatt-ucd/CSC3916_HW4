const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

connectDB();

const MovieSchema = new Schema({
  title: { type: String, required: true, index: true },
  releaseDate: {
    type: Number,
    min: [1900, 'Must be greater than 1899'],
    max: [2100, 'Must be less than 2100']
  },
  genre: {
    type: String,
    enum: [
      'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
      'Horror', 'Mystery', 'Thriller', 'Western', 'Science Fiction'
    ],
  },
  actors: [{
    actorName: String,
    characterName: String,
  }],
});

const Movie = mongoose.model('Movie', MovieSchema);

const seedMovies = async () => {
  try {
    const count = await Movie.countDocuments();
    if (count === 0) {
      await Movie.insertMany([
        {
          title: 'The Dark Knight',
          releaseDate: 2008,
          genre: 'Action',
          actors: [
            { actorName: 'Christian Bale', characterName: 'Bruce Wayne' },
            { actorName: 'Heath Ledger', characterName: 'Joker' },
            { actorName: 'Aaron Eckhart', characterName: 'Harvey Dent' }
          ]
        },
        {
          title: 'Inception',
          releaseDate: 2010,
          genre: 'Science Fiction',
          actors: [
            { actorName: 'Leonardo DiCaprio', characterName: 'Dom Cobb' },
            { actorName: 'Joseph Gordon-Levitt', characterName: 'Arthur' },
            { actorName: 'Ellen Page', characterName: 'Ariadne' }
          ]
        },
        {
          title: 'The Shawshank Redemption',
          releaseDate: 1994,
          genre: 'Drama',
          actors: [
            { actorName: 'Tim Robbins', characterName: 'Andy Dufresne' },
            { actorName: 'Morgan Freeman', characterName: 'Ellis Boyd' },
            { actorName: 'Bob Gunton', characterName: 'Warden Norton' }
          ]
        },
        {
          title: 'The Silence of the Lambs',
          releaseDate: 1991,
          genre: 'Thriller',
          actors: [
            { actorName: 'Jodie Foster', characterName: 'Clarice Starling' },
            { actorName: 'Anthony Hopkins', characterName: 'Hannibal Lecter' },
            { actorName: 'Scott Glenn', characterName: 'Jack Crawford' }
          ]
        },
        {
          title: 'The Lord of the Rings: The Fellowship of the Ring',
          releaseDate: 2001,
          genre: 'Fantasy',
          actors: [
            { actorName: 'Elijah Wood', characterName: 'Frodo Baggins' },
            { actorName: 'Ian McKellen', characterName: 'Gandalf' },
            { actorName: 'Viggo Mortensen', characterName: 'Aragorn' }
          ]
        }
      ]);
      console.log('Seeded 5 movies');
    }
  } catch (err) {
    console.error('Movie seed error:', err);
  }
};

mongoose.connection.once('open', seedMovies);

module.exports = Movie;
