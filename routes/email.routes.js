const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

router.post('/emails', async (req, res) => {
    const {
        email,
        subject,
        message
    } = req.body;

    // Validate email and message data
    if (!email || !subject  || !message) {
        return res.status(400).json({
            error: 'Email and message are required'
        });
    }

    try {
        // Create a transporter using nodemailer
        const transporter = nodemailer.createTransport({
            // Transporter configuration
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASS 
            }
        });

        // Send the email
        const info = await transporter.sendMail({
            from: 'your-email@gmail.com', // Sender's email address
            to: email, // Recipient's email address
            subject: subject,
            text: message // Plain text body of the email
        });

        console.log('Message sent: %s', info.messageId);
        res.send('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Error sending email');
    }
});

module.exports = router;