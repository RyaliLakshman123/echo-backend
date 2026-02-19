import fetch from "node-fetch";

// Existing function — unchanged
export async function fetchNews(category, page) {
  const url = `https://newsapi.org/v2/top-headlines?country=us&category=${category}&page=${page}&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`;
  const response = await fetch(url);
  return await response.json();
}

// NEW function — for automobile, movies etc
export async function fetchNewsByKeyword(q, sortBy = "publishedAt", page = 1) {
  const url = `https://newsapi.org/v2/everything?q=${q}&sortBy=${sortBy}&page=${page}&pageSize=10&language=en&apiKey=${process.env.NEWS_API_KEY}`;
  const response = await fetch(url);
  return await response.json();
}
