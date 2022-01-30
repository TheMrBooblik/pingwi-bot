const mysql = require('mysql2');
const config = require('./config');

const pool = mysql.createPool({
    host: config.MYSQL_HOST,
    user: config.MYSQL_USER,
    database: config.MYSQL_DATABASE,
    password: config.MYSQL_PASS
});

module.exports = {
    getUserInfo(id, callback) {
        let query = "SELECT * FROM " + config.MYSQL_TABLE + " WHERE user_id =" + id;

        pool.query(query, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                callback(result);
            }
        });
    },
    createField(value) {
        const query = "INSERT INTO " + config.MYSQL_TABLE + " (user_id, join_date) VALUES (" +
            pool.escape(value) + ", NOW())";

        pool.query(query, (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("  id = " + value + " successfully added");
            }
        });
    },
    update(id, column, value) {
        const query = "UPDATE " + config.MYSQL_TABLE + " SET " + column + " = " + pool.escape(value) + " WHERE user_id = " + id;

        return new Promise((resolve, reject) => {
            pool.query(query, (err) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    console.log("  " + column + " = '" + value + "' added to DB");
                    resolve();
                }
            });
        })
    },
    setDate(id, column) {
        const query = "UPDATE " + config.MYSQL_TABLE + " SET " + column + " = NOW() WHERE user_id = " + id;

        return new Promise((resolve, reject) => {
            pool.query(query, (err) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    console.log("  " + column + " added to DB");
                    resolve();
                }
            });
        })
    },
    deleteUser(id, firstName) {
        const query = "DELETE FROM " + config.MYSQL_TABLE + " WHERE user_id =" + id;

        return new Promise((resolve, reject) => {
            pool.query(query, (err) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    console.log("  " + firstName + " " + id + " deleted from DB");
                    resolve();
                }
            });
        })
    },
}