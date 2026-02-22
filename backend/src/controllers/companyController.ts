import { Request, Response } from "express";
import Company, { ICompany } from "../models/Company.js";
import { ExtendedError, ErrorResponse } from "../models/Error.js";

export async function getCompanyById(
    req: Request,
    res: Response,
): Promise<Response> {
    try {
        const { id } = req.params;
        const companyId = id as string;

        if (!companyId || companyId === "") {
            return res.status(400).json({
                error: {
                    code: "INVALID_ARGUMENT",
                    message: "Company ID is required",
                },
            } satisfies ErrorResponse);
        }

        const company: ICompany | null = await Company.findById(companyId);

        if (!company) {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: `Company not found with ID: ${id}`,
                },
            } satisfies ErrorResponse);
        }

        return res.json(company);
    } catch (error) {
        console.error("Company lookup error:", error);
        return res.status(500).json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get company details",
            },
        } satisfies ErrorResponse);
    }
}
