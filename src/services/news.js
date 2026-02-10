import fetch from "node-fetch";

export async function fetchNews(category, page) {
  const url = `https://newsapi.org/v2/top-headlines?country=us&category=${category}&page=${page}&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`;
  const response = await fetch(url);
  return await response.json();
}
