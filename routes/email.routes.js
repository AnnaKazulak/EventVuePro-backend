const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Guest = require('../models/Guest.model');
const EventInvitation = require('../models/EmailInvitation.model');
const Event=require('../models/Event.model')

const baseUrl = 'http://localhost:5005';

router.post('/emails', async (req, res) => {
    const {
        recipients,
        subject,
        message,
        eventId,
        invitedGuests // Add invitedGuests to the request body
    } = req.body;

    // Validate recipients, subject, message, eventId, and invitedGuests data
    if (!recipients || !subject || !message || !eventId || !invitedGuests) {
        return res.status(400).json({
            error: 'Recipients, subject, message, eventId, and invitedGuests are required'
        });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        for (const {
                email,
                guestId
            } of recipients) {
            const yesLink = `${process.env.PUBLIC_APP_URL}/api/response/yes?eventId=${eventId}&email=${email}&guestId=${guestId}`;
            const noLink = `${process.env.PUBLIC_APP_URL}/api/response/no?eventId=${eventId}&email=${email}&guestId=${guestId}`;

            await transporter.sendMail({
                from: 'your-email@gmail.com',
                to: email,
                subject: subject,
                html: `
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Event Invitation</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f4f4f4;
                                margin: 0;
                                padding: 0;
                                line-height: 1.6;
                            }
                            .container {
                                max-width: 600px;
                                margin: 20px auto;
                                padding: 20px;
                                background-color: #fff;
                                border-radius: 8px;
                                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                            }
                            h1 {
                                color: #333;
                            }
                            p {
                                margin-bottom: 20px;
                            }
                            .btn {
                                display: inline-block;
                                padding: 10px 20px;
                                background-color: #007bff;
                                color: #fff  !important;;
                                text-decoration: none;
                                border-radius: 5px;
                            }
                            .btn:hover {
                                background-color: #0056b3;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>Event Invitation</h1>
                            <p>${message}</p>
                            <p><strong>Event ID:</strong> ${eventId}</p>
                            <p><strong>invitedGuests:</strong> ${invitedGuests}</p>
                            <ul>
                            ${recipients.map(({ email, guestId }) => ` <
                    li > Email: $ {
                        email
                    },
                Guest ID: $ {
                    guestId
                } < /li>
                `).join('')}
                        </ul>
                            <p>Please respond:</p>
                            <a href="${yesLink}" class="btn">Yes, I'll attend</a>
                            <a href="${noLink}" class="btn" style="margin-left: 10px;">No, I can't attend</a>
                        </div>
                    </body>
                    </html>
                `
            });

            // Save event invitation record 
            const eventInvitation = new EventInvitation({
                eventId,
                recipientEmail: email,
                invitedGuest: guestId,
                rsvpResponse: 'pending'
            });
            await eventInvitation.save();
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
        email,
        guestId
    } = req.query; // Retrieve email and guestId from query parameters
    const eventId = req.query.eventId; // Retrieve eventId from query parameters
    console.log("guestId", guestId)
    try {
        // Update the RSVP response to "attending" for the provided email and guestId
        await EventInvitation.findOneAndUpdate({
                eventId,
                recipientEmail: email,
                invitedGuest: guestId // Add guestId to the query
            }, {
                rsvpResponse: 'attending'
            }, {
                upsert: true
            } // Add the upsert option to create a new document if none exists
        );
        res.send(yesHTML);
    } catch (error) {
        console.error('Error updating RSVP response:', error);
        res.status(500).json({
            error: 'Failed to update RSVP response'
        });
    }
});

router.get('/response/no', async (req, res) => {
    const {
        email,
        guestId
    } = req.query; // Retrieve email and guestId from query parameters
    const eventId = req.query.eventId; // Retrieve eventId from query parameters
    console.log("guestId", guestId)
    try {
        // Update the RSVP response to "attending" for the provided email and guestId
        await EventInvitation.findOneAndUpdate({
                eventId,
                recipientEmail: email,
                invitedGuest: guestId // Add guestId to the query
            }, {
                rsvpResponse: 'not attending'
            }, {
                upsert: true
            } // Add the upsert option to create a new document if none exists
        );

        res.send(noHTML);

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

// Update the backend route to fetch guest responses
router.get('/events/:eventId/guest-responses', async (req, res) => {
    const { eventId } = req.params;
    try {
        const guestResponses = await EventInvitation.find({ eventId }).select('invitedGuest rsvpResponse');
        res.status(200).json(guestResponses);
    } catch (error) {
        console.error('Error fetching guest responses:', error);
        res.status(500).json({ error: 'Error fetching guest responses' });
    }
});


module.exports = router;