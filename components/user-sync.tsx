"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export const UserSync = () => {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const syncUser = async () => {
      try {
        await fetch("/api/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.primaryEmailAddress?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            username: user.username,
          }),
        });
      } catch (error) {
        console.error("Failed to sync user", error);
      }
    };

    syncUser();
  }, [user, isLoaded]);

  return null;
};
