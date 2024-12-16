const NFC = require("../models/nfc")
const Admin = require("../models/dashboardUsers")
const {generateOTP,generateToken} = require("../utils/index")
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
    }
}