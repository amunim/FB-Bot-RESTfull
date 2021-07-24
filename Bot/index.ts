import vanillaPuppeteer, { Browser, Cookie, ElementHandle, Page } from "puppeteer";

import { addExtra, PuppeteerExtra } from "puppeteer-extra";
import Stealth from "puppeteer-extra-plugin-stealth";
import Anonymize from "puppeteer-extra-plugin-anonymize-ua";

import { Cluster } from "puppeteer-cluster";

import useProxy from "puppeteer-page-proxy";

import { createCursor } from "ghost-cursor";
import selectors from "./selectors/selectors.json";

import { installMouseHelper } from "./extensions/install-mouse-helper";
import config from "./config.json";
import { User } from "./user";
export type Callback = (data?: ReturnData) => Promise<void>;
export interface IData 
{
    cookies?: Cookie[],
    url?: string,
    email?: string,
    pass?: string,
    message?: string,
    proxy?: string,
    callback?: Callback,
}
export interface ReturnData
{
    success: boolean,
    error?: string | Error,
    data?: any
}

export default class Bot
{
    // private static page: Page;
    public static accounts: { [key: string]: User } = {};
    // private static browser: Browser;
    private static puppeteer: PuppeteerExtra;
    public static cluster: Cluster;

    private static loggedIn: boolean = false;

    constructor()
    {
        Bot.puppeteer = addExtra(vanillaPuppeteer);
        Bot.puppeteer.use(Stealth());
        // this.puppeteer.use(Anonymize());
    }

    public async setup(maxConcurrency: number)
    {
        Bot.cluster = await Cluster.launch({
            puppeteer: Bot.puppeteer,
            maxConcurrency,
            concurrency: Cluster.CONCURRENCY_BROWSER,
            timeout: 2147483647,
            puppeteerOptions: {
                headless: config.headless,
                args:
                    [
                        '--no-sandbox'
                    ]
            }
        });

        Bot.cluster.on('taskerror', (err, data) =>
        {
            console.error("\x1b[31m%s\x1b[0m", `Error crawling ${data}: ${err.message}`);
        });

        // Bot.browser = await this.puppeteer.launch(
        //     {
        //         headless: config.headless,
        //         args:
        //             [
        //                 '--no-sandbox',
        //                 `--proxy-server=${proxy}`
        //             ]
        //     }
        // );
    }

    public static RegisterCode = async ({ page, data: { email, message, callback } }: { page: Page, data: IData }) =>
    {
        if (!message)
        {
            callback?.call({ success: false, error: "Please enter a valid code" });
            return { success: false, error: "Please enter a valid code" };
        }

        try
        {
            const context = page.browser().defaultBrowserContext();
            context.overridePermissions("https://www.facebook.com", ["geolocation", "notifications"]);
            useProxy(page, Bot.accounts[email!].Proxy || "");

            await page.setCookie(...Bot.accounts[email!].Cookies);
            await page.goto(Bot.accounts[email!].RegisterUrl);

            await page.waitForSelector(selectors.fbCode);

            const cursor = createCursor(page);
            await cursor.click(selectors.fbCode);
            await page.keyboard.type(message!, { delay: 270 });

            await Bot.WaitRandom(page, 1500);

            await cursor.click(selectors.continueCode);

            await Bot.WaitRandom(page, 3000);

            Bot.accounts[email!].RegisterUrl = "";

            callback?.call({ success: false, data: (await page.cookies()) });
            return { success: false, data: (await page.cookies()) };
        }
        catch (error)
        {
            console.log(error);

            callback?.call({ success: false, error: error });
            return { success: false, error: error };
        }
    }

    public static RegisterAccount = async ({ page, data: { email, pass, message, proxy, callback } }: { page: Page, data: IData }) => 
    {
        if (!message)
        {
            callback?.call({ success: false, error: "Please give first name and last name in 'message'" });
            return { success: false, error: "Please give first name and last name in 'message'" };
        }

        try
        {
            useProxy(page, proxy!);
            const context = page.browser().defaultBrowserContext();
            context.overridePermissions("https://www.facebook.com", ["geolocation", "notifications"]);

            await page.goto("https://en-gb.facebook.com/");
            const cursor = createCursor(page);

            await cursor.click(selectors.createNewAccount);

            await page.waitForSelector(selectors.firstName);
            await Bot.WaitRandom(page, 1500);

            await cursor.click(selectors.firstName);
            await Bot.WaitRandom(page, 200);
            await page.keyboard.type(message.split(" ")[0], { delay: 350 });
            await Bot.WaitRandom(page, 1000);

            await cursor.click(selectors.lastName);
            await Bot.WaitRandom(page, 200);
            await page.keyboard.type(message.split(" ")[1], { delay: 250 });
            await Bot.WaitRandom(page, 1000);

            await cursor.click(selectors.emailOrPhone);
            await Bot.WaitRandom(page, 200);
            await page.keyboard.type(email!, { delay: 300 });
            await Bot.WaitRandom(page, 1000);

            await Bot.WaitRandom(page, 1000);

            if (await page.$(selectors.reEnterEmail))
            {
                await cursor.click(selectors.reEnterEmail);
                await Bot.WaitRandom(page, 200);
                await page.keyboard.type(email!, { delay: 320 });
                await Bot.WaitRandom(page, 1000);
            }

            await cursor.click(selectors.newPassword);
            await Bot.WaitRandom(page, 200);
            await page.keyboard.type(pass!, { delay: 280 });
            await Bot.WaitRandom(page, 1000);

            await page.select(selectors.day, (Math.floor(Math.random() * 29 + 1)).toString());
            await Bot.WaitRandom(page, 1000);
            await page.select(selectors.month, (Math.floor(Math.random() * 12)).toString());
            await Bot.WaitRandom(page, 1000);
            await page.select(selectors.year, (Math.floor(Math.random() * 10 + 1990)).toString())
            await Bot.WaitRandom(page, 1000);

            const genders = await page.$$(selectors.sex);
            genders[Math.round(Math.random())].click();

            await Bot.WaitRandom(page, 1000);
            await cursor.click(selectors.signUp);

            await Bot.WaitRandom(page, 4000);

            Bot.accounts[email!] = new User(await page.cookies(), await page.url(), proxy);

            callback?.call({ success: false, data: (await page.cookies()) });
            return { success: false, data: (await page.cookies()) };
        }
        catch (error)
        {
            console.log(error);

            callback?.call({ success: false, error: error });
            return { success: false, error: error };
        }
    }

    public static JoinGroup = async ({ page, data: { url, email, callback } }: { page: Page, data: IData }) =>
    {
        try
        {
            useProxy(page, Bot.accounts[email!].Proxy || "");
            await page.setCookie(...Bot.accounts[email!].Cookies);
            await page.goto(url!);
            await page.waitForSelector(selectors.joinGroup);
            await Bot.WaitRandom(page, 1000);

            const cursor = createCursor(page);
            const el = (await page.$$("div[role='button']"))[13];
            await el.click();

            await Bot.WaitRandom(page, 3000);

            try
            {
                await page.waitForSelector(selectors.cancelAnswers, { timeout: 10 * 1000 });

                await cursor.click(selectors.cancelAnswers);
                await page.waitForSelector(selectors.exitAnswers);
                await Bot.WaitRandom(page, 1000);
                await cursor.click(selectors.exitAnswers);
            }
            catch
            {

            }

            callback?.call({ success: true, data: (await page.cookies()) });
            return { success: true, data: (await page.cookies()) };
        }
        catch (error)
        {
            console.log(error);

            callback?.call({ success: false, error: error });
            return { success: false, error: error };
        }
    }

    public static LeaveGroup = async ({ page, data: { url, email, callback } }: { page: Page, data: IData }) =>
    {
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

        try
        {
            useProxy(page, Bot.accounts[email!].Proxy || "");
            await page.setCookie(...Bot.accounts[email!].Cookies);
            await page.goto(url!);
            await page.waitForSelector(selectors.more);
            await Bot.WaitRandom(page, 1000);
            const cursor = createCursor(page);

            await cursor.click(selectors.more);

            await page.waitForSelector(selectors.leaveGroup);
            await Bot.WaitRandom(page, 2000);
            await cursor.click(selectors.leaveGroup);

            await page.waitForSelector(selectors.confirmLeaveGroup);
            await Bot.WaitRandom(page, 2000);
            await cursor.click(selectors.confirmLeaveGroup);

            await Bot.WaitRandom(page, 3000);

            callback?.call({ success: true, data: (await page.cookies()) });
            return { success: true, data: (await page.cookies()) };
        }
        catch (error)
        {
            callback?.call({ success: false, error: error });
            return { success: false, error: error };
        }
    }

    public static OpenMessageBox = async ({ page, data: { url, email, callback } }: { page: Page, data: IData }) => 
    {
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

        try
        {
            useProxy(page, Bot.accounts[email!].Proxy || "");
            await page.setCookie(...Bot.accounts[email!].Cookies);
            await page.goto(url!);
            await page.waitForSelector(selectors.profileMessage);

            const cursor = createCursor(page);

            await Bot.WaitRandom(page, 1000);

            await cursor.click(selectors.profileMessage);
            await page.waitForSelector(selectors.messageInputBox);

            callback?.call({ success: true, data: (await page.cookies()) });
            return { success: true, data: (await page.cookies()) };
        }
        catch (error)
        {

            callback?.call({ success: false, error: error });
            return { success: false, error: error };
        }
    }

    public static FriendMessage = async ({ page, data: { url, email, message, callback } }: { page: Page, data: IData }) => 
    {
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

        try
        {
            useProxy(page, Bot.accounts[email!].Proxy || "");
            await page.setCookie(...Bot.accounts[email!].Cookies);
            await Bot.OpenMessageBox({ page, data: { url, email } });

            const cursor = createCursor(page);

            await Bot.WaitRandom(page, 1500);

            await cursor.click(selectors.messageInputBox);
            await page.keyboard.type(message!, { delay: 350 });
            await page.keyboard.press(String.fromCharCode(13));

            callback?.call({ success: true, data: (await page.cookies()) });

            return { success: true, data: (await page.cookies()) };
        }
        catch (error)
        {

            callback?.call({ success: false, error: error });
            return { success: false, error: error };
        }
    }

    //returns cookies after logging in
    public static Login = async ({ page, data: { email, pass, cookies, proxy, message, callback } }: { page: Page, data: IData }) =>
    {
        try
        {
            const context = page.browser().defaultBrowserContext();
            context.overridePermissions("https://www.facebook.com", ["geolocation", "notifications"]);
            useProxy(page, proxy || "");

            if (cookies)
            {
                await page.setCookie(...cookies);
                await page.goto("https://facebook.com/");
            }
            else
            {
                await page.goto("https://en-gb.facebook.com/");
                await page.waitForSelector(selectors.email);
                const cursor = createCursor(page);
                await installMouseHelper(page);

                await cursor.click(selectors.email);
                await page.keyboard.type(email!, { delay: 350 });
                await Bot.WaitRandom(page, 1000);

                await cursor.click(selectors.password);
                await page.keyboard.type(pass!, { delay: 350 });
                await Bot.WaitRandom(page, 1000);

                await cursor.move(selectors.login);
                await cursor.click(selectors.login);

            }
            await page.waitForSelector(selectors.search);

            Bot.accounts[email!] = new User(await page.cookies(), undefined, proxy || "");

            callback?.call({ success: true, data: await page.cookies() });

            return { success: true, data: await page.cookies() };
        }
        catch (error)
        {
            callback?.call({ success: false, error: error });
            return { success: false, error: error };
        }
    }

    public static Home = async ({ page, data: { email, callback } }: { page: Page, data: IData }) => 
    {
        try
        {
            useProxy(page, Bot.accounts[email!].Proxy || "");
            await page.setCookie(...Bot.accounts[email!].Cookies);
            await page.goto("https://facebook.com/");
            await Bot.WaitRandom(page, 1200);

            callback?.call({ success: true, data: (await page.cookies()) });
            return { success: true, data: (await page.cookies()) };
        } catch (error)
        {

            callback?.call({ success: false, error: error });
            return { success: false, error: error };
        }
    }

    public static GetProfileURL = async ({ page, data: { email, callback } }: { page: Page, data: IData }) => 
    {
        try
        {
            useProxy(page, Bot.accounts[email!].Proxy || "");
            await page.setCookie(...Bot.accounts[email!].Cookies);
            await page.goto("https://facebook.com/bookmarks");
            await Bot.WaitRandom(page, 5000);

            const url = await page.evaluate(() => (<HTMLAnchorElement>(document.querySelectorAll("a[role='link']"))[26]).href);

            callback?.call({ success: true, data: url });
            return { success: true, data: url };
        }
        catch (error)
        {

            callback?.call({ success: false, error: error });
            return { success: false, error: error };
        }
    }

    public static Logout = async ({ page, data: { email, callback } }: { page: Page, data: IData }) => 
    {
        if (!Bot.accounts.hasOwnProperty(email!))
        {
            callback?.call({ success: true, error: null, data: null });
            return { success: true, error: null, data: null };
        }

        try
        {
            useProxy(page, Bot.accounts[email!].Proxy || "");
            await page.setCookie(...Bot.accounts[email!].Cookies);
            await page.goto("https://facebook.com");
            const cursor = createCursor(page);
            await cursor.click(selectors.account);

            await Bot.WaitRandom(page, 1000);

            await page.waitForSelector(selectors.logout);

            await Bot.WaitRandom(page, 1000);

            await cursor.click(selectors.logout);

            await page.close();
            // Bot.loggedIn = false;
            delete Bot.accounts[email!];

            callback?.call({ success: true, data: (await page.cookies()) });

            return { success: true, data: (await page.cookies()) };
        }
        catch (error)
        {

            callback?.call({ success: false, error: error });
            return { success: false, error: error };
        }
    }

    public static CloseBrowser = async ({ page, data: { callback } }: { page: Page, data: IData }) =>
    {
        try
        {
            // if (Bot.browser)
            //     await Bot.browser.close();

            callback?.call({ success: true, error: null, data: null });
            return { success: true, error: null, data: null };
        }
        catch (e)
        {
            callback?.call({ success: true, error: e, data: null });
            return { success: true, error: null, data: null };
        }
    }

    public static ListOfGroups = async ({ page, data: { email, callback } }: { page: Page, data: IData }) =>
    {
        try
        {
            useProxy(page, Bot.accounts[email!].Proxy || "");
            await page.setCookie(...Bot.accounts[email!].Cookies);

            await page.goto("https://www.facebook.com/groups/feed/");
            await page.waitForSelector(selectors.search);

            const el = await Bot.autoScrollGroups(page);

            if (!el) return { success: true };

            callback?.call({ success: true, data: el });


            return { success: true, data: el };
        } catch (error)
        {

            callback?.call({ success: false, error: error });
            return { success: false, error: error };
        }
    }

    public static AcceptReq = async ({ page, data: { email, url, callback } }: { page: Page, data: IData }) => 
    {
        try
        {
            useProxy(page, Bot.accounts[email!].Proxy || "");
            await page.setCookie(...(Bot.accounts[email!].Cookies));
            await page.goto(url!);
            await page.waitForSelector(selectors.friendRespond);

            await Bot.WaitRandom(page, 1000);

            const cursor = createCursor(page);
            await cursor.click(selectors.friendRespond);

            await Bot.WaitRandom(page, 1000);

            await cursor.click(selectors.friendRespond);
            await Bot.WaitRandom(page, 1000);

            callback?.call({ success: true, data: (await page.cookies()) });

            return { success: true, data: (await page.cookies()) };
        } catch (error)
        {

            callback?.call({ success: false, error: error });
            return { success: false, error: error };
        }
    }

    public static GetAllFriendReq = async ({ page, data: { email, callback } }: { page: Page, data: IData }) =>
    {
        try
        {
            useProxy(page, Bot.accounts[email!].Proxy || "");
            await page.setCookie(...Bot.accounts[email!].Cookies);
            await page.goto("https://www.facebook.com/friends/requests");
            await page.waitForSelector(selectors.search);
            let error;
            let reqs: { name: string, url: string }[] = [];

            try
            {
                reqs = await Bot.autoScrollFriendReq(page);
            }
            catch (e)
            {
                error = e;
                console.log(e);
            }

            callback?.call({ success: true, error, data: reqs });

            return { success: true, error, data: reqs };
        }
        catch (error)
        {

            callback?.call({ success: false, error: error });
            return { success: false, error: error };
        }
    }

    public static AcceptFriendReq = async ({ page, data: { email, url, callback } }: { page: Page, data: IData }) =>
    {
        try
        {
            if (Bot.accounts[email!].Proxy)
                useProxy(page, "");
            
            await page.setCookie(...Bot.accounts[email!].Cookies);
            await page.goto(url!);
            await Bot.WaitRandom(page, 3000);
            const cursor = createCursor(page);

            await page.waitForSelector(selectors.respond);
            await cursor.click(selectors.respond);

            await Bot.WaitRandom(page, 2000);
            await cursor.click(selectors.confirmRequest);

            await Bot.WaitRandom(page, 1000);

            await page.goto("https://facebook.com/");

            callback?.call({ success: true, data: await page.cookies() });
            return { success: true, data: await page.cookies() };            
        }
        catch (error)
        {
            callback?.call({ success: false, error: error });
            return { success: false, error: error };
        }
    }

    public static AcceptAllFriendReq = async ({ page, data: { email, callback } }: { page: Page, data: IData }) => 
    {
        try
        {
            useProxy(page, Bot.accounts[email!].Proxy || "");
            await page.setCookie(...Bot.accounts[email!].Cookies);
            const { data } = await Bot.GetAllFriendReq({ page, data: { callback: undefined } }) || {};
            const cursor = createCursor(page);

            if (!data)
                return { success: true, data: page.cookies() };

            for (let i = 0; i < data.length; i++)
            {
                try
                {
                    const selector = `${selectors.friendsReqGrid} > div:nth-child(${i + 1}) > div > a > div[aria-label='Confirm']`;
                    await page.$eval(selector, (el) => el.scrollIntoView({ block: "end", behavior: "smooth" }));
                    cursor.click(selector);
                }
                catch
                {
                    const selector = selectors.friendReqConfirm;
                    await page.$$eval(selector, (el, x) => el[x].scrollIntoView({ block: "end", behavior: "smooth" }), i);
                    cursor.click((await page.$$(selector))[i]);
                }
            }

            callback?.call({ success: true, data: (await page.cookies()) });
            return { success: true, data: (await page.cookies()) };
        }
        catch (error)
        {
            callback?.call({ success: false, error: error });
            return { success: false, error: error };
        }
    }

    public static PostOnPage = async ({ page, data: { email, message, url, callback } }: { page: Page, data: IData }) => 
    {
        try
        {
            useProxy(page, Bot.accounts[email!].Proxy || "");
            await page.setCookie(...Bot.accounts[email!].Cookies);
            await page.goto(url!);
            await page.waitForSelector(selectors.pageCreatePost);

            await page.$eval(selectors.pageCreatePost, (e) => e.scrollIntoView({ behavior: "smooth", block: "end" }));
            await Bot.WaitRandom(page, 1000);

            const cursor = createCursor(page);
            await cursor.click(selectors.pageCreatePost);

            await page.waitForSelector(selectors.pagePostInput);
            await Bot.WaitRandom(page, 1000);

            await cursor.click(selectors.pagePostInput);
            await page.keyboard.type(message!, { delay: 350 });

            await Bot.WaitRandom(page, 1000);
            await cursor.click(selectors.pagePostSubmit);

            await Bot.WaitRandom(page, 3000);

            callback?.call({ success: true, data: (await page.cookies()) });

            return { success: true, data: (await page.cookies()) }
        } catch (error)
        {

            callback?.call({ success: false, error: error });
            return { success: false, error: error };
        }
    }

    public static PostOnWall = async ({ page, data: { email, message, callback } }: { page: Page, data: IData }) => 
    {
        try
        {
            useProxy(page, Bot.accounts[email!].Proxy || "");
            await page.setCookie(...Bot.accounts[email!].Cookies);
            await page.goto("https://facebook.com/");
            await page.waitForSelector(selectors.postWall);

            await page.$eval(selectors.postWall, (e) => e.scrollIntoView({ behavior: "smooth", block: "end" }));
            await Bot.WaitRandom(page, 1000);

            const cursor = createCursor(page);
            await cursor.click(selectors.postWall);

            await page.waitForSelector(selectors.postWallInput);
            await Bot.WaitRandom(page, 1000);

            await cursor.click(selectors.postWallInput);
            await page.keyboard.type(message!, { delay: 350 });

            await Bot.WaitRandom(page, 1000);
            await cursor.click(selectors.pagePostSubmit);

            await Bot.WaitRandom(page, 3000);

            callback?.call({ success: true, data: (await page.cookies()) });

            return { success: true, data: (await page.cookies()) }
        } catch (error)
        {

            callback?.call({ success: false, error: error });
            return { success: false, error: error };
        }
    }

    public static InviteFriendGroup = async ({ page, data: { email, url, message, callback } }: { page: Page, data: IData }) => 
    {
        try
        {
            useProxy(page, Bot.accounts[email!].Proxy || "");
            await page.setCookie(...Bot.accounts[email!].Cookies);
            await page.setViewport({ width: 523, height: 674 });
            await page.goto(url!);
            await page.waitForSelector(selectors.inviteFriendGroup);
            const cursor = createCursor(page);

            const inv = await page.$(selectors.inviteFriendGroup);
            // await cursor.click(selectors.inviteFriendGroup);
            inv?.click();

            await page.waitForSelector(selectors.searchFriendInvite);
            await Bot.WaitRandom(page, 1500);

            await cursor.click(selectors.searchFriendInvite);
            await page.keyboard.type(message!, { delay: 350 });

            await Bot.WaitRandom(page, 3000);

            const el = page.$(selectors.searchResultFriendInvite);
            if (!el)
            {
                callback?.call({ success: false, error: "Friend not found" });
                return { success: false, error: "Friend not found" };
            }

            await cursor.click(selectors.searchResultFriendInvite);
            await Bot.WaitRandom(page, 1200);

            await cursor.click(selectors.sendFriendInvite);
            callback?.call({ success: true, data: (await page.cookies()) });
            return { success: true, data: (await page.cookies()) };
        } catch (error)
        {
            callback?.call({ success: false, error: error });
            return { success: false, error: error };
        }
    }

    public static EnterGroup = async ({ page, data: { email, url, callback } }: { page: Page, data: IData }) =>
    {
        try
        {
            useProxy(page, Bot.accounts[email!].Proxy || "");
            await page.setCookie(...Bot.accounts[email!].Cookies);
            await page.goto(url!);
            await page.waitForSelector(selectors.search);

            callback?.call({ success: true, data: (await page.cookies()) });
            return { success: true, data: (await page.cookies()) };
        } catch (error)
        {

            callback?.call({ success: false, error: error });
            return { success: false, error: error };
        }
    }

    public static GetGroupMembers = async ({ page, data: { email, url, callback } }: { page: Page, data: IData }) => 
    {
        try
        {
            useProxy(page, Bot.accounts[email!].Proxy || "");
            await page.setCookie(...Bot.accounts[email!].Cookies);
            await page.goto(url!);
            await page.waitForSelector(selectors.membersButton);

            await Bot.WaitRandom(page, 3000);

            const cursor = createCursor(page);
            // await cursor.click(selectors.membersButton);
            const but = await page.$$(selectors.membersButton);
            await cursor.click(but[9]);

            await Bot.WaitRandom(page, 2500);

            let length = await Bot.autoScrollMembers(page);

            const members: { name: string, url: string }[] = []
            for (let i = 0; i < length; i++)
            {
                const el: ElementHandle = (await page.$$(selectors.membersContainer))[1];
                //get all the names of the requests
                // const selector = `${selectors.membersContainer} > div:nth-child(${i + 1})`;
                // const url: string = await page.evaluate((sel) => ((document.querySelector(sel)).querySelectorAll("a")[1]).href, selector);
                // const name: string = await page.evaluate((sel) => ((document.querySelector(sel)).querySelectorAll("a")[1]).textContent, selector);
                const selector = `div:nth-child(${i + 1})`;
                const url: string = await el.evaluate((e, sel) => (e.children[sel].querySelectorAll("a")[1]).href, i);
                const name: string = await el.evaluate((e, sel) => (e.children[sel].querySelectorAll("a")[1]).textContent!, i);
                members.push({ name, url });
            }

            callback?.call({ success: true, data: members });
            return { success: true, data: members };
        } catch (error)
        {

            callback?.call({ success: false, error: error });
            return { success: false, error: error };
        }
    }

    public static GetAvailableGroups = async ({ page, data: { email, message, callback } }: { page: Page, data: IData }) =>
    {
        try
        {
            useProxy(page, Bot.accounts[email!].Proxy || "");
            await page.setCookie(...Bot.accounts[email!].Cookies);
            await page.goto(`https://www.facebook.com/search/groups/?q=${message}`);
            await page.waitForSelector(selectors.search);

            await Bot.WaitRandom(page, 5000);

            const length = await Bot.autoScrollFeed(page);
            const groups: { name: string, url: string, data: string }[] = [];
            for (let i = 0; i < length; i++)
            {
                try
                {
                    let selector = `${selectors.groupsFeed} > div:nth-child(${i + 1})`;
                    const el = await page.$(selector);
                    const href = await el?.evaluate((e) => (e.querySelectorAll("a")[1]).href);
                    const name = await el?.evaluate((e) => (e.querySelectorAll("a")[1]).textContent);
                    const data = await el?.evaluate((e) => (e.querySelectorAll("span[dir='auto']")[1].firstChild!).textContent);

                    groups.push({ name: name!, url: href!, data: data! });
                }
                catch { }
            }

            callback?.call({ success: true, data: groups });
            return { success: true, data: groups };
        } catch (error)
        {

            callback?.call({ success: false, error: error });
            return { success: false, error: error };
        }
    }

    public static GetCurrentUsers()
    {
        return { success: true, data: Bot.accounts };
    }

    private static async WaitRandom(page: Page, waitTime: number)
    {
        await page.waitForTimeout(waitTime + Math.random() * 1000);
    }

    private static async autoScrollGroups(page: Page)
    {
        await this.WaitRandom(page, 2000);
        let container = await page.$(selectors.listOfGroups);
        let el = await container?.$$("a");

        let oldLength = el!.length;
        await page.$eval(selectors.listOfGroupsScroller, (e) => e.scrollTop = Number.MAX_SAFE_INTEGER);

        if (oldLength == 4) return [];

        await new Promise<void>(async (resolve, reject) => 
        {
            var timer = setInterval(async () => 
            {
                // await Bot.mouseSquareMove(page);
                await page.$eval(selectors.listOfGroupsScroller2, (e) => e.scrollTop = Number.MAX_SAFE_INTEGER);
                container = await page.$(selectors.listOfGroups2);
                await this.WaitRandom(page, 3000);
                el = await container?.$$("a");

                if (el!.length <= oldLength)
                {
                    clearInterval(timer);
                    resolve();
                }

                oldLength = el!.length;
            }, 3000);
        });

        let groups: { group: String, url: String }[] = [];

        for (let i = 4; i < el!.length; i++)
        {
            let inner = await page.evaluate((e) => e.innerText, el![i]);
            let href = await page.evaluate((e) => e.href, el![i]);
            groups.push({ group: inner.split("\n")[0], url: href });
        }

        return groups;
    }

    private static async autoScrollFriendReq(page: Page)
    {
        const requests: { name: string, url: string }[] = []
        if (await page.$(selectors.friendsReqGrid) || await page.$("div[class='sxpk6l6v'] > div:last-child"))
        {
            let length = await page.$eval("div[class='sxpk6l6v'] > div:last-child", (e) => e.children.length);
            if (length == 0) return requests;

            await new Promise<void>(async (resolve) => 
            {
                var timer = setInterval(async () => 
                {
                    //scroll to the bottom
                    await page.$eval(selectors.friendReqGridScroller2, (e) => e.scrollTop = Number.MAX_SAFE_INTEGER);
                    await page.$eval(selectors.friendReqGridScroller, (e) => e.scrollTop = Number.MAX_SAFE_INTEGER);
                    await Bot.WaitRandom(page, 3000);
                    try
                    {
                        await page.waitForSelector(`div[class='sxpk6l6v'] > div:last-child > div:nth-child(${length + 1})`, { timeout: 3000 });
                    }
                    catch (_) { }
                    //get the number of items
                    // let len = await page.$eval(selectors.friendsReqGrid, (e) => e.children.length);
                    let len = await page.$eval("div[class='sxpk6l6v'] > div:last-child", (e) => e.children.length);

                    if (len <= length)
                    {
                        clearInterval(timer);
                        resolve();
                        return;
                    }
                    length = len;
                }, 5000);
            });


            for (let i = 0; i < length; i++)
            {
                //get all the names of the requests
                // const selector = `${selectors.friendsReqGrid} > div:nth-child(${i + 1}) > div > a`;
                const selector = `div[class='sxpk6l6v'] > div:last-child > div:nth-child(${i + 1}) > div > a`;
                const url: string = await page.evaluate((sel) => document.querySelector(sel).href, selector);
                const textContent: string = await page.evaluate((sel) => document.querySelector(sel).textContent, selector);
                let name = textContent.match(/\b[A-Z].*?\b/g)?.join(" ");
                if (!name)
                    name = "Unknown Language"

                requests.push({ name, url });

            }
        }
        else
        {
            try
            {
                let length = await page.$eval(selectors.friendRequestsWall, (e) => e.querySelectorAll("a[role='link']").length);
                if (length == 1) return requests;

                const container = await page.$(selectors.friendRequestsWall);
                const reqs = await container?.$$("a[role='link']");
                if (!reqs) return requests;
                for (let i = 1; i < reqs.length; i++)
                {
                    const element = reqs[i];
                    const url: string = await element.evaluate((x) => (<HTMLAnchorElement>x).href);
                    const textContent: string = await element.evaluate((x) => x.textContent!);
                    let name = textContent.match(/\b[A-Z].*?\b/g)?.join(" ");
                    if (!name)
                        name = "Unknown Language"

                    requests.push({ name, url });
                }
            }
            catch (_)
            {

            }
        }

        return requests;
    }

    private static async autoScrollMembers(page: Page)
    {
        let members: number = await page.evaluate(async (s) => 
        {
            try
            {
                let oldLength, newLength = 0;
                let x = (document.querySelectorAll(s))[1];
                do
                {
                    oldLength = x?.children.length;
                    if (document.scrollingElement)
                        document.scrollingElement.scrollTop = Number.MAX_SAFE_INTEGER;
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    newLength = x?.children.length;
                } while (newLength > oldLength);

                return newLength;
            }
            catch
            {
                return 0;
            }
        }, selectors.membersContainer);

        return members;
    }

    private static async autoScrollFeed(page: Page)
    {
        let groups: number = await page.evaluate(async (s) => 
        {
            try
            {
                let oldLength, newLength = 0;
                let x = document.querySelector(s);
                do
                {
                    oldLength = x?.children.length;
                    if (document.scrollingElement)
                        document.scrollingElement.scrollTop = Number.MAX_SAFE_INTEGER;
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    newLength = x?.children.length;

                    if (newLength >= 50) break;
                } while (newLength > oldLength);

                return newLength;
            }
            catch
            {
                return 0;
            }
        }, selectors.groupsFeed);

        return groups;
    }

    private static async mouseSquareMove(page: Page)
    {
        await page.mouse.move(0, 0);
        await page.mouse.move(0, 100);
        await page.mouse.move(100, 100);
        await page.mouse.move(100, 0);
        await page.mouse.move(0, 0);
    }
}
