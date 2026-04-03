const { Client } = require('@elastic/elasticsearch');
const config = require('./index');
const logger = require('../utils/logger');

let esClient = null;

function getEsClient() {
  if (esClient) return esClient;

  const clientConfig = { node: config.elasticsearch.node };
  if (config.elasticsearch.username && config.elasticsearch.password) {
    clientConfig.auth = {
      username: config.elasticsearch.username,
      password: config.elasticsearch.password,
    };
  }

  esClient = new Client(clientConfig);
  return esClient;
}

async function connectElasticsearch() {
  try {
    const client = getEsClient();
    await client.ping();
    logger.info('Elasticsearch connected');
    await ensureNewsIndex();
  } catch (err) {
    logger.warn({ err: err.message }, 'Elasticsearch unavailable — full-text search disabled');
  }
}

async function ensureNewsIndex() {
  const client = getEsClient();
  const index = config.elasticsearch.indexNews;

  const exists = await client.indices.exists({ index });
  if (exists) return;

  await client.indices.create({
    index,
    body: {
      settings: {
        number_of_shards: 1,
        number_of_replicas: 1,
        analysis: {
          analyzer: {
            news_analyzer: {
              type: 'standard',
              stopwords: '_english_',
            },
          },
        },
      },
      mappings: {
        properties: {
          id: { type: 'keyword' },
          title: { type: 'text', analyzer: 'news_analyzer', boost: 2 },
          content: { type: 'text', analyzer: 'news_analyzer' },
          shortDescription: { type: 'text', analyzer: 'news_analyzer' },
          slug: { type: 'keyword' },
          status: { type: 'keyword' },
          categoryId: { type: 'keyword' },
          authorId: { type: 'keyword' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
        },
      },
    },
  });

  logger.info(`Elasticsearch index '${index}' created`);
}

async function indexNewsDocument(news) {
  try {
    const client = getEsClient();
    await client.index({
      index: config.elasticsearch.indexNews,
      id: news.id,
      document: {
        id: news.id,
        title: news.title,
        content: news.content,
        shortDescription: news.shortDescription,
        slug: news.slug,
        status: news.status,
        categoryId: news.categoryId,
        authorId: news.authorId,
        createdAt: news.createdAt,
        updatedAt: news.updatedAt,
      },
    });
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to index news in Elasticsearch');
  }
}

async function deleteNewsDocument(newsId) {
  try {
    const client = getEsClient();
    await client.delete({ index: config.elasticsearch.indexNews, id: newsId });
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to delete news from Elasticsearch');
  }
}

async function searchNews(query, from = 0, size = 10) {
  try {
    const client = getEsClient();
    const result = await client.search({
      index: config.elasticsearch.indexNews,
      from,
      size,
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: ['title^2', 'content', 'shortDescription'],
                type: 'best_fields',
                fuzziness: 'AUTO',
              },
            },
            { term: { status: 'PUBLISHED' } },
          ],
        },
      },
      highlight: {
        fields: {
          title: {},
          content: { fragment_size: 150, number_of_fragments: 3 },
        },
      },
    });

    return {
      ids: result.hits.hits.map((h) => h._id),
      total: result.hits.total.value,
    };
  } catch (err) {
    logger.warn({ err: err.message }, 'Elasticsearch search failed — falling back to DB');
    return null;
  }
}

module.exports = { getEsClient, connectElasticsearch, indexNewsDocument, deleteNewsDocument, searchNews };
