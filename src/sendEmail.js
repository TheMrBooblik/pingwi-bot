const nodemailer = require('nodemailer');
const config = require ('./config');

function sendEmail(ID, NAME, BOTTLES_NUM, PHONE_NUMBER, LANG) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.GMAIL_LOGIN,
            pass: config.GMAIL_PASS
        }
    });

    const mailOptions = {
        from: config.GMAIL_LOGIN,
        to: config.MANAGER_GMAIL_LOGIN,
        subject: config.SUBJECT_GMAIL,
        text: 'Test'
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
                reject(error)
            } else {
                console.log('Email sent: ' + info.response);
                resolve('250');
            }
        });
    })

    /*



    let insert = "INSERT INTO users(id, name, bottles_num, phone, lang, is_call_needed, reg_date) VALUES (" +
        connection.escape(ID) + "," + connection.escape(NAME) + "," + connection.escape(BOTTLES_NUM) + "," +
        connection.escape(PHONE_NUMBER) + "," + connection.escape(LANG) + "," + connection.escape(false)
        + "," + "CURRENT_TIMESTAMP)";

    await connection.query(insert, (err, result) => {
        console.log(err);
        console.log(result);
    });

    connection.end();*/
}

module.exports.sendEmail = sendEmail;