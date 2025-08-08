(() => {
    var o, i, l, a, e, d, c, h, n, t;
    t = (a = (e = location.ancestorOrigins) != null ? e[0] : void 0) != null ? a : document.referrer;
    i = t != null && (d = t.match(/\/\/([^\/]+)/)) != null ? d[1] : void 0;
    n = (c = window.location.href) != null && (h = c.match(/\/html\/(\d+)/)) != null ? h[1] : void 0;

    if (navigator.sendBeacon != null) {
        o = new FormData();
        o.append("domain", i || "unknown-domain");
        if (n) o.append("upload_id", n);
        navigator.sendBeacon("https://itch.io/html-callback", o);
    }
})();
