const {

    getSettings,
    updateSettings,
    updateCompanyLogo

} = require("../models/settingsModel");

// ======================================
// Get Settings
// ======================================

const getSettingsController = async (req, res) => {

    try {

        const settings = await getSettings();

        return res.status(200).json({

            success: true,
            message: "Settings fetched successfully.",
            data: settings[0]

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,
            message: "Internal Server Error."

        });

    }

};

// ======================================
// Update Settings
// ======================================

const updateSettingsController = async (req, res) => {

    try {

        await updateSettings(req.body);

        return res.status(200).json({

            success: true,
            message: "Settings updated successfully."

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,
            message: "Internal Server Error."

        });

    }

};

// ======================================
// Update Company Logo
// ======================================

const updateCompanyLogoController = async (req, res) => {

    try {

        if (!req.file) {

            return res.status(400).json({

                success: false,
                message: "Please upload company logo."

            });

        }

        await updateCompanyLogo(req.file.filename);

        return res.status(200).json({

            success: true,
            message: "Company logo updated successfully.",
            logo: req.file.filename

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,
            message: "Internal Server Error."

        });

    }

};

// ======================================
// Check App Update (Version Sync from Backend)
// ======================================
const checkAppUpdateController = async (req, res) => {
    try {
        const clientVersion = req.query.version || "1.0.0";
        const clientBuildNumber = parseInt(req.query.build_number || "1", 10);

        // Current Latest App Version configuration
        // In the future this can also be fetched from the database settings table
        const latestVersion = "1.0.1";
        const latestBuildNumber = 2;
        const isForceUpdate = false; // true if critical breaking change
        const downloadUrl = "https://smartsunpower.tech/solar_crm.apk";
        const releaseNotes = [
            "🚀 10x faster lead loading speed & instant caching",
            "⚡ Enhanced 'Not Interested' validation (minimum 10 alphabets)",
            "🔄 In-app automatic update notification & direct APK download",
            "🛡️ Enterprise database optimization & improved stability"
        ];

        const hasUpdate = latestBuildNumber > clientBuildNumber;

        return res.status(200).json({
            success: true,
            has_update: hasUpdate,
            latest_version: latestVersion,
            latest_build_number: latestBuildNumber,
            current_version: clientVersion,
            force_update: isForceUpdate,
            download_url: downloadUrl,
            release_notes: releaseNotes,
            message: hasUpdate ? "New update available!" : "App is up to date."
        });
    } catch (error) {
        console.error("checkAppUpdateController error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to check for app update."
        });
    }
};

module.exports = {

    getSettings: getSettingsController,
    updateSettings: updateSettingsController,
    updateCompanyLogo: updateCompanyLogoController,
    checkAppUpdate: checkAppUpdateController

};