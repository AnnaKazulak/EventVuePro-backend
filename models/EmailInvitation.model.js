const mongoose = require('mongoose');

// Define the schema for event invitations
const eventInvitationSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }, // Reference to the event
    recipientEmail: String, // Email of the recipient
    rsvpResponse: String, // RSVP response from the recipient (e.g., 'attending', 'not_attending','pending')
    invitedGuests: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guest'
    }] // Array of guest IDs who were invited to the event
});

// Create a Mongoose model based on the schema
const EventInvitation = mongoose.model('EventInvitation', eventInvitationSchema);

module.exports = EventInvitation;
