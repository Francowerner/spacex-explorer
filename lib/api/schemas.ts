import { z } from "zod";

const LaunchLinksSchema = z
  .object({
    patch: z
      .object({
        small: z.string().url().nullable(),
        large: z.string().url().nullable(),
      })
      .nullable()
      .optional(),
    webcast: z.string().url().nullable().optional(),
    article: z.string().url().nullable().optional(),
    wikipedia: z.string().url().nullable().optional(),
    flickr: z
      .object({
        small: z.array(z.string().url()).default([]),
        original: z.array(z.string().url()).default([]),
      })
      .optional(),
  })
  .passthrough();

export const LaunchSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    date_utc: z.string(),
    date_unix: z.number().optional(),
    success: z.boolean().nullable(),
    upcoming: z.boolean(),
    details: z.string().nullable().optional(),
    rocket: z.string().nullable().optional(),
    launchpad: z.string().nullable().optional(),
    flight_number: z.number().optional(),
    links: LaunchLinksSchema.optional(),
  })
  .passthrough();

export type Launch = z.infer<typeof LaunchSchema>;

export const LaunchesPageSchema = z
  .object({
    docs: z.array(LaunchSchema),
    totalDocs: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    page: z.number(),
    pagingCounter: z.number().optional(),
    hasPrevPage: z.boolean(),
    hasNextPage: z.boolean(),
    prevPage: z.number().nullable(),
    nextPage: z.number().nullable(),
  })
  .passthrough();

export type LaunchesPage = z.infer<typeof LaunchesPageSchema>;

export const RocketSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    description: z.string().optional(),
    wikipedia: z.string().url().nullable().optional(),
    country: z.string().optional(),
    company: z.string().optional(),
    first_flight: z.string().optional(),
    success_rate_pct: z.number().optional(),
    flickr_images: z.array(z.string().url()).default([]),
    active: z.boolean().optional(),
  })
  .passthrough();

export type Rocket = z.infer<typeof RocketSchema>;

export const LaunchpadSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    full_name: z.string(),
    locality: z.string().optional(),
    region: z.string().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    status: z.string(),
    details: z.string().nullable().optional(),
    images: z
      .object({
        large: z.array(z.string().url()).default([]),
      })
      .optional(),
  })
  .passthrough();

export type Launchpad = z.infer<typeof LaunchpadSchema>;
