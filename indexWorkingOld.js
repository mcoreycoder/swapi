// working to sequentially call next page pn people and map residents on planets, flow control seem good.
const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const rp = require("request-promise");
const app = express();


const urlBase = `https://swapi.co/api/`;
let path = '';
let nextPage = '';
let apiResponse = [];
let peopleCollection = [];
let planetCollection = [];
let residentsCollected = false;
let peopleCollected = false;


app.get('/',
  logHome,
);

function logHome() {
  console.log("Home Page")
}

app.get('/people',
  findPeople,
  jsonResponse,
);

app.get('/planets',
  findPlanets,
  jsonResponse,
);

function findPeople(req, res, next) {
  path = `people/`;
  if (peopleCollected === false) {
  // apiCollection = [];
  url = urlBase + path
  request(url, handleApiResponse(res, next));
} else {next()}
  return path;
}

function findPlanets(req, res, next) {
  path = `planets/`
  if (residentsCollected === false) {
 // apiCollection = [];
 url = urlBase + path
 request(url, handleApiResponse(res, next));
  }else {next()}
  return path;
}

function extractNames(param) {
	return Promise.all(
		param.map(residentUrl => {
			return rp({
				url: residentUrl,
			  	json: true
			})
		})
	).then(residents => {
		const residentNames = residents.map(resident => {
			return resident.name
		})
		return residentNames;
	}).catch (err => {
		console.log(err);
	})
}

 function mapPlanets (res, body, next) {

  res.local = {
    success: true,
    results: JSON.parse(body).results,
    nextPage: JSON.parse(body).next,
    count: JSON.parse(body).count
  }

  apiResponse = res.local;
  nextPage = res.local.nextPage;
  planetCollection = [...planetCollection, ...res.local.results];

  console.log("planets/")
  return Promise.all(
    planetCollection.map(planet => {
      const planetMapped = planet;
      return extractNames(planetMapped.residents)
      .then(residentNames => {
        planetMapped.residents = residentNames;
        residentsCollected = true
        return planetCollection, residentsCollected
      })
    })
  )
  .then(() => {
    console.log('residentsCollected')
    return next()
  })
  
}

// function paginate(res, body, next){
//   while (nextPage !== null) {
//     res.local = {
//       success: true,
//       results: JSON.parse(body).results,
//       nextPage: JSON.parse(body).next,
//       count: JSON.parse(body).count
//     }
  
//     apiResponse = res.local;
//     nextPage = res.local.nextPage;
//     peopleCollection = [...peopleCollection, ...res.local.results];
//     console.log("request nextPage", nextPage, 'path', path)
//     return request(nextPage, handleApiResponse(res, next) )
//   } 
//   return next
// }


function handleApiResponse(res, next) {
  return (err, response, body) => {
    if (err || body[0] === '<') {
      res.locals = {
        success: false,
        error: err || 'Invalid request.'
      };
      return next();

    } else if (path === `people/`){
      // paginate(res, body, next)
      while (nextPage !== null) {
        res.local = {
          success: true,
          results: JSON.parse(body).results,
          nextPage: JSON.parse(body).next,
          count: JSON.parse(body).count
        }

        apiResponse = res.local;
        nextPage = res.local.nextPage;
        peopleCollection = [...peopleCollection, ...res.local.results];
        console.log("request nextPage", nextPage, 'path', peopleCollected)
        return request(nextPage, handleApiResponse(res, next) )
      } 
    } else if (path === `planets/` ){
      if (residentsCollected === false) {
        return mapPlanets (res, body, next)
      }
      return next();
    } 
    else if (peopleCollected = true && residentsCollected === true) {
        console.log("end of calls")
      }
    

    return next(console.log("handleApiResponse:", apiResponse.success, apiResponse.count, peopleCollected));

  };
}

function jsonResponse(req, res, next) {
console.log("jsonResponse:");

  if (path === `people/`) {
    peopleCollected = true;
    console.log("peopleCollected:", peopleCollected);
    return peopleCollected, res.json(peopleCollection);
  } else if (path === `planets/`){
    console.log("residentsCollected:", residentsCollected);
    return res.json(planetCollection);
  }
}


const server = app.listen(3000, () => {
  const host = server.address().address,
    port = server.address().port;

  console.log('API listening at http://%s:%s', host, port);
});