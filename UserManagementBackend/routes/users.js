const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getConnection, sql } = require('../dbConfig');

const router = express.Router();

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) return res.sendStatus(401);
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
}

router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, address } = req.body;

  
    try {
      const pool = await getConnection();
      const emailCheck = await pool.request()
        .input('email', sql.VarChar, email)
        .query('SELECT * FROM Users WHERE Email = @email');
      if (emailCheck.recordset.length > 0) {
        return res.status(400).send('Email already exists.');
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      await pool.request()
        .input('firstName', sql.VarChar, firstName)
        .input('lastName', sql.VarChar, lastName)
        .input('email', sql.VarChar, email)
        .input('password', sql.VarChar, hashedPassword)
        .input('address', sql.VarChar, address)
        .query('INSERT INTO Users (FirstName, LastName, Email, Password, Address) VALUES (@firstName, @lastName, @email, @password, @address)');
  
      res.status(201).send('User registered successfully.');
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).send('Server error during registration.');
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

  try {
    const pool = await getConnection();
    const user = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Users WHERE Email = @email');
    
    if (user.recordset.length === 0) {
      return res.status(404).send('User not found.');
    }

    const isValid = await bcrypt.compare(password, user.recordset[0].Password);

    if (!isValid) {
      return res.status(401).send('Invalid credentials.');
    }

    const token = jwt.sign(
      { userId: user.recordset[0].Id, email: user.recordset[0].Email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error during login.');
  }

});

router.get('/', authenticateToken, async (req, res) => {
    try {
      const pool = await getConnection();
      const result = await pool.request().query('SELECT FirstName, LastName, Email, Address FROM Users');
      res.json(result.recordset);
    } catch (err) {
      console.error('Error fetching users:', err);
      res.status(500).send('Server error when fetching users.');
    }
  });

module.exports = router;