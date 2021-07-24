"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    constructor(Cookies, RegisterUrl, Proxy) {
        this.Cookies = Cookies;
        if (RegisterUrl)
            this.RegisterUrl = RegisterUrl;
        if (Proxy)
            this.Proxy = Proxy;
    }
}
exports.User = User;
//# sourceMappingURL=user.js.map