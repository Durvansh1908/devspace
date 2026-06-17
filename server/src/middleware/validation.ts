import { Request, Response, NextFunction } from "express";

export const validateProjectCreation = (req: Request, res: Response, next: NextFunction) => {
  const { name, description, createdBy } = req.body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ error: "Project name is required and must be non-empty" });
  }

  if (name.length > 100) {
    return res.status(400).json({ error: "Project name must be less than 100 characters" });
  }

  if (description && typeof description !== "string") {
    return res.status(400).json({ error: "Description must be a string" });
  }

  if (description && description.length > 500) {
    return res.status(400).json({ error: "Description must be less than 500 characters" });
  }

  next();
};

export const validateMemberData = (req: Request, res: Response, next: NextFunction) => {
  const { members } = req.body;

  if (members && Array.isArray(members)) {
    for (const member of members) {
      if (!member.name || typeof member.name !== "string") {
        return res.status(400).json({ error: "Each member must have a non-empty name" });
      }

      if (member.domain && typeof member.domain !== "string") {
        return res.status(400).json({ error: "Member domain must be a string" });
      }

      const validDomains = ["Frontend", "Backend", "Database", "DevOps", "UI/UX"];
      if (member.domain && !validDomains.includes(member.domain)) {
        return res.status(400).json({ 
          error: `Invalid domain. Must be one of: ${validDomains.join(", ")}` 
        });
      }
    }
  }

  next();
};

export const validateProjectId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!id || typeof id !== "string" || id.trim().length === 0) {
    return res.status(400).json({ error: "Valid project ID is required" });
  }

  next();
};
