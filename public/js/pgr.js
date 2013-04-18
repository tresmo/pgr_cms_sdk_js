(function(mod, windowGlobalName) {

    if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        // NodeJS
        module.exports = mod;
    }
    else if (typeof define === "function" && define.amd) {
        // AMD
        define(function() {
            return mod;
        });
    }
    else {
        // Browser
        window[windowGlobalName] = mod;
    }

})(function() {

        // --- cookie helpers for browser ---
        var COOKIE_SESSION_TOKEN = "X-Session-Token";

        var getCookie = function(name) {
            name = name.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
            var regex = new RegExp('(?:^|;)\\s?' + name + '=(.*?)(?:;|$)', 'i');
            var match = document.cookie.match(regex);
            return match && unescape(match[1]);
        };

        var setCookie = function(name, value) {
            document.cookie = name + "=" + (value !== "" ? value : "") + "; path=/";
        };

        var getSessionTokenCookie = function() {
            return getCookie(COOKIE_SESSION_TOKEN);
        };

        var setSessionTokenCookie = function(sessionToken) {
            setCookie(COOKIE_SESSION_TOKEN, sessionToken);
        };


        // --- HTTP transport switch ---

        var isBrowser = (typeof window !== "undefined" && window == this);

        var getRuntimeRequestFn = function() {
            if (isBrowser) {
                return function(method, url, data, headers, cb, ctx) {
                    $.ajax({
                        url: url,
                        crossDomain: true,
                        data: data,
                        type: method,
                        cache: false,
                        context: ctx,

                        beforeSend: function(xhr) {
                            $.each(headers || {}, function(key, value) {
                                xhr.setRequestHeader(key, value);
                            });
                        },

                        error: function(jqXHR, textStatus, errorThrown) {
                            var res = jqXHR.responseText;
                            try {
                                res = JSON.parse(res);
                            }
                            catch (e) {
                            }
                            cb.call(ctx || this, errorThrown, null, res);
                        },

                        success: function(data, textStatus, jqXHR) {
                            if (data.error) {
                                cb.call(ctx || this, data, null);
                            }
                            else {
                                cb.call(ctx || this, null, data);
                            }
                        }
                    });
                };
            }
            else {
                var request = require("request");
                return function(method, url, data, headers, cb, ctx) {
                    request({
                            method: method,
                            headers: headers || {},
                            uri: url,
                            qs: method == "get" ? data : undefined,
                            json: method != "get" ? data : undefined,
                            jar: false,
                            followRedirect: false
                        }, function(err, resp, data) {
                            if (err || !resp || data.error || resp.statusCode != 200) {
                                cb.call(ctx || this, err || data, null);
                            }
                            else {
                                cb.call(ctx || this, null, data);
                            }
                        }
                    );
                };

            }
        };

        // --- Client definition ---

        var Client = function(baseUrl, options) {
            this.options = options || {};
            this.baseUrl = baseUrl;
            this.sessionToken = null;

            this.requestFn = this.options.requestFn || getRuntimeRequestFn();
        };

        Client.prototype.getHeaders = function() {
            var headers = {};

            var token = this.sessionToken;

            if (!token && isBrowser) {
                token = getSessionTokenCookie();
            }

            if (token) {
                headers[COOKIE_SESSION_TOKEN] = token;
            }

            return headers;
        };

        Client.prototype.storeSessionTokenCookie = function() {
            if (isBrowser) {
                setSessionTokenCookie(this.sessionToken);
            }
        };

        Client.prototype.destroySessionTokenCookie = function() {
            if (isBrowser) {
                setSessionTokenCookie(null);
            }
        };

        Client.prototype.setSessionToken = function(token) {
            this.sessionToken = token;
        };

        Client.prototype.getSessionToken = function() {
            return this.getHeaders()[COOKIE_SESSION_TOKEN];
        };

        Client.prototype.req = function(method, path, data, cb, ctx) {
            this.requestFn(method, this.baseUrl + path, data, this.getHeaders(), cb, ctx);
        };


        Client.prototype.getVersionInfo = function(cb, ctx) {
            this.req("GET", "/", {}, cb, ctx);
        };


        Client.prototype.createSession = function(data, cb, ctx) {
            this.req("POST", "/sessions/", data, function(err, session) {
                this.setSessionToken(session ? session.token : null);
                this.storeSessionTokenCookie();

                cb.apply(ctx || this, arguments);
            }, this);
        };

        Client.prototype.destroySession = function(cb, ctx) {
            var token = this.getSessionToken();

            this.req("DELETE", "/sessions/" + token, {}, function(err, result) {
                this.setSessionToken(null);
                this.destroySessionTokenCookie();

                cb.apply(ctx || this, arguments);
            }, this);
        };


        Client.prototype.getMe = function(cb, ctx) {
            this.req("GET", "/me/", {}, cb, ctx);
        };


        Client.prototype.createPost = function(data, cb, ctx) {
            this.req("POST", "/posts/", data, cb, ctx);
        };

        Client.prototype.updatePost = function(data, cb, ctx) {
            this.req("PUT", "/posts/" + data.id, data, cb, ctx);
        };

        Client.prototype.deletePost = function(id, cb, ctx) {
            this.req("DELETE", "/posts/" + id, {}, cb, ctx);
        };

        Client.prototype.getPost = function(id, cb, ctx) {
            this.req("GET", "/posts/" + id, {}, cb, ctx);
        };

        Client.prototype.findPosts = function(data, cb, ctx) {
            this.req("GET", "/posts/", data, cb, ctx);
        };


        Client.prototype.createAttachment = function(data, cb, ctx) {
            this.req("POST", "/attachments/", data, cb, ctx);
        };

        Client.prototype.getAttachment = function(id, cb, ctx) {
            this.req("GET", "/attachment/" + id, {}, cb, ctx);
        };


        return Client;

    }(), "PGR");
