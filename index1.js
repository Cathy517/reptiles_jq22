const http = require('http'),
    axios = require('axios'),
    cheerio = require('cheerio'),
    fs = require('fs'),
    path = require('path');

const website = 'http://www.jq22.com/';

const start = async function() {
    let pageLength = 2;
    for (let i = 1; i < 2; i++) {
       let urlsArray = [];

        //获取列表 每页15条数据
        await axios.get(website + 'jqueryUI-' + i + '-jq')
            .then(function(response) {
                let $ = cheerio.load(response.data);
                $('#zt .m0 .col-lg-4').each(function() {
                    let link = $(this).find('.cover-info a').attr('href');
                    if (link !== undefined) {
                        urlsArray.push(website + link);
                    }
                });
            })
            .catch(function(error) {});


        //列表中的链接进行爬取
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


            let iframesrc;
            let fileName;
            //爬取查看演示按钮的链接获取到 实例的内容
            await axios.get(caseArray)
                .then(function(response) {
                    let $ = cheerio.load(response.data);
                    fileName = $('.logoTop').find('a').text();
                    let iframeUrl = $('#iframe').attr('src');
                    iframesrc = iframeUrl;
                })
                .catch(function(error) {});

            let cssArray = [],
                jsArray = [],
                itemUrlsArray = [];
            let iframedata;
            //根据实例中 iframe的链接 拿数据
            await axios.get(iframesrc)
                .then(function(response) {
                    iframedata = response.data;
                    let $ = cheerio.load(response.data);
                    let title = $('title').text();
                    let verify = {
                        http: /^[(http:)(https:)]/,
                        position: /^(.\/)/
                    };
                    //获取实例中的 css 文件路径 
                    let cssHref = $('link[rel="stylesheet"]'); //css
                    if(cssHref.length>0){
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
                    }
                    //获取实例中的 js 文件路径 
                    let jsHref = $('script'); //js
                    if(jsHref.length>0){
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
                    }
                    //获取实例中的 item 文件路径                    
                    let itemUrl = $('a.demo'); //itemUrls
                    if(itemUrl.length>0){                        
                        itemUrl.each(function() {
                            let item = $(this).attr('href');
                            if (item) {
                                if (!verify.http.test(item)) {
                                    if (verify.position.test(item)) {
                                        item = item.slice(2, item.length);
                                    }
                                    itemUrlsArray.push(item);
                                    console.log(title + ' url:' + itemUrlsArray);
                                }
                            }
                        })
                    }
                })
                .catch(function(error) {});

            //新建文件夹
            await creatFile(fileName); //file

            //创建并保存html 文件
            await saveFile(fileName, iframedata, '.html');

            //创建css 文件目录
            await creatFile(fileName, cssArray[0]); //file css

            //创建js 文件目录
            await creatFile(fileName, jsArray[0]); //file js

            //爬取css
            findText(fileName, cssArray , 'css' ,iframesrc);
            //爬取js
            findText(fileName, jsArray , 'js' ,iframesrc);

        }
        if(i == pageLength-1){
            console.log("well down");
        }
    }


    http.createServer(start).listen(3300);
}

const findText = async function(fileName, array, type, iframesrc){
    if(array.length>0){
        for(let i = 0; i<array.length;i++){
            let text;
            await axios.get(iframesrc+"/"+array[i])
                .then(response => {
                    text = response.data;
                });
            //创建并保存css
            saveFile(fileName, text, type, array[i])
        }
    }
}

const creatFile = async function(fileName, secondName) {
    if (secondName === undefined) {
        secondName = '';
        await fs.mkdir('./jQuery-UI/' + fileName + secondName, function(err) {
            if (err) {
                // console.log(err);
            }
        });
    }else {
        let split = secondName.split('/');
        secondName = '';
        for(let x=0;x<split.length-1;x++){
            secondName += split[x] + "/";
            await fs.mkdir('./jQuery-UI/' + fileName + "/" + secondName, function(err) {
                if (err) {
                    // console.log(err);
                }
            })
        }
        
    }
}


const saveFile = async function(fileName, data, type, secondName) {
    if (secondName === undefined) {
        secondName = fileName;
    }
    if (type !== '.html' || /html$/.test(secondName)) {
        type = ''
    }
    let file = await fs.createWriteStream('./jQuery-UI/' + fileName + '/' + secondName + type, {
        encoding: 'utf-8'
    });
    file.write(data)
}

start();