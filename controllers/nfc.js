const NFC = require("../models/nfc")
const UserAlbum = require("../models/userAlbums")
const Album = require("../models/album")
const Admin = require("../models/dashboardUsers")
const {generateOTP,generateToken,uploadBufferToS3} = require("../utils/index")
const { parse } = require('json2csv');
const fs = require('fs');
const csv = require('csv-parser');
const album = require("./album");
const path = require('path');
module.exports = {
    createNfc: async(req, res) => {
        const { album_id, numberOfNFC, activate, label_id: bodyLabelId } = req.body;
        let label_id;
        let labelUser;
        let labelName = ''; // To store the label name
        const userRole = req.token.role.toString().toUpperCase();
    
        if (userRole === 'SUPER_ADMIN') {
            label_id = bodyLabelId;
            labelUser = await Admin.findById(label_id);
        } else if (userRole === 'LABEL') {
            label_id = req.token._id;
            labelUser = await Admin.findById(label_id);
        } else if (userRole === 'LABEL_STAFF') {
            labelUser = await Admin.findById(req.token.createdBy);
            label_id = labelUser ? labelUser._id : null;
        }
    
        if (!label_id || !labelUser) {
            return res.status(400).send({ message: 'Missing label ID or unauthorized access' });
        }
    
        if (labelUser) {
            labelName = `${labelUser.firstName} ${labelUser.lastName}`;
        }
    
        const nfcChips = [];
        try {
            for (let i = 0; i < numberOfNFC; i++) {
                let code = generateOTP();  // 6-digit OTP
                let token = generateToken();  // Alphanumeric token
                let activationDetails = {
                    status: activate || false,
                    token: token,
                    code: code,
                };
    
                if (activate) {
                    activationDetails.activationDate = new Date();
                }
    
                const newNFC = new NFC({
                    label_id,
                    album_id,
                    ...activationDetails
                });
                await newNFC.save()
                nfcChips.push(newNFC);
            }
    
            const album = await Album.findById(album_id);
            const csvData = nfcChips.map(item => ({
                label_name: labelName,
                album_name: album ? album.title : '',
                token: item.token,
                code: item.code,
                activationDate: item.activationDate,
                status: item.status,
                mapped: item.mapped,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            }));
    
            const csv = parse(csvData);
    
            // Define the path for the uploads folder directly to your Nginx path
        const mainDir = '/var/www/html/zounds/uploads';
        if (!fs.existsSync(mainDir)) {
            fs.mkdirSync(mainDir, { recursive: true }); // Create the directory if it doesn't exist
        }

    
            // Append a timestamp to the filename
            const date = new Date();
            const timestamp = date.getTime(); // You could also use date.toISOString() for a more readable format
            const filename = `NFCs_${timestamp}.csv`;
            const filePath = path.join(mainDir, filename);
            fs.writeFileSync(filePath, csv);
    
            // Construct the full URL
            const protocol = req.protocol; // 'http' or 'https'
            const host = req.get('host'); // 'example.com' or 'localhost:3000'
            const fileLink = `${protocol}://${host}/uploads/${filename}`;
    
            console.log("Full File Link: ", fileLink);
            return res.json({
                success: true,
                fileLink: filename
            });
        } catch (error) {
            console.log("error", error);
            return res.status(500).send({ message: 'Error creating NFCs', error: error.message });
        }
    },
    importNfc: async(req, res) => {
        if (!req.files.file) {
            return res.status(400).send('No file uploaded.');
        }
    
        let label_id;
        let labelUser;
        let labelName = ''; // To store the label name
        const userRole = req.token.role.toString().toUpperCase();
    
        if (userRole === 'SUPER_ADMIN') {
            label_id = bodyLabelId;
            labelUser = await Admin.findById(label_id);
        } else if (userRole === 'LABEL') {
            label_id = req.token._id;
            labelUser = await Admin.findById(label_id);
        } else if (userRole === 'LABEL_STAFF') {
            labelUser = await Admin.findById(req.token.createdBy);
            label_id = labelUser ? labelUser._id : null;
        }
    
        if (!label_id || !labelUser) {
            return res.status(400).send({ message: 'Missing label ID or unauthorized access' });
        }
    
        const results = [];
        const bufferStream = new require('stream').Readable();
        bufferStream.push(req.files.file.data); // Push buffer to stream
        bufferStream.push(null); // Indicate end of stream
    
        bufferStream
            .pipe(csv())
            .on('data', (row) => results.push(row))
            .on('end', async () => {
                try {
                    for (const row of results) {
                        const newNFC = new NFC({
                            label_id: label_id, // Assuming label_id is already an ObjectId
                            album_id: req.body.album_id, // Convert to ObjectId
                            token: row.token,
                            code: row.code,
                            activationDate: row.activationDate,
                            status: 'active', // Set default status
                            mapped: false // Set default mapping
                        });
                        await newNFC.save();
                    }
                   return res.status(201).json({message:'Data uploaded and saved successfully',success:true});
                } catch (error) {
                   return res.status(500).send('Failed to save data: ' + error.message);
                }
            })
            .on('error', (error) => {
                res.status(500).send('Failed to process file: ' + error.message);
            });
    },
       
    getAllNfcs: async(req,res)=>{
        const userRole = req.token.role.toString().toUpperCase();
        const userId = req.token._id; // User's ID from the token
        const createdBy = req.token.createdBy; // For LABEL_STAFF to find their label
    
        try {
            let query = {};
            if (userRole === 'SUPER_ADMIN') {
                // SUPER_ADMIN can see all NFC records
                query = {};
            } else if (userRole === 'LABEL') {
                // LABEL can only see their own NFC records
                query = { label_id: userId };
            } else if (userRole === 'LABEL_STAFF') {
                // LABEL_STAFF can see NFC records for their label
                // Assuming `createdBy` field in token stores the LABEL's user ID
                query = { label_id: createdBy };
            } else {
                return res.status(403).send({ message: 'Unauthorized access' });
            }
    
            const nfcRecords = await NFC.find(query).populate('label_id').populate('album_id');
           return res.status(200).send(nfcRecords);
        } catch (error) {
            console.log("error",error)
            return res.status(500).send({ message: 'Error fetching NFC records', error: error.message });
        }
    },
    updateNfc : async(req,res)=>{
        const { status } = req.body; // Expected to be 'active' or 'not active'
        
    
        try {
            // Validate the status
            if (!['active', 'inactive'].includes(status)) {
                return res.status(400).send({ message: 'Invalid status. Must be "active" or "inactive".' });
            }
    
            // Find the NFC record
            const nfcRecord = await NFC.findById(req.params.id);
            if (!nfcRecord) {
                return res.status(404).send({ message: 'NFC record not found.' });
            }
                // Update the status if authorized
                nfcRecord.status = status;
                await nfcRecord.save();
                return res.status(200).send({ msg: 'NFC status updated successfully.', data: nfcRecord ,success:true });
          
        } catch (error) {
          return  res.status(500).send({ message: 'Error updating NFC status', error: error.message });
        }
    },
    getNfcsOnStatus: async(req,res)=>{
        const { isActive, isMapped } = req.query; // Expects isActive as 'true' or 'false', isMapped as 'true', 'false', or 'null' for inactive
        const userRole = req.token.role.toString().toUpperCase();
        const userId = req.token._id;
        const createdBy = req.token.createdBy;
    
        try {
            let query = {};
    
            // Determine active status
            if (isActive === 'true') {
                query.status = 'active';
                // Determine mapped status only if active
                if (isMapped !== undefined) {
                    query.mapped = isMapped === 'true';
                }
            } else if (isActive === 'false') {
                query.status = 'inactive';
            } else {
                return res.status(400).send({ message: 'Invalid isActive parameter. Must be "true" or "false".' });
            }
    
            // Adjust the query based on the user's role
            if (userRole !== 'SUPER_ADMIN') {
                if (userRole === 'LABEL') {
                    query.label_id = userId;
                } else if (userRole === 'LABEL_STAFF') {
                    query.label_id = createdBy;
                } else {
                    return res.status(403).send({ message: 'Unauthorized access' });
                }
            }
    
            // Fetch the NFC records based on the constructed query
            const nfcRecords = await NFC.find(query).populate('label_id').populate('album_id');
            res.status(200).send(nfcRecords);
        } catch (error) {
           return res.status(500).send({ message: 'Error fetching NFC records', error: error.message });
        }
    },
    downloadCsv: async(req,res)=>{
        const userRole = req.token.role.toString().toUpperCase();
        const userId = req.token._id; // User's ID from the token
        const createdBy = req.token.createdBy; // For LABEL_STAFF to find their label
        try {
            let query = {};
            if (userRole === 'SUPER_ADMIN') {
                // SUPER_ADMIN can see all NFC records
                query = {};
            } else if (userRole === 'LABEL') {
                // LABEL can only see their own NFC records
                query = { label_id: userId };
            } else if (userRole === 'LABEL_STAFF') {
                // LABEL_STAFF can see NFC records for their label
                // Assuming `createdBy` field in token stores the LABEL's user ID
                query = { label_id: createdBy };
            } else {
                return res.status(403).send({ message: 'Unauthorized access' });
            }
    
            const data = await NFC.find(query)
                .populate('label_id') // Assuming 'name' is the field you want from Dashboarduser
                .populate('album_id', 'title') // Assuming 'name' is the field you want from Album
                .lean();
            const csvData = data.map(item => ({
                label_name: item.label_id ? `${item.label_id.firstName} ${item.label_id.lastName}` : '', // Concatenating first and last names
                album_name: item.album_id ? item.album_id.title : '',
                token: item.token,
                code: item.code,
                activationDate: item.activationDate,
                status: item.status,
                mapped: item.mapped,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            }));
    
            const csv = parse(csvData);
             // Set headers to prompt download
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=NFCs.csv');
    res.send(csv);
           
        } catch (error) {
            console.error('Failed to export data to CSV:', error);
            return res.status(500).send({ message: 'Failed to export data to CSV:', error: error.message });
        }
    },
    verifyNfc: async(req, res) => {
        const { token, code, album_id } = req.body;
        const userId = req.token._id; // Extract user ID from JWT token passed in the request
    
        if (!token || !code || !album_id) {
            return res.status(400).send({ message: "All fields are required: token, code, and album_id." });
        }
    
        try {
            const nfcRecord = await NFC.findOne({ token: token });
            if (!nfcRecord) {
                return res.status(200).json({ message: "NFC record not found.",data:{} ,status: true });
            }
    
            // Check if NFC is already used
            if (nfcRecord.mapped) {
                return res.status(200).json({ message: "This NFC has already been used.",data:{} ,status: true });
            }
    
            if (nfcRecord.code !== code || nfcRecord.album_id.toString() !== album_id) {
                return res.status(200).json({ message: "Invalid code or album ID.",data:{} ,status: true });
            }
    
            if (nfcRecord.status !== 'active') {
                return res.status(200).json({ message: "This NFC is not active.",data:{} ,status: true });
            }
    
            // Update NFC record to marked as mapped
            nfcRecord.mapped = true;
            await nfcRecord.save();
    
            // Add album to user's collection
            const userAlbum = await UserAlbum.findOneAndUpdate(
                { user_id: userId },
                { $addToSet: { album_id: album_id } },
                { new: true, upsert: true }
            );
    
            // Prepare the response object, changing album_id to a string
            const response = userAlbum.toObject(); // Convert the Mongoose document to a plain JavaScript object
            response.album_id = album_id;  // Override the album_id array with the single album ID
    
            return res.status(200).json({
                message: "NFC verified and album added to user's collection.",
                data: response,
                status:true
            });
        } catch (error) {
            console.error('Error verifying NFC:', error);
            return res.status(500).send({ message: "Error verifying NFC." });
        }
    }
    
}