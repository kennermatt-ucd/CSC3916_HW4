require('dotenv').config();
var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

// USERS

router.post('/signup', async (req, res) => {
    if (!req.body.username || !req.body.password) {
        return res.json({ success: false, msg: 'Please include both username and password to signup.' });
    }
    try {
        const user = new User({
            name: req.body.name,
            username: req.body.username,
            password: req.body.password,
        });
        await user.save();
        res.json({ success: true, msg: 'Successfully created new user.' });
    } catch (err) {
        if (err.code === 11000) {
            return res.json({ success: false, message: 'A user with that username already exists.' });
        }
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/signin', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username }).select('name username password');
        if (!user) {
            return res.status(401).json({ success: false, msg: 'Authentication failed. User not found.' });
        }
        const isMatch = await user.comparePassword(req.body.password);
        if (isMatch) {
            var userToken = { id: user._id, username: user.username };
            var token = jwt.sign(userToken, process.env.SECRET_KEY);
            res.json({ success: true, token: 'JWT ' + token });
        } else {
            res.status(401).json({ success: false, msg: 'Authentication failed.' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// MOVIES

router.route('/movies')
    .get(authJwtController.isAuthenticated, async (req, res) => {
        try {
            const movies = await Movie.find();
            res.json(movies);
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    })
    .post(authJwtController.isAuthenticated, async (req, res) => {
        const { title, releaseDate, genre, actors } = req.body;
        if (!title || !releaseDate || !genre || !actors || actors.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Movie must include title, releaseDate, genre, and at least three actors.'
            });
        }
        try {
            const movie = new Movie({ title, releaseDate, genre, actors });
            await movie.save();
            res.json({ success: true, movie });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    })
    .put(authJwtController.isAuthenticated, (req, res) => {
        res.status(405).json({ success: false, message: 'HTTP method not supported.' });
    })
    .delete(authJwtController.isAuthenticated, (req, res) => {
        res.status(405).json({ success: false, message: 'HTTP method not supported.' });
    });

router.route('/movies/:id')
    .get(authJwtController.isAuthenticated, async (req, res) => {
        try {
            if (req.query.reviews === 'true') {
                const result = await Movie.aggregate([
                    { $match: { _id: new require('mongoose').Types.ObjectId(req.params.id) } },
                    {
                        $lookup: {
                            from: 'reviews',
                            localField: '_id',
                            foreignField: 'movieId',
                            as: 'reviews'
                        }
                    }
                ]);
                if (!result || result.length === 0) {
                    return res.status(404).json({ success: false, message: 'Movie not found.' });
                }
                res.json(result[0]);
            } else {
                const movie = await Movie.findById(req.params.id);
                if (!movie) return res.status(404).json({ success: false, message: 'Movie not found.' });
                res.json(movie);
            }
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    })
    .put(authJwtController.isAuthenticated, async (req, res) => {
        try {
            const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
            if (!movie) return res.status(404).json({ success: false, message: 'Movie not found.' });
            res.json({ success: true, movie });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    })
    .delete(authJwtController.isAuthenticated, async (req, res) => {
        try {
            const movie = await Movie.findByIdAndDelete(req.params.id);
            if (!movie) return res.status(404).json({ success: false, message: 'Movie not found.' });
            res.json({ success: true, message: 'Movie deleted.' });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    });

// REVIEWS

router.route('/reviews')
    .get(authJwtController.isAuthenticated, async (req, res) => {
        try {
            const reviews = await Review.find();
            res.json(reviews);
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    })
    .post(authJwtController.isAuthenticated, async (req, res) => {
        const { movieId, username, review, rating } = req.body;
        if (!movieId) {
            return res.status(400).json({ success: false, message: 'movieId is required.' });
        }
        try {
            const movie = await Movie.findById(movieId);
            if (!movie) {
                return res.status(404).json({ success: false, message: 'Movie not found.' });
            }
            const newReview = new Review({ movieId, username, review, rating });
            await newReview.save();
            res.json({ message: 'Review created!' });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    });

app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app;
