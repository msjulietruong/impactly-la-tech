import express from "express";

import getHealth from "../controllers/healthController.js";
import lookupController from "../controllers/lookupController.js";
import companyController from "../controllers/companyController.js";
import scoreController from "../controllers/scoreController.js";

import validateObjectId from "../middleware/validateObjectId.js";

const router = new express.Router();

router.get("/health", getHealth);

// NOTE(liam): v1
router.get("/v1/lookup", lookupController.lookupProduct);
router.get("/v1/company", companyController.getCompany);
router.get(
  "/v1/company/:id",
  validateObjectId("id"),
  companyController.getCompany
);
router.get(
  "/v1/score/:companyId",
  validateObjectId("companyId"),
  scoreController.getScore
);

export default router;
