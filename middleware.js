import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// proctecting the routes in the middleware to check no user can directly go to the follwowing path without signin, (.*) means any routes after dashboard and all
const isProtectedRoute = createRouteMatcher([
    "/dashboard(.*)",
    "/accounts(.*)",
    "/transaction(.*)",
]);

export default clerkMiddleware(async(auth,req)=> {
    const {userId} = await auth();

    // agar userId present nhi hai or user isProtectedRoute ke kisi route pe jane ki kosis kr rha hai toh usse redirect kr do signIn page pe , only signIn can redirect on this page
    if(!userId && isProtectedRoute(req)) {
        const {redirectToSignIn} = await auth();

        return redirectToSignIn();
    }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};