const  express = require('express')
const {engine} = require('express-handlebars')
const app = express()
const cookieParser = require('cookie-parser')
const port = 3001
const db = require('./dbObjects.js')
const fs = require('fs-extra')
const busboy = require('connect-busboy')
const path = require('path')
const { where } = require('sequelize')
const bcrypt = require('bcrypt')
const jsonWebToken = require('jsonwebtoken')
const config = require('./config.json')


app.use(express.static('public'))

const hbs = engine({
    helpers: {
        greaterThan: (a, b) => a > b,
        eq: (a, b) => a == b,
        first: (array) => array && array.length > 0 ? array[0] : null,
    }
})

app.engine('handlebars', hbs)
app.set('view engine', 'handlebars')
app.set('views', './views')
app.use(busboy());
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({
	extended: true
}))
app.use(cookieParser());

app.use((req, res, next) => {

    if (req.cookies.token) {
        const decoded = jsonWebToken.verify(req.cookies.token, config.verySecretSecret);
        if (decoded) {
            req.user = decoded;
            next()
            return
        }
    }
    if (req.path != "/login" && req.path != "/signup" && req.path != "/checkLogin") {
        console.log(req.path)
        if (!req.cookies.token) {
            console.log("no token")
            res.redirect('/login')
            return;
        }
        next();
    }
    else {
        console.log(req.path)
        next()
    }
})

app.get('/', (req, res) => {
	res.redirect('/tricks')
})

app.get('/checkLogin', async (req, res) => {
    if (req.cookies.token) {
        try {
            const decoded = jsonWebToken.verify(req.cookies.token, config.verySecretSecret);
            if (decoded) {
                res.status(200).send('User is already logged in');
                return;
            }
        } catch (err) {
            console.error("Invalid token:", err);
        }
    }

    if (!req.query.username || !req.query.password) {
        res.status(400).redirect('/login' + "?error=Username and password are required");
        return;
    }
    const user = await db.Users.findOne({where: {username: req.query.username}});
    if (!user) {
        res.status(404).send('User not found');
        return;
    }
    if (req.query.password && req.query.username) {
        const isPasswordValid = await bcrypt.compare(req.query.password, user.password);
        if (!isPasswordValid) {
            res.status(401).send('Invalid password');
            return;
        } else {
            const token = jsonWebToken.sign({id: user.id}, config.verySecretSecret, {expiresIn: '1w'});
            res.cookie('token', token, {httpOnly: true});
            res.status(200).redirect('/');
            return;
        }
    }

})

app.get('/signup', (req, res) => {
    res.render('signup')
})

app.get('/login', (req, res) => {
    res.render('login', {error: req.query.error})
})

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login')
})

app.get('/friends', async(req, res) => {
    
    res.render('friends', {friends: []})
})

app.post('/user', async (req, res) => {
    let pictureFileName;
    let formData = {};
    var fstream;
    

    req.pipe(req.busboy);

    req.busboy.on('field', async function (fieldname, val) {
        formData[fieldname] = val;
        const existingUser = await db.Users.findOne({where: {username: formData.username.toLowerCase()}});
    
        if (existingUser) {
            res.render('signup', {error: 'Error 400: User already exists'});
            return;
        }

        if (!formData.username || !formData.password) {
            res.render('signup', {error: 'Error 400: Username and password are required'});
            return;
        }

    });
    
    
    req.busboy.on('file', function (fieldname, file, filename) {
        console.log("Uploading: " + filename);
        pictureFileName = "temp" + filename + '.png';
        const uploadDir = path.join(__dirname, 'uploadedImages');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        fstream = fs.createWriteStream(path.join(uploadDir, pictureFileName));
        file.pipe(fstream);
        fstream.on('close', function () {
            console.log("Upload Finished of " + filename + " to " + path.join(uploadDir, pictureFileName));
        });
    });


    req.busboy.on('finish', async function () {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(formData.password, salt);
    
        
        const user = await db.Tricks.create({
            username: formData.username.toLowerCase(),
            password: hashedPassword,
            role: req.body.role || 'user',
            description: null,
            profilePicture: null,
        });
        const newFileName = user.id + "_profilePicture" + ".png";
        const newFilePath = path.join(__dirname, 'uploadedImages', newFileName);
        fs.renameSync(path.join(__dirname, 'uploadedImages', pictureFileName), newFilePath);
        console.log(newFileName)
        user.profilePicture = [newFileName]
        console.log(user.images)
        await user.save()
        res.redirect('/tricks');
    });
    
})

app.get('/uploadedImages/:filename', (req, res) => {
    //! add authentication check
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploadedImages', filename);
    if (!fs.existsSync(filePath)) {
        res.sendFile(path.join(__dirname, 'pictures', '404_not_found.jpg'));
        return;
    }
    res.sendFile(filePath);
});


app.get('/tricks', async (req, res) => {
    const filter = req.query.filter;
    if (filter) {
        const tricks = await db.Tricks.findAll({where: {tags: filter}});
        const plainTricks = tricks.map(trick => trick.get({ plain: true })); // Convert to plain objects
        res.render('tricks', { tricks: plainTricks });
        return;
    }
    const tricks = await db.Tricks.findAll();
    const plainTricks = tricks.map(trick => trick.get({ plain: true })); // Convert to plain objects
    res.render('tricks', { tricks: plainTricks });
});

app.get('/trick/:id', async (req, res) => {
    if (!req.params.id) {
        res.status(404).send('Trick not found. invalid query');
        return;
    }
    const trick = await db.Tricks.findOne({
        where: {id: req.params.id}, 
        include: [
            {model: db.Tricks, as: 'FromTrick'}, 
            {model: db.Tricks, as: 'ToTrick'}
        ]
    });
    if (!trick) {
        res.status(404).send('Trick not found');
        return;
    } 

    const nextTricks = await db.Tricks.findAll({where: {from: trick.ToTrick ? trick.ToTrick.id : trick.id}});
    const previousTricks = await db.Tricks.findAll({where: {to: trick.FromTrick ? trick.FromTrick.id : trick.id}});

    const plainTrick = trick.get({ plain: true });
    plainTrick.nextTricks = nextTricks.map(trick => trick.get({ plain: true }));
    plainTrick.previousTricks = previousTricks.map(trick => trick.get({ plain: true }));
	res.render('trick', {trick: plainTrick})
})


app.get('/create-Trick', async (req, res) => {
    const tricks = (await db.Tricks.findAll()).map(trick => {
        return trick.get({ plain: true });
    });
    const from = tricks.find(trick => trick.id == req.query.from);
    const to = tricks.find(trick => trick.id == req.query.to);
	res.render('createTrick', {tricks: tricks, from: from, to: to})
})	

app.post('/addTrick', async (req, res) => {
    let pictureFileNames = []
    let videoFileNames = []
    let formData = {};
    var fstream;

    req.pipe(req.busboy);

    req.busboy.on('field', function (fieldname, val) {
        formData[fieldname] = val;
        if (fieldname === 'name' && val === "{null}") {
            res.status(400).send('Name is invalid');
            return;
        }

    });
    
    //! add support for uploading videos 
    req.busboy.on('file', function (fieldname, file, fileInfo) {
        console.log(fieldname)
        
        if (fieldname == 'pictures') {
            const index = pictureFileNames.length
            console.log("Uploading: " + fileInfo.filename);
            pictureFileNames[index] = "temp" + fileInfo.filename;
            const uploadDir = path.join(__dirname, 'uploadedImages');
            
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir);
            }
            fstream = fs.createWriteStream(path.join(uploadDir, pictureFileNames[index]));
            file.pipe(fstream);
            fstream.on('close', function () {
                console.log("Upload Finished of " + fileInfo.filename + " to " + path.join(uploadDir, pictureFileNames[index]));
            });
        } else if (fieldname == 'video') {
            const index = videoFileNames.length
            console.log("Uploading: " + fileInfo.filename);
            videoFileNames[index] = "temp" + fileInfo.filename;
            const uploadDir = path.join(__dirname, 'uploadedVideos');
            
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir);
            }
            fstream = fs.createWriteStream(path.join(uploadDir, videoFileNames[index]));
            file.pipe(fstream);
            fstream.on('close', function () {
                console.log("Upload Finished of " + fileInfo.filename + " to " + path.join(uploadDir, videoFileNames[index]));
            });
        }
        else {
            console.log("Unknown file field: " + fieldname);
        }
        
    });


    req.busboy.on('finish', async function () {
        formData.difficulty = parseInt(formData.difficulty);
        if (formData.difficulty < 1) {
            formData.difficulty = 1;
        } else if (formData.difficulty > 5) {
            formData.difficulty = 5;
        }
        
        
        const trick = await db.Tricks.create({
            name: formData.name,
            difficulty: formData.difficulty,
            sudonames: formData.sudonames,
            description: formData.description,
            tags: formData.tags,
            images: [],
            videos: null,
            to: formData.to === '{null}' ? null : (formData.to ? formData.to : null),
            from: formData.from === '{null}' ? null : (formData.from ? formData.from : null)
        });
        
        const renamedFileNames = [];
        pictureFileNames.forEach((pictureFileName, index) => {
            console.log("renaming: " + pictureFileName);
            const newFileName = trick.id + "_" + (index != 0 ? index + "_" : "") + Date.now() + ".png";
            const newFilePath = path.join(__dirname, 'uploadedImages', newFileName);
            fs.renameSync(path.join(__dirname, 'uploadedImages', pictureFileName), newFilePath);
            renamedFileNames.push(newFileName);
        });
        pictureFileNames = renamedFileNames;
        console.log(pictureFileNames)
        trick.images = pictureFileNames
        await trick.save()
        res.redirect('/trick/' + trick.id);
    });
});

app.delete('/deleteTrick/:trickId', async (req, res) => {
    //! make sure the user is permited to deleate the trick
    
    const trickId = req.params.trickId;
    if (!trickId) {
        res.status(400).send('Trick ID is required');
        return;
    }
    const trick = await db.Tricks.findOne({ where: { id: trickId } });
    if (trick && trick.images) {
        for (const image of trick.images) {
            const imagePath = path.join(__dirname, 'uploadedImages', image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log("deleted image: " + imagePath)
            }
        }
    }

    await db.Tricks.destroy({ where: { id: trickId } });
    
    res.status(200).send('Trick deleted successfully')
})

app.get('/create-Transition', async (req, res) => {
    const tricks = (await db.Tricks.findAll()).map(trick => {
        return trick.get({ plain: true });
    });
    res.render('createTransition', {tricks: tricks, trick: req.query.trick})
})



app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})
