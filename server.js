const express = require('express')
const { engine } = require('express-handlebars')
const app = express()
const cookieParser = require('cookie-parser')
const port = 3000
const db = require('./dbObjects.js')
const fs = require('fs-extra')
const busboy = require('connect-busboy')
const path = require('path')
const bcrypt = require('bcrypt')
const jsonWebToken = require('jsonwebtoken')
const config = require('./config.json')
const methodOverride = require('method-override');
const { Op } = require('sequelize');


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

app.use(methodOverride('_method', { methods: ['POST', 'GET'] }));

app.use((req, res, next) => {
    if (req.query && req.query.error) {
        res.locals.error = req.query.error;
    }
    if (req.query && req.query.success) {
        res.locals.success = req.query.success;
    }
    next();
});

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
    if (!["/login", "/signup", "/checkLogin", "/pictures/logo.svg", "/"].includes(req.path)) {
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

// const canView = async (user) => {

// }

app.get('/', (req, res) => {
    let documentation = `
        <h1>Welcome to the API documentation.</h1><br>
        Almost no routes return a JSON object, most of them render or redirect to a page.<br>
        "/login", "/signup", "/checkLogin", "/pictures/logo.svg", "/" are the only routes that do not require authentication.<br>
        <br>
        POST /checkLogin - Check if the user is logged in. Returns 200 if already logged in and redirects to /tricks if the login was successful.<br>
        GET /logout - Clears the authentication cookie and redirects to /login.<br>
        GET /uploadedImages/:filename - Serves the requested image that a user has uploaded.<br>
        GET /pictures/:filename - Serves the requested image.<br>
        GET /uploadedVideos/:filename - Serves the requested video that a user has uploaded.<br>
        GET /video-thumbnail/:filename - (DEPRECATED) Serves the requested video thumbnail of a user-uploaded video.<br>
        POST /addTrick - Adds a trick to the database.<br>
        DELETE /deleteTrick/:trickId - Deletes the trick with the given ID.<br>
        PUT /updateTrick/:trickId - Updates the trick with the given ID.<br>
    `;
    res.status(200).send(`${documentation}`);
});

app.post('/checkLogin', async (req, res) => {
    if (req.headers['Authorization']) {
        try {
            const decoded = jsonWebToken.verify(req.headers['Authorization'].slice(7), config.verySecretSecret);
            if (decoded) {
                res.status(200).send('User is already logged in');
                return;
            }
        } catch (err) {
            console.error("Invalid token:", err);
        }
    }
    if (!req.body.username || !req.body.password) {
        res.status(400).redirect('/login' + "?error=Username and password are required");
        return;
    }
    const user = await db.Users.findOne({ where: { username: req.body.username } });
    if (!user) {
        res.status(404).redirect('/login?error=User not found');
        return;
    }
    if (req.body.password && req.body.username) {
        const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordValid) {
            res.status(401).redirect('/login?error=Invalid password');
            return;
        } else {
            const token = jsonWebToken.sign({ id: user.id }, config.verySecretSecret, { expiresIn: '168h' });
            
            // Set the token as a cookie instead of just in the response header
            res.cookie('token', token, { 
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                sameSite: 'strict'
            });
            
            res.status(302).redirect('/tricks');
            return;
        }
    }
})

app.get('/signup', (req, res) => {
    res.status(200).render('signup')
})

app.get('/login', (req, res) => {
    res.status(200).render('login', )
})

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.status(302).redirect('/login');
})

app.get('/friends', async (req, res) => {
    res.status(200).render('friends', { friends: [] })
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
            res.status(400).render('signup', { error: 'Error 400: User already exists' });
            return;
        }

        if (!formData.username || !formData.password) {
            res.status(400).render('signup', { error: 'Error 400: Username and password are required' });
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
        res.status(302).redirect('/tricks');
    });

})

app.get('/uploadedImages/:filename', (req, res) => {
    //! add authentication check
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploadedImages', filename);
    if (!fs.existsSync(filePath)) {
        res.status(404).sendFile(path.join(__dirname, 'pictures', '404_not_found.jpg'));
        return;
    }
    res.status(200).sendFile(filePath);
});

app.get('/pictures/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'pictures', filename);
    if (!fs.existsSync(filePath)) {
        res.status(404).sendFile(path.join(__dirname, 'pictures', '404_not_found.jpg'));
        return;
    }
    res.status(200).sendFile(filePath);
});

app.get('/uploadedVideos/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploadedVideos', filename);
    if (!fs.existsSync(filePath)) {
        console.log("file not found: " + filePath)
        res.status(404).sendFile(path.join(__dirname, 'pictures', '404_not_found.jpg'));
        return;
    }
    res.status(200).sendFile(filePath);
});

app.get('/video-thumbnail/:filename', async (req, res) => {
    const filepath = path.join(__dirname, 'uploadedImages', req.params.filename, "-thumbnail.png");
    if (!fs.existsSync(filepath)) {
        res.status(404).sendFile(path.join(__dirname, 'pictures', '404_not_found.jpg'));
        return;
    }
    res.status(200).sendFile(filepath);
});

app.get('/tricks', async (req, res) => {
    const query = req.query.search ? req.query.search.trim() : null;
    const tagOnly = req.query.tagOnly ? req.query.tagOnly : false;
    let tricks
    const queryArray = query ? query.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean) : [];
    if (query) {
        if (tagOnly) {
            // Support multiple tags separated by commas
            tricks = await db.Tricks.findAll({
                where: {
                    [Op.and]: queryArray.map(tag =>
                        db.sequelize.where(
                            db.sequelize.fn('LOWER', db.sequelize.col('tags')),
                            {
                                [Op.like]: `%${tag}%`
                            }
                        )
                    )
                }
            });
        } else {
             tricks = await db.Tricks.findAll({
                where: {
                    [Op.or]: [
                        {
                            [Op.and]: queryArray.map(tag =>
                                db.sequelize.where(
                                    db.sequelize.fn('LOWER', db.sequelize.col('tags')),
                                    {
                                        [Op.like]: `%${tag}%`
                                    }
                                )
                            )
                        },
                        db.sequelize.where(
                            db.sequelize.fn('LOWER', db.sequelize.col('sudoNames')),
                            {
                                [Op.like]: `%${query.trim().toLowerCase()}%`
                            }
                        ),
                        {
                            name: {
                                [Op.like]: query.trim() + '%'
                            }
                        }
                    ]
                }
            });
        }
    } else {
        tricks = await db.Tricks.findAll();
    }
        
    const plainTricks = tricks.map(trick => trick.get({ plain: true })); // Convert to plain objects
    res.status(200).render('tricks', { tricks: plainTricks, query: query, queryArray: queryArray});
});

app.get('/trick/:id', async (req, res) => {
    if (!req.params.id) {
        res.status(404).redirect('/tricks?error=Trick not found. invalid query');
        return;
    }
    const trick = await db.Tricks.findOne({
        where: { id: req.params.id },
        include: [
            { model: db.Tricks, as: 'FromTrick' },
            { model: db.Tricks, as: 'ToTrick' },
            { model: db.Users, as: 'owner' }
        ]
    });
    if (!trick) {
        res.status(404).send('Trick not found');
        return;
    }

    console.log(trick.owner)
    const nextTricks = await db.Tricks.findAll({ where: { from: trick.ToTrick ? trick.ToTrick.id : trick.id } });
    const previousTricks = await db.Tricks.findAll({ where: { to: trick.FromTrick ? trick.FromTrick.id : trick.id } });

    const plainTrick = trick.get({ plain: true });
    plainTrick.nextTricks = nextTricks.map(trick => trick.get({ plain: true }));
    plainTrick.previousTricks = previousTricks.map(trick => trick.get({ plain: true }));
    res.status(200).render('trick', { trick: plainTrick })
})

app.get('/create-Trick', async (req, res) => {
    const from = req.query.from ? req.query.from : null;
    const tricks = (await db.Tricks.findAll()).map(trick => {
        return trick.get({ plain: true });
    });
    const fromTrick = tricks.find(t => t.id == from);
    res.status(200).render('createTrick', { tricks: tricks, from: fromTrick })
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

    req.pipe(req.busboy);

    req.busboy.on('error', function (error) {
        console.error("Error in busboy:", error);
        res.status(500).send('Internal Server Error');
    })

    req.busboy.on('field', function (fieldname, val) {
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
            file.resume(); // Consume the file stream to avoid memory leaks
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
        } else if (fieldname == 'videoThumbnail') { // depricated
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
                owner: user.id,
                difficulty: formData.difficulty,
                sudonames: formData.sudoNames.split(",").map(n=>n.trim()).map(name => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()),
                tags: formData.tags.split(",").map(t=>t.trim()).map(tag => tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()),
                to: formData.to,
                from: formData.from,
                imageCount: pictureFileNames.length,
                videoCount: videoFileNames.length
            });

            const trick = await db.Tricks.create({
                name: formData.name,
                owner: user.id,
                difficulty: formData.difficulty,
                sudonames: formData.sudoNames.split(",").map(n=>n.trim()).map(name => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()),
                description: formData.description,
                tags: formData.tags.split(",").map(t=>t.trim()).map(tag => tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()),
                images: [],
                videos: [],
                to: formData.to == "{null}" ? null : (formData.to ? formData.to : null),
                from: formData.from == "{null}" ? null : (formData.from ? formData.from : null)
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
                trick.videos = renamedVideoNames
            }
            await trick.save()
            res.status(302).redirect('/trick/' + trick.id);
        } catch (error) {
            console.error("Error in busboy finish handler:", error);
            res.status(500).send('An error occurred while processing the request. ' + error.message);
        }
    });
});

// was DELETE but em yes not anymore
app.get('/deleteTrick/:trickId', async (req, res) => {
    //! make sure the user is permited to deleate the trick

    const trickId = req.params.trickId;
    if (!trickId) {
        res.status(400).redirect(`/trick/${trickId}?error=Trick ID is required`);
        return;
    }
    const trick = await db.Tricks.findOne({ where: { id: trickId } });
    
    if (!trick) {
        res.status(404).redirect(`/trick/${trickId}?error=Trick not found`);
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

        res.status(200).redirect('/tricks?success=Trick deleted successfully' );
    } catch (error) {
        console.error(error);
        res.status(500).redirect(`/trick/${trickId}?error=Failed to delete trick` );
    }
})

app.get('/editTrick/:id', async (req, res) => {
    const tricks = (await db.Tricks.findAll()).map(trick => {
        return trick.get({ plain: true });
    });

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

    const nextTricks = tricks.filter(t => t.from == trick.id);
    const previousTricks = tricks.filter(t => t.to == trick.id);

    const plainTrick = trick.get({ plain: true });
    plainTrick.nextTricks = nextTricks.map(trick => trick.get({ plain: true }));
    plainTrick.previousTricks = previousTricks.map(trick => trick.get({ plain: true }));
    res.status(200).render('editTrick', { trick: plainTrick, tricks: tricks})
})

// HTML form dont support PUT method, so we use POST and specify the method in a hidden field
app.put('/updateTrick/:trickId', async (req, res) => {
    const user = await getUserFromToken(req)

    if (user == null) {
        res.status(401).send('Unauthorized');
        return;
    }

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

    if (trick.owner != user.id && user.role != "admin" && trick.edit_perms != "public") {
        if (trick.edit_perms != "friends") {
            res.status(403).send('You are not allowed to edit this trick');
            return;
        } else {
            const owner = await db.Users.findOne({ where: { id: trick.owner } });
            if (owner) {
                const isFriend = await db.Friends.findOne({ 
                    where: { 
                    userId: user.id, 
                    friendId: trick.owner 
                    } 
                });
                if (!isFriend) {
                    res.status(403).send('You are not allowed to edit this trick');
                    return;
                }
            }
        }
    }
    let formData = {};
    
    req.pipe(req.busboy);
    
    req.busboy.on('field', function (fieldname, val) {
        console.log("Field received:", fieldname, val);
        formData[fieldname] = val;
    });
    
    req.busboy.on('file', function (fieldname, file, fileInfo) {
        // Handle file uploads if needed
        console.log(`File received: ${fieldname}`);
        file.resume(); // Skip files for now, just consume the stream
    });
    
    req.busboy.on('finish', async function () {
        try {
            console.log("Busboy finished, formData:", formData);
            
            await trick.update({
                name: formData.name,
                difficulty: parseInt(formData.difficulty),
                sudoNames: formData.sudoNames.split(",").map(n=>n.trim()).map(name => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()),
                description: formData.description,
                tags: formData.tags.split(",").map(t=>t.trim()).map(tag => tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()),
                to: formData.to === "{null}" ? null : (formData.to),
                from: formData.from === "{null}" ? null : (formData.from)
            });
            
            res.status(302).redirect(`/trick/${trickId}`);
        } catch (error) {
            console.error("Error updating trick:", error);
            res.status(500).send({ error: 'Failed to update trick' });
        }
    });
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
