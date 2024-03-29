/*
   🐬@toulanboy
   📕更新地址：https://github.com/toulanboy/scripts

   *************************
   Loon, surge, quanx配置教程
   *************************
   1、下载脚本到本地， 打开https://weather.com/zh-CN/weather/today。
   2、搜索你的城市，然后切换到【每小时】。
   3、复制地址栏的链接填到 第30行的 weather_url。
   4、认真检查链接是否正确。。  正确的链接是包含hourbyhour字样的，下述是参考样例！
   样例参考：https://weather.com/zh-CN/weather/hourbyhour/l/f6de1330f517758fbcfe51946263fb8485477d27f5ab1e3f2d9f88b0e823f544
   [Loon config]
   cron "0 6,12,17 * * *" script-path=weather.js, timeout=600, tag=天气提醒
   [Quanx config]
   0 6,12,17 * * * weather.js, tag=天气提醒
   [surge config]
   天气提醒= type=cron,cronexp="0 6,12,17 * * *",script-path=weather.js,wake-system=true,timeout=600

   *************************
   box配置教程 
   *************************
   1、远程订阅该js文件。  在box中订阅https://raw.githubusercontent.com/toulanboy/scripts/master/toulanboy.boxjs.json
   2、打开https://weather.com/zh-CN/weather/today， 搜索你的城市，然后切换到【每小时】。
   3、复制地址栏的链接填到 box里面的“tlb_weather_url”。
   4、认真检查链接是否正确。。  正确的链接是包含hourbyhour字样的，下述是参考样例！
   样例参考：https://weather.com/zh-CN/weather/hourbyhour/l/f6de1330f517758fbcfe51946263fb8485477d27f5ab1e3f2d9f88b0e823f544
*/
const $ = new Env('⏰ 下雨提醒')
$.weather_url = "https://weather.com/zh-CN/weather/hourbyhour/l/2aee69af5b5fe11bc90e5c89deffe4cd89840087e26e057d1035a04f051da89b"   //这里需要你填。  box用户请在box里面修改变量。
$.pre_hours = 24     //预测未来24小时，最多48小时


!(async () => {
    $.log('', `🔔 ${$.name}, 开始!`, '')
    if ($.weather_url == "") {
        $.weather_url = $.getdata('tlb_weather_url')
    }
    if ($.weather_url == undefined || $.weather_url == "" || $.weather_url.match(/hourbyhour/) == undefined || $.weather_url.match(/^https:.*?/) == undefined) {
        $.msg($.name, "", "🚫启动失败，请配置weather_url，具体配置过程请阅读js文件！！！")
        $.done()
        return
    }
    await getw()

})()
.catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
})
.finally(() => {
    $.log('', `🔔 ${$.name}, 结束!`, ''), $.done()
})

function getw() {
    return new Promise((resove) => {
        url = {
            url: $.weather_url,
            headers: {
                'user-agent':`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36`,
            }
        }
        $.get(url, (error, response, data) => {
            if (error) throw new Error(error)
            body = response.body
            city_name = body.match(/locationCard">.*?locationName--.*?>(.*?)</)
            if (city_name != undefined) {
                console.log(city_name[1])
                $.city_name = city_name[1]
            }
            else {
                console.log("🚫 获取城市名称失败")
                $.city_name = "🚫 获取城市名称失败"
            }
            var is_tomorrow = false
            var is_notify = false
            var time_prefix = ""
            var count = 1
            $.message = ""
            const reg_time = /daypartName.*?>(\d+:\d+)/g //g代表全局模式，可以多次匹配
            const reg_tmp = /TemperatureValue.*?DetailsSummary--tempValue.*?>(.*?)</g
            const reg_rain_p = /PercentageValue">(.*?)</g
            
            while ((r = reg_time.exec(body)) && (count <= $.pre_hours)) {
                time_point = r[1]
                tmp = reg_tmp.exec(body)[1]
                rain_p = reg_rain_p.exec(body)[1] 
                if (count == 1) {
                    $.message += `🌈 当前温度 ${tmp}，降雨概率为${rain_p}。\n⬇️ 未来${$.pre_hours}小时内大概率降雨如下\n`
                }
                time_point = time_prefix + time_point
                if (!is_tomorrow && parseInt(r[1].replace(/:\d+/, "")) == 23) {
                    time_prefix = "明天"
                    is_tomorrow = true
                }
                else if (is_tomorrow && parseInt(r[1].replace(/:\d+/, "")) == 23) {
                    time_prefix = "后天"
                }
                console.log(`${time_point}，温度${tmp}，下雨概率${rain_p}`)
                if (parseInt(rain_p.replace(/°/, "")) >= 50) {
                    is_notify = true
                    $.message += `🌧 ${time_point}，温度${tmp}，下雨概率${rain_p}。\n`
                }
                count++
            }
            if(is_notify)
                $.msg(`${$.name}:${$.city_name}`, ``, $.message)
            else {
                console.log("🌟 当前降雨概率都不大于50%， 故不弹出系统通知。")
            }
        })
    })
}
// prettier-ignore, @chavyleung
function Env(s) {
    this.name = s, this.data = null, this.logs = [], this.isSurge = (() => "undefined" != typeof $httpClient), this.isQuanX = (() => "undefined" != typeof $task), this.isNode = (() => "undefined" != typeof module && !!module.exports), this.log = ((...s) => {
        this.logs = [...this.logs, ...s], s ? console.log(s.join("\n")) : console.log(this.logs.join("\n"))
    }), this.msg = ((s = this.name, t = "", i = "") => {
        this.isSurge() && $notification.post(s, t, i), this.isQuanX() && $notify(s, t, i);
        const e = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];
        s && e.push(s), t && e.push(t), i && e.push(i), console.log(e.join("\n"))
    }), this.getdata = (s => {
        if (this.isSurge()) return $persistentStore.read(s);
        if (this.isQuanX()) return $prefs.valueForKey(s);
        if (this.isNode()) {
            const t = "box.dat";
            return this.fs = this.fs ? this.fs : require("fs"), this.fs.existsSync(t) ? (this.data = JSON.parse(this.fs.readFileSync(t)), this.data[s]) : null
        }
    }), this.setdata = ((s, t) => {
        if (this.isSurge()) return $persistentStore.write(s, t);
        if (this.isQuanX()) return $prefs.setValueForKey(s, t);
        if (this.isNode()) {
            const i = "box.dat";
            return this.fs = this.fs ? this.fs : require("fs"), !!this.fs.existsSync(i) && (this.data = JSON.parse(this.fs.readFileSync(i)), this.data[t] = s, this.fs.writeFileSync(i, JSON.stringify(this.data)), !0)
        }
    }), this.wait = ((s, t = s) => i => setTimeout(() => i(), Math.floor(Math.random() * (t - s + 1) + s))), this.get = ((s, t) => this.send(s, "GET", t)), this.post = ((s, t) => this.send(s, "POST", t)), this.send = ((s, t, i) => {
        if (this.isSurge()) {
            const e = "POST" == t ? $httpClient.post : $httpClient.get;
            e(s, (s, t, e) => {
                t && (t.body = e, t.statusCode = t.status), i(s, t, e)
            })
        }
        this.isQuanX() && (s.method = t, $task.fetch(s).then(s => {
            s.status = s.statusCode, i(null, s, s.body)
        }, s => i(s.error, s, s))), this.isNode() && (this.request = this.request ? this.request : require("request"), s.method = t, s.gzip = !0, this.request(s, (s, t, e) => {
            t && (t.status = t.statusCode), i(null, t, e)
        }))
    }), this.done = ((s = {}) => this.isNode() ? null : $done(s))
}
