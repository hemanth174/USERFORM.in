``

import express from "express";
import path, { dirname }  from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
import  { open } from  "sqlite";
import sqlite3 from "sqlite3";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from 'multer';
const app = express();
app.use(express.json());
app.use(cors());


const dbpath = path.join(__dirname, "userdata.db");

let db = null;

const InitializeDBandServer = async () => {
    try {
        db = await open({
            filename: dbpath,
            driver: sqlite3.Database
        });
        app.listen(3000, () => {
            console.log("Server is running at http://localhost:3000/");
        });
    } catch (e) {
        console.log(`DB Error: ${e.message}`);
        process.exit(1);
    }
};
InitializeDBandServer();

// Serve static files (so uploaded files under public/uploads are accessible)
app.use(express.static(path.join(__dirname, 'public')));
// Serve USERFORM directory (index.html, script.js, style.css, etc.)
app.use(express.static(__dirname));
// Serve project root (profile.html, profile.js, languages.js, authManager.js, toastMessage.js, css, etc.)
app.use(express.static(path.join(__dirname, '..')));

// Serve top-level profile page and script (these files live one level up in the repo root)
app.get('/profile.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'profile.html'));
});

app.get('/profile.js', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'profile.js'));
});

// Serve login/index page for auth flow (lives in USERFORM)
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Multer setup for uploads
const uploadDir = path.join(__dirname, 'public', 'uploads');
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Middleware to authenticate the token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, "my_secret_key", (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};



//GET method
app.get('/userdetails/', async (req, res) => {
    const querie = `SELECT * FROM user;`;
    const UserArray = await db.all(querie);
    res.send(UserArray);

});


//Profile data GET method
app.get('/profile-data', authenticateToken, async (req, res) => {
    const { email } = req.user;
    const selectUserQuery = `SELECT email, profile_pic FROM user WHERE email = '${email}';`;
    const user = await db.get(selectUserQuery);
    res.send(user);
});


app.post('/upload-profile-pic', authenticateToken, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send('No file');

            // Build absolute URL so clients can open it directly
            const relativeUrl = `/uploads/${req.file.filename}`;
            const fullUrl = req.protocol + '://' + req.get('host') + relativeUrl;

            // Ensure 'profile_pic' column exists, add if missing
            const tableInfo = await db.all("PRAGMA table_info('user');");
            const hasCol = tableInfo.some(c => c.name === 'profile_pic');
            if (!hasCol) {
                await db.run("ALTER TABLE user ADD COLUMN profile_pic TEXT;");
            }

            // Update the user's profile_pic path in the DB (store absolute URL)
            const { email } = req.user;
            await db.run(`UPDATE user SET profile_pic = '${fullUrl}' WHERE email = '${email}';`);

            res.json({ url: fullUrl });
    } catch (e) {
        console.error('Upload route error:', e);
        res.status(500).send('Internal Server Error');
    }
});

    // Return all photos (email + profile_pic) so each photo has a link
    app.get('/photos', async (req, res) => {
        try {
            const rows = await db.all(`SELECT email, profile_pic FROM user WHERE profile_pic IS NOT NULL;`);
            res.json(rows);
        } catch (e) {
            console.error('Error listing photos:', e);
            res.status(500).send('Internal Server Error');
        }
    });





//post method
app.post('/submit-form', async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10); 
        const selectUserQuery = `SELECT * FROM user WHERE email = '${email}';`;
        const existingUser = await db.get(selectUserQuery);
        if(existingUser === undefined) {
            const Adduser = `
            INSERT INTO user (email, password)
            VALUES ('${email}', '${hashedPassword}');
        `;

        const result = await db.run(Adduser);
        res.status(201).send("User added successfully!");
        }
        
    } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).send("Internal Server Error");
    }
});



//login FORM
app.post('/login', async (req, res) => {
    const { password, email } = req.body;

    const selectUserQuery = `
        SELECT * FROM user 
        WHERE email = '${email}';
    `;

    const user = await db.get(selectUserQuery);
    if (user === undefined) {

        res.status(401).send("Invalid password or email");
    } else {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid === true) {
            const payload = {
                email: email,
            };
            const jwtToken = jwt.sign(payload, "my_secret_key");
            res.send({
                jwtToken: jwtToken,
                message: "Login successful",
            });
        } else {
            res.status(401).send("Invalid password or email");
        }
    }
});


//Put method
app.put('/Udate_userdetails/', async (req, res) => {
  try{
    const Userdetails = req.body;

    const {
        password,email
    } = Userdetails;
    const hashedPassword = await bcrypt.hash(password, 10);
    const updateUser = `
        UPDATE user
        SET 
        password = '${hashedPassword}'
        WHERE email = '${email}';
    `;
    await db.run(updateUser);
    res.send("Book Updated Successfully")
} catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send("Internal Server Error");
  }
})

app.delete('/deleteUser/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const deleteUser = `
    DELETE FROM user WHERE user_id = ${user_id};`;
    await db.run(deleteUser);
    res.send("User Deleted Successfully");
})