exports.handler = async function (event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      preset:    process.env.CLOUDINARY_PRESET,
      apiKey:    process.env.CLOUDINARY_API_KEY,
    }),
  };
};
