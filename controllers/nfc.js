const NFC = require("../models/nfc")
const Admin = require("../models/dashboardUsers")
const {generateOTP,generateToken} = require("../utils/index")
const { parse } = require('json2csv');
const fs = require('fs');
module.exports = {
    createNfc: async(req,res)=>{
        const { album_id, numberOfNFC, activate, label_id: bodyLabelId } = req.body;
        let label_id;
    
        const userRole = req.token.role.toString().toUpperCase();
        if (userRole === 'SUPER_ADMIN') {
            // Use label_id from request body if the role is SUPER_ADMIN
            label_id = bodyLabelId;
        } else if (userRole === 'LABEL') {
            // Directly use the user's ID if the role is LABEL
            label_id = req.token._id;
        } else if (userRole === 'LABEL_STAFF') {
            // Find the label ID from the createdBy if the role is LABEL_STAFF
            const labelUser = await Admin.findById(req.token.createdBy);
            label_id = labelUser ? labelUser._id : null;  // Ensure that createdBy points to the LABEL's ID
        }
    
        if (!label_id) {
            return res.status(400).send({ message: 'Missing label ID or unauthorized access' });
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
                nfcChips.push(newNFC);
            }
    
            await NFC.insertMany(nfcChips); // Bulk insert generated NFC chips
           return res.status(201).send({ message: 'NFCs created successfully', data: nfcChips.length });
        } catch (error) {
            console.log("error",error)
           return res.status(500).send({ message: 'Error creating NFCs', error: error.message });
        }
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
            fs.writeFileSync('./nfcData.csv', csv);
            console.log('Data has been written to CSV file successfully.');
             // Set headers to prompt download
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=NFCs.csv');
    res.send(csv);
           
        } catch (error) {
            console.error('Failed to export data to CSV:', error);
            return res.status(500).send({ message: 'Failed to export data to CSV:', error: error.message });
        }
    }
}