'use strict';

const Nightmare = require('nightmare');
const fetch = require('node-fetch');
const vo = require('vo');

const nightmare = Nightmare({
  gotoTimeout: 60000,
  show: false,
});

console.log(`get main links start`);

var aaa = [
  "https://www.nisnass.ae/women/brands", 
  "https://www.nisnass.ae/men/brands", 
  "https://www.nisnass.ae/kids"
];

vo(start)(function (err, result) {
  if (err) throw err;
});

function* start() {
  var i = 0;
  while (i < aaa.length) {
    yield getMultipalSoursLinks(aaa[i])
    i++
  }
}

function* getMultipalSoursLinks(params) {
  console.log('get main links', params)
  var nightmare = Nightmare();

  yield nightmare
    .goto(`https://www.nisnass.ae/women/brands`)
    .wait(2000)
    .evaluate(function () {
      var brandPageList = document.querySelectorAll('.Brands-names a');
      var brandPageLinks = [];
      brandPageList.forEach(function (item) {

        brandPageLinks.push({
          "name": item.innerText.trim(),
          "url": item.href,
          "site": "nisnass",
          "scrap": false
        });

      });
      return brandPageLinks;
    })
    .end()
    .then(function (result) {
      vo(prepToSave)(result, function (err) {
        console.log(err)
        if (err) throw err;
      });
    })
    .catch(function (error) {
      console.error('Error:', error);
    });

}

function* saveToDb(params) {
  console.log(params)
  return yield fetch('https://sitedata-mum.herokuapp.com/api/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })
    .then(res => res.json())
    .then(json => {
      console.log(json)
    });
}

function* prepToSave(catLists) {
  var i, j, temparray = [],
    chunk = 100;
  for (i = 0, j = catLists.length; i < j; i += chunk) {
    yield saveToDb(catLists.slice(i, i + chunk));
  }
}


