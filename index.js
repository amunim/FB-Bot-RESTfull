const config = require("./config/config.json");

const Bot = require("./Bot").default;
const bot = new Bot();

const fs = require('fs').promises;

const express = require('express')
const app = express();
const cors = require('cors');

const { body, validationResult, header, query } = require("express-validator");

const port = 3030;


// Configuring body parser middleware
app.use(express.json());
app.use(cors());

app.get("/register-code", [query("code").isNumeric()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.RegisterCode({
        data: {
            message: req.query.code
        }
    });

    return res.json({ success, error, data: data });
})

app.get("/register", [query("email").isEmail(), query("pass").isStrongPassword(), query("first_name").isString(), query("last_name").isString()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    await bot.setup(config.maxconcurrency);
    const { success, error, data } = await Bot.RegisterAccount({
        data: {
            email: req.query.email, pass: req.query.pass, message: req.query.first_name.trim() + " " + req.query.last_name.trim()
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

app.get("/login-cookie", [query("cookie").isJSON(), query("proxy").optional().isURL({ require_port: true, require_protocol: true })], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    await Bot.CloseBrowser({ data: {} });
    await bot.setup(config.maxconcurrency, req.query.proxy);
    const { success, error, data } = await Bot.Login({
        data: {
            cookies: JSON.parse(req.query.cookie)
        }
    });

    return res.json({ success, error, data });
});

app.get("/login", [query("email").isEmail(), query("password").isString(), query("proxy").optional().isURL({ require_port: true, require_protocol: true })], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    await Bot.CloseBrowser({ data: {} });
    await bot.setup(config.maxconcurrency, req.query.proxy);
    const { success, error, data } = await Bot.Login({
        data: {
            email: req.query.email, pass: req.query.password
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

app.get("/groups/join", [query("url").isURL()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.JoinGroup({ data: { url: req.query.url } });
    return res.json({ success, error, data });
});
app.get("/groups/leave", [query("url").isURL()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.LeaveGroup({ data: { url: req.query.url } });
    return res.json({ success, error, data });
});

app.get("/friend/message", [query("url").isURL(), query("message").isString()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.FriendMessage({ data: { url: req.query.url, message: req.query.message } });
    return res.json({ success, error, data });
});

app.get("/friend/message/open", [query("url").isURL()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.OpenMessageBox({ data: { url: req.query.url } });
    return res.json({ success, error, data });
});

app.get("/groups/invite", [query("url").isURL(), query("friend_name").isString()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.InviteFriendGroup({ data: { url: req.query.url, message: req.query.friend_name } });
    return res.json({ success, error, data });
});

app.get("/groups/enter", [query("url").isURL()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.EnterGroup({ data: { url: req.query.url } });
    return res.json({ success, error, data });
});

app.get("/wall", [query("message").isString()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.PostOnWall({ data: { message: req.query.message } });
    return res.json({ success, error, data });
});

app.get("/page", [query("message").isString(), query("url").isURL()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.PostOnPage({ data: { message: req.query.message, url: req.query.url } });
    return res.json({ success, error, data });
});

app.get("/friend/available", async (req, res) =>
{
    const { success, error, data } = await Bot.GetAllFriendReq({ data: {} });
    return res.json({ success, error, data });
});

app.get("/friend/accept/all", async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.AcceptAllFriendReq({ data: {} });
    return res.json({ success, error, data });
});

app.get("/friend/accept", [query("friend").isURL()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.AcceptReq({ data: { url: req.query.friend } });
    return res.json({ success, error, data });
});

app.get("/group/members", [query("url").isURL()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.GetGroupMembers({ data: { url: req.query.url } });
    return res.json({ success, error, data });
});

app.get("/groups/available", [query("keyword").isString()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.GetAvailableGroups({ data: { message: req.query.keyword } });
    return res.json({ success, error, data });
});

app.get("/logout", async (req, res) => 
{
    const { success, error, data } = await Bot.Logout({ data: {} });
    return res.json({ success, error, data });
});

app.get("/close-browser", async (req, res) => 
{
    const { success, error, data } = await Bot.CloseBrowser({ data: {} });
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
