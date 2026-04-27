import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username ||
      "User";

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      throw new Error("User email not found in Clerk");
    }

    // Use upsert to handle find/create atomically and avoid race conditions
    const loggedInUser = await db.user.upsert({
      where: {
        clerkUserId: user.id,
      },
      update: {
        name,
        imageUrl: user.imageUrl,
        email,
      },
      create: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email,
      },
    });

    return loggedInUser;
  } catch (error) {
    console.error("Error in checkUser:", error.message);
    // On Vercel, we want to know what exactly failed
    throw error;
  }
};
