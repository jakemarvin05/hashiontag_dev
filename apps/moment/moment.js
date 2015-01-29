var moment = require('moment');

//define custom locales
moment.locale('en-shortened', {
    relativeTime : {
        future : "+%s",
        past : "%s",
        s : "%ds",
        m : "%dm",
        mm : "%dm",
        h : "%dh",
        hh : "%dh",
        d : "%dd",
        dd : "%dd",
        M : "%dmth",
        MM : "%dmth",
        y : "%dy",
        yy : "%dy"
    },
});

//switch back to default locale.
moment.locale('en');
module.exports = moment;