require('dotenv').config({
    path: './.env'
});
const TelegramBot = require('node-telegram-bot-api'); //Telegram bot api
const express = require('express'); //For web app to keep the bot alive
const app = express();
app.get("/", (request, response) => {
    response.send("Bot is running!!!");
});
const token = process.env.BOT_TOKEN; //Telegram bot token
const bot = new TelegramBot(token, {
    polling: true
});

const {
    uploadByUrl
} = require('telegraph-uploader') //Telegraph up by url api

//Setting bot commands
bot.setMyCommands([{
    command: '/start',
    description: 'Check if I am alive'
}])

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Hello there!!! I am a bot created by @bipuldey19');
});

bot.on('message', async (msg) => {

    if (msg.document != undefined) {
        if (msg.document.file_name.includes('.png') || msg.document.file_name.includes('.jpeg') || msg.document.file_name.includes('.gif') || msg.document.file_name.includes('.mp4') || msg.document.includes('.mkv') || msg.document.file_size < 5000000) {
            await bot.sendMessage(msg.chat.id, '⚙️ Uploading file & making links...');
            await bot.getFileLink(msg.document.file_id)
                .then(async link => {
                    await uploadByUrl(link)
                        .then(async (result) => {
                            var doctype = msg.document.mime_type;
                            var docurl = result.link;
                            var desc = "*✅ File uploaded to telegraph!*\n\n" +
                                "📄 *File Type:* " + doctype + "\n" +
                                "🔗 *Link:*\n" + "```" + docurl + "```";
                            await bot.sendMessage(msg.chat.id, desc, {
                                parse_mode: "Markdown"
                            });
                        })
                });
        } else {
            await bot.sendMessage(msg.chat.id, 'Sorry, I can only upload images, gifs and videos with size less than 5MB');

        }
    }

    //Check if the message is a photo
    if (msg.photo != undefined) {
        if (msg.photo[0].file_size > 5000000) {
            await bot.sendMessage(msg.chat.id, 'Sorry, I can only upload images, gifs and videos with size less than 5MB');
        } else {
            await bot.sendMessage(msg.chat.id, '⚙️ Uploading image & making links...');
            var links = [];
            var width = [];
            var height = [];
            for (let i = 0; i < msg.photo.length; i++) {
                await bot.getFileLink(msg.photo[i].file_id)
                    .then(async link => {
                        await uploadByUrl(link)
                            .then(async (result) => {
                                links.push(result.link);
                            })
                    });
                await width.push(msg.photo[i].width);
                await height.push(msg.photo[i].height);
            }
            var desc = "*✅ Image uploaded to telegraph!*\n\n🔗 *Links:*\n\n";
            for (let i = 0; i < links.length; i++) {
                desc += "🖼️ *" + width[i] + "*" + "×" + "*" + height[i] + "*\n" + "```" + links[i] + "```" + "\n\n";
            }

            await bot.sendMessage(msg.chat.id, desc, {
                parse_mode: "Markdown"
            });
        }

    }
    if (msg.audio != undefined || msg.voice != undefined) {
        bot.sendMessage(msg.chat.id, 'Sorry, I can only upload images, gifs and videos with size less than 5MB');
    }

})

app.listen(80)