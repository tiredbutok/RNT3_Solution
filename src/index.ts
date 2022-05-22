import express, { Application, Request, Response, NextFunction } from 'express';
import films from "./routes/films";
import favorites from "./routes/favorites";

const jsonErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).send({ error: err });
}

const app: Application = express();
app.use('/films', films);
app.use('/favorites', favorites);
app.use(jsonErrorHandler)

app.get("/", (req: Request, res: Response) => {
  res.send("hello!");
})

app.listen(3000, () => console.log("Server running"));