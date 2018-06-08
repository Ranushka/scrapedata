'use strict';

const Nightmare = require('nightmare');
const fetch = require('node-fetch');
const vo = require('vo');

const nightmare = Nightmare({
  show: false,
});



console.log('get main links', 'https://www.mamasandpapas.ae/');

nightmare
  .goto(`https://www.mamasandpapas.ae/`)
  .wait(2000)
  .evaluate(function () {
    var brandPageList = document.querySelectorAll('nav .dropdown > .container section > a.needsclick');
    var brandPageLinks = [];
    brandPageList.forEach(function (item) {

      brandPageLinks.push({
        "name": item.innerText.trim(),
        "url": item.href,
        "site": "mamasandpapas",
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

function* saveToDb(params) {
  console.log(params)
  return yield fetch('https://sitedata-mum.herokuapp.com/api/links', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params) 
    })
    .then(res => res.json())
    .then(json => {
      console.log(json)
    });
}

function* prepToSave(catLists) {
  var i, j, temparray = [], chunk = 100;
  for (i = 0, j = catLists.length; i < j; i += chunk) {
    yield saveToDb(catLists.slice(i, i + chunk));
  }
}