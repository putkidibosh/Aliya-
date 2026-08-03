"use strict";

var utils = require("./utils");
var cheerio = require("cheerio");
var log = require("npmlog");
/*var { getThemeColors } = require("../../func/utils/log.js");
var logger = require("../../func/utils/log.js");
var { cra, cv, cb, co } = getThemeColors();*/
log.maxRecordSize = 100;
var checkVerified = null;
const Boolean_Option = ['online', 'selfListen', 'listenEvents', 'updatePresence', 'forceLogin', 'autoMarkDelivery', 'autoMarkRead', 'listenTyping', 'autoReconnect', 'emitReady'];
global.ditconmemay = false;

function setOptions(globalOptions, options) {
    Object.keys(options).map(function (key) {
        switch (Boolean_Option.includes(key)) {
            case true: {
                globalOptions[key] = Boolean(options[key]);
                break;
            }
            case false: {
                switch (key) {
                    case 'pauseLog': {
                        if (options.pauseLog) log.pause();
                        else log.resume();
                        break;
                    }
                    case 'logLevel': {
                        log.level = options.logLevel;
                        globalOptions.logLevel = options.logLevel;
                        break;
                    }
                    case 'logRecordSize': {
                        log.maxRecordSize = options.logRecordSize;
                        globalOptions.logRecordSize = options.logRecordSize;
                        break;
                    }
                    case 'pageID': {
                        globalOptions.pageID = options.pageID.toString();
                        break;
                    }
                    case 'userAgent': {
                        globalOptions.userAgent = (options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
                        break;
                    }
                    case 'proxy': {
                        if (typeof options.proxy != "string") {
                            delete globalOptions.proxy;
                            utils.setProxy();
                        } else {
                            globalOptions.proxy = options.proxy;
                            utils.setProxy(globalOptions.proxy);
                        }
                        break;
                    }
                    default: {
                        log.warn("setOptions", "Unrecognized option given to setOptions: " + key);
                        break;
                    }
                }
                break;
            }
        }
    });
}

function buildAPI(globalOptions, html, jar) {
    let fb_dtsg = null;
    let irisSeqID = null;
    function extractFromHTML() {
        try {
            const $ = cheerio.load(html);
            $('script').each((i, script) => {
                if (!fb_dtsg) {
                    const scriptText = $(script).html() || '';
                    const patterns = [
                        /\["DTSGInitialData",\[\],{"token":"([^"]+)"}]/,
                        /\["DTSGInitData",\[\],{"token":"([^"]+)"/,
                        /"token":"([^"]+)"/,
                        /{\\"token\\":\\"([^\\]+)\\"/,
                        /,\{"token":"([^"]+)"\},\d+\]/,
                        /"async_get_token":"([^"]+)"/,
                        /"dtsg":\{"token":"([^"]+)"/,
                        /DTSGInitialData[^>]+>([^<]+)/
                    ];
                    for (const pattern of patterns) {
                        const match = scriptText.match(pattern);
                        if (match && match[1]) {
                            try {
                                const possibleJson = match[1].replace(/\\"/g, '"');
                                const parsed = JSON.parse(possibleJson);
                                fb_dtsg = parsed.token || parsed;
                            } catch {
                                fb_dtsg = match[1];
                            }
                            if (fb_dtsg) break;
                        }
                    }
                }
            });
            if (!fb_dtsg) {
                const dtsgInput = $('input[name="fb_dtsg"]').val();
                if (dtsgInput) fb_dtsg = dtsgInput;
            }
            const seqMatches = html.match(/irisSeqID":"([^"]+)"/);
            if (seqMatches && seqMatches[1]) {
                irisSeqID = seqMatches[1];
            }
            try {
                const jsonMatches = html.match(/\{"dtsg":({[^}]+})/);
                if (jsonMatches && jsonMatches[1]) {
                    const dtsgData = JSON.parse(jsonMatches[1]);
                    if (dtsgData.token) fb_dtsg = dtsgData.token;
                }
            } catch { }
            if (fb_dtsg) {
                console.log("Đã tìm thấy fb_dtsg");
            }
        } catch (e) {
            console.log("Lỗi khi tìm fb_dtsg:", e);
        }
    }
    extractFromHTML();
    var userID;
    var cookies = jar.getCookies("https://www.facebook.com");
    var userCookie = cookies.find(cookie => cookie.cookieString().startsWith("c_user="));
    var tiktikCookie = cookies.find(cookie => cookie.cookieString().startsWith("i_user="));
    if (!userCookie && !tiktikCookie) {
        return log.error('login', "Không tìm thấy cookie cho người dùng, vui lòng kiểm tra lại thông tin đăng nhập");
    }
    if (html.includes("/checkpoint/block/?next")) {
        return log.error('login', "Appstate die, vui lòng thay cái mới!", 'error');
    }
    userID = (tiktikCookie || userCookie).cookieString().split("=")[1];
    //logger.log(`${cra(`[ CONNECT ]`)} Logged in as ${userID}`, "DATABASE");
    try { clearInterval(checkVerified); } catch (_) { }
    const clientID = (Math.random() * 2147483648 | 0).toString(16);
    let mqttEndpoint = `wss://edge-chat.facebook.com/chat?region=prn&sid=${userID}`;
    let region = "PRN";

    try {
        const endpointMatch = html.match(/"endpoint":"([^"]+)"/);
        if (endpointMatch.input.includes("601051028565049")) {
          console.log(`lỗi login vì dính tài khoản tự động`);
          ditconmemay = true;
        }
        if (endpointMatch) {
            mqttEndpoint = endpointMatch[1].replace(/\\\//g, '/');
            const url = new URL(mqttEndpoint);
            region = url.searchParams.get('region')?.toUpperCase() || "PRN";
        }
    } catch (e) {
        console.log('Using default MQTT endpoint');
    }
    log.info('login', 'Fix fca by DongDev x Satoru, published By Team Calyx');
    var ctx = {
        userID: userID,
        jar: jar,
        clientID: clientID,
        globalOptions: globalOptions,
        loggedIn: true,
        access_token: 'NONE',
        clientMutationId: 0,
        mqttClient: undefined,
        lastSeqId: irisSeqID,
        syncToken: undefined,
        mqttEndpoint: mqttEndpoint,
        region: region,
        firstListen: true,
        fb_dtsg: fb_dtsg,
        req_ID: 0,
        callback_Task: {},
        wsReqNumber: 0,
        wsTaskNumber: 0,
        reqCallbacks: {}
    };
    var api = {
        setOptions: setOptions.bind(null, globalOptions),
        getAppState: () => utils.getAppState(jar),
        postFormData: (url, body) => utils.makeDefaults(html, userID, ctx).postFormData(url, ctx.jar, body)
    };
    var defaultFuncs = utils.makeDefaults(html, userID, ctx);
    api.postFormData = function (url, body) {
        return defaultFuncs.postFormData(url, ctx.jar, body);
    };
    api.getFreshDtsg = async function () {
        try {
            const res = await defaultFuncs.get('https://www.facebook.com/', jar, null, globalOptions);
            const $ = cheerio.load(res.body);
            let newDtsg;
            const patterns = [
                /\["DTSGInitialData",\[\],{"token":"([^"]+)"}]/,
                /\["DTSGInitData",\[\],{"token":"([^"]+)"/,
                /"token":"([^"]+)"/,
                /name="fb_dtsg" value="([^"]+)"/
            ];

            $('script').each((i, script) => {
                if (!newDtsg) {
                    const scriptText = $(script).html() || '';
                    for (const pattern of patterns) {
                        const match = scriptText.match(pattern);
                        if (match && match[1]) {
                            newDtsg = match[1];
                            break;
                        }
                    }
                }
            });

            if (!newDtsg) {
                newDtsg = $('input[name="fb_dtsg"]').val();
            }

            return newDtsg;
        } catch (e) {
            console.log("Error getting fresh dtsg:", e);
            return null;
        }
    };
    //if (noMqttData) api.htmlData = noMqttData;
    require('fs').readdirSync(__dirname + '/src/').filter(v => v.endsWith('.js')).forEach(v => { api[v.replace('.js', '')] = require(`./src/${v}`)(utils.makeDefaults(html, userID, ctx), api, ctx); });
    api.listen = api.listenMqtt;
    return {
        ctx,
        defaultFuncs,
        api
    };
}

function makeLogin(jar, email, password, loginOptions, callback, prCallback) {
    return async function (res) {
        try {
            const html = res.body;
            const $ = cheerio.load(html);
            let arr = [];
            $("#login_form input").each((i, v) => arr.push({ val: $(v).val(), name: $(v).attr("name") }));
            arr = arr.filter(v => v.val && v.val.length);
            let form = utils.arrToForm(arr);
            form.lsd = utils.getFrom(html, "[\"LSD\",[],{\"token\":\"", "\"}");
            form.lgndim = Buffer.from(JSON.stringify({ w: 1440, h: 900, aw: 1440, ah: 834, c: 24 })).toString('base64');
            form.email = email;
            form.pass = password;
            form.default_persistent = '0';
            form.lgnrnd = utils.getFrom(html, "name=\"lgnrnd\" value=\"", "\"");
            form.locale = 'en_US';
            form.timezone = '240';
            form.lgnjs = Math.floor(Date.now() / 1000);
            const willBeCookies = html.split("\"_js_");
            willBeCookies.slice(1).forEach(val => {
                const cookieData = JSON.parse("[\"" + utils.getFrom(val, "", "]") + "]");
                jar.setCookie(utils.formatCookie(cookieData, "facebook"), "https://www.facebook.com");
            });
            log.info("login", "Logging in...");
            const loginRes = await utils.post(
                "https://www.facebook.com/login/device-based/regular/login/?login_attempt=1&lwv=110",
                jar,
                form,
                loginOptions
            );
            await utils.saveCookies(jar)(loginRes);
            const headers = loginRes.headers;
            if (!headers.location) throw new Error("Wrong username/password.");
            if (headers.location.includes('https://www.facebook.com/checkpoint/')) {
                log.info("login", "You have login approvals turned on.");
                const checkpointRes = await utils.get(headers.location, jar, null, loginOptions);
                await utils.saveCookies(jar)(checkpointRes);
                const checkpointHtml = checkpointRes.body;
                const $ = cheerio.load(checkpointHtml);
                let checkpointForm = [];
                $("form input").each((i, v) => checkpointForm.push({ val: $(v).val(), name: $(v).attr("name") }));
                checkpointForm = checkpointForm.filter(v => v.val && v.val.length);
                const form = utils.arrToForm(checkpointForm);
                if (checkpointHtml.includes("checkpoint/?next")) {
                    return new Promise((resolve, reject) => {
                        const submit2FA = async (code) => {
                            try {
                                form.approvals_code = code;
                                form['submit[Continue]'] = $("#checkpointSubmitButton").html();
                                const approvalRes = await utils.post(
                                    "https://www.facebook.com/checkpoint/?next=https%3A%2F%2Fwww.facebook.com%2Fhome.php",
                                    jar,
                                    form,
                                    loginOptions
                                );
                                await utils.saveCookies(jar)(approvalRes);
                                const approvalError = $("#approvals_code").parent().attr("data-xui-error");
                                if (approvalError) throw new Error("Invalid 2FA code.");
                                form.name_action_selected = 'dont_save';
                                const finalRes = await utils.post(
                                    "https://www.facebook.com/checkpoint/?next=https%3A%2F%2Fwww.facebook.com%2Fhome.php",
                                    jar,
                                    form,
                                    loginOptions
                                );
                                await utils.saveCookies(jar)(finalRes);
                                const appState = utils.getAppState(jar);
                                resolve(await loginHelper(appState, email, password, loginOptions, callback));
                            } catch (error) {
                                reject(error);
                            }
                        };
                        throw {
                            error: 'login-approval',
                            continue: submit2FA
                        };
                    });
                }
                if (!loginOptions.forceLogin) throw new Error("Couldn't login. Facebook might have blocked this account.");
                form['submit[This was me]'] = checkpointHtml.includes("Suspicious Login Attempt") ? "This was me" : "This Is Okay";
                await utils.post("https://www.facebook.com/checkpoint/?next=https%3A%2F%2Fwww.facebook.com%2Fhome.php", jar, form, loginOptions);
                form.name_action_selected = 'save_device';
                const reviewRes = await utils.post("https://www.facebook.com/checkpoint/?next=https%3A%2F%2Fwww.facebook.com%2Fhome.php", jar, form, loginOptions);
                const appState = utils.getAppState(jar);
                return await loginHelper(appState, email, password, loginOptions, callback);
            }
            await utils.get('https://www.facebook.com/', jar, null, loginOptions);
            return await utils.saveCookies(jar);
        } catch (error) {
            callback(error);
        }
    };
}


function loginHelper(appState, email, password, globalOptions, callback, prCallback) {
    let mainPromise = null;
    const jar = utils.getJar();
    if (appState) {
        try {
            appState = JSON.parse(appState);
        } catch (e) {
            try {
                appState = appState;
            } catch (e) {
                return callback(new Error("Failed to parse appState"));
            }
        }

        try {
            appState.forEach(c => {
                const str = `${c.key}=${c.value}; expires=${c.expires}; domain=${c.domain}; path=${c.path};`;
                jar.setCookie(str, "http://" + c.domain);
            });

            mainPromise = utils.get('https://www.facebook.com/', jar, null, globalOptions, { noRef: true })
                .then(utils.saveCookies(jar));
        } catch (e) {
            process.exit(0);
        }
    } else {
        mainPromise = utils
            .get("https://www.facebook.com/", null, null, globalOptions, { noRef: true })
            .then(utils.saveCookies(jar))
            .then(makeLogin(jar, email, password, globalOptions, callback, prCallback))
            .then(() => utils.get('https://www.facebook.com/', jar, null, globalOptions).then(utils.saveCookies(jar)));
    }

    function handleRedirect(res) {
        const reg = /<meta http-equiv="refresh" content="0;url=([^"]+)[^>]+>/;
        const redirect = reg.exec(res.body);
        if (redirect && redirect[1]) {
            return utils.get(redirect[1], jar, null, globalOptions).then(utils.saveCookies(jar));
        }
        return res;
    }

    let ctx, api;
    mainPromise = mainPromise
        .then(handleRedirect)
        .then(res => {
            const mobileAgentRegex = /MPageLoadClientMetrics/gs;
            if (!mobileAgentRegex.test(res.body)) {
                globalOptions.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
                return utils.get('https://www.facebook.com/', jar, null, globalOptions, { noRef: true }).then(utils.saveCookies(jar));
            }
            return res;
        })
        .then(handleRedirect)
        .then(res => {
            const html = res.body;
            const Obj = buildAPI(globalOptions, html, jar);
            ctx = Obj.ctx;
            api = Obj.api;
            return res;
        });

    if (globalOptions.pageID) {
        mainPromise = mainPromise
            .then(() => utils.get(`https://www.facebook.com/${globalOptions.pageID}/messages/?section=messages&subsection=inbox`, jar, null, globalOptions))
            .then(resData => {
                let url = utils.getFrom(resData.body, 'window.location.replace("https:\\/\\/www.facebook.com\\', '");').split('\\').join('');
                url = url.substring(0, url.length - 1);
                return utils.get('https://www.facebook.com' + url, jar, null, globalOptions);
            });
    }

    mainPromise
        .then(async () => {
            log.info('Đăng nhập thành công');
            callback(null, api);
        })
        .catch(e => {
            callback(e);
        });
}


function login(loginData, options, callback) {
    if (utils.getType(options) === 'Function' || utils.getType(options) === 'AsyncFunction') {
        callback = options;
        options = {};
    }

    var globalOptions = {
        selfListen: false,
        listenEvents: true,
        listenTyping: false,
        updatePresence: false,
        forceLogin: false,
        autoMarkDelivery: false,
        autoMarkRead: false,
        autoReconnect: true,
        logRecordSize: 100,
        online: false,
        emitReady: false,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    };

    var prCallback = null;
    if (utils.getType(callback) !== "Function" && utils.getType(callback) !== "AsyncFunction") {
        var rejectFunc = null;
        var resolveFunc = null;
        var returnPromise = new Promise(function (resolve, reject) {
            resolveFunc = resolve;
            rejectFunc = reject;
        });
        prCallback = function (error, api) {
            if (error) return rejectFunc(error);
            return resolveFunc(api);
        };
        callback = prCallback;
    }

    if (loginData.email && loginData.password) {
        setOptions(globalOptions, {
            logLevel: "silent",
            forceLogin: true,
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        });
        loginHelper(loginData.appState, loginData.email, loginData.password, globalOptions, callback, prCallback);
    } else if (loginData.appState) {
        setOptions(globalOptions, options);
        return loginHelper(loginData.appState, loginData.email, loginData.password, globalOptions, callback, prCallback);
    }
    return returnPromise;
}


module.exports = login;												.then(function (res) {
													const $ = cheerio.load(res.body);
													const error = $("#approvals_code").parent().attr("data-xui-error");
													if (error) {
														throw {
															error: 'login-approval',
															errordesc: "Invalid 2FA code.",
															lerror: error,
															continue: submit2FA
														};
													}
												})
												.then(function () {
													// Use the same form (safe I hope)
													delete form.no_fido;
													delete form.approvals_code;
													form.name_action_selected = 'dont_save'; //'save_device';

													return utils.post(nextURL, jar, form, loginOptions).then(utils.saveCookies(jar));
												})
												.then(function (res) {
													const headers = res.headers;
													if (!headers.location && res.body.indexOf('Review Recent Login') > -1) throw { error: "Something went wrong with login approvals." };

													const appState = utils.getAppState(jar);

													if (callback === prCallback) {
														callback = function (err, api) {
															if (err) return prReject(err);
															return prResolve(api);
														};
													}

													// Simply call loginHelper because all it needs is the jar
													// and will then complete the login process
													return loginHelper(appState, email, password, loginOptions, callback);
												})
												.catch(function (err) {
													// Check if using Promise instead of callback
													if (callback === prCallback) prReject(err);
													else callback(err);
												});
										} else {
											utils
												.post("https://www.facebook.com/checkpoint/?next=https%3A%2F%2Fwww.facebook.com%2Fhome.php", jar, form, loginOptions, null, { "Referer": "https://www.facebook.com/checkpoint/?next" })
												.then(utils.saveCookies(jar))
												.then(res => {
													try {
														JSON.parse(res.body.replace(/for\s*\(\s*;\s*;\s*\)\s*;\s*/, ""));
													} catch (ex) {
														clearInterval(checkVerified);
														log.info("login", "Verified from browser. Logging in...");
														if (callback === prCallback) {
															callback = function (err, api) {
																if (err) return prReject(err);
																return prResolve(api);
															};
														}
														return loginHelper(utils.getAppState(jar), email, password, loginOptions, callback);
													}
												})
												.catch(ex => {
													log.error("login", ex);
													if (callback === prCallback) prReject(ex);
													else callback(ex);
												});
										}
										return rtPromise;
									}
								};
							} else {
								if (!loginOptions.forceLogin) throw { error: "Couldn't login. Facebook might have blocked this account. Please login with a browser or enable the option 'forceLogin' and try again." };

								if (html.indexOf("Suspicious Login Attempt") > -1) form['submit[This was me]'] = "This was me";
								else form['submit[This Is Okay]'] = "This Is Okay";

								return utils
									.post(nextURL, jar, form, loginOptions)
									.then(utils.saveCookies(jar))
									.then(function () {
										// Use the same form (safe I hope)
										form.name_action_selected = 'save_device';

										return utils.post(nextURL, jar, form, loginOptions).then(utils.saveCookies(jar));
									})
									.then(function (res) {
										const headers = res.headers;

										if (!headers.location && res.body.indexOf('Review Recent Login') > -1) throw { error: "Something went wrong with review recent login." };

										const appState = utils.getAppState(jar);

										// Simply call loginHelper because all it needs is the jar
										// and will then complete the login process
										return loginHelper(appState, email, password, loginOptions, callback);
									})
									.catch(e => callback(e));
							}
						});
				}

				return utils.get('https://www.facebook.com/', jar, null, loginOptions).then(utils.saveCookies(jar));
			});
	};
}

// Helps the login
function loginHelper(appState, email, password, globalOptions, callback, prCallback) {
	let mainPromise = null;
	const jar = utils.getJar();

	// If we're given an appState we loop through it and save each cookie
	// back into the jar.
	if (appState) {
		// check and convert cookie to appState
		if (utils.getType(appState) === 'Array' && appState.some(c => c.name)) {
			appState = appState.map(c => {
				c.key = c.name;
				delete c.name;
				return c;
			});
		}
		else if (utils.getType(appState) === 'String') {
			const arrayAppState = [];
			appState.split(';').forEach(c => {
				const [key, value] = c.split('=');

				arrayAppState.push({
					key: (key || "").trim(),
					value: (value || "").trim(),
					domain: "facebook.com",
					path: "/",
					expires: new Date().getTime() + 1000 * 60 * 60 * 24 * 365
				});
			});
			appState = arrayAppState;
		}

		appState.map(function (c) {
			const str = c.key + "=" + c.value + "; expires=" + c.expires + "; domain=" + c.domain + "; path=" + c.path + ";";
			jar.setCookie(str, "http://" + c.domain);
		});

		// Load the main page.
		mainPromise = utils.get('https://www.facebook.com/', jar, null, globalOptions, { noRef: true }).then(utils.saveCookies(jar));
	} else {
		// Open the main page, then we login with the given credentials and finally
		// load the main page again (it'll give us some IDs that we need)
		mainPromise = utils
			.get("https://www.facebook.com/", null, null, globalOptions, { noRef: true })
			.then(utils.saveCookies(jar))
			.then(makeLogin(jar, email, password, globalOptions, callback, prCallback))
			.then(function () {
				return utils.get('https://www.facebook.com/', jar, null, globalOptions).then(utils.saveCookies(jar));
			});
	}


	let redirectArr = [1, "https://m.facebook.com/"];
	let ctx;
	let api;
	function checkAndFixErr(res) {
		const reg_antierr = /This browser is not supported/gs;
		if (reg_antierr.test(res.body)) {
			const Data = JSON.stringify(res.body);
			const Dt_Check = Data.split('2Fhome.php&amp;gfid=')[1];
			if (Dt_Check == undefined) return res;
			const fid = Dt_Check.split("\\\\")[0];
			if (Dt_Check == undefined || Dt_Check == "") return res;
			const final_fid = fid.split(`\\`)[0];
			if (final_fid == undefined || final_fid == '') return res;
			const redirectlink = redirectArr[1] + "a/preferences.php?basic_site_devices=m_basic&uri=" + encodeURIComponent("https://m.facebook.com/home.php") + "&gfid=" + final_fid;
			return utils.get(redirectlink, jar, null, globalOptions).then(utils.saveCookies(jar));
		}
		else return res;
	}

	function redirect(res) {
		const reg = /<meta http-equiv="refresh" content="0;url=([^"]+)[^>]+>/;
		redirectArr = reg.exec(res.body);
		if (redirectArr && redirectArr[1]) return utils.get(redirectArr[1], jar, null, globalOptions).then(utils.saveCookies(jar));
		return res;
	}

	mainPromise = mainPromise
		.then(res => redirect(res))
		.then(res => checkAndFixErr(res))
		//fix via login with defaut UA return WWW.facebook.com not m.facebook.com
		.then(function (res) {
			const Regex_Via = /MPageLoadClientMetrics/gs; //default for normal account, can easily get region, without this u can't get region in some case but u can run normal
			if (!Regex_Via.test(res.body)) {
				//www.facebook.com
				globalOptions.userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";
				return utils.get('https://www.facebook.com/', jar, null, globalOptions, { noRef: true }).then(utils.saveCookies(jar));
			}
			else return res;
		})
		.then(res => redirect(res))
		.then(res => checkAndFixErr(res))
		.then(function (res) {
			const html = res.body;
			const stuff = buildAPI(globalOptions, html, jar);
			ctx = stuff[0];
			api = stuff[2];
			return res;
		});

	// given a pageID we log in as a page
	if (globalOptions.pageID) {
		mainPromise = mainPromise
			.then(function () {
				return utils.get('https://www.facebook.com/' + ctx.globalOptions.pageID + '/messages/?section=messages&subsection=inbox', ctx.jar, null, globalOptions);
			})
			.then(function (resData) {
				let url = utils.getFrom(resData.body, 'window.location.replace("https:\\/\\/www.facebook.com\\', '");').split('\\').join('');
				url = url.substring(0, url.length - 1);
				return utils.get('https://www.facebook.com' + url, ctx.jar, null, globalOptions);
			});
	}

	// At the end we call the callback or catch an exception
	mainPromise
		.then(function () {
			log.info("login", 'Done logging in.');
			return callback(null, api);
		})
		.catch(function (e) {
			log.error("login", e.error || e);
			callback(e);
		});
}

function login(loginData, options, callback) {
	if (utils.getType(options) === 'Function' || utils.getType(options) === 'AsyncFunction') {
		callback = options;
		options = {};
	}

	const globalOptions = {
		selfListen: false,
		selfListenEvent: false,
		listenEvents: false,
		listenTyping: false,
		updatePresence: false,
		forceLogin: false,
		autoMarkDelivery: true,
		autoMarkRead: false,
		autoReconnect: true,
		logRecordSize: defaultLogRecordSize,
		online: false,
		emitReady: false,
		userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/600.3.18 (KHTML, like Gecko) Version/8.0.3 Safari/600.3.18"
	};

	setOptions(globalOptions, options);

	let prCallback = null;
	let returnPromise;
	if (utils.getType(callback) !== "Function" && utils.getType(callback) !== "AsyncFunction") {
		let rejectFunc = null;
		let resolveFunc = null;
		returnPromise = new Promise(function (resolve, reject) {
			resolveFunc = resolve;
			rejectFunc = reject;
		});
		prCallback = function (error, api) {
			if (error) {
				return rejectFunc(error);
			}
			return resolveFunc(api);
		};
		callback = prCallback;
	}
	loginHelper(loginData.appState, loginData.email, loginData.password, globalOptions, callback, prCallback);
	return returnPromise;
}

module.exports = login;
