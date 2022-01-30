let locales = require('./ru.js');

const get = () => {
    return {
        STRING_RESPONSE_START: "Якою мовою бажаєш спілкуватися?\n" +
            "На каком языке ты хочешь общаться?\n" +
            "In what language do you want to communicate?",
        ...locales,
    }
}

const setSource = (str) => {
    locales = require(str);
}

module.exports = { get, setSource };