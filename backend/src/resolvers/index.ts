import { projectQueries } from './projects/queries';
import { projectMutations } from './projects/mutations';
import { articleQueries } from './articles/queries';
import { articleMutations } from './articles/mutations';
import { userQueries } from './users/queries';
import { userMutations } from './users/mutations';
import { rateTestQueries } from './rateTest/queries';
import { chatbotQueries } from './chatbot/queries';
import { chatbotMutations } from './chatbot/mutations';
import { screamMutations } from './screams/mutations';
import { sendGogginsEmailMutation } from './resend/mutations';
import { ApodQueries } from './apod/queries';
import { stripeMutations } from './stripe/mutations';
import Project from '../models/Project';
import { slugify } from '../utils/slugUtils';
import type { ApodResponse } from '../services/apod/';

// Combine all resolvers
export const resolvers = {
  Query: {
    ...projectQueries,
    ...articleQueries,
    ...userQueries,
    ...rateTestQueries,
    ...chatbotQueries,
    ...ApodQueries,
  },
  
  Mutation: {
    ...projectMutations,
    ...articleMutations,
    ...userMutations,
    ...chatbotMutations,
    ...screamMutations,
    ...stripeMutations,
    // Wire Resend mutation
    sendGogginsEmail: sendGogginsEmailMutation,
  },
  
  Project: {
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
