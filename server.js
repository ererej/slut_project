const express = require('express')
const { engine } = require('express-handlebars')
const app = express()
const cookieParser = require('cookie-parser')
const port = 3000
const db = require('./dbObjects.js')
const fs = require('fs-extra')
const busboy = require('connect-busboy')
const path = require('path')
const { where } = require('sequelize')
const bcrypt = require('bcrypt')
const jsonWebToken = require('jsonwebtoken')
const config = require('./config.json')
const { exec } = require('child_process')


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
    // First check cookie
    if (req.cookies && req.cookies.token) {
        try {
            const decoded = jsonWebToken.verify(req.cookies.token, config.verySecretSecret);
            if (decoded) {
                req.user = decoded;
                // Also set the Authorization header for internal use
                req.headers['Authorization'] = `Bearer ${req.cookies.token}`;
                next();
                return;
            }
        } catch (err) {
            console.error("Invalid token in cookie:", err);
        }
    }
    
    // Then check Authorization header
    if (req.headers['Authorization']) {
        try {
            const decoded = jsonWebToken.verify(req.headers['Authorization'].slice(7), config.verySecretSecret);
            if (decoded) {
                req.user = decoded;
                next();
                return;
            }
        } catch (err) {
            console.error("Invalid token in header:", err);
        }
    }
    
    // No valid authentication
    if (!["/login", "/signup", "/checkLogin", "/pictures/logo.svg"].includes(req.path)) {
        console.log(`Unauthorized access to ${req.path}`);
        res.redirect('/login');
        return;
    }
    next();
})

const getUserFromToken = async (req) => {
    // First check token in cookies
    if (req.cookies && req.cookies.token) {
        try {
            const decoded = jsonWebToken.verify(req.cookies.token, config.verySecretSecret);
            const user = await db.Users.findOne({ where: { id: decoded.id } });
            if (user) {
                return user;
            }
        } catch (err) {
            console.error("Invalid token in cookie:", err);
        }
    }
    
    // Then check Authorization header
    if (req.headers['Authorization']) {
        try {
            const decoded = jsonWebToken.verify(req.headers['Authorization'].slice(7), config.verySecretSecret);
            const user = await db.Users.findOne({ where: { id: decoded.id } });
            if (user) {
                return user;
            }
        } catch (err) {
            console.error("Invalid token in header:", err);
        }
    }
    
    return null;
}

const canView = async (user) => {

}


app.get('/', (req, res) => {
    res.redirect('/tricks')
})

app.post('/checkLogin', async (req, res) => {
    if (req.headers['Authorization']) {
        try {
            console.log(req.headers['Authorization'])
            const decoded = jsonWebToken.verify(req.headers['Authorization'].slice(7), config.verySecretSecret);
            if (decoded) {
                res.status(200).send('User is already logged in');
                return;
            }
        } catch (err) {
            console.error("Invalid token:", err);
        }
    }
    console.log(req.body)
    if (!req.body.username || !req.body.password) {
        res.status(400).redirect('/login' + "?error=Username and password are required");
        return;
    }
    const user = await db.Users.findOne({ where: { username: req.body.username } });
    if (!user) {
        res.status(404).send('User not found');
        return;
    }
    if (req.body.password && req.body.username) {
        const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordValid) {
            res.status(401).send('Invalid password');
            return;
        } else {
            console.log("giving token")
            const token = jsonWebToken.sign({ id: user.id }, config.verySecretSecret, { expiresIn: '168h' });
            
            // Set the token as a cookie instead of just in the response header
            res.cookie('token', token, { 
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                sameSite: 'strict'
            });
            
            res.redirect('/');
            return;
        }
    }
})

app.get('/signup', (req, res) => {
    res.render('signup')
})

app.get('/login', (req, res) => {
    res.render('login', { error: req.query.error })
})

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
})

app.get('/friends', async (req, res) => {

    res.render('friends', { friends: [] })
})

app.post('/user', async (req, res) => {
    let pictureFileName;
    let formData = {};
    var fstream;


    req.pipe(req.busboy);

    req.busboy.on('field', async function (fieldname, val) {
        formData[fieldname] = val;
        const existingUser = await db.Users.findOne({ where: { username: formData.username.toLowerCase() } });

        if (existingUser) {
            res.render('signup', { error: 'Error 400: User already exists' });
            return;
        }

        if (!formData.username || !formData.password) {
            res.render('signup', { error: 'Error 400: Username and password are required' });
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

app.get('/pictures/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'pictures', filename);
    if (!fs.existsSync(filePath)) {
        res.sendFile(path.join(__dirname, 'pictures', '404_not_found.jpg'));
        return;
    }
    res.sendFile(filePath);
});

app.get('/uploadedVideos/:filename', (req, res) => {
    console.log("getting video: " + req.params.filename)
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploadedVideos', filename);
    if (!fs.existsSync(filePath)) {
        console.log("file not found: " + filePath)
        res.sendFile(path.join(__dirname, 'pictures', '404_not_found.jpg'));
        return;
    }
    res.sendFile(filePath);
});


app.get('/video-thumbnail/:filename', async (req, res) => {
    const filepath = path.join(__dirname, 'uploadedImages', req.params.filename, "-thumbnail.png");
    if (!fs.existsSync(filepath)) {
        res.sendFile(path.join(__dirname, 'pictures', '404_not_found.jpg'));
        return;
    }
    res.sendFile(filepath);
            
});

app.get('/tricks', async (req, res) => {
    const filter = req.query.filter;
    if (filter) {
        const tricks = await db.Tricks.findAll({ where: { tags: filter } });
        // for (const trick in tricks) {
        //     if (await trick.canView(getUserFromToken()))
        //     {}
        // }
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
        where: { id: req.params.id },
        include: [
            { model: db.Tricks, as: 'FromTrick' },
            { model: db.Tricks, as: 'ToTrick' }
        ]
    });
    if (!trick) {
        res.status(404).send('Trick not found');
        return;
    }

    const nextTricks = await db.Tricks.findAll({ where: { from: trick.ToTrick ? trick.ToTrick.id : trick.id } });
    const previousTricks = await db.Tricks.findAll({ where: { to: trick.FromTrick ? trick.FromTrick.id : trick.id } });

    const plainTrick = trick.get({ plain: true });
    plainTrick.nextTricks = nextTricks.map(trick => trick.get({ plain: true }));
    plainTrick.previousTricks = previousTricks.map(trick => trick.get({ plain: true }));
    res.render('trick', { trick: plainTrick })
})


app.get('/create-Trick', async (req, res) => {
    const tricks = (await db.Tricks.findAll()).map(trick => {
        return trick.get({ plain: true });
    });
    const from = tricks.find(trick => trick.id == req.query.from);
    const to = tricks.find(trick => trick.id == req.query.to);
    res.render('createTrick', { tricks: tricks, from: from, to: to })
})

app.post('/addTrick', async (req, res) => {
    const user = await getUserFromToken(req)
    if (user == null) {
        res.status(401).send('Unauthorized');
        return;
    }
    let pictureFileNames = []
    let videoFileNames = []
    let videoThumbnailFileNames = []
    let formData = {};
    let fstream;
    let filesComplete = 0
    let fieldsComplete = 0

    // Add these debug statements
    console.log("Starting /addTrick processing");

    req.pipe(req.busboy);

    req.busboy.on('error', function (error) {
        console.error("Error in busboy:", error);
        res.status(500).send('Internal Server Error');
    })

    req.busboy.on('field', function (fieldname, val) {
        console.log("Fild received: " + fieldname + " = " + val);
        formData[fieldname] = val;
        fieldsComplete++

        if (fieldname === 'name' && val === "{null}") {
            res.status(400).send('Name is invalid');
            return;
        }

    });

    
    req.busboy.on('file', function (fieldname, file, fileInfo) {
        console.log(`File processing started for ${fieldname}`);


        if (!fileInfo || !fileInfo.filename) {
            console.log("No file info or filename provided for field: " + fieldname);
            filesComplete++;
            return;
        }

        if (fieldname == 'pictures') {
            const index = pictureFileNames.length
            console.log("Uploading: " + fileInfo.filename);
            pictureFileNames[index] = "temp" + fileInfo.filename;
            const uploadDir = path.join(__dirname, 'uploadedImages');

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const filePath = path.join(uploadDir, pictureFileNames[index]);

            fstream = fs.createWriteStream(filePath)
            
            fstream.on('error', (err) => {
                console.error(`Error writing file ${filePath}:`, err);
                file.resume(); // Resume the stream to avoid memory leaks
            })

            file.on('error', (err) => {
                console.error("Error reading uploaded file:", err);
                fstream.end(); // Close the write stream
            })

            file.pipe(fstream);
            
            fstream.on('close', function () {
                console.log("Upload Finished of " + fileInfo.filename + " to " + path.join(uploadDir, pictureFileNames[index]));
                filesComplete++;
            });
        } else if (fieldname == 'video') {
            const index = videoFileNames.length
            console.log("Uploading: " + fileInfo.filename);
            videoFileNames[index] = "temp" + fileInfo.filename;
            const uploadDir = path.join(__dirname, 'uploadedVideos');

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, videoFileNames[index]);
            fstream = fs.createWriteStream(filePath);

            fstream.on('error', (err) => {
                console.error(`Error writing file ${filePath}:`, err);
                file.resume(); // Resume the stream to avoid memory leaks
            })

            file.on('error', (err) => {
                console.error("Error reading uploaded file:", err);
                fstream.end(); // Close the write stream
            })

            file.pipe(fstream);

            fstream.on('close', function () {
                console.log("Upload Finished of " + fileInfo.filename + " to " + path.join(uploadDir, videoFileNames[index]));
                filesComplete++;
            });
        } else if (fieldname == 'videoThumbnail') {
            const index = videoThumbnailFileNames.length
            console.log("Uploading: " + fileInfo.filename);
            videoThumbnailFileNames[index] = "temp" + fileInfo.filename;
            const uploadDir = path.join(__dirname, 'uploadedImages');

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, videoThumbnailFileNames[index]);
            fstream = fs.createWriteStream(filePath);

            fstream.on('error', (err) => {
                console.error(`Error writing file ${filePath}:`, err);
                file.resume(); // Resume the stream to avoid memory leaks
            })

            file.on('error', (err) => {
                console.error("Error reading uploaded file:", err);
                fstream.end(); // Close the write stream
            })

            file.pipe(fstream);

            fstream.on('close', function () {
                console.log("Upload Finished of " + fileInfo.filename + " to " + path.join(uploadDir, videoThumbnailFileNames[index]));
                filesComplete++;
            });
        } else {
            console.log("Unknown file field: " + fieldname);
            file.resume(); // Consume the file stream to avoid memory leaks
            filesComplete++;
        }

    });


    req.busboy.on('finish', async function () {
        console.log("⭐ BUSBOY FINISH EVENT TRIGGERED ⭐");
        console.log(`Fields processed: ${fieldsComplete}, Files processed: ${filesComplete}`);
        
        try {
            formData.difficulty = parseInt(formData.difficulty);
            if (formData.difficulty < 1) {
                formData.difficulty = 1;
            } else if (formData.difficulty > 5) {
                formData.difficulty = 5;
            }

            console.log("formData.to: " + formData.to)
            console.log("formData.from: " + formData.from)

            console.log("Creating trick with data:", {
                name: formData.name,
                difficulty: formData.difficulty,
                to: formData.to,
                from: formData.from,
                imageCount: pictureFileNames.length,
                videoCount: videoFileNames.length
            });

            const trick = await db.Tricks.create({
                name: formData.name,
                owner: user.id,
                difficulty: formData.difficulty,
                sudonames: formData.sudonames,
                description: formData.description,
                tags: formData.tags,
                images: [],
                videos: null,
                to: formData.to === '{null}' ? null : (formData.to ? formData.to : null),
                from: formData.from === '{null}' ? null : (formData.from ? formData.from : null)
            });
            console.log("created trick with ID: " + trick.id)

            if (pictureFileNames.length > 0) {
                const renamedPictureNames = [];
                pictureFileNames.forEach((pictureFileName, index) => {
                    console.log("renaming: " + pictureFileName);
                    const newFileName = trick.id + "_" + (index != 0 ? index + "_" : "") + Date.now() + ".png";
                    const newFilePath = path.join(__dirname, 'uploadedImages', newFileName);
                    fs.renameSync(path.join(__dirname, 'uploadedImages', pictureFileName), newFilePath);
                    renamedPictureNames.push(newFileName);
                });
                trick.images = renamedPictureNames
            }
            
            if (videoFileNames.length > 0) {
                const renamedVideoNames = [];
                videoFileNames.forEach((videoFileName, index) => {
                    const newFileName = trick.id + "_" + (index != 0 ? index + "_" : "") + Date.now() + ".mp4";
                    const newFilePath = path.join(__dirname, 'uploadedVideos', newFileName);
                    fs.renameSync(path.join(__dirname, 'uploadedVideos', videoFileName), newFilePath);
                    if (videoThumbnailFileNames[index]) {
                        const newThumbnailFileName = newFileName + "-thumbnail.png";
                        const newThumbnailFilePath = path.join(__dirname, 'uploadedImages', newThumbnailFileName);
                        fs.renameSync(path.join(__dirname, 'uploadedImages', videoThumbnailFileNames[index]), newThumbnailFilePath);
                    }
                    renamedVideoNames.push(newFileName);
                });
            }
            await trick.save()
            res.redirect('/trick/' + trick.id);
        } catch (error) {
            console.error("Error in busboy finish handler:", error);
            res.status(500).send('An error occurred while processing the request. ' + error.message);
        }
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
    
    if (!trick) {
        res.status(404).send('Trick not found');
        return;
    }
    
    if (trick.images) {
        for (const image of trick.images) {
            const imagePath = path.join(__dirname, 'uploadedImages', image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log("deleted image: " + imagePath)
            }
        }
    }

    if (trick.videos) {
        for (const video of trick.videos) {
            const videoPath = path.join(__dirname, 'uploadedVideos', video);
            const thumbnailPath = path.join(__dirname, 'uploadedImages', video + "-thumbnail.png");
            if (fs.existsSync(thumbnailPath)) {
                fs.unlinkSync(thumbnailPath);
                console.log("deleted thumbnail: " + thumbnailPath)
            }
            if (fs.existsSync(videoPath)) {
                fs.unlinkSync(videoPath);
                console.log("deleted video: " + videoPath)
            }
        }
    }

    try {
        // Delete dependent rows first
        await db.Tricks.update({ to: null }, { where: { to: trickId } });

        // Now delete the parent row
        await db.Tricks.destroy({ where: { id: trickId } });

        res.status(200).send({ message: 'Trick deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to delete trick' });
    }
})

app.get('/create-Transition', async (req, res) => {
    const tricks = (await db.Tricks.findAll()).map(trick => {
        return trick.get({ plain: true });
    });
    res.render('createTransition', { tricks: tricks, trick: req.query.trick })
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
