import { projectQueries } from './projects/queries';
import { projectMutations } from './projects/mutations';
import { articleQueries } from './articles/queries';
import { articleMutations } from './articles/mutations';
import { userQueries } from './users/queries';
import { userMutations } from './users/mutations';
import { chatbotQueries } from './chatbot/queries';
import { chatbotMutations } from './chatbot/mutations';
import { screamMutations } from './screams/mutations';
import { sendGogginsEmailMutation } from './resend/mutations';
import { ApodQueries } from './apod/queries';
import { WritingQueries } from './writing/queries';
import { stripeMutations } from './stripe/mutations';
import { stripeQueries } from './stripe/queries';
import { noteQueries } from './notes/queries';
import { noteMutations } from './notes/mutations';
import { pinQueries } from './pins/queries';
import { pinMutations } from './pins/mutations';
import { paymentQueries } from './payments/queries';
import Project from '../models/Project';
import { slugify } from '../utils/slugUtils';
import { isoDate } from '../utils/dates';
import type { ApodResponse } from '../services/apod/';

// Combine all resolvers
export const resolvers = {
  Query: {
    ...projectQueries,
    ...articleQueries,
    ...userQueries,
    ...chatbotQueries,
    ...ApodQueries,
    ...WritingQueries,
    ...stripeQueries,
    ...noteQueries,
    ...pinQueries,
    ...paymentQueries,
  },

  Mutation: {
    ...projectMutations,
    ...articleMutations,
    ...userMutations,
    ...chatbotMutations,
    ...screamMutations,
    ...stripeMutations,
    ...noteMutations,
    ...pinMutations,
    // Wire Resend mutation
    sendGogginsEmail: sendGogginsEmailMutation,
  },
  
  // Every date field is ISO 8601; without these, GraphQL sends epoch-ms strings.
  User: {
    lastLogin: isoDate('lastLogin'),
    createdAt: isoDate('createdAt'),
    updatedAt: isoDate('updatedAt'),
  },

  Article: {
    publishedAt: isoDate('publishedAt'),
    createdAt: isoDate('createdAt'),
    updatedAt: isoDate('updatedAt'),
  },

  Note: {
    date: isoDate('date'),
    createdAt: isoDate('createdAt'),
    updatedAt: isoDate('updatedAt'),
  },

  Payment: {
    createdAt: isoDate('createdAt'),
  },

  Pin: {
    date: isoDate('date'),
    createdAt: isoDate('createdAt'),
  },

  Project: {
    createdAt: isoDate('createdAt'),
    updatedAt: isoDate('updatedAt'),
    // Ensure non-null slug by backfilling if missing
    async slug(parent: any) {
      if (parent.slug) return parent.slug;
      if (!parent.title) return null;
      const generated = slugify(parent.title);
      try {
        await Project.findByIdAndUpdate(parent.id, { $set: { slug: generated } }, { new: false });
      } catch (e) {
        // ignore duplicate or other errors here; still return computed slug
      }
      return generated;
    },
  },

  // Map NASA API snake_case fields to GraphQL camelCase
  Apod: {
    mediaType: (parent: ApodResponse) => parent.media_type,
    serviceVersion: (parent: ApodResponse) => parent.service_version,
    apodUrl: (parent: ApodResponse) => parent.apod_url,
  },
};
