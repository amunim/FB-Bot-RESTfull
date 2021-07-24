import { Cookie } from "puppeteer";

export class User
{
    public Cookies: Cookie[];
    public RegisterUrl: string;
    public Proxy: string;

    constructor(Cookies: Cookie[], RegisterUrl?: string, Proxy?: string)
    {
        this.Cookies = Cookies;

        if (RegisterUrl)
            this.RegisterUrl = RegisterUrl

        if (Proxy)
            this.Proxy = Proxy;
    }
}