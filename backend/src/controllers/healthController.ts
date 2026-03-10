import { Request, Response } from "express";

interface HealthResponse {
    status: "healthy";
    timestamp: string;
    uptime: number;
    environment: string;
}

export const getHealth = (
    _req: Request,
    res: Response<HealthResponse>,
): void => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
    });
};
