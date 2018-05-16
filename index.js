const http = require('http'),
    axios = require('axios'),
    cheerio = require('cheerio'),
    fs = require('fs'),
    path = require('path'),
    request = require('request')

const website = 'http://www.jq22.com/';

const start = async function() {
    for (let i = 1; i < 5; i++) {
        let urlsArray = [];

        //每个例子的link 每页15条数据
        await axios.get(website + 'jqueryUI-' + i + '-jq')
            .then(function(response) {
                let $ = cheerio.load(response.data);
                $('#zt .m0 .col-lg-4').each(function() {
                    let link = $(this).find('.cover-info a').attr('href'); // let firstLink = $(this).find('a').first().attr('href');// let firstLink2 = $(this).find('a:first-child').attr('href');// let firstLink3 = $(this).find('a').eq(0).attr('href');
                    if (link !== undefined) {
                        urlsArray.push(website + link);
                    }
                });
            })
            .catch(function(error) {});

        //每个例子演示的link
        for (let j = 0; j < urlsArray.length; j++) {
            let caseArray;
            await axios.get(urlsArray[j])
                .then(function(response) {
                    let $ = cheerio.load(response.data);
                    //查看演示按钮链接
                    let _case = $('.project-content div.thumbile').find('a').first().attr('href');
                    caseArray = _case;
                })
                .catch(function(error) {});

            //爬取查看演示按钮的链接获取到 实例的内容
            let iframesrc;
            let fileName;
            await axios.get(caseArray)
                .then(function(response) {
                    let $ = cheerio.load(response.data);
                    fileName = $('.logoTop').find('a').text();
                    let iframeUrl = $('#iframe').attr('src');
                    iframesrc = iframeUrl;
                })
                .catch(function(error) {});
            //根据实例中 iframe的链接 拿数据
            let cssArray = [],
                jsArray = [],
                htmlArray = [],
                imgArray = [];
            let iframedata;
            await axios.get(iframesrc)
                .then(function(response) {
                    iframedata = response.data;
                    let $ = cheerio.load(response.data);
                    let title = $('title').text();
                    let verify = {
                        http: /^[(http:)(https:)]/,
                        position: /^(.\/)/
                    };
                    //html
                    let itemUrl = $('a.demo'); //itemUrls
                    itemUrl.each(function() {
                        let item = $(this).attr('href');
                        if (item) {
                            if (!verify.http.test(item)) {
                                if (verify.position.test(item)) {
                                    item = item.slice(2, item.length);
                                }
                                htmlArray.push(item);
                                console.log(title + ' url:' + htmlArray);
                            }
                        }
                    })

                    let cssHref = $('link[rel="stylesheet"]'); //css
                    cssHref.each(function() {
                        let item = $(this).attr('href')
                        if (item) {
                            if (!verify.http.test(item)) {
                                if (verify.position.test(item)) {
                                    item = item.slice(2, item.length);
                                }
                                cssArray.push(item);
                                console.log(title + ' css:' + cssArray);
                            }
                        }
                    });

                    let jsHref = $('script'); //js
                    jsHref.each(function() {
                        let item = $(this).attr('src');
                        if (item) {
                            if (!verify.http.test(item)) {
                                if (verify.position.test(item)) {
                                    item = item.slice(2, item.length);
                                }
                                jsArray.push(item);
                                console.log(title + ' js:' + jsArray);
                            }
                        }
                    });

                    let imgHref = $('img');
                    imgHref.each(function() {
                        let item = $(this).attr('src');
                        if (item) {
                            await  downloadPic(uri,  file,  function() {
                                console.log('done');
                            });

                        }
                    })



                })
                .catch(function(error) {});


            await creatFile(fileName); //file


            //html
            await saveFile(fileName, iframedata, '.html');
            //css
            await creatFile(fileName, cssArray[0]); //css file
            await saveData(cssArray, fileName, iframesrc, 'css');
            //js
            await creatFile(fileName, jsArray[0]); //css file
            await saveData(jsArray, fileName, iframesrc, 'js');
            //itemUrl
            // saveData(htmlArray, fileName, iframesrc, 'html');
        }

    }




    http.createServer(start).listen(3300);
}

const creatFile = async function(fileName, secondName) {
    if (secondName === undefined) {
        secondName = '';
        await fs.mkdir('./jqueryUI/' + fileName, function(err) {
            if (err) {
                // console.log(err);
            }
        })
    } else {
        secondName = secondName.split('/');
        let path = '';
        for (let i = 0; i < secondName.length - 1; i++) {
            path += secondName[i] + '/';
            console.log(path);
            await fs.mkdir('./jqueryUI/' + fileName + "/" + path, function(err) {
                if (err) {
                    // console.log(err);
                }
            })
        }
    }
    console.log('1111111' + fileName + '....' + secondName);
    // mkdirs('./jqueryUI/' + fileName + '/' + secondName, function(ee) {
    //     console.log(ee);
    // })
}


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

const saveFile = async function(fileName, data, type, secondName) {
    if (secondName === undefined) {
        secondName = fileName;
    }
    if (type !== '.html' || /html$/.test(secondName)) {
        type = ''
    }
    let file = await fs.createWriteStream('./jqueryUI/' + fileName + '/' + secondName + type, {
        encoding: 'utf-8'
    });
    file.write(data)
}

const saveData = async function(array, fileName, iframesrc, type) {
    if (array.length > 0) {
        for (let k = 0; k < array.length; k++) {
            let data;
            let link = iframesrc + '/' + array[k];
            await axios.get(link)
                .then(function(response) {
                    data = response.data;
                })
                .catch(function(error) {});
            if (data) {
                await saveFile(fileName, data, type, array[k]);
            }
        }
    }
}
var  downloadPic  =  async (uri,  filename,  callback)  =>  {
    request.head(uri,  function(err,  res,  body) {
        console.log('content-type:',  res.headers['content-type']);
        console.log('content-length:',  res.headers['content-length']);
        request(uri).pipe(fs.createWriteStream(filename)).on('close',  callback);
    });
};
start();