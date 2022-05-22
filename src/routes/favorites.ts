/**
 * ROUTE /favorites/*
 */
import express, { Request, Response } from "express";
import { favoritesPost, favoritesGet, favoritesGetId, favoritesGetFile } from "../controllers/favoritesControllers";

const router = express.Router();
router.use(express.json())


router
  .route("/")
  .get(favoritesGet)
  .post(favoritesPost)

router
  .get("/:id", favoritesGetId)
  .get("/:id/file", favoritesGetFile)

export default router;