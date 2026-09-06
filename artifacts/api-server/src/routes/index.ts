import { Router, type IRouter } from "express";
import healthRouter from "./health";
import madadRouter from "./madad";

const router: IRouter = Router();

router.use(healthRouter);
router.use(madadRouter);

export default router;
