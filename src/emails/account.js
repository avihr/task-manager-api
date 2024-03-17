import { MailtrapClient } from "mailtrap";
const TOKEN = process.env.MAILTRAP_API_KEY;

const SENDER_EMAIL = "mailtrap@demomailtrap.com";

const client = new MailtrapClient({ token: TOKEN });

const sender = { name: "demo", email: SENDER_EMAIL };

const sendWelcomeEmail = (email, name) => {
    client
        .send({
            from: sender,
            to: [{ email: email }],
            subject: "Thanks for joining in",
            text: `Welcome to the app, ${name}.`,
        })
        .catch(console.error);
};

const sendFarewellEmail = (email, name) => {
    client
        .send({
            from: sender,
            to: [{ email: email }],
            subject: "We are sad to see you leaving.",
            text: `We are sorry to see you going, ${name}. Let us know what could be improved.`,
        })
        .catch(console.error);
};

export { sendWelcomeEmail, sendFarewellEmail };
