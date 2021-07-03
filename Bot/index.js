"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
const puppeteer_extra_1 = require("puppeteer-extra");
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const ghost_cursor_1 = require("ghost-cursor");
const selectors_json_1 = __importDefault(require("./selectors/selectors.json"));
const install_mouse_helper_1 = require("./extensions/install-mouse-helper");
const config_json_1 = __importDefault(require("./config.json"));
class Bot {
    constructor() {
        this.puppeteer = puppeteer_extra_1.addExtra(puppeteer_1.default);
        this.puppeteer.use(puppeteer_extra_plugin_stealth_1.default());
    }
    async setup(maxConcurrency, proxy = "") {
        //     this.cluster = await Cluster.launch({
        //         puppeteer: this.puppeteer,
        //         maxConcurrency,
        //         concurrency: Cluster.CONCURRENCY_BROWSER,
        //         timeout: 2147483647,
        //         puppeteerOptions: {
        //             headless: false
        //         }
        //     });
        //     this.cluster.on('taskerror', (err, data) =>
        //     {
        //         console.error("\x1b[31m%s\x1b[0m", `Error crawling ${data}: ${err.message}`);
        //     });
        Bot.browser = await this.puppeteer.launch({
            headless: config_json_1.default.headless,
            args: [
                '--no-sandbox',
                `--proxy-server=${proxy}`
            ]
        });
        const context = Bot.browser.defaultBrowserContext();
        context.overridePermissions("https://www.facebook.com", ["geolocation", "notifications"]);
        Bot.page = await Bot.browser.newPage();
    }
    static GetCurrentUser() {
        try {
            return this.accounts.keys().next().value;
        }
        catch (_a) {
            return "";
        }
    }
    static async WaitRandom(page, waitTime) {
        await page.waitForTimeout(waitTime + Math.random() * 1000);
    }
    static async autoScrollGroups(page) {
        await this.WaitRandom(page, 2000);
        let container = await page.$(selectors_json_1.default.listOfGroups);
        let el = await (container === null || container === void 0 ? void 0 : container.$$("a"));
        let oldLength = el.length;
        await page.$eval(selectors_json_1.default.listOfGroupsScroller, (e) => e.scrollTop = Number.MAX_SAFE_INTEGER);
        if (oldLength == 4)
            return [];
        await new Promise(async (resolve, reject) => {
            var timer = setInterval(async () => {
                // await Bot.mouseSquareMove(page);
                await page.$eval(selectors_json_1.default.listOfGroupsScroller2, (e) => e.scrollTop = Number.MAX_SAFE_INTEGER);
                container = await page.$(selectors_json_1.default.listOfGroups2);
                await this.WaitRandom(page, 3000);
                el = await (container === null || container === void 0 ? void 0 : container.$$("a"));
                if (el.length <= oldLength) {
                    clearInterval(timer);
                    resolve();
                }
                oldLength = el.length;
            }, 3000);
        });
        let groups = [];
        for (let i = 4; i < el.length; i++) {
            let inner = await page.evaluate((e) => e.innerText, el[i]);
            let href = await page.evaluate((e) => e.href, el[i]);
            groups.push({ group: inner.split("\n")[0], url: href });
        }
        return groups;
    }
    static async autoScrollFriendReq(page) {
        var _a, _b;
        const requests = [];
        if (await page.$(selectors_json_1.default.friendsReqGrid) || await page.$("div[class='sxpk6l6v'] > div:last-child")) {
            let length = await page.$eval("div[class='sxpk6l6v'] > div:last-child", (e) => e.children.length);
            if (length == 0)
                return requests;
            await new Promise(async (resolve) => {
                var timer = setInterval(async () => {
                    //scroll to the bottom
                    await page.$eval(selectors_json_1.default.friendReqGridScroller2, (e) => e.scrollTop = Number.MAX_SAFE_INTEGER);
                    await page.$eval(selectors_json_1.default.friendReqGridScroller, (e) => e.scrollTop = Number.MAX_SAFE_INTEGER);
                    await Bot.WaitRandom(page, 3000);
                    try {
                        await page.waitForSelector(`div[class='sxpk6l6v'] > div:last-child > div:nth-child(${length + 1})`, { timeout: 3000 });
                    }
                    catch (_) { }
                    //get the number of items
                    // let len = await page.$eval(selectors.friendsReqGrid, (e) => e.children.length);
                    let len = await page.$eval("div[class='sxpk6l6v'] > div:last-child", (e) => e.children.length);
                    if (len <= length) {
                        clearInterval(timer);
                        resolve();
                        return;
                    }
                    length = len;
                }, 5000);
            });
            for (let i = 0; i < length; i++) {
                //get all the names of the requests
                // const selector = `${selectors.friendsReqGrid} > div:nth-child(${i + 1}) > div > a`;
                const selector = `div[class='sxpk6l6v'] > div:last-child > div:nth-child(${i + 1}) > div > a`;
                const url = await page.evaluate((sel) => document.querySelector(sel).href, selector);
                const textContent = await page.evaluate((sel) => document.querySelector(sel).textContent, selector);
                let name = (_a = textContent.match(/\b[A-Z].*?\b/g)) === null || _a === void 0 ? void 0 : _a.join(" ");
                if (!name)
                    name = "Unknown Language";
                requests.push({ name, url });
            }
        }
        else {
            try {
                let length = await page.$eval(selectors_json_1.default.friendRequestsWall, (e) => e.querySelectorAll("a[role='link']").length);
                if (length == 1)
                    return requests;
                const container = await page.$(selectors_json_1.default.friendRequestsWall);
                const reqs = await (container === null || container === void 0 ? void 0 : container.$$("a[role='link']"));
                if (!reqs)
                    return requests;
                for (let i = 1; i < reqs.length; i++) {
                    const element = reqs[i];
                    const url = await element.evaluate((x) => x.href);
                    const textContent = await element.evaluate((x) => x.textContent);
                    let name = (_b = textContent.match(/\b[A-Z].*?\b/g)) === null || _b === void 0 ? void 0 : _b.join(" ");
                    if (!name)
                        name = "Unknown Language";
                    requests.push({ name, url });
                }
            }
            catch (_) {
            }
        }
        return requests;
    }
    static async autoScrollMembers(page) {
        let members = await page.evaluate(async (s) => {
            try {
                let oldLength, newLength = 0;
                let x = (document.querySelectorAll(s))[1];
                do {
                    oldLength = x === null || x === void 0 ? void 0 : x.children.length;
                    if (document.scrollingElement)
                        document.scrollingElement.scrollTop = Number.MAX_SAFE_INTEGER;
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    newLength = x === null || x === void 0 ? void 0 : x.children.length;
                } while (newLength > oldLength);
                return newLength;
            }
            catch (_a) {
                return 0;
            }
        }, selectors_json_1.default.membersContainer);
        return members;
    }
    static async autoScrollFeed(page) {
        let groups = await page.evaluate(async (s) => {
            try {
                let oldLength, newLength = 0;
                let x = document.querySelector(s);
                do {
                    oldLength = x === null || x === void 0 ? void 0 : x.children.length;
                    if (document.scrollingElement)
                        document.scrollingElement.scrollTop = Number.MAX_SAFE_INTEGER;
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    newLength = x === null || x === void 0 ? void 0 : x.children.length;
                    if (newLength >= 50)
                        break;
                } while (newLength > oldLength);
                return newLength;
            }
            catch (_a) {
                return 0;
            }
        }, selectors_json_1.default.groupsFeed);
        return groups;
    }
    static async mouseSquareMove(page) {
        await page.mouse.move(0, 0);
        await page.mouse.move(0, 100);
        await page.mouse.move(100, 100);
        await page.mouse.move(100, 0);
        await page.mouse.move(0, 0);
    }
}
exports.default = Bot;
Bot.accounts = new Map();
Bot.loggedIn = false;
Bot.RegisterCode = async ({ page = Bot.page, data: { message, callback } }) => {
    if (!message) {
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, error: "Please enter a valid code" });
        return { success: false, error: "Please enter a valid code" };
    }
    try {
        await page.waitForSelector(selectors_json_1.default.fbCode);
        const cursor = ghost_cursor_1.createCursor(page);
        await cursor.click(selectors_json_1.default.fbCode);
        await page.keyboard.type(message, { delay: 270 });
        await Bot.WaitRandom(page, 1500);
        await cursor.click(selectors_json_1.default.continueCode);
        await Bot.WaitRandom(page, 3000);
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, data: (await page.cookies()) });
        return { success: false, data: (await page.cookies()) };
    }
    catch (error) {
        console.log(error);
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, error });
        return { success: false, error };
    }
};
Bot.RegisterAccount = async ({ page = Bot.page, data: { email, pass, message, callback } }) => {
    if (!message) {
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, error: "Please give first name and last name in 'message'" });
        return { success: false, error: "Please give first name and last name in 'message'" };
    }
    try {
        await page.goto("https://en-gb.facebook.com/");
        const cursor = ghost_cursor_1.createCursor(page);
        await cursor.click(selectors_json_1.default.createNewAccount);
        await page.waitForSelector(selectors_json_1.default.firstName);
        await Bot.WaitRandom(page, 1500);
        await cursor.click(selectors_json_1.default.firstName);
        await Bot.WaitRandom(page, 200);
        await page.keyboard.type(message.split(" ")[0], { delay: 350 });
        await Bot.WaitRandom(page, 1000);
        await cursor.click(selectors_json_1.default.lastName);
        await Bot.WaitRandom(page, 200);
        await page.keyboard.type(message.split(" ")[1], { delay: 250 });
        await Bot.WaitRandom(page, 1000);
        await cursor.click(selectors_json_1.default.emailOrPhone);
        await Bot.WaitRandom(page, 200);
        await page.keyboard.type(email, { delay: 300 });
        await Bot.WaitRandom(page, 1000);
        await Bot.WaitRandom(page, 1000);
        if (await page.$(selectors_json_1.default.reEnterEmail)) {
            await cursor.click(selectors_json_1.default.reEnterEmail);
            await Bot.WaitRandom(page, 200);
            await page.keyboard.type(email, { delay: 320 });
            await Bot.WaitRandom(page, 1000);
        }
        await cursor.click(selectors_json_1.default.newPassword);
        await Bot.WaitRandom(page, 200);
        await page.keyboard.type(pass, { delay: 280 });
        await Bot.WaitRandom(page, 1000);
        await page.select(selectors_json_1.default.day, (Math.floor(Math.random() * 29 + 1)).toString());
        await Bot.WaitRandom(page, 1000);
        await page.select(selectors_json_1.default.month, (Math.floor(Math.random() * 12)).toString());
        await Bot.WaitRandom(page, 1000);
        await page.select(selectors_json_1.default.year, (Math.floor(Math.random() * 10 + 1990)).toString());
        await Bot.WaitRandom(page, 1000);
        const genders = await page.$$(selectors_json_1.default.sex);
        genders[Math.round(Math.random())].click();
        await Bot.WaitRandom(page, 1000);
        await cursor.click(selectors_json_1.default.signUp);
        await Bot.WaitRandom(page, 4000);
        Bot.accounts[email] = (await page.cookies());
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, data: (await page.cookies()) });
        return { success: false, data: (await page.cookies()) };
    }
    catch (error) {
        console.log(error);
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, error });
        return { success: false, error };
    }
};
Bot.JoinGroup = async ({ page = Bot.page, data: { url, email, callback } }) => {
    try {
        await page.goto(url);
        await page.waitForSelector(selectors_json_1.default.joinGroup);
        await Bot.WaitRandom(page, 1000);
        const cursor = ghost_cursor_1.createCursor(page);
        const el = (await page.$$("div[role='button']"))[13];
        await el.click();
        await Bot.WaitRandom(page, 3000);
        try {
            await page.waitForSelector(selectors_json_1.default.cancelAnswers, { timeout: 10 * 1000 });
            await cursor.click(selectors_json_1.default.cancelAnswers);
            await page.waitForSelector(selectors_json_1.default.exitAnswers);
            await Bot.WaitRandom(page, 1000);
            await cursor.click(selectors_json_1.default.exitAnswers);
        }
        catch (_a) {
        }
        callback === null || callback === void 0 ? void 0 : callback.call({ success: true, data: (await page.cookies()) });
        return { success: true, data: (await page.cookies()) };
    }
    catch (error) {
        console.log(error);
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, error });
        return { success: false, error };
    }
};
Bot.LeaveGroup = async ({ page = Bot.page, data: { url, email, callback } }) => {
    // if (Bot.accounts.has(email!))
    // {
    //     // await Bot.Login({ page, data: { cookies: Bot.accounts[email!] } });
    //     await page.setCookie(Bot.accounts[email!]);
    // }
    // else
    // {
    //     if (callback)
    //         callback?.call({ success: false, error: "Account is not Logged in" });
    //     return;
    // }
    try {
        await page.goto(url);
        await page.waitForSelector(selectors_json_1.default.more);
        await Bot.WaitRandom(page, 1000);
        const cursor = ghost_cursor_1.createCursor(page);
        await cursor.click(selectors_json_1.default.more);
        await page.waitForSelector(selectors_json_1.default.leaveGroup);
        await Bot.WaitRandom(page, 2000);
        await cursor.click(selectors_json_1.default.leaveGroup);
        await page.waitForSelector(selectors_json_1.default.confirmLeaveGroup);
        await Bot.WaitRandom(page, 2000);
        await cursor.click(selectors_json_1.default.confirmLeaveGroup);
        await Bot.WaitRandom(page, 3000);
        callback === null || callback === void 0 ? void 0 : callback.call({ success: true, data: (await page.cookies()) });
        return { success: true, data: (await page.cookies()) };
    }
    catch (error) {
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, error });
        return { success: false, error };
    }
};
Bot.OpenMessageBox = async ({ page = Bot.page, data: { url, email, callback } }) => {
    // if (Bot.accounts.has(email!))
    // {
    //     // await Bot.Login({ page, data: { cookies: Bot.accounts[email!] } });
    //     await page.setCookie(Bot.accounts[email!]);
    // }
    // else
    // {
    //     if (callback)
    //         callback?.call({ success: false, error: "Account is not Logged in" });
    //     return;
    // }
    try {
        await page.goto(url);
        await page.waitForSelector(selectors_json_1.default.profileMessage);
        const cursor = ghost_cursor_1.createCursor(page);
        await Bot.WaitRandom(page, 1000);
        await cursor.click(selectors_json_1.default.profileMessage);
        await page.waitForSelector(selectors_json_1.default.messageInputBox);
        callback === null || callback === void 0 ? void 0 : callback.call({ success: true, data: (await page.cookies()) });
        return { success: true, data: (await page.cookies()) };
    }
    catch (error) {
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, error });
        return { success: false, error };
    }
};
Bot.FriendMessage = async ({ page = Bot.page, data: { url, email, message, callback } }) => {
    // if (Bot.accounts.has(email!))
    // {
    //     // await Bot.Login({ page, data: { cookies: Bot.accounts[email!] } });
    //     await page.setCookie(Bot.accounts[email!]);
    // }
    // else
    // {
    //     if (callback)
    //         callback?.call({ success: false, error: "Account is not Logged in" });
    //     return;
    // }
    try {
        await Bot.OpenMessageBox({ page, data: { url, email } });
        const cursor = ghost_cursor_1.createCursor(page);
        await Bot.WaitRandom(page, 1500);
        await cursor.click(selectors_json_1.default.messageInputBox);
        await page.keyboard.type(message, { delay: 350 });
        await page.keyboard.press(String.fromCharCode(13));
        callback === null || callback === void 0 ? void 0 : callback.call({ success: true, data: (await page.cookies()) });
        return { success: true, data: (await page.cookies()) };
    }
    catch (error) {
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, error });
        return { success: false, error };
    }
};
//returns cookies after logging in
Bot.Login = async ({ page = Bot.page, data: { email, pass, cookies, message, callback } }) => {
    try {
        if (cookies) {
            await page.setCookie(...cookies);
            await page.goto("https://facebook.com/");
        }
        else {
            await page.goto("https://en-gb.facebook.com/");
            await page.waitForSelector(selectors_json_1.default.email);
            const cursor = ghost_cursor_1.createCursor(page);
            await install_mouse_helper_1.installMouseHelper(page);
            await cursor.click(selectors_json_1.default.email);
            await page.keyboard.type(email, { delay: 350 });
            await Bot.WaitRandom(page, 1000);
            await cursor.click(selectors_json_1.default.password);
            await page.keyboard.type(pass, { delay: 350 });
            await Bot.WaitRandom(page, 1000);
            await cursor.move(selectors_json_1.default.login);
            await cursor.click(selectors_json_1.default.login);
        }
        await page.waitForSelector(selectors_json_1.default.search);
        Bot.accounts[email] = await page.cookies();
        Bot.loggedIn = true;
        callback === null || callback === void 0 ? void 0 : callback.call({ success: true, data: await page.cookies() });
        return { success: true, data: await page.cookies() };
    }
    catch (error) {
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, error });
        return { success: false, error };
    }
};
Bot.Home = async ({ page = Bot.page, data: { callback } }) => {
    try {
        await page.goto("https://facebook.com/");
        await Bot.WaitRandom(page, 1200);
        callback === null || callback === void 0 ? void 0 : callback.call({ success: true, data: (await page.cookies()) });
        return { success: true, data: (await page.cookies()) };
    }
    catch (error) {
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, error });
        return { success: false, error };
    }
};
Bot.Logout = async ({ page = Bot.page, data: { callback } }) => {
    if (!Bot.loggedIn) {
        callback === null || callback === void 0 ? void 0 : callback.call({ success: true, error: null, data: null });
        return { success: true, error: null, data: null };
    }
    try {
        await page.goto("https://facebook.com");
        const cursor = ghost_cursor_1.createCursor(page);
        await cursor.click(selectors_json_1.default.account);
        await Bot.WaitRandom(page, 1000);
        await page.waitForSelector(selectors_json_1.default.logout);
        await Bot.WaitRandom(page, 1000);
        await cursor.click(selectors_json_1.default.logout);
        await page.close();
        await Bot.browser.close();
        Bot.loggedIn = false;
        callback === null || callback === void 0 ? void 0 : callback.call({ success: true, data: (await page.cookies()) });
        return { success: true, data: (await page.cookies()) };
    }
    catch (error) {
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, error: error });
        return { success: false, error: error };
    }
};
Bot.CloseBrowser = async ({ page = Bot.page, data: { callback } }) => {
    try {
        if (Bot.browser)
            await Bot.browser.close();
        callback === null || callback === void 0 ? void 0 : callback.call({ success: true, error: null, data: null });
        return { success: true, error: null, data: null };
    }
    catch (e) {
        callback === null || callback === void 0 ? void 0 : callback.call({ success: true, error: e, data: null });
        return { success: true, error: null, data: null };
    }
};
Bot.ListOfGroups = async ({ page = Bot.page, data: { callback } }) => {
    try {
        await page.goto("https://www.facebook.com/groups/feed/");
        await page.waitForSelector(selectors_json_1.default.search);
        const el = await Bot.autoScrollGroups(page);
        if (!el)
            return { success: true };
        callback === null || callback === void 0 ? void 0 : callback.call({ success: true, data: el });
        return { success: true, data: el };
    }
    catch (error) {
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, error });
        return { success: false, error };
    }
};
Bot.AcceptReq = async ({ page = Bot.page, data: { url, callback } }) => {
    try {
        await page.goto(url);
        await page.waitForSelector(selectors_json_1.default.friendRespond);
        await Bot.WaitRandom(page, 1000);
        const cursor = ghost_cursor_1.createCursor(page);
        await cursor.click(selectors_json_1.default.friendRespond);
        await Bot.WaitRandom(page, 1000);
        await cursor.click(selectors_json_1.default.friendRespond);
        await Bot.WaitRandom(page, 1000);
        callback === null || callback === void 0 ? void 0 : callback.call({ success: true, data: (await page.cookies()) });
        return { success: true, data: (await page.cookies()) };
    }
    catch (error) {
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, error });
        return { success: false, error };
    }
};
Bot.GetAllFriendReq = async ({ page = Bot.page, data: { callback } }) => {
    try {
        await page.goto("https://www.facebook.com/friends/requests");
        await page.waitForSelector(selectors_json_1.default.search);
        let error;
        let reqs = [];
        try {
            reqs = await Bot.autoScrollFriendReq(page);
        }
        catch (e) {
            error = e;
            console.log(e);
        }
        callback === null || callback === void 0 ? void 0 : callback.call({ success: true, error, data: reqs });
        return { success: true, error, data: reqs };
    }
    catch (error) {
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, error });
        return { success: false, error };
    }
};
Bot.AcceptAllFriendReq = async ({ page = Bot.page, data: { callback } }) => {
    try {
        const { data } = await Bot.GetAllFriendReq({ data: { callback: undefined } }) || {};
        const cursor = ghost_cursor_1.createCursor(page);
        if (!data)
            return { success: true, data: page.cookies() };
        for (let i = 0; i < data.length; i++) {
            try {
                const selector = `${selectors_json_1.default.friendsReqGrid} > div:nth-child(${i + 1}) > div > a > div[aria-label='Confirm']`;
                await page.$eval(selector, (el) => el.scrollIntoView({ block: "end", behavior: "smooth" }));
                cursor.click(selector);
            }
            catch (_a) {
                const selector = selectors_json_1.default.friendReqConfirm;
                await page.$$eval(selector, (el, x) => el[x].scrollIntoView({ block: "end", behavior: "smooth" }), i);
                cursor.click((await page.$$(selector))[i]);
            }
        }
        callback === null || callback === void 0 ? void 0 : callback.call({ success: true, data: (await page.cookies()) });
        return { success: true, data: (await page.cookies()) };
    }
    catch (error) {
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, error });
        return { success: false, error };
    }
};
Bot.PostOnPage = async ({ page = Bot.page, data: { message, url, callback } }) => {
    try {
        await page.goto(url);
        await page.waitForSelector(selectors_json_1.default.pageCreatePost);
        await page.$eval(selectors_json_1.default.pageCreatePost, (e) => e.scrollIntoView({ behavior: "smooth", block: "end" }));
        await Bot.WaitRandom(page, 1000);
        const cursor = ghost_cursor_1.createCursor(page);
        await cursor.click(selectors_json_1.default.pageCreatePost);
        await page.waitForSelector(selectors_json_1.default.pagePostInput);
        await Bot.WaitRandom(page, 1000);
        await cursor.click(selectors_json_1.default.pagePostInput);
        await page.keyboard.type(message, { delay: 350 });
        await Bot.WaitRandom(page, 1000);
        await cursor.click(selectors_json_1.default.pagePostSubmit);
        await Bot.WaitRandom(page, 3000);
        callback === null || callback === void 0 ? void 0 : callback.call({ success: true, data: (await page.cookies()) });
        return { success: true, data: (await page.cookies()) };
    }
    catch (error) {
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, error });
        return { success: false, error };
    }
};
Bot.PostOnWall = async ({ page = Bot.page, data: { message, callback } }) => {
    try {
        await page.goto("https://facebook.com/");
        await page.waitForSelector(selectors_json_1.default.postWall);
        await page.$eval(selectors_json_1.default.postWall, (e) => e.scrollIntoView({ behavior: "smooth", block: "end" }));
        await Bot.WaitRandom(page, 1000);
        const cursor = ghost_cursor_1.createCursor(page);
        await cursor.click(selectors_json_1.default.postWall);
        await page.waitForSelector(selectors_json_1.default.postWallInput);
        await Bot.WaitRandom(page, 1000);
        await cursor.click(selectors_json_1.default.postWallInput);
        await page.keyboard.type(message, { delay: 350 });
        await Bot.WaitRandom(page, 1000);
        await cursor.click(selectors_json_1.default.pagePostSubmit);
        await Bot.WaitRandom(page, 3000);
        callback === null || callback === void 0 ? void 0 : callback.call({ success: true, data: (await page.cookies()) });
        return { success: true, data: (await page.cookies()) };
    }
    catch (error) {
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, error });
        return { success: false, error };
    }
};
Bot.InviteFriendGroup = async ({ page = Bot.page, data: { url, message, callback } }) => {
    try {
        await page.setViewport({ width: 523, height: 674 });
        await page.goto(url);
        await page.waitForSelector(selectors_json_1.default.inviteFriendGroup);
        const cursor = ghost_cursor_1.createCursor(page);
        const inv = await page.$(selectors_json_1.default.inviteFriendGroup);
        // await cursor.click(selectors.inviteFriendGroup);
        inv === null || inv === void 0 ? void 0 : inv.click();
        await page.waitForSelector(selectors_json_1.default.searchFriendInvite);
        await Bot.WaitRandom(page, 1500);
        await cursor.click(selectors_json_1.default.searchFriendInvite);
        await page.keyboard.type(message, { delay: 350 });
        await Bot.WaitRandom(page, 3000);
        const el = page.$(selectors_json_1.default.searchResultFriendInvite);
        if (!el) {
            callback === null || callback === void 0 ? void 0 : callback.call({ success: false, error: "Friend not found" });
            return { success: false, error: "Friend not found" };
        }
        await cursor.click(selectors_json_1.default.searchResultFriendInvite);
        await Bot.WaitRandom(page, 1200);
        await cursor.click(selectors_json_1.default.sendFriendInvite);
        callback === null || callback === void 0 ? void 0 : callback.call({ success: true, data: (await page.cookies()) });
        return { success: true, data: (await page.cookies()) };
    }
    catch (error) {
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, error });
        return { success: false, error };
    }
};
Bot.EnterGroup = async ({ page = Bot.page, data: { url, callback } }) => {
    try {
        await page.goto(url);
        await page.waitForSelector(selectors_json_1.default.search);
        callback === null || callback === void 0 ? void 0 : callback.call({ success: true, data: (await page.cookies()) });
        return { success: true, data: (await page.cookies()) };
    }
    catch (error) {
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, error });
        return { success: false, error };
    }
};
Bot.GetGroupMembers = async ({ page = Bot.page, data: { url, callback } }) => {
    try {
        await page.goto(url);
        await page.waitForSelector(selectors_json_1.default.membersButton);
        await Bot.WaitRandom(page, 3000);
        const cursor = ghost_cursor_1.createCursor(page);
        // await cursor.click(selectors.membersButton);
        const but = await page.$$(selectors_json_1.default.membersButton);
        await cursor.click(but[9]);
        await Bot.WaitRandom(page, 2500);
        let length = await Bot.autoScrollMembers(page);
        const members = [];
        for (let i = 0; i < length; i++) {
            const el = (await page.$$(selectors_json_1.default.membersContainer))[1];
            //get all the names of the requests
            // const selector = `${selectors.membersContainer} > div:nth-child(${i + 1})`;
            // const url: string = await page.evaluate((sel) => ((document.querySelector(sel)).querySelectorAll("a")[1]).href, selector);
            // const name: string = await page.evaluate((sel) => ((document.querySelector(sel)).querySelectorAll("a")[1]).textContent, selector);
            const selector = `div:nth-child(${i + 1})`;
            const url = await el.evaluate((e, sel) => (e.children[sel].querySelectorAll("a")[1]).href, i);
            const name = await el.evaluate((e, sel) => (e.children[sel].querySelectorAll("a")[1]).textContent, i);
            members.push({ name, url });
        }
        callback === null || callback === void 0 ? void 0 : callback.call({ success: true, data: members });
        return { success: true, data: members };
    }
    catch (error) {
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, error });
        return { success: false, error };
    }
};
Bot.GetAvailableGroups = async ({ page = Bot.page, data: { message, callback } }) => {
    try {
        await page.goto(`https://www.facebook.com/search/groups/?q=${message}`);
        await page.waitForSelector(selectors_json_1.default.search);
        await Bot.WaitRandom(page, 5000);
        const length = await Bot.autoScrollFeed(page);
        const groups = [];
        for (let i = 0; i < length; i++) {
            try {
                let selector = `${selectors_json_1.default.groupsFeed} > div:nth-child(${i + 1})`;
                const el = await page.$(selector);
                const href = await (el === null || el === void 0 ? void 0 : el.evaluate((e) => (e.querySelectorAll("a")[1]).href));
                const name = await (el === null || el === void 0 ? void 0 : el.evaluate((e) => (e.querySelectorAll("a")[1]).textContent));
                groups.push({ name: name, url: href });
            }
            catch (_a) { }
        }
        callback === null || callback === void 0 ? void 0 : callback.call({ success: true, data: groups });
        return { success: true, data: groups };
    }
    catch (error) {
        callback === null || callback === void 0 ? void 0 : callback.call({ success: false, error });
        return { success: false, error };
    }
};
//# sourceMappingURL=index.js.map