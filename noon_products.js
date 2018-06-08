'use strict';

var fs = require('fs');
var fetch = require('node-fetch');

var nextExists = true;

const baseUrl = `https://safe-dusk-29222.herokuapp.com`;

const Nightmare = require('nightmare')
const nightmare = Nightmare({
  show: true
})

var vo = require('vo');

var siteName = "noon";

vo(start)(function (err, result) {
  if (err) throw err;
});

function* start() {

  let i = 0;
  console.log('kicking off')
  while (nextExists) {
    let link, urlToScrap, doneSavedata;
    urlToScrap = yield getNewScrapURL();
    if (urlToScrap.greeting) {
      yield getProductLinks(urlToScrap.greeting.url);
    } else {
      console.log("All links are DONE")
      nextExists = false;
    }
    i++;
  }
  console.log(`${siteName} done save data ${i}`);

}


function* getNewScrapURL() {
  return yield fetch(`https://sitedata-mum.herokuapp.com/api/links/nextScrapLink?site=${siteName}`, {
      method: 'GET'
    }).then(res => res.json())
    .then(json => {
      return json;
    });
}

function* getProductLinks(catLists) {

  var nightmare = Nightmare(),
    gotoUrl = catLists,
    allLinks = [];

  let scrapedData = yield nightmare
    .goto(gotoUrl)


  while (nextExists) {

    // loging scraping site url
    var url = yield nightmare.url();
    console.log(url);

    yield nightmare
      .wait(4000)
      .evaluate(function () {

        var links = [],
          productList = document.querySelectorAll('[class*="ProductBox__wrapper"] a'),
          nextExists = document.querySelectorAll('[class*="Pagination__nextLink"]')[0].parentElement.offsetWidth > 0;

        // going through each product
        productList.forEach(function (item) {
          links.push({
            "name": item.querySelectorAll('[class*="ProductBox__productName"]')[0].innerText,
            "url": item.href,
            "price": item.getElementsByClassName('value')[0].innerText.trim(),
            "brand": item.querySelectorAll('[class*="ProductBox__brandName"]')[0].innerText.trim(),
            "site": "noon",
          });
        });

        // return all the values
        return {
          'links': links,
          'nextExists': nextExists
        };

      }).then(function (resalt) {
        nextExists = resalt.nextExists;

        vo(saveToDb)(resalt.links, function(err, result) {
          if (err) throw err;
        });

        // await saveToDb(resalt.links);
      })

    if (nextExists) {
      yield nightmare
        .evaluate(function () {
          document.querySelectorAll('[class*="Pagination__nextLink"]')[0].click()
        })
        .wait(4000);
    }
  }

  yield nightmare.end();

}

function* saveToDb(params) {

  var jsonData = JSON.stringify(params);
  return yield fetch('https://sitedata-mum.herokuapp.com/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: jsonData
    })
    .then(res => res.json())
    .then(json => {
      console.log('data saved')
    });
}
