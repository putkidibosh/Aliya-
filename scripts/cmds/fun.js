const axios = require("axios");
const fs = require("fs");
const path = require("path");

const FOLDER_ID = "1YxVOIOKLkUdV9aatf4SAeey_T6ZbCPQX";

module.exports = {
  config: {
    name: "fun",
    aliases: ["👀"],
    version: "1.0.1",
    author: "Mr.King 🎭",
    countDown: 5,
    role: 0,
    category: "media",
    shortDescription: { en: "Random videos from drive and sync folder" },
    guide: { en: "{pn} | {pn} sync | 👀" }
  },

  onChat: async function ({ api, event }) {
    if (event.senderID == api.getCurrentUserID()) return;
    if (event.body && event.body.trim() === "👀") {
      return sendRandomVideo(api, event);
    }
  },

  onStart: async function ({ api, event, args }) {
    if (args[0] === "sync") {
      return handleSync(api, event);
    }
    return sendRandomVideo(api, event);
  }
};

// ফাইল লিস্ট চেক করার ফাংশন
async function handleSync(api, event) {
  const { threadID, messageID } = event;
  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);
    const response = await axios.get(`https://drive.google.com/embeddedfolderview?id=${FOLDER_ID}`);
    const matches = [...response.data.matchAll(/\/file\/d\/([a-zA-Z0-9_-]+)\/view/g)];
    
    if (matches.length === 0) {
      return api.sendMessage("📁 No files found in the drive folder.", threadID, messageID);
    }

    const report = `📊 **Drive Sync Report**\n\n` +
                   `• Total files detected: ${matches.length}\n` +
                   `• Folder ID: ${FOLDER_ID}\n\n` +
                   `Everything is synced and ready!`;
                   
    api.setMessageReaction("✅", messageID, () => {}, true);
    return api.sendMessage(report, threadID, messageID);
  } catch (err) {
    api.sendMessage("❌ Error syncing drive folder.", threadID, messageID);
  }
}

// র্যান্ডম ভিডিও পাঠানোর ফাংশন (কোনো টেক্সট ছাড়া)
async function sendRandomVideo(api, event) {
  const { threadID, messageID } = event;
  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);
    
    const response = await axios.get(`https://drive.google.com/embeddedfolderview?id=${FOLDER_ID}`);
    const matches = [...response.data.matchAll(/\/file\/d\/([a-zA-Z0-9_-]+)\/view/g)];
    
    if (matches.length === 0) {
      return api.sendMessage("❌ No videos found in drive.", threadID);
    }

    const randomFile = matches[Math.floor(Math.random() * matches.length)][1];
    const downloadUrl = `https://docs.google.com/uc?export=download&id=${randomFile}`;
    const filePath = path.join(__dirname, "cache", `fun_${randomFile}.mp4`);

    const writer = fs.createWriteStream(filePath);
    const downloadResponse = await axios({
      url: downloadUrl,
      method: "GET",
      responseType: "stream"
    });

    downloadResponse.data.pipe(writer);

    writer.on("finish", async () => {
      // শুধুমাত্র ভিডিও ফাইল পাঠানো হচ্ছে, কোনো body বা টেক্সট নেই
      await api.sendMessage({
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
      api.setMessageReaction("✅", messageID, () => {}, true);
    });

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", messageID, () => {}, true);
  }
}
