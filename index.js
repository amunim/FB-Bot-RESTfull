const config = require("./config/config.json");

const Bot = require("./Bot").default;
const bot = new Bot();

const fs = require('fs').promises;

const express = require('express')
const app = express();
const cors = require('cors');

const { body, validationResult, header } = require("express-validator");

const port = 3030;


// Configuring body parser middleware
app.use(express.json());
app.use(cors());

app.post("/register-code", [body("code").isNumeric()], async (req, res) => 
{    
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.RegisterCode({
        data: {
            message: req.body.code
        }
    });

    return res.json({ success, error, data: data });
})

app.post("/register", [body("email").isEmail(), body("pass").isStrongPassword(), body("first_name").isString(), body("last_name").isString()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    await bot.setup(config.maxconcurrency);
    const { success, error, data } = await Bot.RegisterAccount({
        data: {
            email: req.body.email, pass: req.body.pass, message: req.body.first_name.trim() + " " + req.body.last_name.trim()
        }
    });

    return res.json({ success, error, data: data });
});

app.get("/current-user", (req, res) => 
{
    const user = Bot.GetCurrentUser();
    if (user) res.json({ success: true, error: "false", data: user });
    else res.status(404).json({ success: false, error: "User not logged in", data: null });
});

app.get("/login-cookie", [body("cookie").isJSON()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    await bot.setup(config.maxconcurrency);
    const { success, error, data } = await Bot.Login({
        data: {
            cookies: JSON.parse(req.body.cookie)
        }
    });

    return res.json({ success, error, data });
});

app.get("/login", [body("email").isEmail(), body("password").isString()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    await bot.setup(config.maxconcurrency);
    const { success, error, data } = await Bot.Login({
        data: {
            email: req.body.email, pass: req.body.password
        }
    });

    return res.json({ success, error, data: data })
});

app.get("/groups", async (req, res) => 
{
    const { success, error, data } = await Bot.ListOfGroups({ data: {} });
    return res.json({ success, error, data });
});

app.get("/home", async (req, res) =>
{
    const { success, error, data } = await Bot.Home({ data: {} });
    res.json({ success, error, data });
});

app.post("/groups/join", [body("url").isURL()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.JoinGroup({ data: { url: req.body.url } });
    return res.json({ success, error, data });
});
app.post("/groups/leave", [body("url").isURL()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.LeaveGroup({ data: { url: req.body.url } });
    return res.json({ success, error, data });
});

app.post("/friend/message", [body("url").isURL(), body("message").isString()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.FriendMessage({ data: { url: req.body.url, message: req.body.message } });
    return res.json({ success, error, data });
});

app.post("/friend/message/open", [body("url").isURL()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.OpenMessageBox({ data: { url: req.body.url } });
    return res.json({ success, error, data });
});

app.post("/groups/invite", [body("url").isURL(), body("friend_name").isString()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.InviteFriendGroup({ data: { url: req.body.url, message: req.body.friend_name } });
    return res.json({ success, error, data });
});

app.post("/groups/enter", [body("url").isURL()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.EnterGroup({ data: { url: req.body.url } });
    return res.json({ success, error, data });
});

app.post("/wall", [body("message").isString()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.PostOnWall({ data: { message: req.body.message } });
    return res.json({ success, error, data });
});

app.post("/page", [body("message").isString(), body("url").isURL()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.PostOnPage({ data: { message: req.body.message, url: req.body.url } });
    return res.json({ success, error, data });
});

app.get("/friend/available", async (req, res) =>
{
    const { success, error, data } = await Bot.GetAllFriendReq({ data: {} });
    return res.json({ success, error, data });
});

app.post("/friend/accept/all", async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.AcceptAllFriendReq({ data: {} });
    return res.json({ success, error, data });
});

app.post("/friend/accept", [body("friend").isURL()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.AcceptReq({ data: { url: req.body.friend } });
    return res.json({ success, error, data });
});

app.get("/group/members", [body("url").isURL()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.GetGroupMembers({ data: { url: req.body.url } });
    return res.json({ success, error, data });
});

app.get("/groups/available", [body("keyword").isString()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.GetAvailableGroups({ data: { message: req.body.keyword } });
    return res.json({ success, error, data });
});

async function main()
{
    await bot.setup(config.maxconcurrency);

    await LoginTest();
    // await ListOfFriendReqTest();
    // await PostOnPage();
    // await PostWall();
    console.log("All done :)");
}

async function LoginTest()
{
    try
    {
        const cookieString = await fs.readFile("./cookies.json");
        const cookies = JSON.parse(cookieString);

        await Bot.Login({
            data: {
                cookies
            }
        });
    }
    catch (e)
    {
        console.log("cookies not Found: ", e);
        const { success, error, data } = await Bot.Login({
            data: {
                email: "email", pass: "pass"
            }
        });

        await fs.writeFile('./cookies.json', JSON.stringify(data, null, 2));
    }
}

async function MessageTest()
{
    const { success, error, data } = await Bot.FriendMessage({
        data: {
            url: "https://www.facebook.com/profile.php?id=100006633826957",
            email: "abdulmunim2002@gmail.com",
            message: "theek yr bs tum sunao, youtube kesa chal raha he tumhara",
        }
    });
}

async function JoinGroupTest()
{
    await Bot.JoinGroup({ data: { url: "https://www.facebook.com/groups/1413627525454761" } });
}

async function LeaveGroupTest()
{
    await Bot.LeaveGroup({ data: { url: "https://www.facebook.com/groups/1413627525454761" } });
}

async function ListOfGroupsTest()
{
    const { success, error, data } = await Bot.ListOfGroups({ data: {} });
    // console.log(JSON.stringify(data, null, 2));
    console.log(data);
}

async function ListOfFriendReqTest()
{
    const { success, error, data } = await Bot.GetAllFriendReq({ data: {} });
    console.log(data);
}

async function PostOnPage()
{
    const { success, error, data } = Bot.PostOnPage({ data: { message: "2nd Post :)", url: "https://www.facebook.com/Amunim-104696308448191" } });
}

async function PostWall()
{
    const { success, error, data } = await Bot.PostOnWall({ data: { message: "bdsaij" } });
}

app.listen(port, () => console.log(`Listening on port:${port}`));
