const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Ensure cache folder exists
const cacheDir = path.join(__dirname, "cache");
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

module.exports.config = {
  name: "edit",
  aliases: ["geminiedit"],
  version: "2.1",
  credits: "ArYAN",
  cooldowns: 30,
  hasPermssion: 0,
  description: "Edit or generate an image using EditV2 API",
  commandCategory: "AI",
  usages: "[text] (reply to an image)"
};

module.exports.run = async function ({ api, event, args }) {
  const prompt = args.join(" ");
  if (!prompt) {
    return api.sendMessage(
      "⚠️ Please provide some text for the image.",
      event.threadID,
      event.messageID
    );
  }

  const tempPath = path.join(cacheDir, `${Date.now()}.png`);
  const apiUrl = "https://apis-top.vercel.app/aryan/editv2";

  api.setMessageReaction("⏳", event.messageID, () => {}, true);

  try {
    const params = { prompt };

    if (
      event.messageReply &&
      event.messageReply.attachments &&
      event.messageReply.attachments[0]
    ) {
      params.imgurl = event.messageReply.attachments[0].url;
    }

    const response = await axios.get(apiUrl, { params });
    const imageData = response.data?.image_data;

    if (!imageData) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return api.sendMessage(
        `❌ API Error: ${response.data?.message || "Failed to get image data."}`,
        event.threadID,
        event.messageID
      );
    }

    const imageBuffer = Buffer.from(
      imageData.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    fs.writeFileSync(tempPath, imageBuffer);

    api.setMessageReaction("✅", event.messageID, () => {}, true);

    await api.sendMessage(
      {
        body: "✅ Image generated successfully!",
        attachment: fs.createReadStream(tempPath)
      },
      event.threadID,
      () => {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      },
      event.messageID
    );
  } catch (error) {
    console.error("❌ API ERROR:", error);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    return api.sendMessage(
      "❌ An error occurred while creating or editing the image.",
      event.threadID,
      event.messageID
    );
  }
};
