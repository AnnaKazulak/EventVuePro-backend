const mongoose = require('mongoose');

const eventInvitationSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }, 
    recipientEmail: String, 
    rsvpResponse: String, // RSVP response from the recipient (e.g., 'attending', 'not_attending','pending')
    invitedGuests: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guest'
    }], 
    invitedGuest: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guest'
    } 
});


const EventInvitation = mongoose.model('EventInvitation', eventInvitationSchema);

module.exports = EventInvitation;
