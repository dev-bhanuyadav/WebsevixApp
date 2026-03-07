import { Schema, model, models } from "mongoose";

export interface ISiteSettings {
  _id?: unknown;
  logoWide?:   string; // full wide logo URL (header)
  logoSquare?: string; // square/icon logo URL (favicon, loading)
  platformName?: string;
  placementFee?: number;
  updatedAt?: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    logoWide:     { type: String, default: "" },
    logoSquare:   { type: String, default: "" },
    platformName: { type: String, default: "Websevix" },
    placementFee: { type: Number, default: 500 },
  },
  { timestamps: true }
);

export const SiteSettings =
  models.SiteSettings ?? model<ISiteSettings>("SiteSettings", SiteSettingsSchema);
