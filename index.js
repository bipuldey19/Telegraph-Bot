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
const telegraph = require('telegraph-node')
const ph = new telegraph()

//Setting bot commands
bot.setMyCommands([{
    command: '/start',
    description: 'Check if I am alive'
}],
[{
    command: '/createAccount',
    description: 'Create a new account on telegraph | /createAccount SHORTNAME FULLNAME'
}])

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Hello there!!! I am a bot created by @bipuldey19');
});

bot.onText(/\/createAccount/, (msg) => {
    var names = msg.text.toString().replace(/createAccount |\//g, '');
    var name = names.split(' ');
    var shortName = name[0];
    var fullNameArray = [];
    for (let j = 1; j < name.length; j++) {
        fullNameArray.push(name[j]);
    }
    var fullName = fullNameArray.join(' ');
    if (name.length > 1) {
        ph.createAccount('hi', {
                short_name: shortName,
                author_name: fullName
            }).then(async (account) => {
                console.log(account)
                const auth = {
                    reply_markup: {
                        "inline_keyboard": [
                            [{
                                "text": "🔐 Verify Account",
                                "url": account.auth_url
                            }]
                        ]
                    }, 
                    parse_mode: 'Markdown'
                }
                var details = "✅ *Account created Successfully!*\n\n🔰 *Account Details:*\n💠Short Name: " + "_" + account.short_name + "_" +
                    "\n💠Author Name: " + "_" + account.author_name + "_" +
                    "\n💠Access Token: \n" + "```" + account.access_token + "```";
                await bot.sendChatAction(msg.chat.id, 'typing');
                await bot.sendMessage(msg.chat.id, details, auth);
            })
            .catch((err) => {
                bot.sendMessage(msg.chat.id, err);
            })
    } else {
        bot.sendMessage(msg.chat.id, "⚠️ Please give me your Short Name & your Full Name !")
    }

});

bot.on('message', async (msg) => {
    console.log(msg)
    // For documents
    if (msg.document != undefined) {
        await bot.sendMessage(msg.chat.id, '⚙️ Uploading file & making links...');
        bot.getFileLink(msg.document.file_id)
        .then(async link => {
                await uploadByUrl(link)
                    .then(async (result) => {
                        var doctype = msg.document.mime_type;
                        var docurl = result.link;
                        var desc = "*✅ File uploaded to telegraph!*\n\n" +
                            "📄 *File Type:* " + doctype + "\n" +
                            "🔗 *Link:*\n" + "```" + docurl + "```";
                            await bot.sendChatAction(msg.chat.id, 'typing');
                            await bot.sendMessage(msg.chat.id, desc, {
                                parse_mode: "Markdown"
                        });
                    })
                    .catch(error => {
                        bot.sendMessage(msg.chat.id, '⚠️ Sorry, I can only upload images, gifs and videos with size less than 5MB !');
                    })
            });
    }
    // For photos
    if (msg.photo != undefined) {
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
                })
                .catch(error => {
                    bot.sendMessage(msg.chat.id, '⚠️ Sorry, I can only upload images, gifs and videos with size less than 5MB !');
                })
            await width.push(msg.photo[i].width);
            await height.push(msg.photo[i].height);
        }
        var desc = "*✅ Image uploaded to telegraph!*\n\n🔗 *Links:*\n\n";
        for (let i = 0; i < links.length; i++) {
            desc += "🖼️ *" + width[i] + "*" + "×" + "*" + height[i] + "*\n" + "```" + links[i] + "```" + "\n\n";
        }

        await bot.sendChatAction(msg.chat.id, 'typing');
        await bot.sendMessage(msg.chat.id, desc, {
            parse_mode: "Markdown"
        });
    }
    // For audio
    if (msg.audio != undefined || msg.voice != undefined) {
        bot.sendMessage(msg.chat.id, '⚠️ Sorry, I can only upload images, gifs and videos with size less than 5MB');
    }

})

app.listen(80)