export type Roaster = {
  id: string;
  name: string;
  location: string | null;
  created_by: string;
  created_at: string;
};

export type NewRoaster = Pick<Roaster, "name" | "location" | "created_by">;
