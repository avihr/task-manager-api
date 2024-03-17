import validator from "validator";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import { Task } from "./task.js";

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            unique: true,
            required: true,
            trim: true,
            validate(email) {
                if (!validator.isEmail(email)) throw new Error("Invalid email");
            },
        },
        age: {
            type: Number,
            default: 18,
            validate(value) {
                if (value < 0) throw new Error("Invalid age");
            },
        },
        password: {
            type: String,
            required: true,
            trim: true,
            minLength: 7,
            validate(pwd) {
                if (pwd.includes("password"))
                    throw new Error("Invalid password");
            },
        },
        tokens: [
            {
                token: {
                    type: String,
                    required: true,
                },
            },
        ],
        avatar: {
            type: Buffer,
        },
    },
    { timestamps: true }
);

userSchema.virtual("userTasks", {
    ref: "tasks",
    localField: "_id",
    foreignField: "creator",
});
userSchema.methods.generateAuthToken = async function () {
    try {
        const user = this;
        const token = jsonwebtoken.sign(
            { _id: user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: "1 day" }
        );
        user.tokens = user.tokens.concat({ token });
        await user.save();
        return token;
    } catch (e) {}
};

userSchema.statics.findByCredentials = async (email, pwd) => {
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error("Unable to login");
    }

    const isMatch = await bcrypt.compare(pwd, user.password);
    if (!isMatch) {
        throw new Error("Invalid email or password");
    }
    return user;
};

userSchema.pre("save", async function (next) {
    try {
        const user = this;

        if (user.isModified("password")) {
            user.password = await bcrypt.hash(user.password, 8);
        }
    } catch (e) {}
});

userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
};

userSchema.pre("deleteOne", async function (next) {
    const user = this;
    await Task.deleteMany({ creator: user._conditions._id });
    next();
});

const User = mongoose.model("User", userSchema);

export { User };
