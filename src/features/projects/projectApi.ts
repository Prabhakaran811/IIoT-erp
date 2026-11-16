import api from "../../services/api";
import type { Project, ProjectPayload } from "./projectTypes";

/* eslint-disable @typescript-eslint/no-explicit-any */
const pickOne = (res: any): Project => res.data?.data ?? res.data?.project ?? res.data;

const pickList = (res: any): Project[] => {
  const d = res.data;
  if (Array.isArray(d)) return d;
  return d?.data ?? d?.projects ?? [];
};

export const projectApi = {
  getAll: async (): Promise<Project[]> => pickList(await api.get("/projects")),

  getById: async (id: string): Promise<Project> =>
    pickOne(await api.get(`/projects/${id}`)),

  create: async (payload: ProjectPayload): Promise<Project> =>
    pickOne(await api.post("/projects", payload)),

  update: async (id: string, payload: Partial<ProjectPayload>): Promise<Project> =>
    pickOne(await api.put(`/projects/${id}`, payload)),

  remove: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
};