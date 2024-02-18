const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Guest = require('../models/Guest.model');
const EventInvitation = require('../models/EmailInvitation.model');

const baseUrl = 'http://localhost:5005';


router.post('/emails', async (req, res) => {
    const {
        recipients,
        subject,
        message,
        eventId
    } = req.body;

    console.log("🚎", eventId)
    // Validate recipients, subject, and message data
    if (!recipients || !subject || !message || !eventId) {
        return res.status(400).json({
            error: 'Recipients, subject, message and eventId are required'
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

        // Loop through recipients and send email to each recipient
        for (const recipientEmail of recipients) {
            // Generate links for response handling
            const yesLink = `${process.env.PUBLIC_APP_URL}/api/response/yes?eventId=${eventId}&email=${recipientEmail}`;
            const noLink = `${process.env.PUBLIC_APP_URL}/api/response/no?eventId=${eventId}&email=${recipientEmail}`;

            // Send the email with HTML content
            await transporter.sendMail({
                from: 'your-email@gmail.com', // Sender's email address
                to: recipientEmail, 
                subject: subject,
                html: `
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Email</title>
                    </head>
                    <body>
                        <p>${message}</p>
                        <p>EventId:${eventId}</p>
                        <p>Please respond:</p>
                        <a href="${yesLink}">Yes</a>
                        <a href="${noLink}">No</a>
                        
                    </body>
                    </html>
                `
            });
        }

        res.status(200).json({
            success: true,
            message: 'Emails sent successfully'
        });
    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending emails'
        });
    }
});



router.post('/rsvp/:eventId', async (req, res) => {
    const {
        eventId
    } = req.params;
    const {
        email,
        response
    } = req.body;

    console.log('Request Body:', req.body);

    try {
        // Find the event invitation record for the specified event and recipient email
        let eventInvitation = await EventInvitation.findOne({
            eventId,
            recipientEmail: email
        });

        // If no invitation record exists, create a new one
        if (!eventInvitation) {
            eventInvitation = new EventInvitation({
                eventId,
                recipientEmail: email,
                rsvpResponse: response
            });
        } else {
            // Update the existing invitation record with the RSVP response
            eventInvitation.rsvpResponse = response;
        }

        // Save the updated or new invitation record to the database
        await eventInvitation.save();

        res.status(200).json({
            message: "RSVP response recorded successfully"
        });
    } catch (error) {
        console.error('Error recording RSVP response:', error);
        res.status(500).json({
            error: "Failed to record RSVP response"
        });
    }
});

const yesHTML = `
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RSVP Response</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 50px;
            }
            .message {
                font-size: 24px;
                color: green;
            }
        </style>
    </head>
    <body>
        <div class="message">Thank you for confirming your attendance!</div>
    </body>
    </html>
`;
const noHTML = `
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RSVP Response</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 50px;
            }
            .message {
                font-size: 24px;
                color: orange;
            }
        </style>
    </head>
    <body>
        <div class="message">Thank you for your answer!</div>
        <div class="message">In case you change your mind, let us know!</div>
    </body>
    </html>
`;

router.get('/response/yes', async (req, res) => {
    const {
        email
    } = req.query;
    const eventId = req.query.eventId; // Retrieve eventId from query parameters

    try {
        // Update the RSVP response to "attending" for the provided email
        await EventInvitation.findOneAndUpdate({
                eventId,
                recipientEmail: email
            }, {
                rsvpResponse: 'attending'
            }, {
                upsert: true
            } // Add the upsert option to create a new document if none exists
        );
        res.send(yesHTML)
        // res.status(200).json({
        //     message: 'RSVP response updated successfully to attending'
        // });
    } catch (error) {
        console.error('Error updating RSVP response:', error);
        res.status(500).json({
            error: 'Failed to update RSVP response'
        });
    }
});


router.get('/response/no', async (req, res) => {
    const {
        email
    } = req.query;
    const eventId = req.query.eventId; // Retrieve eventId from query parameters

    try {
        // Update the RSVP response to "not attending" for the provided email
        await EventInvitation.findOneAndUpdate({
                eventId,
                recipientEmail: email
            }, {
                rsvpResponse: 'not attending'
            }, {
                upsert: true
            } // Add the upsert option to create a new document if none exists
        );
        res.send(noHTML)
        // res.status(200).json({
        //     message: 'RSVP response updated successfully to not attending'
        // });
    } catch (error) {
        console.error('Error updating RSVP response:', error);
        res.status(500).json({
            error: 'Failed to update RSVP response'
        });
    }
});


module.exports = router;