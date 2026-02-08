import Company from "../models/Company.js";
export async function getCompanyById(req, res) {
    try {
        const { id } = req.params;
        const companyId = id;
        if (!companyId || companyId === "") {
            return res.status(400).json({
                error: {
                    code: "INVALID_ARGUMENT",
                    message: "Company ID is required",
                },
            });
        }
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: `Company not found with ID: ${id}`,
                },
            });
        }
        return res.json(company);
    }
    catch (error) {
        console.error("Company lookup error:", error);
        return res.status(500).json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get company details",
            },
        });
    }
}
