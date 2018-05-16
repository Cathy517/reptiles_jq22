const fs = require('fs'),
    path = require('path');

function mkdirs(dirname, callback) {
    fs.exists(dirname, function(exists) {
        if (exists) {
            callback();
        } else {
            //console.log(path.dirname(dirname));  
            mkdirs(path.dirname(dirname), function() {
                fs.mkdir(dirname, callback);
            });
        }
    });
}

mkdirs('./jqueryUI/xxx/yug', function(ee) {
    console.log(ee);
})