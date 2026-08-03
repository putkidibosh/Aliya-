const axios = require("axios");

module.exports.config = {
  name: "vid",
  version: "1.4.0",
  role: 0,
  author: "𝔐𝔯.𝔎𝔦𝔫𝔤 ☠️✌🏼",
  description: "Get a random video from Mr. King's database or check total video count.",
  category: "media",
  usages: "[vid | vid sync | ☠️ | 👻]",
  cooldowns: 5,
  aliases: ["☠️", "👻"],
  usePrefix: false
};

const usedLinks = new Set();
const BASE_URL = "https://video-uy9p.onrender.com";

async function handleVideoLogic(api, event, args) {
  const { threadID, messageID } = event;

  try {
    if (args && args[0] && args[0].toLowerCase() === "sync") {
      api.setMessageReaction("⏳", messageID, () => {}, true);

      const res = await axios.get(`${BASE_URL}/api/videos/count`);
      if (res.data && res.data.success) {
        api.setMessageReaction("🔥", messageID, () => {}, true);

        const countMsg = `✨ ─── 『 ₛYₙC Sₜₐₜₛ 』 ─── ✨\n\n` +
                         `📊 Total Videos Available: ${res.data.count}\n` +
                         `👤 Maintainer: 𝔐𝔯.𝔎ᵢ𝔫𝔤 ☠️✌🏼\n\n` +
                         `✨ ───────────────── ✨`;
        return api.sendMessage(countMsg, threadID, messageID);
      } else {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("❌ Failed to fetch video count!", threadID, messageID);
      }
    }

    api.setMessageReaction("👀", messageID, () => {}, true);

    const res = await axios.get(`${BASE_URL}/api/videos`);
    if (!res.data || !res.data.success || !res.data.videos || res.data.videos.length === 0) {
      api.setMessageReaction("⚠️", messageID, () => {}, true);
      return api.sendMessage("⚠️ No videos found in the database!", threadID, messageID);
    }

    const allVideos = res.data.videos.map(v => v.url);
    let availableVideos = allVideos.filter(url => !usedLinks.has(url));

    if (availableVideos.length === 0) {
      usedLinks.clear();
      availableVideos = allVideos;
    }

    const selectedUrl = availableVideos[Math.floor(Math.random() * availableVideos.length)];
    usedLinks.add(selectedUrl);

    const videoStream = (await axios.get(selectedUrl, { responseType: "stream" })).data;

    const caption = `✨ ───────────────── ✨\n` +
                    `ₕₑᵣₑ ᵢₛ ₐ ᵥᵢdₑₒ Fᵣ₏ₘ 𝔐𝔯.𝔎ᵢ𝔫𝔤 ☠️✌🏼\n` +
                    `✨ ───────────────── ✨`;

    api.setMessageReaction("🪶", messageID, () => {}, true);

    return api.sendMessage({
      body: caption,
      attachment: videoStream
    }, threadID, messageID);

  } catch (error) {
    console.error("Vid Command Error:", error);
    api.setMessageReaction("🔴", messageID, () => {}, true);
    return api.sendMessage("🔴 An error occurred while fetching the video!", threadID, messageID);
  }
}

module.exports.onStart = async function ({ api, event, args }) {
  return handleVideoLogic(api, event, args);
};

module.exports.onChat = async function ({ api, event }) {
  const { body } = event;
  if (!body) return;

  const trimmed = body.trim();
  if (trimmed === "👻" || trimmed === "☠️") {
    return handleVideoLogic(api, event, []);
  }
};
