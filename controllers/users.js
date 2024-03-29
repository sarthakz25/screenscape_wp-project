const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_DATABASE = process.env.DB_DATABASE;
const DB_PORT = process.env.DB_PORT;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const JWT_COOKIE_EXPIRES = process.env.JWT_COOKIE_EXPIRES;

const db = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    port: DB_PORT
});

exports.login = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).render("login",
                {
                    msg: "please enter your email and password",
                    msg_type: "error"
                }
            );
        }

        db.query(
            "select * from users where user_email = ?",
            [email],
            async (error, result) => {
                console.log(result);
                if (result.length <= 0) {
                    return res.status(401).render("login",
                        {
                            msg: "email or password incorrect",
                            msg_type: "error"
                        }
                    );
                }
                else {
                    if (!(await bcrypt.compare(password, result[0].user_password))) {
                        return res.status(401).render("login",
                            {
                                msg: "email or password incorrect",
                                msg_type: "error"
                            }
                        );
                    }
                    else {
                        const id = result[0].user_id;
                        const token = jwt.sign(
                            { id: id },
                            JWT_SECRET,
                            {
                                expiresIn: JWT_EXPIRES_IN
                            }
                        );
                        console.log("the token is " + token);
                        const cookieOptions = {
                            expires: new Date(
                                Date.now() + JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                            ),
                            httpOnly: true,
                        };
                        res.cookie("joes", token, cookieOptions);
                        res.status(200).redirect("/home");
                    }
                }
            }
        );
    }
    catch (error) {
        console.log(error);
    }
};

exports.register = (req, res) => {
    console.log(req.body);
    // const name = req.body.username;
    // const email = req.body.email;
    // const password = req.body.password;
    const {
        username,
        email,
        password,
        confirm_password
    } = req.body;
    // console.log(username);
    // console.log(email);
    // console.log(password);
    // res.send("form submitted");
    db.query(
        "select user_email from users where user_email = ?",
        [email],
        async (error, result) => {
            if (error) {
                confirm.log(error);
            }
            if (result.length > 0) {
                return res.render("register",
                    {
                        msg: "email id already taken",
                        msg_type: "error"
                    }
                );
            }
            else if (password !== confirm_password) {
                return res.render("register",
                    {
                        msg: "passwords do not match",
                        msg_type: "error"
                    }
                );
            }
            let hashedPassword = await bcrypt.hash(password, 8);
            console.log(hashedPassword);

            db.query("insert into users set ?",
                {
                    user_name: username,
                    user_email: email,
                    user_password: hashedPassword
                },
                (error, result) => {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        console.log(result);
                        return res.render("register",
                            {
                                msg: "user registration success",
                                msg_type: "good"
                            }
                        );
                    }
                }
            );
        }
    );
};

exports.isLoggedIn = async (req, res, next) => {
    // req.name = "check login";
    // console.log(req.cookies);
    if (req.cookies.joes) {
        try {
            const decode = await promisify(jwt.verify)(
                req.cookies.joes,
                JWT_SECRET
            );
            // console.log(decode);
            db.query("select * from users where user_id = ?",
                [decode.id],
                (error, result) => {
                    // console.log(result);
                    if (!result) {
                        return next();
                    }
                    req.user = result[0];
                    return next();
                }
            );
        }
        catch (error) {
            console.log(error);
            return next();
        }
    }
    else {
        next();
    }
}

exports.logout = async (req, res) => {
    res.cookie("joes", "logout", {
        expires: new Date(Date.now() + 2 * 1000),
        httpOnly: true,
    });
    res.status(200).redirect("/");
}