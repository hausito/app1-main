const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

// Connect to PostgreSQL
pool.connect((err, client, done) => {
    if (err) {
        throw err;
    }
    console.log('Connected to PostgreSQL...');
    done();
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
// Endpoint to fetch top 10 users by high score
app.get('/topUsers', async (req, res) => {
    try {
        const topUsersQuery = 'SELECT username, points FROM users ORDER BY points DESC LIMIT 10';
        const client = await pool.connect();
        const result = await client.query(topUsersQuery);
        client.release();
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching top users:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Endpoint to fetch initial user data (points and tickets)
app.get('/getUserData', async (req, res) => {
    try {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({ success: false, error: 'Username is required' });
        }

        const client = await pool.connect();
        const result = await client.query('SELECT points, tickets FROM users WHERE username = $1', [username]);

        if (result.rows.length > 0) {
            // User exists
            res.status(200).json({ success: true, points: result.rows[0].points, tickets: result.rows[0].tickets });
        } else {
            // User does not exist, insert new user with default values
            const insertQuery = 'INSERT INTO users (username, points, tickets) VALUES ($1, $2, $3) RETURNING points, tickets';
            const insertValues = [username, 0, 100];
            const insertResult = await client.query(insertQuery, insertValues);

            res.status(200).json({ success: true, points: insertResult.rows[0].points, tickets: insertResult.rows[0].tickets });
        }

        client.release();
    } catch (err) {
        console.error('Error in getUserData endpoint:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});
// Endpoint to save user's score and update max_score if necessary
app.post('/saveUser', async (req, res) => {
    const { username, points } = req.body;

    if (!username || points === undefined) {
        return res.status(400).send('Username and points are required');
    }

    try {
        const client = await pool.connect();

        // Check if the user exists
        const existingUser = await client.query('SELECT * FROM users WHERE username = $1', [username]);

        if (existingUser.rows.length > 0) {
            // User exists, update points and check max_score
            const currentPoints = existingUser.rows[0].points;
            const currentMaxScore = existingUser.rows[0].max_score || 0;

            if (points > currentMaxScore) {
                // Update max_score if the current score is higher
                const updateMaxScoreQuery = 'UPDATE users SET points = $1, max_score = $2 WHERE username = $3 RETURNING *';
                const updateValues = [points, points, username];
                const result = await client.query(updateMaxScoreQuery, updateValues);
                client.release();
                res.status(200).json({ success: true, data: result.rows[0] });
            } else {
                // Just update points
                const updateQuery = 'UPDATE users SET points = $1 WHERE username = $2 RETURNING *';
                const updateValues = [points, username];
                const result = await client.query(updateQuery, updateValues);
                client.release();
                res.status(200).json({ success: true, data: result.rows[0] });
            }
        } else {
            // User does not exist, insert new user
            const insertQuery = 'INSERT INTO users (username, points, max_score) VALUES ($1, $2, $3) RETURNING *';
            const insertValues = [username, points, points];
            const result = await client.query(insertQuery, insertValues);
            client.release();
            res.status(200).json({ success: true, data: result.rows[0] });
        }
    } catch (err) {
        console.error('Error saving user:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});


// Endpoint to update tickets
app.post('/updateTickets', async (req, res) => {
    const { username, tickets } = req.body;

    if (!username || tickets === undefined) {
        return res.status(400).send('Username and tickets are required');
    }

    try {
        const client = await pool.connect();
        const updateQuery = 'UPDATE users SET tickets = $1 WHERE username = $2 RETURNING *';
        const updateValues = [tickets, username];
        const result = await client.query(updateQuery, updateValues);
        client.release();

        if (result.rows.length > 0) {
            res.status(200).json({ success: true, data: result.rows[0] });
        } else {
            res.status(404).json({ success: false, error: 'User not found' });
        }
    } catch (err) {
        console.error('Error updating tickets:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
