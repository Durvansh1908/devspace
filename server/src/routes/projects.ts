import { Router, Request, Response } from "express";

const router = Router();

const projects: {
  id: string;
  name: string;
  description: string;
  members: { id: string; name: string; domain: string | null }[];
  createdAt: string;
  createdBy: string;
}[] = [];

router.get("/", (req: Request, res: Response) => {
  res.json(projects);
});

router.post("/", (req: Request, res: Response) => {
  const { name, description, members, createdBy } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Project name required" });
  }

  const project = {
    id: Date.now().toString(),
    name,
    description: description || "",
    members: members || [],
    createdAt: new Date().toLocaleDateString(),
    createdBy: createdBy || "unknown"
  };

  projects.push(project);
  res.json(project);
});

router.get("/:id", (req: Request, res: Response) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  res.json(project);
});

export default router;