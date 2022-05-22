import { Character, Film, PrismaClient } from '@prisma/client'
import { AxiosError } from "axios";
import { NextFunction, Response } from "express";
import { LooseObj } from "../types";
import { Workbook } from 'exceljs';

const ExcelJS = require('exceljs');
const axios = require('axios').default;
const prisma = new PrismaClient()

export async function getFilmsData(movieIds: number[], next: NextFunction) {
  /**
   * Gets data from API
   */
  let filmsData = [];
  try {
    for (const movieId of movieIds) {
      filmsData.push(
        axios
          .get(`https://swapi.dev/api/films/${movieId}/`)
          .catch((err: AxiosError) => next(err))
      );
    }
  } catch (err) {
    console.log(err);
  }
  const data = await Promise.all(filmsData);
  // Modify it so resulting array can be modified with modifyFilmsArray
  if (data[0] !== undefined) {
    const dataModified = data.map((element) => element.data);
    return Promise.resolve(dataModified);
  }
}

export async function updateWithCharacters(films: LooseObj[], next: NextFunction) {
  /**
   * Gets characters data from API for each film
   */
  // Fetch character names and return updated films
  for (const film of films) {
    let charactersArray = [];
    for (const character of film.characters) {
      // For each character fetch data
      let characterObj = axios
        .get(character)
        .catch((err: AxiosError) => next(err))
      charactersArray.push(characterObj);
    }
    let result = await Promise.all(charactersArray)
    result = result.map((el) => ({ name: el.data.name }));
    film.characters = result;
  }
  return Promise.resolve(films);
}

export async function checkIfMoviesExist(movieIds: number[]) {
  /**
   * Check if movie already exists in DB and return array of movies that aren't recorded in DB
   */
  let result: (null | Film)[] = [];
  for (const movieId of movieIds) {
    let movieExists = await prisma.film.findUnique({
      where: {
        movie_id: movieId
      }
    })
    result.push(movieExists);
  }
  let newMovieIds = movieIds.filter((movieId, i) => result[i] === null);
  return Promise.resolve(newMovieIds);
}

export async function createNewFilmInDB(film: LooseObj, characters: Character[]) {
  let charactersUpdate = characters.map((character: Character) => {
    return {
      create: { name: character.name },
      where: { name: character.name }
    }
  })
  try {
    await prisma.film.upsert({
      where: { movie_id: film.id },
      update: {
        characters: {
          connectOrCreate: charactersUpdate
        }
      },
      create: {
        movie_id: film.id,
        release_date: film.release_date,
        title: film.title,
        characters: {
          connectOrCreate: charactersUpdate
        }
      }
    })

  } catch (err) {
    console.log(err);
  }
}

export async function createNewFavoriteListInDB(name: string, movieIds: number[], res: Response) {
  let filmsConnect = movieIds.map((movieId: number) => {
    return {
      movie_id: movieId
    }
  });
  try {
    await prisma.favorite.upsert({
      where: {
        name: name
      },
      create: {
        name: name,
        films: {
          connect: filmsConnect
        }
      },
      update: {
        name: name,
        films: {
          connect: filmsConnect
        }
      }
    }).then((response) => {
      if (response) {
        res.status(201).send(response)
      }
    })
  } catch (err) {
    console.log(err);
  }
}

export function modifyDataForExcel(filmArray: LooseObj[]) {
  let prepData: LooseObj = {};
  filmArray.forEach((film: LooseObj) => {
    film.characters.forEach((character: Character) => {
      if (prepData.hasOwnProperty(character.name)) {
        prepData[character.name].films.push(film.title);
      } else {
        prepData[character.name] = {
          films: [film.title]
        };
      }
    });
  })
  prepData = Object.keys(prepData).map((el) => {
    return { character: el, films: prepData[el].films.join() }
  })
  return prepData;
}

export const exportDataExcel = (data: LooseObj): Workbook => {
  let workbook = new ExcelJS.Workbook();
  let worksheet = workbook.addWorksheet("Worksheet");
  worksheet.columns = [
    { header: "Character", key: "character", width: 20 },
    { header: "Films", key: "films", width: 20 }
  ]
  worksheet.addRows(data);
  return workbook;
};