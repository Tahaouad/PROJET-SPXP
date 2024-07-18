const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes, Op } = require('sequelize');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const CLIENT_ID = '165892090777-clapkqeje8s7bcujrr86ro5bh0nllm2p.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:5173/coaches';
const REFRESH_TOKEN = 'YOUR_REFRESH_TOKEN';

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });



const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());





const config_cors = {
    origin: ['http://192.168.8.119:5173', 'http://localhost:5173'],
    methods: ['PUT', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(config_cors));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = 'uploads/avatars';
      if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}_${file.originalname}`);
    }
  });

  
  const upload = multer({ storage });

  const eventStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/covers';
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});

const uploadEventCover = multer({ storage: eventStorage });

  
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads/avatars')));

app.use('/uploads/covers', express.static(path.join(__dirname, 'uploads/covers')));




async function sendMail(name, lastName, email, phone, coach, message) {
    try {
        const accessToken = await oAuth2Client.getAccessToken();

        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: 'YOUR_EMAIL@gmail.com',
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
        });

        const mailOptions = {
            from: 'tahaouad04@gmail.com',
            to: 'tahaouad04@gmail.com',
            subject: 'New Coach Inquiry',
            text: `Name: ${name}\nLast Name: ${lastName}\nEmail: ${email}\nPhone: ${phone}\nCoach: ${coach}\nMessage: ${message}`,
        };

        const result = await transport.sendMail(mailOptions);
        return result;
    } catch (error) {
        return error;
    }
}

const sequelize = new Sequelize('sportxplore', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});

const Admin = sequelize.define('Admin', {
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    }
});

// Model User
const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    gender: {
        type: DataTypes.STRING,
        allowNull: true
    },
    favoriteSport: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lastSeen: {
        type: DataTypes.DATE,
        allowNull: true
    },
    latitude: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    longitude: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    isBlocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

const Match = sequelize.define('Match', {
    sport: {
        type: DataTypes.STRING,
        allowNull: false
    },
    maxPlayers: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    currentPlayers: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending'
    }
});

const MatchParticipant = sequelize.define('MatchParticipant', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    matchId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
});

const Event = sequelize.define('Event', {
    title: DataTypes.STRING,
    description: DataTypes.STRING,
    cover: DataTypes.STRING,
    adminId: DataTypes.INTEGER ,
    likes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue : 0
    },
});
const EventComment = sequelize.define('EventComment', {
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    eventId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});
// Model for likes
const EventLike = sequelize.define('EventLike', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    eventId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

// Relations
EventLike.belongsTo(User, { foreignKey: 'userId' });
EventLike.belongsTo(Event, { foreignKey: 'eventId' });
Event.hasMany(EventLike, { foreignKey: 'eventId' });
User.hasMany(EventLike, { foreignKey: 'userId' });


EventComment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
EventComment.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });


const Blog = sequelize.define('Blog', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: false
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    author: {
        type: DataTypes.STRING,
        allowNull: false // Assurez-vous que cette contrainte est correcte pour votre application
    },
    authorRole: {
        type: DataTypes.STRING,
        allowNull: false
    },
    authorImage: {
        type: DataTypes.STRING,
        allowNull: false
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

// Define associations
User.hasMany(Match, { foreignKey: 'ownerId', as: 'createdMatches' });
Match.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
User.belongsToMany(Match, { through: MatchParticipant, foreignKey: 'userId', as: 'joinedMatches' });
Match.belongsToMany(User, { through: MatchParticipant, foreignKey: 'matchId', as: 'participants' });

// Sync database
sequelize.sync().then(() => {
    console.log('Database & tables created!');
});

// Authentication middleware
const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.sendStatus(401);
    }
    jwt.verify(token, 'my_jwt_secret', async (err, decoded) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.userId = decoded.id;
        try {
            const user = await User.findByPk(req.userId);
            if (user) {
                user.lastSeen = new Date();
                await user.save();
            }
        } catch (error) {
            console.error('Failed to update lastSeen time:', error);
        }

        next();
    });
};
// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, 'admin_jwt_secret', async (err, decoded) => {
        if (err) return res.sendStatus(403);
        
        const admin = await Admin.findByPk(decoded.id);
        if (!admin) return res.sendStatus(403);

        req.adminId = decoded.id;
        next();
    });
};

// User registration
app.post('/register', upload.single('avatar'), async (req, res) => {
    const { username, email, password } = req.body;
    const avatar = req.file ? req.file.path : null;
  
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        avatar
      });
      res.status(201).json(user);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to register user' });
    }
  });
  //admin regiter
  app.post('/admin/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = await Admin.create({ email, password: hashedPassword });
        res.status(201).json(admin);
    } catch (err) {
        res.status(500).json({ message: 'Failed to register admin' });
    }
});
//admin login
app.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await Admin.findOne({ where: { email } });
        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).send('Invalid login credentials.');
        }
        const token = jwt.sign({ id: admin.id }, 'admin_jwt_secret', { expiresIn: 86400 });
        res.status(200).send({ token });
    } catch (err) {
        res.status(500).send('Failed to login');
    }
});

// User login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        
        if (user.isBlocked) {
            return res.status(403).json({ error: 'Your account is blocked. Please contact support for assistance.' });
        }

        if (await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ id: user.id }, 'my_jwt_secret', { expiresIn: 86400 });
            res.status(200).json({ token });
        } else {
            res.status(401).json({ error: 'Invalid email or password.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to login.' });
    }
});

// Get all users except the current user
app.get('/users', authenticateAdmin, async (req, res) => {
    try {
      const users = await User.findAll();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

// Get user by ID
app.get('/users/:userId', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findOne({
            where: { id: req.userId },
            attributes: ['id', 'username', 'email', 'avatar', 'phoneNumber', 'dateOfBirth', 'address', 'gender', 'favoriteSport', 'lastSeen']
        });
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to retrieve user');
    }
});

// User profile
app.get('/profile', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            phoneNumber: user.phoneNumber,
            dateOfBirth: user.dateOfBirth,
            address: user.address,
            gender: user.gender,
            favoriteSport: user.favoriteSport,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to retrieve user profile');
    }
});

app.get('/profile/:userId', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            phoneNumber: user.phoneNumber,
            dateOfBirth: user.dateOfBirth,
            address: user.address,
            gender: user.gender,
            favoriteSport: user.favoriteSport,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to retrieve user profile');
    }
});

// Update user profile
app.put('/profile', authenticateJWT, upload.single('avatar'), async (req, res) => {
    const { username, email, phoneNumber, dateOfBirth, address, gender, favoriteSport } = req.body;
    const avatar = req.file ? `uploads/avatars/${req.file.filename}` : req.body.avatar;

    try {
        const user = await User.findByPk(req.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        await user.update({ username, email, avatar, phoneNumber, dateOfBirth, address, gender, favoriteSport });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to update user profile');
    }
});
// User logout
app.post('/logout', authenticateJWT, async (req, res) => {
    const user = await User.findByPk(req.userId);
    if (user) {
        user.lastSeen = new Date();
        await user.save();
    }
    res.sendStatus(204);
});

app.get('/get-locations', authenticateJWT ,async (req, res) => {
    try {
      const locations = await User.findAll({ attributes: ['id','avatar', 'username', 'latitude', 'longitude','phoneNumber',"updatedAt"] });
      res.status(200).json(locations);
    } catch (error) {
      console.error('Error getting user locations:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

app.get('/get-location', authenticateJWT ,async (req, res) => {
    try {
      const user = await User.findByPk(req.userId, { attributes: ['latitude', 'longitude','updatedAt'] });
      res.status(200).json(user);
    } catch (error) {
      console.error('Error getting user location:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

//update location 
app.post('/post-location',authenticateJWT , async (req, res) => {
    const { latitude, longitude } = req.body;
    try {
      const user = await User.findOne({ where: req.userId  });
      await user.update({ latitude, longitude });
      res.status(201).json({ message: 'Location posted successfully' });
    } catch (error) {
      console.error('Error posting location:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/remove-location', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findOne({ where: { id: req.userId } });
        await user.update({ latitude: null, longitude: null });
        res.status(200).json({ message: 'Location removed successfully' });
    } catch (error) {
        console.error('Error removing location:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Create a new match
app.post('/matches', authenticateJWT, async (req, res) => {
    const { sport, maxPlayers, date, location, price, description } = req.body;
    try {
        const match = await Match.create({
            sport,
            maxPlayers,
            currentPlayers: 1, // Initial participant count is 1 (the creator)
            date,
            location,
            price,
            description,
            status: 'pending',
            ownerId: req.userId
        });

        // Add the current user as a participant
        await MatchParticipant.create({
            matchId: match.id,
            userId: req.userId
        });

        res.status(201).json(match);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to create match');
    }
});

// Get all matches
// Get all matches
app.get('/matches', authenticateJWT, async (req, res) => {
    try {
        const matches = await Match.findAll({
            include: [
                {
                    model: User,
                    as: 'owner',
                    attributes: ['id', 'username', 'avatar']
                },
                {
                    model: User,
                    as: 'participants',
                    attributes: ['id', 'username', 'avatar'],
                    through: { attributes: [] }
                }
            ]
        });
        res.json(matches);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to retrieve matches');
    }
});
app.get('/admin-matches', authenticateAdmin, async (req, res) => {
    try {
        const matches = await Match.findAll({
            include: [
                {
                    model: User,
                    as: 'owner',
                    attributes: ['id', 'username', 'avatar']
                },
                {
                    model: User,
                    as: 'participants',
                    attributes: ['id', 'username', 'avatar'],
                    through: { attributes: [] }
                }
            ]
        });
        res.json(matches);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to retrieve matches');
    }
});
// Delete a match
app.delete('/matches/:matchId', authenticateJWT, async (req, res) => {
    try {
        const match = await Match.findOne({ where: { id: req.params.matchId, ownerId: req.userId } });
        if (!match) {
            return res.status(404).send('Match not found or you are not the owner');
        }
        await match.destroy();
        res.status(200).send('Match deleted successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to delete match');
    }
});

// Get match by ID
app.get('/matches/:matchId', authenticateJWT, async (req, res) => {
    try {
        const match = await Match.findByPk(req.params.matchId, {
            include: [
                {
                    model: User,
                    as: 'owner',
                    attributes: ['id', 'username', 'avatar']
                },
                {
                    model: User,
                    as: 'participants',
                    attributes: ['id', 'username', 'avatar']
                }
            ]
        });
        if (!match) {
            return res.status(404).send('Match not found');
        }
        res.json(match);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to retrieve match');
    }
});
// Join a match
app.post('/matches/:matchId/join', authenticateJWT, async (req, res) => {
    try {
        const match = await Match.findByPk(req.params.matchId);
        if (!match) {
            return res.status(404).send('Match not found');
        }
        const isAlreadyJoined = await MatchParticipant.findOne({
            where: { matchId: match.id, userId: req.userId }
        });
        if (isAlreadyJoined) {
            return res.status(400).send('You are already a participant of this match');
        }
        if (match.currentPlayers >= match.maxPlayers) {
            return res.status(400).send('Match is already full');
        }
        await MatchParticipant.create({
            matchId: match.id,
            userId: req.userId
        });
        match.currentPlayers += 1;
        await match.save();
        res.status(201).send('Successfully joined the match');
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to join match');
    }
});
// Leave a match
app.post('/matches/:matchId/leave', authenticateJWT, async (req, res) => {
    try {
        const match = await Match.findByPk(req.params.matchId);
        if (!match) {
            return res.status(404).send('Match not found');
        }
        const participant = await MatchParticipant.findOne({
            where: { matchId: match.id, userId: req.userId }
        });
        if (!participant) {
            return res.status(400).send('You are not a participant of this match');
        }
        await participant.destroy();
        match.currentPlayers -= 1;
        await match.save();
        res.status(200).send('Successfully left the match');
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to leave match');
    }
});
// Remove participant from match
app.delete('/matches/:matchId/remove/:participantId', authenticateJWT, async (req, res) => {
    const ownerId = req.userId;
    const matchId = req.params.matchId;
    const participantId = req.params.participantId;

    try {
        // Vérifier si le propriétaire a le droit de supprimer le participant
        const match = await Match.findOne({
            where: { id: matchId, ownerId },
            include: [{ model: User, as: 'participants', attributes: ['id'] }]
        });
        if (!match) {
            return res.status(404).send('Match not found or you are not the owner');
        }

        // Vérifier si le participant existe dans le match
        const participant = match.participants.find(p => p.id === Number(participantId));
        if (!participant) {
            return res.status(404).send('Participant not found in this match');
        }

        await MatchParticipant.destroy({
            where: { matchId, userId: participantId }
        });

        // Mettre à jour le nombre de participants dans le match
        match.currentPlayers -= 1;
        x

        res.status(200).send('Participant removed from the match');
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to remove participant from the match');
    }
});

app.delete('/admin-matches/:matchId/remove/:participantId', authenticateAdmin, async (req, res) => {
    const matchId = req.params.matchId;
    const participantId = req.params.participantId;

    try {
        const match = await Match.findByPk(matchId, {
            include: [{ model: User, as: 'participants', attributes: ['id'] }]
        });

        if (!match) {
            return res.status(404).send('Match not found');
        }

        const participant = match.participants.find(p => p.id === Number(participantId));
        if (!participant) {
            return res.status(404).send('Participant not found in this match');
        }

        await MatchParticipant.destroy({
            where: { matchId, userId: participantId }
        });

        match.currentPlayers -= 1;
        await match.save();

        res.status(200).send('Participant removed from the match');
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to remove participant from the match');
    }
});

app.delete('/admin-matches/:matchId', authenticateAdmin, async (req, res) => {
    const matchId = req.params.matchId;

    try {
        const match = await Match.findByPk(matchId);

        if (!match) {
            return res.status(404).send('Match not found');
        }

        await match.destroy();
        res.status(200).send('Match deleted successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to delete match');
    }
});
app.put('/matches/:matchId/status', authenticateAdmin, async (req, res) => {
    const { status } = req.body;
    try {
        const match = await Match.findByPk(req.params.matchId);
        if (!match) {
            return res.status(404).send('Match not found');
        }

        match.status = status;
        await match.save();

        res.status(200).json(match);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to update match status');
    }
});
app.get('/blogs', async (req, res) => {
    try {
        const blogs = await Blog.findAll();
        res.json(blogs);
    } catch (err) {
        console.error('Error fetching blogs:', err);
        res.status(500).json({ message: 'Failed to retrieve blogs' });
    }
});

app.get('/blogs/:blogId', async (req, res) => {
    try {
        const blog = await Blog.findByPk(req.params.blogId);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        res.json(blog);
    } catch (err) {
        console.error('Error fetching blog:', err);
        res.status(500).json({ message: 'Failed to retrieve blog' });
    }
});
app.post('/send-email', async (req, res) => {
    const { name, lastName, email, phone, coach, message } = req.body;
    try {
      const result = await sendMail(name, lastName, email, phone, coach, message);
      res.status(200).send(result);
    } catch (error) {
      res.status(500).send(error);
    }
  });
//app management (admin)
app.get('/  ', async (req, res) => {
    try {
        const events = await Event.findAll();
        res.json(events);
    } catch (err) {
        console.error('Error fetching blogs:', err);
        res.status(500).json({ message: 'Failed to retrieve blogs' });
    }
});
app.get('/events/:id', async (req, res) => {
    const eventId = req.params.id; // Get the event ID from request parameters
    
    try {
        const event = await Event.findByPk(eventId); // Use findByPk to find event by its primary key
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event); // Return the event as JSON response
    } catch (err) {
        console.error('Error fetching event:', err);
        res.status(500).json({ message: 'Failed to retrieve event' });
    }
});
app.post('/events', authenticateAdmin, uploadEventCover.single('cover'), async (req, res) => {
    const { title, description } = req.body;
    const cover = req.file ? req.file.path : null;
    
    try {
        const event = await Event.create({ title, description, cover, adminId: req.adminId });
        res.status(201).json(event);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create event' });
    }
});


    app.put('/events/:eventId', authenticateAdmin, async (req, res) => {
        const { title, description, cover } = req.body;
        try {
            const event = await Event.findByPk(req.params.eventId);
            if (event && event.adminId === req.adminId) {
                await event.update({ title, description, cover });
                res.json(event);
            } else {
                res.status(404).json({ message: 'Event not found or not authorized' });
            }
        } catch (err) {
            console.error('Error updating event:', err);
            res.status(500).json({ message: 'Failed to update event' });
        }
    });


app.delete('/events/:eventId', authenticateAdmin, async (req, res) => {
    try {
      const event = await Event.findByPk(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      await event.destroy();
      res.status(200).json({ message: 'Event deleted' });
    } catch (err) {
      res.status(500).json({ message: 'Failed to delete event' });
    }
  });
  

// Blog routes (Admin only)
app.post('/blogs', authenticateAdmin, async (req, res) => {
    const { title, description, imageUrl, author, authorRole, authorImage, date, category } = req.body;
    try {
        const blog = await Blog.create({ title, description, imageUrl, author, authorRole, authorImage, date, category, adminId: req.adminId });
        res.status(201).json(blog);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create blog' });
    }
});

app.put('/blogs/:blogId', authenticateAdmin, async (req, res) => {
    const { title, description, imageUrl, author, authorRole, authorImage, date, category } = req.body;
    try {
        const blog = await Blog.findByPk(req.params.blogId);
        if (blog && blog.adminId === req.adminId) {
            await blog.update({ title, description, imageUrl, author, authorRole, authorImage, date, category });
            res.json(blog);
        } else {
            res.status(404).json({ message: 'Blog not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Failed to update blog' });
    }
});

app.delete('/blogs/:blogId', authenticateAdmin, async (req, res) => {
    try {
        const blog = await Blog.findByPk(req.params.blogId);
        if (blog && blog.adminId === req.adminId) {
            await blog.destroy();
            res.status(200).json({ message: 'Blog deleted' });
        } else {
            res.status(404).json({ message: 'Blog not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete blog' });
    }
});

// User management routes (Admin only)
app.put('/users/:userId/block', authenticateAdmin, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.userId);
        if (user) {
            user.isBlocked = true;
            await user.save();
            res.status(200).json({ message: 'User blocked' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Failed to block user' });
    }
});

app.put('/users/:userId/unblock', authenticateAdmin, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.userId);
        if (user) {
            user.isBlocked = false;
            await user.save();
            res.status(200).json({ message: 'User unblocked' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Failed to unblock user' });
    }
});
  
// Like an event
app.post('/events/:eventId/like', authenticateJWT, async (req, res) => {
    const { eventId } = req.params;
    const userId = req.userId;

    try {
        // Check if the user has already liked the event
        const existingLike = await EventLike.findOne({
            where: { eventId, userId }
        });

        if (existingLike) {
            return res.status(400).json({ message: 'You have already liked this event.' });
        }

        // Add like
        await EventLike.create({ eventId, userId });

        // Increment the like count on the event
        const event = await Event.findByPk(eventId);
        event.likes += 1;
        await event.save();

        res.status(201).json({ message: 'Event liked successfully.' });
    } catch (error) {
        console.error('Error liking event:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Unlike an event
app.delete('/events/:eventId/unlike', authenticateJWT, async (req, res) => {
    const { eventId } = req.params;
    const userId = req.userId;

    try {
        // Check if the like exists
        const existingLike = await EventLike.findOne({
            where: { eventId, userId }
        });

        if (!existingLike) {
            return res.status(400).json({ message: 'You have not liked this event.' });
        }

        // Remove like
        await existingLike.destroy();

        // Decrement the like count on the event
        const event = await Event.findByPk(eventId);
        event.likes -= 1;
        await event.save();

        res.status(200).json({ message: 'Event unliked successfully.' });
    } catch (error) {
        console.error('Error unliking event:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Add a comment
app.post('/events/:eventId/comments', authenticateJWT, async (req, res) => {
    const { eventId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    try {
        const comment = await EventComment.create({
            content,
            eventId,
            userId
        });

        res.status(201).json(comment);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get comments for an event
app.get('/events/:eventId/comments', authenticateJWT, async (req, res) => {
    const { eventId } = req.params;

    try {
        const comments = await EventComment.findAll({
            where: { eventId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'avatar']
                }
            ]
        });

        res.status(200).json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a comment
app.put('/comments/:commentId', authenticateJWT, async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    try {
        const comment = await EventComment.findByPk(commentId);

        if (!comment || comment.userId !== userId) {
            return res.status(404).json({ message: 'Comment not found or unauthorized.' });
        }

        comment.content = content;
        await comment.save();

        res.status(200).json(comment);
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a comment
app.delete('/comments/:commentId', authenticateJWT, async (req, res) => {
    const { commentId } = req.params;
    const userId = req.userId;

    try {
        const comment = await EventComment.findByPk(commentId);

        if (!comment || comment.userId !== userId) {
            return res.status(404).json({ message: 'Comment not found or unauthorized.' });
        }

        await comment.destroy();

        res.status(200).json({ message: 'Comment deleted successfully.' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
