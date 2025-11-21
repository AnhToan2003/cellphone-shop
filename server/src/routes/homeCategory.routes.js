import { Router } from "express";

import { listHomeCategories } from "../controllers/homeCategory.controller.js";

const router = Router();

router.get("/", listHomeCategories);

export default router;
