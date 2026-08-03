const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const ownerInfo = {
  name: "Mr.king",
  facebook: "https://www.facebook.com/mrking000123",
  getScript: "https://script-rmy3.onrender.com/scripts.html"
};

module.exports = {
  config: {
    name: "botjoin",
    version: "1.0",
    author: "Mr.king",
    category: "events"
  },

  onStart: async function ({ event, api, message }) {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData } = event;
    const botID = api.getCurrentUserID();
    const addedUsers = logMessageData.addedParticipants;

    const isBotAdded = addedUsers.some(u => u.userFbId === botID);
    if (!isBotAdded) return;

    const nickNameBot = global.AliyaBot?.config?.nickNameBot || global.GoatBot?.config?.nickNameBot || "Aliya Bot";
    const prefix = global.utils.getPrefix(threadID);
    const BOT_UID = botID; 

    try {
      await api.changeNickname(nickNameBot, threadID, botID);
    } catch (err) {
      console.warn("⚠️ Nickname change failed:", err.message);
    }

    try {
      const API_ENDPOINT = "https://xsaim8x-xxx-api.onrender.com/api/botjoin"; 
      const apiUrl = `${API_ENDPOINT}?botuid=${BOT_UID}&prefix=${encodeURIComponent(prefix)}`;
      
      const tmpDir = path.join(__dirname, "..", "cache");
      await fs.ensureDir(tmpDir);
      const imagePath = path.join(tmpDir, `botjoin_image_${threadID}.png`);

      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(imagePath, response.data);

      const textMsg = [
        "⚡ 𝗕𝗢𝗧 𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘𝗗 𝗦𝗨𝗖𝗖𝗘𝗦𝗦𝗙𝗨𝗟𝗟𝗬 ⚡",
        "━━━ ━━━━ ━━━━ ━━━━ ━━━",
        `❯ 𝗣𝗿𝗲𝗳𝗶𝘅 : ${prefix}`,
        `❯ 𝗛𝗲𝗹𝗽 : ${prefix}help`,
        "━━━ ━━━━ ━━━━ ━━━━ ━━━",
        `❯ 𝗔𝘂𝘁𝗵𝗼𝗿 : ${ownerInfo.name}`,
        `❯ 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸 : ${ownerInfo.facebook}`,
        `❯ 𝗦𝗰𝗿𝗶𝗽𝘁 𝗖𝗺𝗱𝘀 : ${ownerInfo.getScript}`,
        "━━━ ━━━━ ━━━━ ━━━━ ━━━"
      ].join("\n");

      await api.sendMessage({
        body: textMsg,
        attachment: fs.createReadStream(imagePath)
      }, threadID);

      fs.unlinkSync(imagePath);

    } catch (err) {
      console.error("⚠️ Error sending botjoin message:", err);
      
      const fallbackMsg = [
        "⚡ 𝗕𝗢𝗧 𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘𝗗 𝗦𝗨𝗖𝗖𝗘𝗦𝗦𝗙𝗨𝗟𝗟𝗬 ⚡",
        "━━━ ━━━━ ━━━━ ━━━━ ━━━",
        `❯ 𝗣𝗿𝗲𝗳𝗶𝘅 : ${prefix}`,
        `❯ 𝗛𝗲𝗹𝗽 : ${prefix}help`,
        "━━━ ━━━━ ━━━━ ━━━━ ━━━",
        `❯ 𝗔𝘂𝘁𝗵𝗼𝗿 : ${ownerInfo.name}`,
        `❯ 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸 : ${ownerInfo.facebook}`,
        `❯ 𝗦𝗰𝗿𝗶𝗽𝘁 𝗖𝗺𝗱𝘀 : ${ownerInfo.getScript}`,
        "━━━ ━━━━ ━━━━ ━━━━ ━━━"
      ].join("\n");
      api.sendMessage(fallbackMsg, threadID);
    }
  }
};
      
