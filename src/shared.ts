import { LooseObj } from "./types";

export function modifyFilmsArray(apiResponse: any, full: boolean): LooseObj[] {
  /**
   * Extract episode_id, release_date, title and characters list (if full===true)
   * for each movie
   */
  let filmsArray: LooseObj[] = [];
  let arrayToLoop = [];
  if (apiResponse.data) {
    // for GET /films route
    arrayToLoop = apiResponse.data.results;
  } else {
    // for POST /favorites route
    arrayToLoop = apiResponse;
  }
  arrayToLoop.forEach((element: LooseObj) => {
    // Since id in url https://swapi.dev/api/films/:id is different than episode_id in response
    let id: number = parseInt(element.url[element.url.length - 2]);
    let film: LooseObj = {
      id: id,
      release_date: element.release_date,
      title: element.title
    }
    if (full) {
      film['characters'] = element.characters;
    }
    
    filmsArray.push(film);
  });
  return filmsArray;
}