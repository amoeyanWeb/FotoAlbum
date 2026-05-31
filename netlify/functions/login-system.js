exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: "Method not allowed" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: "درخواست نامعتبر" }) };
  }

  const { username, password } = body;

  if (
    username === process.env.SYSTEM_USER &&
    password === process.env.SYSTEM_PASS
  ) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
    };
  }

  return {
    statusCode: 401,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: false, error: "نام کاربری یا رمز اشتباه است" }),
  };
};
