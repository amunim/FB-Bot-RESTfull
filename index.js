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

app.get("/register-code", [query("code").isNumeric(), query("email").isEmail()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    if (!Bot.accounts.hasOwnProperty(req.query.email))
    {
        return res.json({ success: false, error: "account not present in registry please check email" });
    }

    const { success, error, data } = await Bot.cluster.execute({ message: req.query.code, email: req.query.email }, Bot.RegisterCode);

    //  = await Bot.RegisterCode({
    //     data: {
    //         message: req.query.code
    //     }
    // });

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
    const user = Bot.GetCurrentUsers();
    if (user) res.json({ success: true, error: "false", data: user });
    else res.status(404).json({ success: false, error: "User not logged in", data: null });
});

app.get("/login-cookie", [query("cookie").isJSON(), query("email").isEmail(), query("proxy").optional()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.cluster.execute({
        cookies: JSON.parse(req.query.cookie),
        email: req.query.email
    }, Bot.Login);

    return res.json({ success, error, data });
});

app.get("/login", [query("email").isEmail(), query("password").isString(), query("proxy").optional()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    const { success, error, data } = await Bot.cluster.execute({
        email: req.query.email, pass: req.query.password
    }, Bot.Login);

    return res.json({ success, error, data: data })
});

app.get("/groups", [query("email").isEmail()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    if (!Bot.accounts.hasOwnProperty(req.query.email))
    {
        return res.json({ success: false, error: "account not present in registry please check email" });
    }

    const { success, error, data } = await Bot.cluster.execute({ email: req.query.email }, Bot.ListOfGroups);
    return res.json({ success, error, data });
});

app.get("/home", [query("email").isEmail()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    if (!Bot.accounts.hasOwnProperty(req.query.email))
    {
        return res.json({ success: false, error: "account not present in registry please check email" });
    }

    const { success, error, data } = await Bot.cluster.execute({ email: req.query.email }, Bot.Home);
    return res.json({ success, error, data });
});

app.get("/groups/join", [query("url").isURL(), query("email").isEmail()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    if (!Bot.accounts.hasOwnProperty(req.query.email))
    {
        return res.json({ success: false, error: "account not present in registry please check email" });
    }

    const { success, error, data } = await Bot.cluster.execute({ url: req.query.url, email: req.query.email }, Bot.JoinGroup);
    return res.json({ success, error, data });
});
app.get("/groups/leave", [query("url").isURL(), query("email").isEmail()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    if (!Bot.accounts.hasOwnProperty(req.query.email))
    {
        return res.json({ success: false, error: "account not present in registry please check email" });
    }

    const { success, error, data } = await Bot.cluster.execute({ url: req.query.url, email: req.query.email }, Bot.LeaveGroup);
    return res.json({ success, error, data });
});

app.get("/friend/message", [query("url").isURL(), query("message").isString(), query("email").isEmail()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    if (!Bot.accounts.hasOwnProperty(req.query.email))
    {
        return res.json({ success: false, error: "account not present in registry please check email" });
    }

    const { success, error, data } = await Bot.cluster.execute({ url: req.query.url, message: req.query.message, email: req.query.email }, Bot.FriendMessage);
    return res.json({ success, error, data });
});

app.get("/friend/message/open", [query("url").isURL(), query("email").isEmail()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    if (!Bot.accounts.hasOwnProperty(req.query.email))
    {
        return res.json({ success: false, error: "account not present in registry please check email" });
    }

    const { success, error, data } = await Bot.cluster.execute({ url: req.query.url, email: req.query.email }, Bot.OpenMessageBox);
    return res.json({ success, error, data });
});

app.get("/groups/invite", [query("url").isURL(), query("friend_name").isString(), query("email").isEmail()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    if (!Bot.accounts.hasOwnProperty(req.query.email))
    {
        return res.json({ success: false, error: "account not present in registry please check email" });
    }
    const { success, error, data } = await Bot.cluster.execute({ url: req.query.url, message: req.query.friend_name, email: req.query.email }, Bot.InviteFriendGroup);
    return res.json({ success, error, data });
});

app.get("/groups/enter", [query("url").isURL(), query("email").isEmail()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    if (!Bot.accounts.hasOwnProperty(req.query.email))
    {
        return res.json({ success: false, error: "account not present in registry please check email" });
    }
    const { success, error, data } = await Bot.cluster.execute({ url: req.query.url, email: req.query.email }, Bot.EnterGroup);
    return res.json({ success, error, data });
});

app.get("/wall", [query("message").isString(), query("email").isEmail()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    if (!Bot.accounts.hasOwnProperty(req.query.email))
    {
        return res.json({ success: false, error: "account not present in registry please check email" });
    }
    const { success, error, data } = await Bot.cluster.execute({ message: req.query.message, email: req.query.email }, Bot.PostOnWall);
    return res.json({ success, error, data });
});

app.get("/page", [query("message").isString(), query("url").isURL(), query("email").isEmail()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    if (!Bot.accounts.hasOwnProperty(req.query.email))
    {
        return res.json({ success: false, error: "account not present in registry please check email" });
    }
    const { success, error, data } = await Bot.cluster.execute({ message: req.query.message, url: req.query.url, email: req.query.email }, Bot.PostOnPage);
    return res.json({ success, error, data });
});

app.get("/friend/available", [query("email").isEmail()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }
    const { success, error, data } = await Bot.cluster.execute({ email: req.query.email }, Bot.GetAllFriendReq);
    return res.json({ success, error, data });
});

app.get("/friend/accept/all", [query("email").isEmail()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    if (!Bot.accounts.hasOwnProperty(req.query.email))
    {
        return res.json({ success: false, error: "account not present in registry please check email" });
    }
    const { success, error, data } = await Bot.cluster.execute({ email: req.query.email }, Bot.AcceptAllFriendReq);
    return res.json({ success, error, data });
});

app.get("/friend/accept", [query("friend").isURL(), query("email").isEmail()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    if (!Bot.accounts.hasOwnProperty(req.query.email))
    {
        return res.json({ success: false, error: "account not present in registry please check email" });
    }

    const { success, error, data } = await Bot.cluster.execute({ url: req.query.friend, email: req.query.email }, Bot.AcceptFriendReq);
    return res.json({ success, error, data });
});

app.get("/group/members", [query("url").isURL(), query("email").isEmail()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    if (!Bot.accounts.hasOwnProperty(req.query.email))
    {
        return res.json({ success: false, error: "account not present in registry please check email" });
    }
    const { success, error, data } = await Bot.cluster.execute({ url: req.query.url, email: req.query.email }, Bot.GetGroupMembers);
    return res.json({ success, error, data });
});

app.get("/groups/available", [query("keyword").isString(), query("email").isEmail()], async (req, res) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }

    if (!Bot.accounts.hasOwnProperty(req.query.email))
    {
        return res.json({ success: false, error: "account not present in registry please check email" });
    }
    const { success, error, data } = await Bot.cluster.execute({ message: req.query.keyword, email: req.query.email }, Bot.GetAvailableGroups);
    return res.json({ success, error, data });
});

app.get("/logout", [query("email").isEmail()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }
    if (!Bot.accounts.hasOwnProperty(req.query.email))
    {
        return res.json({ success: false, error: "account not present in registry please check email" });
    }
    const { success, error, data } = await Bot.cluster.execute({ email: req.query.email }, Bot.Logout);
    return res.json({ success, error, data });
});

app.get("/close-browser", [query("email").isEmail()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }
    if (!Bot.accounts.hasOwnProperty(req.query.email))
    {
        return res.json({ success: false, error: "account not present in registry please check email" });
    }
    const { success, error, data } = await Bot.cluster.execute({ email: req.query.email }, Bot.CloseBrowser);
    return res.json({ success, error, data });
});

app.get("/profile-url", [query("email").isEmail()], async (req, res) => 
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ error: errors.array(), success: false, data: null });
    }
    if (!Bot.accounts.hasOwnProperty(req.query.email))
    {
        return res.json({ success: false, error: "account not present in registry please check email" });
    }
    const { success, error, data } = await Bot.cluster.execute({ email: req.query.email }, Bot.GetProfileURL);
    return res.json({ success, error, data });
});

// async function main()
// {
//     await bot.setup(config.maxconcurrency);

//     await LoginTest();
//     // await ListOfFriendReqTest();
//     // await PostOnPage();
//     // await PostWall();
//     console.log("All done :)");
// }

// async function LoginTest()
// {
//     try
//     {
//         const cookieString = await fs.readFile("./cookies.json");
//         const cookies = JSON.parse(cookieString);

//         await Bot.Login({
//             data: {
//                 cookies
//             }
//         });
//     }
//     catch (e)
//     {
//         console.log("cookies not Found: ", e);
//         const { success, error, data } = await Bot.Login({
//             data: {
//                 email: "email", pass: "pass"
//             }
//         });

//         await fs.writeFile('./cookies.json', JSON.stringify(data, null, 2));
//     }
// }

// async function MessageTest()
// {
//     const { success, error, data } = await Bot.FriendMessage({
//         data: {
//             url: "https://www.facebook.com/profile.php?id=100006633826957",
//             email: "abdulmunim2002@gmail.com",
//             message: "theek yr bs tum sunao, youtube kesa chal raha he tumhara",
//         }
//     });
// }

// async function JoinGroupTest()
// {
//     await Bot.JoinGroup({ data: { url: "https://www.facebook.com/groups/1413627525454761" } });
// }

// async function LeaveGroupTest()
// {
//     await Bot.LeaveGroup({ data: { url: "https://www.facebook.com/groups/1413627525454761" } });
// }

// async function ListOfGroupsTest()
// {
//     const { success, error, data } = await Bot.ListOfGroups({ data: {} });
//     // console.log(JSON.stringify(data, null, 2));
//     console.log(data);
// }

// async function ListOfFriendReqTest()
// {
//     const { success, error, data } = await Bot.GetAllFriendReq({ data: {} });
//     console.log(data);
// }

// async function PostOnPage()
// {
//     const { success, error, data } = Bot.PostOnPage({ data: { message: "2nd Post :)", url: "https://www.facebook.com/Amunim-104696308448191" } });
// }

// async function PostWall()
// {
//     const { success, error, data } = await Bot.PostOnWall({ data: { message: "bdsaij" } });
// }

async function Start()
{
    await bot.setup(config.maxconcurrency);
}

Start().then(() => app.listen(port, () => console.log(`Listening on port:${port}`)));
