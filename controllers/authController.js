const User = require("../models/prismaClient").user;
const Profile = require("../models/prismaClient").profile;
const passport = require("passport");
const genPassword = require("../utils/genPassword");

const getStatus = (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ isAuthenticated: true, user: req.user });
    } else {
        res.json({ isAuthenticated: false });
    };
};

const postSignup = async (req, res, next) => {
    try {
        const {username, email, password, confirmPassword} = req.body;

        const existingUser = await User.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ message: "Username or email already in use" });
        };

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match." });
        };

        const newUser = await User.create({
            data: {
                username: username,
                email: email,
                password: genPassword(password),
                profile: {
                    create: {}
                }
            },
            include: {
                profile: true
            }
        });

        req.login(newUser, err => {
            if (err) {
                return next(err);
            }
            
            return res.status(200).json({
                message: "Signup successful",
                user: newUser
            });
        });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error." });
    }
};

const postLogin = (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);

        if (!user) {
            return res.status(401).json({ message: "Invalid username or password" });
        };

        req.logIn(user, (err) => {
            if (err) return next(err);
            return res.json({ message: "Logged in successfully", user});
        });
    })(req, res, next);
};

const logout = (req, res, next) => {
    req.logout(err => {
        if (err) {
            return next(err);
        }

        res.status(200).json({ message: "Logged out successfully" });
    });
};

module.exports = {
    getStatus,
    postSignup,
    postLogin,
    logout
}