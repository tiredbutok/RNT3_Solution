import { NextFunction, Request, Response } from "express";
import { exportDataExcel, checkIfMoviesExist, getFilmsData, createNewFavoriteListInDB, createNewFilmInDB, updateWithCharacters, modifyDataForExcel } from "./controllersHelpers";
import { modifyFilmsArray } from "../shared";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient();

export const favoritesPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, movieIds } = req.body;
    if (!name || !movieIds) {
      return
    }
    // Chekc if movie already exists in database
    const tempMovieIds = await checkIfMoviesExist(movieIds);
    // If it does skip adding it to db
    if (tempMovieIds.length !== 0) {
      const films = await getFilmsData(tempMovieIds, next);
      if (films) {
        const modifiedFilms = modifyFilmsArray(films, true);
        const filmsComplete = await updateWithCharacters(modifiedFilms, next);
        // Create new Film and Character records in DB
        for (const film of filmsComplete) {
          await createNewFilmInDB(film, film.characters);
        }
      } else {
        return;
      }
    }
    // Create favorite list
    await createNewFavoriteListInDB(name, movieIds, res);
  } catch (err) {
    console.log(err)
  }
}

export const favoritesGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // For pagination
    let page = 1;
    let pageSize = 5;
    if (req.query.page) {
      page = Number(req.query.page);
    }
    // For search
    let searchString = '';
    if (req.query.search) {
      searchString = String(req.query.search);
    }
    
    const results = await prisma.favorite.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where: {
        name: {
          contains: searchString,
          mode: 'insensitive'
        }
      }
    })
    res.status(200).json(results);
  } catch (err) {
    console.log(err);
  }
}

export const favoritesGetId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.favorite.findMany({
      where: { id: id },
      include: {
        films: {
          include: {
            characters: true
          }
        }
      }
    }).then((response) => {
      if (response[0]) {
        res.status(200).json(response)
        return;
      }
      res.status(404).json({ message: "item not found" })
    });
  } catch (err) {
    console.log(err);
  }
}

export const favoritesGetFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let id = parseInt(req.params.id);
    let result = await prisma.favorite.findUnique({
      where: {
        id: id
      },
      include: {
        films: {
          include: {
            characters: true
          }
        }
      }
    })
    if (result) {
      let data = modifyDataForExcel(result.films);
      let workbook = exportDataExcel(data);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + "data.xlsx"
      );
      return workbook.xlsx.write(res).then(function () {
        res.status(200).end();
      });
    }
  } catch (err) {
    console.log(err);
  }
}