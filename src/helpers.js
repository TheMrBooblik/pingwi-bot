const moment = require("moment");
const fs = require('fs');
const locales = require("./locales/locales");
const variables = require("./variables");

module.exports = {

    logBotStarted() {
        console.log('  Bot has been started...\n  ');
    },

    logCommandStart(id, first_name) {
        console.log(`\n /start       ${first_name} id:${id}`);
    },

    saveToLogFile(msg, userInfo) {
        if (userInfo[0]) {
            const dataLine = `${this.timeConverter(msg.date)} ${userInfo[0].name} (${msg.from.id})     ${msg.text}\n`;
            fs.appendFile('./messageLog.txt', dataLine, (err) => {
                if (err) return console.log(err);
            });
        }
    },

    timeConverter(UNIX_timestamp) {
        const a = new Date(UNIX_timestamp * 1000);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const year = a.getFullYear();
        const month = months[a.getMonth()];
        const date = a.getDate();
        const hour = a.getHours();
        const min = a.getMinutes();
        return hour + ':' + min + ' ' + date + ' ' + month + ' ' + year;
    },

    getKeyByValue(object, value) {
        return Object.keys(object).find(key => object[key] === value);
    },

    sumValues(obj) {
        return Object.values(obj).reduce((a, b) => Number(a) + Number(b));
    },

    getPrices(bottleAmount, bottlesNeeded, pompNeeded) {
        return {
            water: this.getBottlePrice(bottleAmount) * bottleAmount,
            bottles: bottlesNeeded ? variables.PRICE.PLASTIC_BOTTLE * bottleAmount : 0,
            pomp: pompNeeded ? variables.PRICE.POMP : 0,
        }
    },

    getBottlePrice(bottleAmount) {
        for (let item of Object.keys(variables.PRICE.WATER)) {
            if (bottleAmount >= parseInt(item)) {
                return parseInt(variables.PRICE.WATER[item]);
            }
        }
    },

    firstConfirmationToString({bottles_amount, bottles_needed, pomp_needed, address, comment, phone, call_required}) {
        const prices = this.getPrices(bottles_amount, bottles_needed, pomp_needed);
        const totalPrice = this.sumValues(prices);

        return (bottles_needed ? `${locales.get().ADDITIONAL_GOODS.BOTTLES}:  ${bottles_amount} ${this.addCurrency(prices.bottles)}\n` : '') +
            `${locales.get().BOTTLES_AMOUNT}:  ${bottles_amount} ${this.addCurrency(prices.water)}\n` +
            (pomp_needed ? `${locales.get().ADDITIONAL_GOODS.POMP}:  1 ${this.addCurrency(prices.pomp)}\n` : '') +
            `*${locales.get().TOTAL_PRICE}*:  ${totalPrice} ${locales.get().CURRENCY}\n` +
            `\n` +
            (phone ? `*${locales.get().CONTACT.PHONE}*:  ${phone}\n` : ``) +
            `*${locales.get().CALL.ME}*: ${call_required ? '+' : '-'}\n` +
            '\n' +
            `*${locales.get().ADDRESS}*:  ${address}\n` +
            `*${locales.get().COMMENT}*:  ${comment ? comment : '-'}\n\n`
    },

    getUserOrderText(userInfo, withDate) {
        return `*${locales.get().STATUS_TITLE}*:  ${locales.get().STATUS[userInfo[0]?.status.toUpperCase()]}\n` +
            (withDate ? this.getDate(userInfo[0].last_order) : '') +
            `\n` +
            this.firstConfirmationToString(userInfo[0])
    },

    addCurrency(price) {
        return ` (${price} ${locales.get().CURRENCY})`
    },

    getDate(date) {
        return `*${locales.get().LAST_ORDER_DATE}*:\n` +
        `${moment(date).format('DD.MM.YYYY HH:mm')}\n`;
    }
};