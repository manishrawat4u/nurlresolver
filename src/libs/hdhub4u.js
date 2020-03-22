var Xray = require('x-ray')
var x = Xray()

var BaseUrlResolver = require('../BaseResolver');

class Hdhub4uResolver extends BaseUrlResolver {
    constructor() {
        super();
        this.domains = ['https://hdhub4u'];
    }

    async resolveInner(_urlToResolve) {
        const pathname = new URL(_urlToResolve).pathname;
        if (pathname === '/') return this.resolveInnerBase(_urlToResolve);

        //else do the processing here
        var links = [];

        var obj = await x(_urlToResolve, {
            title: ['a'],
            link: ['a@href']
        });

        for (let index = 0; index < obj.title.length; index++) {
            const title = obj.title[index];
            const link = obj.link[index];

            var regex_links = /https?:\/\/(t.me|hdhub4u)/gi;
            if (link.match(regex_links) === null)
                links.push(BaseUrlResolver.prototype.createResult(title, link, '', false));
        }
        return links;
    }

    async resolveInnerBase(_urlToResolve) {
        var origin = new URL(_urlToResolve).origin;
        var counter = 1;
        var promises = [];
        var links = [];
        while (counter <= 30) {
            var promise = new Promise(function (resolve, reject) {
                var page = counter;
                x(`${origin}/page/${page}`, '.home-wrapper div.thumb', [
                    {
                        title: 'p',
                        link: 'a@href',
                        poster: 'img@src'
                    }
                ])((err, obj) => {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        var items = obj.map(el => BaseUrlResolver.prototype.createResult(el.title, el.link, el.poster, false));
                        links.push({ page, items });
                        resolve();
                    }
                });
            });
            promises.push(promise);
            counter++;
        }
        await Promise.all(promises);
        links.sort((a, b) => a.page - b.page);
        let arr = links.map(x => x.items);
        return [].concat(...arr);
        // return [].concat(links.map(x=>x.items));
        // return links;
    }
}

module.exports = Hdhub4uResolver;