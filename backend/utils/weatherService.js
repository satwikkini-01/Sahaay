import axios from "axios";
import NodeCache from "node-cache";
import logger from "./logger.js";

// Cache weather data for 30 minutes to reduce API calls
const weatherCache = new NodeCache({ stdTTL: 1800 });

/**
 * Get weather data for given coordinates
 * @param {Array} coordinates - [longitude, latitude]
 * @returns {Object} Weather data
 */
export const getWeatherData = async (coordinates) => {
    try {
        const [lon, lat] = coordinates;
        const cacheKey = `weather_${lat}_${lon}`;

        // Check cache first
        const cached = weatherCache.get(cacheKey);
        if (cached) {
            logger.info("Weather data retrieved from cache");
            return cached;
        }

        // Fetch from OpenWeatherMap API
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
            logger.warn("OpenWeatherMap API key not configured");
            return null;
        }

        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const response = await axios.get(url, { timeout: 5000 });

        const weatherData = {
            temperature: response.data.main.temp,
            feelsLike: response.data.main.feels_like,
            humidity: response.data.main.humidity,
            pressure: response.data.main.pressure,
            weather: response.data.weather[0].main,
            description: response.data.weather[0].description,
            windSpeed: response.data.wind.speed,
            clouds: response.data.clouds.all,
            rain: response.data.rain?.["1h"] || 0,
            snow: response.data.snow?.["1h"] || 0,
        };

        // Cache the result
        weatherCache.set(cacheKey, weatherData);
        logger.info(`Weather data fetched for coordinates [${lat}, ${lon}]`);

        return weatherData;
    } catch (error) {
        logger.error("Error fetching weather data:", error.message);
        return null;
    }
};

/**
 * Calculate priority boost based on weather conditions and complaint category
 * @param {Array} coordinates - [longitude, latitude]
 * @param {String} category - Complaint category
 * @returns {Object} Priority boost and explanation
 */
export const getWeatherPriorityBoost = async (coordinates, category) => {
    try {
        const weather = await getWeatherData(coordinates);

        if (!weather) {
            return {
                boost: 0,
                weatherData: null,
                explanation: "Weather data unavailable",
            };
        }

        let boost = 0;
        const explanations = [];

        const normalizedCategory = category.toLowerCase();

        // Heavy rain impacts
        if (weather.rain > 10) {
            if (
                normalizedCategory === "water" ||
                normalizedCategory === "roads"
            ) {
                boost += 30;
                explanations.push(
                    `Heavy rain (${weather.rain}mm/h) increases ${category} issue urgency`
                );
            } else if (normalizedCategory === "electricity") {
                boost += 20;
                explanations.push(`Heavy rain may affect electrical systems`);
            }
        } else if (weather.rain > 5) {
            if (
                normalizedCategory === "water" ||
                normalizedCategory === "roads"
            ) {
                boost += 15;
                explanations.push(
                    `Moderate rain (${weather.rain}mm/h) affects ${category} issues`
                );
            }
        }

        // Snow impacts
        if (weather.snow > 5) {
            if (
                normalizedCategory === "roads" ||
                normalizedCategory === "rail"
            ) {
                boost += 25;
                explanations.push(
                    `Heavy snow (${weather.snow}mm/h) severely impacts ${category}`
                );
            }
        }

        // Extreme temperatures
        if (weather.temperature > 40) {
            if (
                normalizedCategory === "electricity" ||
                normalizedCategory === "water"
            ) {
                boost += 20;
                explanations.push(
                    `Extreme heat (${weather.temperature}°C) increases demand for ${category} services`
                );
            }
        } else if (weather.temperature < 0) {
            if (normalizedCategory === "water") {
                boost += 15;
                explanations.push(
                    `Freezing temperature (${weather.temperature}°C) may cause pipe issues`
                );
            }
        }

        // High wind impacts
        if (weather.windSpeed > 15) {
            if (
                normalizedCategory === "electricity" ||
                normalizedCategory === "roads"
            ) {
                boost += 15;
                explanations.push(
                    `High winds (${weather.windSpeed}m/s) affect ${category} infrastructure`
                );
            }
        }

        // Thunderstorm/severe weather
        if (weather.weather === "Thunderstorm") {
            if (normalizedCategory === "electricity") {
                boost += 25;
                explanations.push(
                    "Thunderstorm poses high risk to electrical systems"
                );
            } else if (
                normalizedCategory === "roads" ||
                normalizedCategory === "water"
            ) {
                boost += 15;
                explanations.push("Thunderstorm affects infrastructure");
            }
        }

        return {
            boost: Math.min(boost, 50), // Cap at 50 points
            weatherData: weather,
            explanation:
                explanations.length > 0
                    ? explanations.join(". ")
                    : "No significant weather impact",
        };
    } catch (error) {
        logger.error(
            "Error calculating weather priority boost:",
            error.message
        );
        return {
            boost: 0,
            weatherData: null,
            explanation: "Error calculating weather impact",
        };
    }
};
