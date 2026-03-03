export const ARTICLE_BY_SLUG_QUERY = `
  query ArticleBySlug($slug: String!) {
    articleBySlug(slug: $slug) {
      id
      slug
      title
      content
      imageUrl
      excerpt
      tags
      published
      createdAt
      updatedAt
    }
  }
`;

export const PUBLISHED_ARTICLES_QUERY = `
  query PublishedArticles {
    publishedArticles {
      id
      slug
      title
      content
      excerpt
      imageUrl
      tags
      createdAt
      updatedAt
    }
  }
`;

export const PROJECT_BY_SLUG_QUERY = `
  query ProjectBySlug($slug: String!) {
    projectBySlug(slug: $slug) {
      id
      slug
      title
      description
      imageUrl
      githubUrl
      technologies
      createdAt
      updatedAt
    }
  }
`;

export const PROJECTS_QUERY = `
  query Projects {
    projects {
      id
      slug
      title
      description
      imageUrl
      githubUrl
      technologies
      createdAt
      updatedAt
    }
  }
`;
