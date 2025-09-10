import { VALID_HACKATHONS } from "@/lib/constants";
import { Outlet, createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/$hackathon")({
  parseParams: (params) => ({
    hackathon: params.hackathon.toLowerCase(),
  }),

  loader: ({ params }) => {
    const validation = VALID_HACKATHONS.safeParse(params.hackathon);
    if (!validation.success) {
      throw notFound();
    }
    return {
      activeHackathon: validation.data,
    };
  },
  component: () => <Outlet />,
});
