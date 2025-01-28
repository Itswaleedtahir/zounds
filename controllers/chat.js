const Chat = require("../models/chat")
const mongoose = require('mongoose');
const Artist = require("../models/artist")
const Dashboarduser = require("../models/dashboardUsers")
const Reaction= require("../models/reaction")
module.exports = {
    createChat : async (req, res) => {
        try {
            const { message } = req.body;
            if (!message) {
                return res.status(400).json({ msg: "Please provide a message", success: false });
            }
            let label_id
            // Assume artist user IDs are stored in the Artist model
            let artist;
            if (req.token.role === 'ARTIST') {
                artist = await Artist.findOne({ userId: req.token._id });
                if (!artist) {
                    return res.status(404).json({ msg: "Artist not found", success: false });
                }
                label_id = artist.label_id
            }
            let artist_id = req.token.role === 'ARTIST' ? artist._id : req.body.artist_id;
            if (req.token.role === 'LABEL' && !artist_id) {
                return res.status(400).json({ msg: "Label must provide an Artist ID", success: false });
            }
            
            const userRole = req.token.role.toString().toUpperCase();
        if (['LABEL', 'LABEL_STAFF'].includes(userRole)) {
          if (userRole === 'LABEL') {
              // Directly use the user's ID if the role is LABEL
              label_id = req.token._id;
          } else if (userRole === 'LABEL_STAFF') {
              // Find the label ID from the createdBy if the role is LABEL_STAFF
              const labelUser = await Dashboarduser.findById(req.token.createdBy);
              label_id = labelUser ? labelUser._id : null; // Ensure that createdBy points to the LABEL's ID
          }
      }
            const eventAdd = new Chat({
                label_id: label_id,
                artist_id: artist ? artist._id : req.body.artist_id,  // Use found artist ID or expect it from body for labels
                message:message
            });
    
            const savedEvent = await eventAdd.save();
         return   res.status(201).json(savedEvent);
        } catch (error) {
            console.log("error",error)
         return   res.status(400).json({ message: error.message });
        }
    },
    getChats: async (req, res) => {
        try {
            let chats;
            if (req.token.role === 'ARTIST') {
                const artist = await Artist.findOne({ userId: req.token._id });
                if (!artist) {
                    return res.status(404).json({ msg: "Artist not found", success: false });
                }
                chats = await Chat.find({ artist_id: artist._id }).populate('artist_id');
            } else if (req.token.role === 'LABEL' || req.token.role === 'LABEL_STAFF') {
                let label_id = req.token.role === 'LABEL' ? req.token._id : null;
                if (req.token.role === 'LABEL_STAFF') {
                    const labelUser = await Dashboarduser.findById(req.token.createdBy);
                    label_id = labelUser ? labelUser._id : null;
                }
                const artists = await Artist.find({ label_id: label_id });
                if (!artists.length) {
                    return res.status(404).json({ msg: "No artists found for this label", success: false });
                }
                const artistIds = artists.map(artist => artist._id);
                chats = await Chat.find({ artist_id: { $in: artistIds } }).populate('artist_id');
            }
    
            if (!chats || !chats.length) {
                return res.status(404).json({ msg: "No chat messages found", success: false });
            }
    
            // Aggregate reactions based on message IDs from the chats
            const messageIds = chats.map(chat => chat._id);
            const reactions = await Reaction.aggregate([
                { $match: { message_id: { $in: messageIds } } },
                { $group: { _id: "$message_id", count: { $sum: 1 } } }
            ]);
    
            // Convert reaction aggregation into a map for easy lookup
            const reactionCounts = reactions.reduce((acc, reaction) => {
                acc[reaction._id] = reaction.count;
                return acc;
            }, {});
    
            // Add reaction counts to chats
            const chatResponses = chats.map(chat => ({
                ...chat.toObject(),
                reaction_count: reactionCounts[chat._id] || 0
            }));
    
            return res.status(200).json(chatResponses);
        } catch (error) {
            console.log("Error:", error);
            return res.status(500).json({ message: error.message });
        }
    },
    
    updateChat: async(req,res)=>{
        const chatId = req.params.id
        try {
            const { message} = req.body;
                
                const eventItem = await Chat.findOne({_id:chatId})
                // Update the news item if authorized
        eventItem.message = message || eventItem.message;
        const updatedNews = await eventItem.save();
                return res.status(200).send(updatedNews)


        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    deleteChat: async(req,res)=>{
        const eventId = req.params.id;

        try {
   
            // Find and delete the chat message
            const chat = await Chat.findByIdAndDelete(eventId);
            if (!chat) {
                return res.status(404).json({ message: 'Chat message not found' ,success:false});
            }
    
            // Delete all reactions associated with this chat message
            await Reaction.deleteMany({ message_id: eventId });
            return res.status(200).json({ message: 'Chat message and associated reactions deleted',success:true });
        } catch (error) {
            console.log("error", error);
            return res.status(500).json({ message: error.message ,success:false});
        }
    },
    createReaction: async(req,res)=>{
        const user_id = req.token._id
        const { message_id, emoji } = req.body;
        const message = [{
            "_id": "",
    "label_id": "",
    "artist_id": "",
    "message": "",
    "createdAt": "",
    "updatedAt": "",
    "__v": 0,
    "reactions": []

    }]
        try {
              // Check if the reaction already exists
        const existingReaction = await Reaction.findOne({
            message_id,
            user_id
        });

        if (existingReaction) {
            return res.status(409).json({ // 409 Conflict might be more appropriate than 400 Bad Request
                message: 'You have already reacted to this message.',
                data: message,
                success: true
            });
        }
            const newReaction = new Reaction({
                message_id,
                user_id,
                emoji  // Emoji is received as a Unicode string and saved directly
            });
            const messages = await Chat.find({ _id:message_id });
    
            if (!messages.length) {
                return res.status(404).json({ message: 'No messages found for this artist.',data:message,success:true });
            }
    
            // Loop through each message to attach reactions
            const messagesWithReactions = await Promise.all(messages.map(async (message) => {
                const reactions = await Reaction.find({ message_id: message._id });
                return { ...message._doc, reactions }; // Use _doc to access the raw document
            }));
    
            await newReaction.save();
            // return res.status(200).json(messagesWithReactions);
           return res.status(201).json({
                message: 'Reaction added successfully.',
                data: messagesWithReactions,
                success:true
            });
        } catch (error) {
            console.error('Error adding reaction:', error);
          return  res.status(500).json({ message: 'Internal server error', error: error.message,success:false });
        }
    },
     getAllMessages : async (req, res) => {
        const { artistId } = req.params;
    
        try {
            
            const messages = await Chat.find({ artist_id: artistId }).sort({ createdAt: -1 });
            const message = [{
                    "_id": "",
            "label_id": "",
            "artist_id": "",
            "message": "",
            "createdAt": "",
            "updatedAt": "",
            "__v": 0,
            "reactions": [
                {
                    "_id": "",
                    "message_id": "",
                    "user_id": "",
                    "emoji": "",
                    "createdAt": "",
                    "updatedAt": "",
                    "__v": ""
                }
            ]

            }]
            if (!messages.length) {
                return res.status(404).json({message:message,success:true });
            }
    
            // Loop through each message to attach reactions
            const messagesWithReactions = await Promise.all(messages.map(async (message) => {
                const reactions = await Reaction.find({ message_id: message._id });
                return { ...message._doc, reactions }; // Use _doc to access the raw document
            }));
    
            return res.status(200).json({message:messagesWithReactions , success:true});
        } catch (error) {
            console.error('Error fetching artist messages with reactions:', error);
            return res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    } ,
    removeReaction:async(req,res)=>{
        const { reactionId } = req.params;
    
        try {
            // Optional: Check if the reaction belongs to the user, if needed
            const reaction = await Reaction.findOne({ 
                _id: reactionId, 
                user_id: req.token._id 
            });
            console.log("react   user", reactionId, req.token._id)
            if (!reaction) {
                return res.status(404).json({ message: "Reaction not found." ,success:false});
            }
    
            
            // Delete the reaction
            const result = await Reaction.deleteOne({ _id: reactionId ,user_id:req.token._id})
            if (result.deletedCount === 0) {
                // No document was deleted
                return res.status(404).json({ message: "Reaction not found or user not authorized to delete.", success: false });
            }
        
            return res.status(200).json({ message: "Reaction successfully removed." ,success:true})
        } catch (error) {
            console.error('Error deleting reaction:', error);
          return  res.status(500).json({ message: 'Internal server error', error: error.message , success:false});
        }
    } ,
    updateReaction: async(req,res)=>{
        const { emoji } = req.body;
    const { id } = req.params;

    if (!emoji) {
        return res.status(400).json({
            message: 'Emoji is required to update the reaction.',
            success: false
        });
    }

    try {
        // Check if the reaction exists
        const existingReaction = await Reaction.findById(id);
        if (!existingReaction) {
            return res.status(404).json({
                message: 'Reaction not found.',
                success: false
            });
        }

        // Update the emoji of the existing reaction
        existingReaction.emoji = emoji;
        await existingReaction.save();

        // Fetch updated reactions to show in response
        const updatedReaction = await Reaction.findById(id).populate('message_id user_id', 'name email message');
        
        return res.status(200).json({
            message: 'Reaction updated successfully.',
            data: updatedReaction,
            success: true
        });
    } catch (error) {
        console.error('Error updating reaction:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
            success: false
        });
    }
    } 
}