export function GET(): Response {
  return Response.json({
    status: "ok",
    application: "mk-bet",
  });
}
