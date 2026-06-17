// src/api/fileSystem.ts
// Real disk operations for project files, scoped to $HOME/devspace-projects/**
// (matches the fs plugin scope set in tauri.conf.json)

import { mkdir, writeTextFile, readTextFile, readDir, remove, rename, exists } from "@tauri-apps/plugin-fs";
import { homeDir, join } from "@tauri-apps/api/path";

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

async function getProjectRoot(projectId: string, domain: string): Promise<string> {
  const home = await homeDir();
  return join(home, "devspace-projects", projectId, domain);
}

export async function ensureProjectFolder(projectId: string, domain: string): Promise<string> {
  const path = await getProjectRoot(projectId, domain);
  const alreadyExists = await exists(path);
  if (!alreadyExists) {
    await mkdir(path, { recursive: true });
  }
  return path;
}

export async function listFiles(projectId: string, domain: string): Promise<FileNode[]> {
  const root = await ensureProjectFolder(projectId, domain);
  const entries = await readDir(root);
  return entries.map((e) => ({
    name: e.name ?? "unknown",
    path: `${root}/${e.name}`,
    isDirectory: e.isDirectory,
  }));
}

export async function createFile(projectId: string, domain: string, fileName: string, content = ""): Promise<string> {
  const root = await ensureProjectFolder(projectId, domain);
  const path = await join(root, fileName);
  await writeTextFile(path, content);
  return path;
}

export async function createFolder(projectId: string, domain: string, folderName: string): Promise<string> {
  const root = await ensureProjectFolder(projectId, domain);
  const path = await join(root, folderName);
  await mkdir(path, { recursive: true });
  return path;
}

export async function readFile(path: string): Promise<string> {
  return readTextFile(path);
}

export async function saveFile(path: string, content: string): Promise<void> {
  await writeTextFile(path, content);
}

export async function deleteFile(path: string): Promise<void> {
  await remove(path);
}

export async function renameFile(oldPath: string, newPath: string): Promise<void> {
  await rename(oldPath, newPath);
}