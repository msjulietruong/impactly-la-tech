import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        status: "doing ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

export default router;
