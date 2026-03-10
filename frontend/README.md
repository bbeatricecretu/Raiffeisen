
  # Connect & Grow UI Design

  This is a code bundle for Connect & Grow UI Design. The original project is available at https://www.figma.com/design/yJqJULcsVLdqHfsRVT5IBe/Connect---Grow-UI-Design.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

    ## Deploying On Vercel

    This frontend is Vite + React Router, so it is ready for Vercel with SPA rewrites.

    1. Push your repo to GitHub.
    2. In Vercel, click `Add New Project` and import this repository.
    3. Set the root directory to `frontend`.
    4. Add environment variables in Vercel Project Settings:
      - `VITE_PUBLIC_APP_URL`: your Vercel URL or custom domain, for example `https://your-app.vercel.app`
      - `VITE_API_BASE_URL`: public backend URL ending in `/api`, for example `https://your-backend-domain.com/api`
    5. Deploy.

    Notes:
    - Referral links and WhatsApp invites use `VITE_PUBLIC_APP_URL`.
    - API calls use `VITE_API_BASE_URL`.
    - Client-side routes are handled by `vercel.json` rewrite to `index.html`.
  