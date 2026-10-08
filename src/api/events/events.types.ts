export type BloomEvent = {
  type: "brew" | "roaster" | "roast" | "endorsement";
  ref_id: string;
  bro_id: string;
  roast_id: string | null;
  roaster_id: string | null;
  method: string | null;
  rating: number | null;
  note: string | null;
  created_at: string;
};
