/**
 * ROUTE /films/*
 */
import { AxiosError } from "axios";
import express, { NextFunction, Request, Response } from "express";
import { modifyFilmsArray } from "../shared";
const axios = require('axios').default;
const router = express.Router();

// /films route
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiResponse = await axios
      .get("https://swapi.dev/api/films/")
      .catch((err: AxiosError) => next(err));
    if (apiResponse) {
      const films = modifyFilmsArray(apiResponse, false);
      res.json(films);
    }
  } catch (err) {
    console.log(err);
  }
})

export default router;
