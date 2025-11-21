import { Router } from "express";

import { listBrands } from "../controllers/brand.controller.js";

const router = Router();

router.get("/", listBrands);

export default router;
