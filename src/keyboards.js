const locales = require("./locales/locales.js");
const variables = require("./variables");
module.exports = {
    adminKeyboard(id) {
        return {
            inline_keyboard: [
                [
                    {
                        text: `${locales.get().BUTTONS.REFRESH} 🔄`,
                        callback_data: `${id}_id`
                    }
                ],
            ]
        }
    },
    managerKeyboard(id) {
        return {
            inline_keyboard: [
                [
                    {
                        text: `${locales.get().BUTTONS.CONFIRM} ✅`,
                        callback_data: `${id}_id`
                    }
                ],
            ]
        }
    },
    newOrder() {
        return {
            keyboard: [
                [
                    {
                        text: locales.get().BUTTONS.NEW_ORDER,
                        callback_data: 'new_order'
                    }
                ],
            ]
        }
    },
    sendKeyboard() {
        return {
            inline_keyboard: [
                [
                    {
                        text: locales.get().BUTTONS.EDIT.BOTTLES,
                        callback_data: 'bottles_edit',
                    }
                ],
                [
                    {
                        text: locales.get().BUTTONS.EDIT.ADDRESS,
                        callback_data: 'address_edit',
                    }
                ],
                [
                    {
                        text: `${locales.get().BUTTONS.SEND}  📤️`,
                        callback_data: 'send',
                    }
                ],
            ]
        }
    },
    mainKeyboard() {
        return {
            keyboard: [
                [
                    {
                        text: locales.get().CONTACT.BTN_TEXT,
                        request_contact: true,
                        callback_data: 'contact'
                    },
                ],
            ],
            resize_keyboard: true,
        }
    },
    additionalGoodsKeyboard(userInfo) {
        const goods = locales.get().ADDITIONAL_GOODS;
        const currency = locales.get().BOTTLES_PRICE;
        return {
            inline_keyboard: [
                [
                    {
                        text: userInfo && userInfo[0].pomp_needed ? `✅️ ${goods.POMP} (${variables.PRICE.POMP} ${currency})`
                            : `${goods.POMP} (${variables.PRICE.POMP} ${currency})`,
                        callback_data: "pomp_needed"
                    },
                ],
                [
                    {
                        text: userInfo && userInfo[0].bottles_needed ? `✅️ ${goods.BOTTLES} (${variables.PRICE.PLASTIC_BOTTLE} ${currency})`
                            : `${goods.BOTTLES} (${variables.PRICE.PLASTIC_BOTTLE} ${currency})`,
                        callback_data: 'bottles_needed'
                    },
                ],
                [
                    {
                        text: `Next ➡️`,
                        callback_data: 'next_additional_goods'
                    }
                ],
            ]
        }
    },
    callKeyboard(userInfo) {
        return {
            inline_keyboard: [
                [
                    {
                        text: (userInfo && userInfo[0].call_required) ? `✅️ ${locales.get().CALL.REQUIRED}`
                            : locales.get().CALL.REQUIRED,
                        callback_data: 'call_required'
                    },
                ],
                [
                    {
                        text: (userInfo && !userInfo[0].call_required) ? `✅️ ${locales.get().CALL.USELESS}`
                            : locales.get().CALL.USELESS,
                        callback_data: 'call_useless'
                    },
                ],
                [
                    {
                        text: `Next ➡️`,
                        callback_data: 'next_call'
                    }
                ],
            ]
        }
    },
    bottleKeyboard(userInfo) {
        const currency = locales.get().BOTTLES_PRICE;

        return {
            inline_keyboard: [
                [
                    {
                        text: (userInfo && userInfo[0].bottles_amount === 1) ? `✅️ 1 (${variables.PRICE.WATER['1b']} ${currency})`
                            : `1 (${variables.PRICE.WATER['1b']} ${currency})`,
                        callback_data: '1b'
                    },
                    {
                        text: (userInfo && userInfo[0].bottles_amount === 2) ? `✅️ 2 (${variables.PRICE.WATER['2b']} ${currency})`
                            : `2 (${variables.PRICE.WATER['2b']} ${currency})`,
                        callback_data: '2b'
                    }
                ],
                [
                    {
                        text: (userInfo && userInfo[0].bottles_amount === 3) ? `✅️ 3 (${variables.PRICE.WATER['3b']} ${currency})`
                            : `3 (${variables.PRICE.WATER['3b']} ${currency})`,
                        callback_data: '3b'
                    },
                    {
                        text: (userInfo && userInfo[0].bottles_amount === 4) ? `✅️ 4 (${variables.PRICE.WATER['3b']} ${currency})`
                            : `4 (${variables.PRICE.WATER['3b']} ${currency})`,
                        callback_data: '4b'
                    }
                ],
                [
                    {
                        text: (userInfo && userInfo[0].bottles_amount === 5) ? `✅️ 5 (${variables.PRICE.WATER['5b']} ${currency})`
                            : `5 (${variables.PRICE.WATER['5b']} ${currency})`,
                        callback_data: '5b'
                    }
                ],
                [
                    {
                        text: `Next ➡️`,
                        callback_data: 'next_bottles'
                    }
                ],
            ]
        }
    },
    languageKeyboard() {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Укра\'їнська',
                            callback_data: 'ua'
                        },
                        {
                            text: 'Русский',
                            callback_data: 'ru'
                        },
                        {
                            text: 'English',
                            callback_data: 'en'
                        }
                    ]
                ]
            }
        }
    },
    phoneKeyboard() {
        return {
            keyboard: [
                [
                    {
                        text: locales.get().CONTACT.BTN_TEXT,
                        request_contact: true,
                        callback_data: 'contact'
                    },
                ],
            ],
            resize_keyboard: true,
        }
    },
}