import Express from "express";
import { Task } from "../models/task.js";
import { auth } from "../middleware/auth.js";

const router = new Express.Router();

router.post("/task", auth, (req, res) => {
    const task = new Task({
        ...req.body,
        creator: req.user._id,
    });

    task.save()
        .then((tsk) => res.status(201).send(tsk))
        .catch((e) => res.status(400).send(e));
});

router.get("/tasks", auth, async (req, res) => {
    try {
        /* const tasks = await Task.find({ creator: req.user._id }).populate(
            "creator"
        ); */
        let tasks;
        const sortObj = {};
        if (req.query.sortBy) {
            const parts = req.query.sortBy.split(":");
            sortObj[parts[0]] = parts[1] === "desc" ? -1 : 1;
        }
        if (req.query.completed) {
            let completed;
            completed = req.query.completed === "true" ? true : false;
            tasks = await Task.find({
                creator: req.user._id,
                completed: completed,
            })
                .limit(parseInt(req.query.limit))
                .skip(parseInt(req.query.skip))
                .sort(sortObj);
        } else {
            tasks = await Task.find({
                creator: req.user._id,
            })
                .limit(parseInt(req.query.limit))
                .skip(parseInt(req.query.skip))
                .sort(sortObj);
        }

        res.send(tasks);
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
});

router.get("/task/:name", auth, async (req, res) => {
    try {
        const respTask = await Task.findOne({
            name: req.params.name,
            creator: req.user._id,
        });
        if (!respTask) res.status(404);
        res.send(respTask);
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
});

router.patch("/task/:name", auth, async (req, res) => {
    const allowedUpdates = ["name", "description", "completed"];
    const updates = Object.keys(req.body);

    if (!updates.every((update) => allowedUpdates.includes(update))) {
        return res.status(400).send({ error: "Invalid updates" });
    }

    try {
        const task = await Task.findOne({
            name: req.params.name,
            creator: req.user._id,
        });

        if (!task) res.status(404).send();

        updates.forEach((update) => (task[update] = req.body[update]));
        const updateResp = await task.save();
        res.send(updateResp);
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
});

router.delete("/task/:name", auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            name: req.params.name,
            creator: req.user._id,
        });
        if (!task) return res.status(404).send({ error: "task not found" });
        res.send(task);
    } catch (e) {
        res.status(500).send(e);
    }
});

export { router };
