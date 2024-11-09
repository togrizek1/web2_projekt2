const express = require('express');
const https = require('https');
const { Pool } = require('pg');
const app = express();
const externalUrl = process.env.RENDER_EXTERNAL_URL;
const PORT = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 4090;
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
require("dotenv").config();
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false },
});


app.get("/", async (req, res) => {
    res.render('index', { siteKey: process.env.DATA_SITEKEY });
});

/*SQL ubacivanje*/
app.post("/saveMessage", async (req, res) => {
    const { username, pin, isSqlEnabled } = req.body;

    if (!username || !pin) {
        return res.status(400).json({ error: "Username i PIN moraju biti upisani." });
    }

    try {
        let query;
        let params;

        if (isSqlEnabled) {
            query = `SELECT * FROM users WHERE username = '${username}' AND pin = '${pin}'`;
        } else {
            query = 'SELECT * FROM users WHERE username = $1 AND pin = $2';
            params = [username, pin];
        }

        const data = await pool.query(query, params);

        console.log(data.rows);
        console.log("\n");

        if (data.rows.length > 0) {
            res.json({ id: data.rows[0].id, username: data.rows[0].username, pin: data.rows[0].pin });
        } else {
            res.status(400).json({ error: "Podaci za pristup su pogrešni." });
        }

    } catch (error) {
        console.error("Greška kod dohvaćanja podataka iz baze: ", error);
        res.status(500).json({ error: "Greška" });
    }
});


/* Loša autentifikacija */
app.post('/login-captcha', async (req, res) => {
    const { username, password, captcha } = req.body;


    if (!username || !password) {
        return res.status(400).json({ error: "Username i password moraju biti upisani." });
    }

    try {

        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Podaci za pristup su pogrešni." });
        }

        const user = result.rows[0];

        if (user.pin !== password) {
            return res.status(401).json({ error: "Podaci za pristup su pogrešni." });
        }

        const params = new URLSearchParams({
            secret: process.env.SECRET,
            response: req.body['g-recaptcha-response'],
            remoteip: req.ip,
        });

        fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            body: params,
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    res.json({ captchaSuccess: true, username: user.username });
                } else {
                    res.json({ captchaSuccess: false, error: "Problem s CAPTCHA provjerom" });
                }
            })

    } catch (error) {
        res.status(500).json({ error: "Greška u prijavi." });
    }
});

app.post('/login', async (req, res) => {
    const { username, password, captcha } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);


        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, error: "Krivi username." });
        }

        const user = result.rows[0];

        if (user.pin !== password) {
            return res.status(401).json({ success: false, error: "Pogrešna lozinka." });
        }

        res.json({ success: true, username: user.username });

    } catch (error) {
        res.status(500).json({ error: "Greška u prijavi." });
    }
});

if (externalUrl) {
    const hostname = '0.0.0.0';
    app.listen(PORT, hostname, () => {
        console.log(`Server locally running at http://${hostname}:${PORT}/ and from outside on ${externalUrl}`);
    });
} else {
    https.createServer({
        key: fs.readFileSync('server.key'),
        cert: fs.readFileSync('server.cert')
    }, app)
        .listen(PORT, function () {
            console.log(`Server running at https://localhost:${PORT}/`);
        });
}