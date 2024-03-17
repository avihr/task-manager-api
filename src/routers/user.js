import { Router } from "express";
import { User } from "../models/user.js";
import { auth } from "../middleware/auth.js";
import multer from "multer";
import sharp from "sharp";
import { sendWelcomeEmail, sendFarewellEmail } from "../emails/account.js";

const router = new Router();

router.post("/users/signup", async (req, res) => {
    const user = new User(req.body);
    const token = await user.generateAuthToken();
    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        res.set("auth-token", token);
        res.status(201).send(user);
    } catch (e) {
        res.status(400).send(e);
    }
});

router.post("/users/login", async (req, res) => {
    try {
        const user = await User.findByCredentials(
            req.body.email,
            req.body.password
        );

        const token = await user.generateAuthToken();
        res.set("auth-token", token);
        res.send(user);
    } catch (error) {
        console.log(error);
        res.status(400).send();
    }
});

router.get("/users/me", auth, async (req, res) => {
    res.send(req.user);
});

router.patch("/users/me", auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["name", "email", "age", "password"];

    if (!updates.every((update) => allowedUpdates.includes(update)))
        return res.status(400).send({ error: "Invalid update" });

    try {
        updates.forEach((update) => (req.user[update] = req.body[update]));
        await req.user.save();
        res.send(req.user);
    } catch (e) {
        res.status(500).send(e);
    }
});

router.delete("/users/me", auth, async (req, res) => {
    try {
        await req.user.deleteOne();
        sendFarewellEmail(req.user.email, req.user.name);
        res.send(req.user);
    } catch (e) {
        res.status(500).send(e);
    }
});

router.post("/users/logout", auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        await req.user.save();
        res.send({ message: "logged out successfully" });
    } catch (error) {
        res.status(500).send();
    }
});

router.post("/users/logoutAll", auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send({ message: "logged out of all devices" });
    } catch (error) {
        res.status(500).send();
    }
});

const upload = multer({
    limits: {
        fileSize: 1000000,
    },
    fileFilter(req, file, callback) {
        if (!file.originalname.match(".(jpg|jpeg|png)$"))
            return callback(
                new Error(
                    "Invalid file type. Please upload .jpg, .jpeg or .png files only"
                )
            );
        callback(undefined, true);
    },
});

router.post(
    "/users/me/avatar",
    auth,
    upload.single("avatar"),
    async (req, res) => {
        try {
            const buffer = await sharp(req.file.buffer)
                .png()
                .resize({ width: 250, height: 250 })
                .toBuffer();
            req.user.avatar = buffer;
            await req.user.save();
            res.status(200).send({ message: "file uploaded successfully" });
        } catch (e) {
            console.log(e);
        }
    },
    (error, req, res, next) => {
        res.status(400).send({ error: error.message });
    }
);

router.delete("/users/me/avatar", auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.status(200).send({ message: "image deleted" });
});

router.get("/users/:name/avatar", async (req, res) => {
    try {
        const user = await User.find({ name: req.params.name });
        if (!user || user.avatar) {
            throw new Error();
        }

        res.set("Content-Type", "image/png");
        res.send(user.avatar);
    } catch (error) {
        res.status(404);
    }
});

export { router };
