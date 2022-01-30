const telegramBot = require('node-telegram-bot-api');

const config = require('./config');
const helpers = require('./helpers');
const db = require('./db');
const locales = require('./locales/locales.js');
const keyboards = require("./keyboards");
// const {sendEmail} = require("./sendEmail");

const check = async (msg, userInfo) => {
    const {
        from: {
            id,
            first_name
        }
    } = msg;
    console.log(121212, userInfo)

    if (!userInfo.length) {
        await db.createField(id);
        await db.update(id, 'name', first_name);
        await db.update(id, 'status', 'lang');
        await sendLangQuestion(id);
    } else if (!userInfo[0].lang) {
        await sendLangQuestion(id);
    } else if (!userInfo[0].phone) {
        await db.update(id, 'status', 'phone');
        await sendPhoneQuestion(id)
    } else if (!userInfo[0].bottles_amount) {
        await db.update(id, 'status', 'bottles_amount');
        await sendBottleQuestion(id);
    } else if (userInfo[0].pomp_needed === null && userInfo[0].bottles_needed === null) {
        await db.update(id, 'status', 'additional_goods');
        await sendAdditionalGoodsQuestion(id);
    } else if (!userInfo[0].address) {
        await db.update(id, 'status', 'address');
        await sendAddressQuestion(id);
    } else if (userInfo[0].call_required === null) {
        await db.update(id, 'status', 'call_required');
        await sendCallQuestion(id);
    } else {
        await db.update(msg.from.id, 'status', 'confirmation');
        await sendOrderConfirmation(id);
    }

    return 0;
}

/*const checkIsGreeting = (msg, userInfo) => {
    if (!msg.text) {
        return;
    }

    helpers.saveToLogFile(msg, userInfo);

    if (msg.text.toLowerCase() === locales.get().HELLO_WORD_1.toLowerCase() ||
        msg.text.toLowerCase() === locales.get().HELLO_WORD_2.toLowerCase() ||
        msg.text.toLowerCase() === locales.get().HELLO_WORD_3.toLowerCase() ||
        msg.text.toLowerCase() === locales.get().HELLO_WORD_4.toLowerCase()) {
        bot.sendMessage(msg.from.id, `${locales.get().HELLO_WORD_1}, ${msg.from.first_name}!`)
            .then(() => {
                console.log('  message \'hello\' has been send ')
            })
            .catch((error) => {
                console.error(error)
            })
    } else {
        bot.sendMessage(msg.from.id, locales.get().DONT_UNDERSTAND)

            .then(() => {
                console.log('  message \'I am bot\' has been send ')
            })
            .catch((error) => {
                console.error(error)
            });
    }
}*/

const handleEditMessage = async (botMsg, bot, msg) => {
    const opts = {
        chat_id: msg.message ? msg.message.chat.id : msg.chat.id,
        message_id: msg.message ? msg.message.message_id : msg.message_id,
    };

    await bot.editMessageText(botMsg, opts)
}

const sendLangQuestion = async (id) => {
    await bot.sendMessage(id, locales.get().STRING_RESPONSE_START, keyboards.languageKeyboard());
}

const sendPhoneQuestion = async (id) => {
    const keyboard = JSON.stringify(keyboards.phoneKeyboard())

    await bot.sendMessage(id, `${locales.get().CONTACT.QUESTION}`, {
        reply_markup: keyboard,
    });
}

const sendBottleQuestion = async (id) => {
    const keyboard = keyboards.bottleKeyboard(null);

    await bot.sendMessage(id, `${locales.get().BOTTLES.QUESTION}`, {
        reply_markup: keyboard
    })
}

const editBottleKeyboard = async (msg, userInfo) => {
    const keyboard = keyboards.bottleKeyboard(userInfo);
    await bot.editMessageReplyMarkup(keyboard, {
        chat_id: msg.from.id,
        message_id: msg.message.message_id,
    });
    await bot.answerCallbackQuery(msg.id);
}

const sendAdditionalGoodsQuestion = async (id) => {
    const keyboard = keyboards.additionalGoodsKeyboard(null);

    await bot.sendMessage(id, `${locales.get().ADDITIONAL_GOODS.QUESTION}`, {
        reply_markup: keyboard,
    })
}

const sendAddressQuestion = async (id) => {
    await bot.sendMessage(id, `${locales.get().ADDRESS_QUESTION}`);
}

const sendCallQuestion = async (id, userInfo) => {
    const keyboard = keyboards.callKeyboard(userInfo);

    await bot.sendMessage(id, `${locales.get().CALL.QUESTION}`, {
        reply_markup: keyboard,
    })
}

const sendOrderConfirmation = async (id) => {
    const keyboard = keyboards.sendKeyboard();

    await db.getUserInfo(id, async (userInfo) => {
        bot.sendMessage(id, helpers.getUserOrderText(userInfo, false) +
            (
                !userInfo[0].comment ?
                    `----------------------------------------\n\n` + `${locales.get().ADD_COMMENT}`
                    : ''),
            {
                reply_markup: keyboard,
                parse_mode: 'Markdown'}
        ).then((msg) => {
            if (msg.message_id) {
                db.update(id, 'confirm_id', msg.message_id);
            }
        })
    });
}

const sendInvoice = async (id) => {
    const keyboard = keyboards.newOrder();

    await db.getUserInfo(id, async (userInfo) => {
        await langDetection(userInfo)
        await bot.sendMessage(id, helpers.getUserOrderText(userInfo, true), {
            reply_markup: keyboard,
            parse_mode: 'Markdown'
        }).then((msg) => {
            if (msg.message_id) {
                db.update(id, 'confirm_id', msg.message_id);
            }
        })
    });
}

const editAdditionalGoodsKeyboard = async (msg, userInfo) => {
    const keyboard = keyboards.additionalGoodsKeyboard(userInfo, locales.get());

    await bot.editMessageReplyMarkup(keyboard, {
        chat_id: msg.from.id,
        message_id: msg.message.message_id,
    });
    await bot.answerCallbackQuery(msg.id);
}

const editCallKeyboard = async (msg, userInfo) => {
    const keyboard = keyboards.callKeyboard(userInfo, locales.get());

    await bot.editMessageReplyMarkup(keyboard, {
        chat_id: msg.from.id,
        message_id: msg.message.message_id,
    });
    await bot.answerCallbackQuery(msg.id);
}

const resendOrderToUs = (userInfo) => {
    Object.values(config.MANAGERS_ID).forEach(async (id) => {
        await bot.sendMessage(id, helpers.firstConfirmationToString(userInfo[0]), {
            parse_mode: 'Markdown',
            reply_markup: keyboards.managerKeyboard(userInfo[0].user_id),
        })
    })
    Object.values(config.ADMINS_ID).forEach(async (id) => {
        await bot.sendMessage(id, helpers.firstConfirmationToString(userInfo[0]), {
            parse_mode: 'Markdown',
            reply_markup: keyboards.adminKeyboard(userInfo[0].user_id),
        })
    })
}

const handleLanguageResponse = async (msg) => {
    locales.setSource(`./${msg.data.toLowerCase()}.js`);
    await db.update(msg.from.id, 'lang', msg.data.toLowerCase());
    await handleEditMessage(locales.get().LANG_SUCCESS, bot, msg);
}

const handlePhoneResponse = async (msg, phoneNumber) => {
    const newPhoneNumber = phoneNumber[0] === "+" ? phoneNumber : "+" + phoneNumber;
    await db.update(msg.from.id, 'phone', newPhoneNumber);
}

const handleBottlesResponse = async (msg) => {
    await db.update(msg.from.id, 'bottles_amount', parseInt(msg.data));
}

const handleAdditionalGoodsResponse = async (msg, goods) => {
    await db.update(msg.from.id, msg.data.toLowerCase(), goods);
}

const handleAdditionalGoodsNext = async (msg) => {
    await db.getUserInfo(msg.from.id, async (userInfo) => {
        await bot.answerCallbackQuery(msg.id, {})
        if (!userInfo[0].bottles_needed && !userInfo[0].pomp_needed) {
            await db.update(msg.from.id, 'bottles_needed', 0);
            await db.update(msg.from.id, 'pomp_needed', 0);
        }
        await goToNextStep(msg);
    });
}

const goToNextStep = async (msg) => {
    await db.getUserInfo(msg.from.id, (userInfo) => check(msg, userInfo));
}

const handleAddressResponse = async (msg) => {
    await db.update(msg.from.id, 'address', msg.text);
    await db.update(msg.from.id, 'status', 'call_required');
    await goToNextStep(msg);
}

const handleCallResponse = async (msg, isRequired) => {
    await db.update(msg.from.id, 'call_required', isRequired);
    await db.update(msg.from.id, 'status', 'confirmation');
}

const handleCommentResponse = async (msg, userInfo) => {
    await db.update(msg.from.id, 'comment', msg.text);
    await db.update(msg.from.id, 'status',
        userInfo[0].status === 'wait_manager' ? 'wait_manager' : 'confirmation'
    );
    await db.getUserInfo(msg.from.id, (userInfo) => {
        replaceConfirmation(msg, userInfo);
    });
}

const handleNewOrderResponse = async (msg) => {
    await db.update(msg.from.id, 'pomp_needed', 0);
    await db.update(msg.from.id, 'bottles_needed', 0);
 /*   await db.getUserInfo(msg.from.id, async (userInfo) => {
        await bot.editMessageText(helpers.getUserOrderText(userInfo, true), {
            chat_id: msg.from.id,
            message_id: userInfo[0].confirm_id,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: []
            },
        })
    });*/
    await db.update(msg.from.id, 'comment', msg.text);
    await db.update(msg.from.id, 'status', 'confirmation');
    await sendOrderConfirmation(msg.from.id);
}

const replaceConfirmation = async (msg, userInfo, sendNew = true) => {
    if (!userInfo[0]) {
        return;
    }

    const chatId = msg.chat && msg.chat.id ? msg.chat.id : msg.message.chat.id;
    try {
        await bot.deleteMessage(chatId, userInfo[0].confirm_id);
    } catch {}
    setTimeout(async () => {
        sendNew && await sendOrderConfirmation(msg.from.id);
    }, 300);
}

const handleSend = async (msg, userInfo) => {
    const {
        from: {
            id
        }
    } = msg;
    await bot.answerCallbackQuery(msg.id, {text: locales.get().NOTIFICATION.SEND_SUCCESS, show_alert: true});
    await resendOrderToUs(userInfo);
    await bot.deleteMessage(id, userInfo[0].confirm_id);
    await db.setDate(id, 'last_order');
    await sendInvoice(id);
}

const langDetection = async (userInfo) => {
    locales.setSource(userInfo[0]?.lang ? `./${userInfo[0].lang.toLowerCase()}.js` : `./ru.js`);
}

helpers.logBotStarted();

const bot = new telegramBot(config.TOKEN, {
    polling: true
});

bot.onText(/\/start/, msg => {
    const {
        chat: {
            id,
            first_name
        }
    } = msg;

    helpers.logCommandStart(id, first_name);
});

bot.on('callback_query', async (msg) => {
    const {
        from: {
            id,
        }
    } = msg;

    await db.getUserInfo(id, (result) => langDetection(result));

    switch (msg.data.toLowerCase()) {
        case 'en':
        case 'ru':
        case 'ua':
            await handleLanguageResponse(msg);
            await db.getUserInfo(id, (result) => check(msg, result));
            break;
        case '1b':
        case '2b':
        case '3b':
        case '4b':
        case '5b':
            await db.getUserInfo(id, (userInfo) => {
                userInfo[0].bottles_amount = parseInt(msg.data);
                handleBottlesResponse(msg);
                editBottleKeyboard(msg, userInfo)
            });
            break;
        case 'pomp_needed':
        case 'bottles_needed':
            await db.getUserInfo(id, (userInfo) => {
                userInfo[0][msg.data.toLowerCase()] = !userInfo[0][msg.data.toLowerCase()];
                handleAdditionalGoodsResponse(msg, userInfo[0][msg.data.toLowerCase()]);
                editAdditionalGoodsKeyboard(msg, userInfo);
            });
            break;
        case 'next_bottles':
            await db.getUserInfo(id, (userInfo) => {
                if (userInfo[0].bottles_amount) {
                    bot.answerCallbackQuery(msg.id, {})
                    check(msg, userInfo);
                } else {
                    bot.answerCallbackQuery(msg.id, {
                        text: locales.get().NOTIFICATION.ERROR.BOTTLES,
                        show_alert: true
                    })
                }
            });
            break;
        case 'next_additional_goods':
            await handleAdditionalGoodsNext(msg);
            break;
        case 'next_call':
            await db.getUserInfo(id, async (userInfo) => {
                if (userInfo[0].call_required !== null) {
                    await bot.answerCallbackQuery(msg.id, {})
                    await db.update(msg.from.id, 'status', 'confirmation');
                    await sendOrderConfirmation(msg.from.id)
                } else {
                    bot.answerCallbackQuery(msg.id, {
                        text: locales.get().ERROR.CALL,
                        show_alert: true
                    })
                }
            });
            break;
        case 'call_required':
            await handleCallResponse(msg, true);
            await db.getUserInfo(id, async (userInfo) => {
                await editCallKeyboard(msg, userInfo);
            });
            break;
        case 'call_useless':
            await handleCallResponse(msg, false);
            await db.getUserInfo(id, async (userInfo) => {
                await editCallKeyboard(msg, userInfo);
            });
            break;
        case 'send':
            await db.update(id, 'status', 'wait_manager');
            await db.getUserInfo(id, async (userInfo) => await handleSend(msg, userInfo));
            break;
        case 'confirmation':
            await db.update(msg.from.id, 'status', 'confirmation');
            await db.getUserInfo(id, async (userInfo) => await replaceConfirmation(msg, userInfo));
            break;
        case 'new_order':
            await handleNewOrderResponse(msg);
            break;
        case 'bottles_edit':
            await db.update(msg.from.id, 'bottles_amount', null);
            await db.getUserInfo(id, async (userInfo) => {
                await check(msg, userInfo);
                await replaceConfirmation(msg, userInfo, false);
            });
            await bot.answerCallbackQuery(msg.id, {});
            break;
        case 'address_edit':
            await db.update(msg.from.id, 'address', null);
            await db.getUserInfo(id, async (userInfo) => {
                await check(msg, userInfo);
                await replaceConfirmation(msg, userInfo, false);
            });
            await bot.answerCallbackQuery(msg.id, {})
    }

    if (msg.data.search('_id') !== -1 && !isNaN(parseInt(msg.data))) {
        const userId = parseInt(msg.data.toLowerCase(), 10);

        if (Object.values(config.MANAGERS_ID).includes(msg.from.id)) {
            await db.update(userId, 'status', 'approved');

            await db.getUserInfo(userId, async (userInfo) => {
                await bot.deleteMessage(userId, userInfo[0].confirm_id);
                await sendInvoice(userId);
            });
        }

        await db.getUserInfo(userId, async (userInfo) => {
            if (userInfo[0].status !== 'approved') {
                await bot.answerCallbackQuery(msg.id, {})
                return;
            }
            await bot.editMessageText(`✅\n\n` + helpers.firstConfirmationToString(userInfo[0]), {
                chat_id: msg.from.id,
                message_id: msg.message.message_id,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: []
                },
            })
        });
    }
});

bot.on("contact", async (msg) => {
    const {
        chat: {
            id
        },
        contact: {
            phone_number
        }
    } = msg;

    await db.getUserInfo(id, (result) => langDetection(result));
    await handlePhoneResponse(msg, phone_number);
    await db.getUserInfo(id, (userInfo) => check(msg, userInfo));
    await bot.sendMessage(id, `${locales.get().CONTACT.SUCCESS}`, {
        reply_markup: { remove_keyboard: true }
    })
});

bot.on('message', async (msg) => {
    const {chat: {id}} = msg;

    await db.getUserInfo(id, (result) => langDetection(result));

    const isStaff = !!helpers.getKeyByValue(config.ADMINS_ID, id) || !!helpers.getKeyByValue(config.MANAGERS_ID, id);
    if (config.IS_MAINTENANCE && !isStaff) {
        await bot.sendMessage(id, locales.get().UNDER_MAINTENANCE);
        return;
    }

    await db.getUserInfo(id, async (userInfo) => {
        const isEditable = userInfo[0]?.status === 'bottles_amount' || userInfo[0]?.status === 'confirmation';

        if (userInfo[0] && isEditable && msg.text === '/start') {
            await replaceConfirmation(msg, userInfo);
            return 0;
        }

        if (userInfo[0] && (userInfo[0].status === 'approved')) {
            await handleNewOrderResponse(msg);
        } else if (userInfo[0] && userInfo[0].status === 'address') {
            await handleAddressResponse(msg);
        } else if (userInfo[0] && isEditable) {
            await handleCommentResponse(msg, userInfo);
        } else {
            // await checkIsGreeting(msg, userInfo);
            await db.getUserInfo(id, (userInfo) => check(msg, userInfo));
        }
    })
});


bot.onText(/delete_me/, async (msg) => {
    const {
        chat: {
            id,
            first_name
        }
    } = msg;

    await db.deleteUser(id, first_name);
});

bot.on('polling_error', (err) => console.log(err));


/*bot.on("contact", (msg) => {
    phone_num = msg.contact.phone_number;
    // bot.deleteMessage(msg.from.id, result2.message_id);
    // sss bot.deleteMessage(msg.from.id, msg.message_id);

    bot.sendMessage(msg.from.id, `${locales.get().BOTTLES.QUESTION}`, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: `1 (50 ${locales.get().BOTTLES_PRICE})`,
                        callback_data: 1
                    },
                    {
                        text: `2 (45 ${locales.get().BOTTLES_PRICE})`,
                        callback_data: 2
                    }
                ],
                [
                    {
                        text: `3 (40 ${locales.get().BOTTLES_PRICE})`,
                        callback_data: 3
                    },
                    {
                        text: `4 (35 ${locales.get().BOTTLES_PRICE})`,
                        callback_data: 4
                    }
                ],
                [
                    {
                        text: `5 (30 ${locales.get().BOTTLES_PRICE})`,
                        callback_data: 5
                    }
                ],
            ]
        }
    })
});*/

// function editMessage() {
//     console.log(`${locales.get().LANG_CONSOLE} ${msg.from.first_name} id:${msg.from.id}`);
//     for (;counter === 0;counter++) {
//         console.log(counter);
//         let message = 'edited';
//         bot.editMessageText(STRING_RESPONSE_START, {
//             chat_id: msg.from.id,
//             message_id: result.message_id,
//         });
//         // bot.deleteMessage(msg.from.id, result.message_id);
//     }
// }

/*bot.on('callback_query', (msg) => {
    const fullMessage = msg.message;
    const opts = {
        chat_id: fullMessage.chat.id,
        message_id: fullMessage.message_id,
    };


    if (msg.data.toLowerCase() === 'en') {
        locales.get() = require('./locales.get()/en.js');
        console.log(`${locales.get().LANG_CONSOLE} ${msg.from.first_name} id:${msg.from.id}`);
        bot.editMessageText(STRING_RESPONSE_START, opts);

        language = msg.data.toLowerCase();

        bot.sendMessage(msg.from.id, `${locales.get().LANG_SUCCESS}\n${locales.get().CONTACT_QUESTION}`, {
            reply_markup: JSON.stringify({
                keyboard: [
                    [
                        {
                            text: locales.SEND_CONTACT,
                            request_contact: true,
                            callback_data: 'contact'
                        }
                    ],
                ],
                resize_keyboard: true,
            })
        });
    } else if (msg.data.toLowerCase() === 'ru') {
        locales = require('./locales/ru.js');
        console.log(`${locales.LANG_CONSOLE} ${msg.from.first_name} id:${msg.from.id}`);
        bot.editMessageText(locales.LANG_SUCCESS + locales.CONTACT_QUESTION, opts);

        language = msg.data.toLowerCase();

        bot.sendMessage(msg.from.id, `${locales.LANG_SUCCESS}\n${locales.CONTACT_QUESTION}`, {
            reply_markup: JSON.stringify({
                keyboard: [
                    [
                        {
                            text: locales.SEND_CONTACT,
                            request_contact: true,
                            callback_data: 'contact'
                        }
                    ],
                ],
                resize_keyboard: true,
            })
        });
    } else if (msg.data.toLowerCase() >= 1 && msg.data.toLowerCase() <= 5) {
        bot.editMessageText(STRING_RESPONSE_START, opts);
        bot.sendMessage(msg.from.id, locales.SEND_SUCCESS);

        async function lang() {
            const id = msg.from.id;
            const name = msg.from.first_name;
            const bottles_num = msg.data.toLowerCase();

            await bot.sendMessage(config.ADMIN_ID, `ID: ${id}\nName: ${name}\nNumber of bottles: ${bottles_num}\nPhone number: ${phone_num}\nLang: ${language}\n`);
            await main(id, name, bottles_num, phone_num, language);
        }
        lang();
    }
});*/


