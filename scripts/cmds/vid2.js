const axios = require("axios");


if (!global.mrkingVideoCache) {
    global.mrkingVideoCache = [];
}

async function syncDatabase(api, event, isManual = false) {
    try {
        const res = await axios.get("https://fun-biju.onrender.com/api/videos");
        const data = res.data;

        if (!data || !data.success || !data.videos || data.videos.length === 0) {
            global.mrkingVideoCache = [];
            if (isManual) api.sendMessage("No video links found in the database.", event.threadID, event.messageID);
            return false;
        }

        global.mrkingVideoCache = data.videos;
        if (isManual) {
            api.sendMessage("Sync Successful! A total of " + global.mrkingVideoCache.length + " video links have been loaded into memory.", event.threadID, event.messageID);
        }
        return true;
    } catch (err) {
        console.error(err);
        if (isManual) api.sendMessage("Failed to sync database. Please check the server connection.", event.threadID, event.messageID);
        return false;
    }
}

module.exports.config = {
    name: "vid2",
    aliases: ["lol2"],
    version: "6.6",
    author: "Roni",
    role: 0,
    category: "media",
    guide: { en: "Use {p}vid to get a random video or {p}vid sync to refresh database." }
};

module.exports.onChat = async ({ api, event }) => {
    if (event.senderID == api.getCurrentUserID()) return;

    const message = event.body ? event.body.trim() : "";
    
    if (message === "🌚") {
        try {
            api.setMessageReaction("🧞", event.messageID, (err) => {}, true);
            
            if (global.mrkingVideoCache.length === 0) {
                const isSynced = await syncDatabase(api, event, false);
                if (!isSynced) return;
            }

            const randomIndex = Math.floor(Math.random() * global.mrkingVideoCache.length);
            const targetVideo = global.mrkingVideoCache[randomIndex];
            const videoUrl = targetVideo.url;

            api.sendMessage({
                body: "Here is your video!",
                attachment: [await global.utils.getStreamFromURL(videoUrl)]
            }, event.threadID, (err, info) => {
                api.setMessageReaction("🇦🇷", event.messageID, (err) => {}, true);
            }, event.messageID);

        } catch (err) {
            console.error(err);
        }
    }
};

module.exports.onStart = async ({ api, event, args }) => {
    if (args[0] && args[0].toLowerCase() === "sync") {
        api.setMessageReaction("⏳", event.messageID, (err) => {}, true);
        return await syncDatabase(api, event, true);
    }

    try {
        api.setMessageReaction("👀", event.messageID, (err) => {}, true);

        if (global.mrkingVideoCache.length === 0) {
            const isSynced = await syncDatabase(api, event, false);
            if (!isSynced) return;
        }

        const randomIndex = Math.floor(Math.random() * global.mrkingVideoCache.length);
        const targetVideo = global.mrkingVideoCache[randomIndex];
        const videoUrl = targetVideo.url;

        api.sendMessage({
            body: "Here is your video!",
            attachment: [await global.utils.getStreamFromURL(videoUrl)]
        }, event.threadID, (err, info) => {
            api.setMessageReaction("🔥", event.messageID, (err) => {}, true);
        }, event.messageID);

    } catch (err) {
        console.error(err);
        api.sendMessage("Error sending video or the link is broken.", event.threadID, event.messageID);
    }
};
