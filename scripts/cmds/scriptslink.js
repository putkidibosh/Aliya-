const axios = require('axios');

module.exports = {
    config: {
        name: "scriptslink",
        version: "1.4.0",
        author: "Mr.King",
        countDown: 5,
        role: 0, 
        description: "Fetch and display script links and code stylishly with a live countdown timer.",
        category: "utility",
        guide: "{p}scriptslink <script_name.js>"
    },

    onStart: async function ({ api, event, args, message }) {
        const { threadID, messageID } = event;
        
        if (args.length === 0) {
            return message.reply("⚠️ Please provide a script name! Example: /scriptslink test.js");
        }

        let scriptName = args[0];
        if (!scriptName.includes('.')) {
            scriptName += '.js';
        }

        const BASE_URL = "https://script-rmy3.onrender.com"; 
        const scriptUrl = `${BASE_URL}/scripts/${scriptName}`;

        const loadingMsg = await message.reply(`🔍 Fetching '${scriptName}' from server...`);

        try {
            const response = await axios.get(scriptUrl);
            let rawCode = response.data;

            if (!rawCode || rawCode.includes('404: Script not found')) {
                return message.reply(`❌ Script '${scriptName}' not found on the server!`);
            }

            if (rawCode.startsWith('// Banner Image:')) {
                rawCode = rawCode.split('\n').slice(2).join('\n');
            }

            
            api.unsendMessage(loadingMsg.messageID);

            
            const getStylishTemplate = (timeLeft) => {
                return `╔════════════════════╗\n` +
                       `   ⚙️  𝐒𝐂𝐑𝐈𝐏𝐓  𝐅𝐄𝐓𝐂𝐇𝐄𝐃  ⚙️\n` +
                       `╚════════════════════╝\n\n` +
                       `🌐 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱 𝗟𝗶𝗻𝗸:\n${scriptUrl}\n\n` +
                       `📜 𝗦𝗼𝘂𝗿𝗰𝗲 𝗖𝗼𝗱𝗲:\n\`\`\`javascript\n${rawCode}\n\`\`\`\n` +
                       `⏳ 𝘛𝘩𝘪𝘴 𝘮𝘦𝘴𝘴𝘢𝘨𝘦 𝘸𝘪𝘭𝘭 𝘢𝘶𝘵𝘰-𝘥𝘦𝘭𝘦𝘵𝘦 𝘪𝘯: 𝟬𝟬:${timeLeft < 10 ? '𝟬' + timeLeft : timeLeft} 𝘴𝘦𝘤𝘰𝘯𝘥𝘴`;
            };

            let secondsLeft = 10;

            
            api.sendMessage(getStylishTemplate(secondsLeft), threadID, (err, info) => {
                if (err) return console.error(err);

                // প্রতি ১ সেকেন্ড পর পর টাইমার আপডেট করার ইন্টারভাল
                const timer = setInterval(() => {
                    secondsLeft--;

                    if (secondsLeft <= 0) {
                        clearInterval(timer);
                        api.unsendMessage(info.messageID); // ১০ সেকেন্ড শেষ হলে ডিলিট
                    } else {
                        // মেসেজ এডিট করে লাইভ কাউন্টডাউন দেখানো
                        api.editMessage(getStylishTemplate(secondsLeft), info.messageID);
                    }
                }, 1000);
            }, messageID);

        } catch (error) {
            console.error("ScriptsLink Error:", error);
            message.reply(`🔴 Request failed or server is offline!`);
        }
    }
};
