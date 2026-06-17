import { Router, Request, Response } from "express";
import db from "../database";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const projects = db.prepare("SELECT * FROM projects").all();
  const result = projects.map((p: any) => ({
    ...p,
    members: db.prepare("SELECT * FROM project_members WHERE project_id = ?").all(p.id)
  }));
  res.json(result);
});

router.post("/", (req: Request, res: Response) => {
  const { name, description, members, createdBy } = req.body;

  if (!name) return res.status(400).json({ error: "Project name required" });

  const id = Date.now().toString();
  db.prepare("INSERT INTO projects (id, name, description, created_by) VALUES (?, ?, ?, ?)").run(id, name, description || "", createdBy || "unknown");

  if (members && Array.isArray(members)) {
    for (const m of members) {
      const mid = Date.now().toString() + Math.random();
      db.prepare("INSERT INTO project_members (id, project_id, name, domain) VALUES (?, ?, ?, ?)").run(mid, id, m.name, m.domain || null);
    }
  }

  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as any;
  const projectMembers = db.prepare("SELECT * FROM project_members WHERE project_id = ?").all(id);

  res.json({ ...project, members: projectMembers });
});

router.get("/:id", (req: Request, res: Response) => {
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id) as any;
  if (!project) return res.status(404).json({ error: "Project not found" });

  const members = db.prepare("SELECT * FROM project_members WHERE project_id = ?").all(req.params.id);
  res.json({ ...project, members });
});

export default router;